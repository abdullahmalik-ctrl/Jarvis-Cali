const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const ALLOWED_ORIGINS = [
    'https://abdullahmalik-ctrl.github.io',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

const corsHeaders = (origin) => {
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin',
    };
};

const jsonResponse = (data, status = 200, origin = '') => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
        },
    });
};

const parseJson = async (request) => {
    try {
        return await request.json();
    } catch (_error) {
        return null;
    }
};

const resolveApiKey = (body, env) => {
    const custom = typeof body?.customApiKey === 'string' ? body.customApiKey.trim() : '';
    return custom || env.GEMINI_API_KEY || '';
};

const fetchGemini = async ({ endpoint, method = 'GET', apiKey, body }) => {
    const response = await fetch(`${GEMINI_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({ error: { message: 'Invalid Gemini response.' } }));

    if (!response.ok || data?.error) {
        throw new Error(data?.error?.message || 'Gemini request failed.');
    }

    return data;
};

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (url.pathname === '/api/health' && request.method === 'GET') {
            return jsonResponse({ ok: true }, 200, origin);
        }

        if (url.pathname === '/api/models' && request.method === 'POST') {
            const body = await parseJson(request);
            if (!body) {
                return jsonResponse({ error: 'Invalid JSON body.' }, 400, origin);
            }

            const apiKey = resolveApiKey(body, env);
            if (!apiKey) {
                return jsonResponse({ error: 'Missing GEMINI_API_KEY secret and no customApiKey provided.' }, 500, origin);
            }

            try {
                const data = await fetchGemini({ endpoint: '/models', apiKey });
                const models = (data.models || []).filter((model) =>
                    model.supportedGenerationMethods?.includes('generateContent')
                ).map((model) => model.name.replace('models/', ''));

                return jsonResponse({ models }, 200, origin);
            } catch (error) {
                return jsonResponse({ error: error.message }, 500, origin);
            }
        }

        if (url.pathname === '/api/generate' && request.method === 'POST') {
            const body = await parseJson(request);
            if (!body) {
                return jsonResponse({ error: 'Invalid JSON body.' }, 400, origin);
            }

            const apiKey = resolveApiKey(body, env);
            if (!apiKey) {
                return jsonResponse({ error: 'Missing GEMINI_API_KEY secret and no customApiKey provided.' }, 500, origin);
            }

            const modelName = body.modelName || 'gemini-1.5-flash';
            const contents = body.contents;
            const generationConfig = body.generationConfig;

            if (!Array.isArray(contents) || contents.length === 0) {
                return jsonResponse({ error: 'Request must include a non-empty contents array.' }, 400, origin);
            }

            try {
                const payload = generationConfig ? { contents, generationConfig } : { contents };
                const data = await fetchGemini({
                    endpoint: `/models/${modelName}:generateContent`,
                    method: 'POST',
                    apiKey,
                    body: payload,
                });

                return jsonResponse(data, 200, origin);
            } catch (error) {
                return jsonResponse({ error: error.message }, 500, origin);
            }
        }

        return jsonResponse({ error: 'Route not found.' }, 404, origin);
    },
};
