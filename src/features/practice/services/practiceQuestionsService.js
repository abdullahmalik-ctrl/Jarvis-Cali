import { getCuratedQuestions } from '@features/practice/services/questionBankService';
import { queueGeneratedQuestionsForReview } from '@features/practice/services/qualityReviewService';
import { enqueueAction, OfflineQueuedError } from '@shared/services/offlineQueueService';
import { generateViaGateway } from '@shared/services/geminiGatewayService';

const parseQuestionsFromModel = (responseData) => {
    let text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== 'string') {
        throw new Error('AI returned an unexpected response format.');
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(text);
    } catch (_error) {
        throw new Error('AI returned invalid JSON for questions. Please try again.');
    }
};

const generateWithAi = async ({ apiKey, modelName, config, count }) => {
    const prompt = `Generate ${count} ${config.difficulty} ${config.topic} math questions for ${config.curriculum} curriculum in valid JSON format.
            Strictly follow this JSON schema:
            [
                {
                    "id": 1,
                    "question": "Latex supported question text",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": "Option A", 
                    "explanation": "Short explanation of the solution"
                }
            ]
            Ensure options are distinct. Do not include markdown formatting like \`\`\`json. Return only the raw JSON array.`;

    if (!navigator.onLine) {
        const action = enqueueAction({
            type: 'generate-practice',
            payload: { apiKey, modelName, config, count },
            conflictKey: `practice:${config.topic}:${config.difficulty}:${config.curriculum}`,
        });
        throw new OfflineQueuedError('You are offline. Practice generation has been queued for sync.', action.id);
    }

    const data = await generateViaGateway({
        modelName: modelName || 'gemini-1.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        customApiKey: apiKey || undefined,
    });

    const aiQuestions = parseQuestionsFromModel(data).map((question, index) => ({
        ...question,
        id: `ai-${Date.now()}-${index + 1}`,
        source: 'ai-generated',
        curriculumTag: config.curriculum,
    }));

    queueGeneratedQuestionsForReview(aiQuestions, {
        topic: config.topic,
        difficulty: config.difficulty,
        curriculum: config.curriculum,
    });

    return aiQuestions;
};

export const generatePracticeQuestions = async ({ apiKey, modelName, config }) => {
    const curatedQuestions = getCuratedQuestions(config);
    if (curatedQuestions.length >= config.count) {
        return curatedQuestions;
    }

    const remainingCount = config.count - curatedQuestions.length;
    const aiQuestions = await generateWithAi({ apiKey, modelName, config, count: remainingCount });
    return [...curatedQuestions, ...aiQuestions];
};
