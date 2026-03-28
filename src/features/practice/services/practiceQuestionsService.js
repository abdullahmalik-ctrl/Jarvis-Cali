export const generatePracticeQuestions = async ({ apiKey, modelName, config }) => {
    if (!apiKey) {
        throw new Error('API Key is missing.');
    }

    const prompt = `Generate ${config.count} ${config.difficulty} ${config.topic} math questions in valid JSON format. 
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
};
