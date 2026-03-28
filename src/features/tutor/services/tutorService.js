import { enqueueAction, OfflineQueuedError } from '@shared/services/offlineQueueService';

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

    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.2 },
            modelName: resolvedModel,
            customApiKey: apiKey || undefined,
        })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Failed to generate tutor response.');
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
        throw new Error('No response from AI.');
    }

    return aiText;
};
