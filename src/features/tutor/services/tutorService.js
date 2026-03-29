import { enqueueAction, OfflineQueuedError } from '@shared/services/offlineQueueService';
import { generateViaGateway } from '@shared/services/geminiGatewayService';

export const generateTutorResponse = async ({ apiKey, modelName, fallbackModelName, contents }) => {
    const resolvedModel = modelName || fallbackModelName;

    if (!navigator.onLine) {
        const action = enqueueAction({
            type: 'generate-tutor',
            payload: { apiKey, modelName, fallbackModelName, contents },
            conflictKey: `tutor:${resolvedModel}`,
        });
        throw new OfflineQueuedError('You are offline. Tutor request has been queued for sync.', action.id);
    }

    const data = await generateViaGateway({
        contents,
        generationConfig: { temperature: 0.2 },
        modelName: resolvedModel,
        customApiKey: apiKey || undefined,
    });

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
        throw new Error('No response from AI.');
    }

    return aiText;
};
