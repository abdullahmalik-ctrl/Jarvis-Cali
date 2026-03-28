import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(express.json({ limit: '5mb' }));

const resolveApiKey = (customApiKey) => {
    const userKey = typeof customApiKey === 'string' ? customApiKey.trim() : '';
    return userKey || process.env.GEMINI_API_KEY || '';
};

const callGemini = async ({ modelName, apiKey, payload }) => {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }
    );

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data;
};

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

app.post('/api/models', async (req, res) => {
    try {
        const apiKey = resolveApiKey(req.body?.customApiKey);
        if (!apiKey) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server.' });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message);
        }

        const models = data.models?.filter((m) =>
            m.supportedGenerationMethods?.includes('generateContent')
        ).map((m) => m.name.replace('models/', '')) || [];

        return res.json({ models });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to load models.' });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const apiKey = resolveApiKey(req.body?.customApiKey);
        if (!apiKey) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY on server.' });
        }

        const modelName = req.body?.modelName || 'gemini-1.5-flash';
        const contents = req.body?.contents;
        const generationConfig = req.body?.generationConfig;

        if (!Array.isArray(contents) || contents.length === 0) {
            return res.status(400).json({ error: 'Request must include a non-empty contents array.' });
        }

        const payload = generationConfig ? { contents, generationConfig } : { contents };
        const data = await callGemini({ modelName, apiKey, payload });

        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Gemini request failed.' });
    }
});

app.listen(PORT, () => {
    console.log(`Gemini proxy server running on http://localhost:${PORT}`);
});
