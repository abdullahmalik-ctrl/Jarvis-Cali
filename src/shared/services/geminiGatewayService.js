const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const PUBLIC_FRONTEND_FALLBACK_KEY = (import.meta.env.VITE_PUBLIC_GEMINI_API_KEY || '').trim();
const BACKEND_PROXY_BASE = (import.meta.env.VITE_BACKEND_PROXY_BASE || '').trim();

const shouldSkipProxy = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    const isGithubPages = window.location.hostname.endsWith('github.io');
    return isGithubPages && !BACKEND_PROXY_BASE;
};

const proxyUrl = (path) => {
    if (!BACKEND_PROXY_BASE) {
        return path;
    }
    return `${BACKEND_PROXY_BASE}${path}`;
};

const safeJson = async (response) => {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (_error) {
        if (text?.trim().startsWith('<')) {
            return { error: 'Received HTML response instead of API JSON. Check API endpoint and key restrictions.' };
        }
        return { error: text || `HTTP ${response.status}` };
    }
};

const extractErrorMessage = (data, fallback) => {
    if (typeof data?.error === 'string') {
        return data.error;
    }

    if (data?.error?.message) {
        return data.error.message;
    }

    return fallback;
};

const tryProxyGenerate = async ({ modelName, contents, generationConfig, customApiKey }) => {
    const response = await fetch(proxyUrl('/api/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName, contents, generationConfig, customApiKey }),
    });

    const data = await safeJson(response);
    if (!response.ok || data.error) {
        throw new Error(extractErrorMessage(data, 'Proxy generation failed.'));
    }

    return data;
};

const tryDirectGenerate = async ({ modelName, contents, generationConfig, customApiKey }) => {
    const resolvedKey = (customApiKey || PUBLIC_FRONTEND_FALLBACK_KEY).trim();
    if (!resolvedKey) {
        throw new Error('No user API key found for direct Gemini call.');
    }

    const endpoint = `${GEMINI_BASE_URL}/models/${modelName}:generateContent?key=${encodeURIComponent(resolvedKey)}`;
    const payload = generationConfig ? { contents, generationConfig } : { contents };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await safeJson(response);
    if (!response.ok || data.error) {
        throw new Error(extractErrorMessage(data, 'Direct Gemini generation failed.'));
    }

    return data;
};

export const generateViaGateway = async ({ modelName, contents, generationConfig, customApiKey }) => {
    if (shouldSkipProxy()) {
        return tryDirectGenerate({ modelName, contents, generationConfig, customApiKey });
    }

    try {
        return await tryProxyGenerate({ modelName, contents, generationConfig, customApiKey });
    } catch (proxyError) {
        if (!customApiKey && !PUBLIC_FRONTEND_FALLBACK_KEY) {
            throw new Error('Backend is unavailable and no API key is available. Add your key in Settings or configure VITE_PUBLIC_GEMINI_API_KEY.');
        }

        try {
            return await tryDirectGenerate({ modelName, contents, generationConfig, customApiKey });
        } catch (directError) {
            throw new Error(directError.message || proxyError.message || 'Gemini request failed.');
        }
    }
};

const tryProxyModels = async (customApiKey) => {
    const response = await fetch(proxyUrl('/api/models'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customApiKey: customApiKey || undefined }),
    });

    const data = await safeJson(response);
    if (!response.ok || data.error) {
        throw new Error(extractErrorMessage(data, 'Proxy model lookup failed.'));
    }

    return data.models || [];
};

const tryDirectModels = async (customApiKey) => {
    const resolvedKey = (customApiKey || PUBLIC_FRONTEND_FALLBACK_KEY).trim();
    if (!resolvedKey) {
        throw new Error('No API key provided for direct model lookup.');
    }

    const endpoint = `${GEMINI_BASE_URL}/models?key=${encodeURIComponent(resolvedKey)}`;
    const response = await fetch(endpoint);
    const data = await safeJson(response);

    if (!response.ok || data.error) {
        throw new Error(extractErrorMessage(data, 'Direct model lookup failed.'));
    }

    const models = data.models?.filter((model) =>
        model.supportedGenerationMethods?.includes('generateContent')
    ).map((model) => model.name.replace('models/', '')) || [];

    return models;
};

export const fetchModelsViaGateway = async (customApiKey) => {
    if (shouldSkipProxy()) {
        if (!customApiKey && !PUBLIC_FRONTEND_FALLBACK_KEY) {
            throw new Error('Model list requires API key for static hosting.');
        }
        return tryDirectModels(customApiKey);
    }

    try {
        return await tryProxyModels(customApiKey);
    } catch (_proxyError) {
        if (!customApiKey && !PUBLIC_FRONTEND_FALLBACK_KEY) {
            throw new Error('Model list requires API key when backend is not running.');
        }
        return tryDirectModels(customApiKey);
    }
};
