export const fetchAvailableGeminiModels = async (key) => {
    if (!key) return [];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.models?.filter((m) =>
        m.supportedGenerationMethods?.includes('generateContent')
    ).map((m) => m.name.replace('models/', '')) || [];
};
