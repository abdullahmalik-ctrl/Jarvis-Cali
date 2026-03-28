export const fetchAvailableGeminiModels = async (key) => {
    const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customApiKey: key || undefined }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Failed to load models.');
    }

    return data.models || [];
};
