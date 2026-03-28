export const generateTutorResponse = async ({ apiKey, modelName, fallbackModelName, contents }) => {
    if (!apiKey) {
        throw new Error('API Key is missing. Please add it in Settings.');
    }

    const resolvedModel = modelName || fallbackModelName;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.2 }
        })
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
        throw new Error('No response from AI.');
    }

    return aiText;
};
