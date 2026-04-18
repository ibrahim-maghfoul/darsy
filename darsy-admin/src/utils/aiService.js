/**
 * Adapted from Kinderly's aiService — multi-provider LLM fallback for text generation.
 */

let sessionFailedProviders = new Set();

export const blackListProvider = (provider) => {
    if (provider) sessionFailedProviders.add(provider);
};

export const resetProviderBlacklist = () => {
    sessionFailedProviders.clear();
};

export const makeLLMRequest = async (messages, options = {}) => {
    const {
        forceProvider = null,
        keys = {},
        addLog = () => { },
        setCurrentProvider = () => { },
        config = {}
    } = options;

    const defaultProviders = ['nebius', 'openrouter'];
    const mode = forceProvider || 'auto';

    const params = {
        temperature: config.temperature ?? 0.85,
        max_tokens: config.maxTokens ?? 2048,
    };

    const performRequest = async (provider) => {
        setCurrentProvider(provider);
        addLog(`Trying ${provider.toUpperCase()}...`);

        try {
            switch (provider) {
                case 'gemini': {
                    if (!keys.gemini) throw new Error("Gemini API Key missing");
                    const body = {
                        contents: messages.filter(m => m.role !== 'system').map(m => ({
                            role: m.role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: m.content }]
                        })),
                        generationConfig: {
                            temperature: params.temperature,
                            maxOutputTokens: params.max_tokens
                        }
                    };
                    const systemMessage = messages.find(m => m.role === 'system');
                    if (systemMessage) {
                        body.system_instruction = { parts: [{ text: systemMessage.content }] };
                    }
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.gemini}`,
                        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
                    );
                    const data = await response.json();
                    if (!response.ok || data.error) throw new Error(`Gemini Error: ${data.error?.message || response.statusText}`);
                    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!content) throw new Error('Gemini returned empty response');
                    return { choices: [{ message: { content } }], provider };
                }

                case 'nebius': {
                    if (!keys.nebius) throw new Error("Nebius API Key missing");
                    const response = await fetch('https://api.studio.nebius.ai/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keys.nebius}` },
                        body: JSON.stringify({
                            model: 'meta-llama/Llama-3.3-70B-Instruct',
                            messages,
                            temperature: params.temperature,
                            max_tokens: params.max_tokens,
                        })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(`Nebius Error: ${data.error?.message || response.statusText}`);
                    const content = data.choices?.[0]?.message?.content;
                    if (!content) throw new Error('Nebius returned empty response');
                    return { choices: [{ message: { content } }], provider };
                }

                case 'openrouter': {
                    if (!keys.openrouter) throw new Error("OpenRouter API Key missing");
                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${keys.openrouter}`,
                            'HTTP-Referer': window.location.origin,
                            'X-Title': 'Darsy Admin'
                        },
                        body: JSON.stringify({
                            model: 'openai/gpt-4o-mini',
                            messages,
                            temperature: params.temperature,
                            max_tokens: params.max_tokens,
                        })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(`OpenRouter Error: ${data.error?.message || response.statusText}`);
                    const content = data.choices?.[0]?.message?.content;
                    if (!content) throw new Error('OpenRouter returned empty response');
                    return { choices: [{ message: { content } }], provider };
                }

                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        } catch (error) {
            blackListProvider(provider);
            addLog(`${provider} failed: ${error.message}`);
            throw error;
        }
    };

    const availableProviders = mode !== 'auto'
        ? [mode]
        : defaultProviders.filter(p => !sessionFailedProviders.has(p));

    if (availableProviders.length === 0) {
        resetProviderBlacklist();
        return makeLLMRequest(messages, options);
    }

    let lastError = null;
    for (const provider of availableProviders) {
        try {
            const result = await performRequest(provider);
            addLog(`✅ ${provider} succeeded!`);
            return result;
        } catch (error) {
            lastError = error;
        }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
};
