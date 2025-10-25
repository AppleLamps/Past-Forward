/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash-image";
const ANALYSIS_MODEL = "openrouter/andromeda-alpha";

export interface OpenRouterMessage {
    role: string;
    content: Array<{
        type: string;
        text?: string;
        image_url?: { url: string };
    }> | string;
}

export interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    max_tokens?: number;
    temperature?: number;
}

export interface OpenRouterResponse {
    choices?: Array<{
        message?: {
            content?: string | any[];
            images?: Array<{
                url?: string;
                image_url?: { url: string };
            }>;
        };
    }>;
}

/**
 * Calls the OpenRouter API with retry logic for transient errors.
 * @param request The request payload.
 * @param maxRetries Maximum number of retry attempts.
 * @param initialDelay Initial delay in milliseconds before first retry.
 * @returns The API response.
 */
export async function callOpenRouterAPI(
    request: OpenRouterRequest,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<OpenRouterResponse> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Past Forward',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenRouter API error (${response.status}): ${JSON.stringify(errorData)}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error calling OpenRouter API (Attempt ${attempt}/${maxRetries}):`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            const isRetriableError = errorMessage.includes('500') || errorMessage.includes('INTERNAL') || errorMessage.includes('429');

            if (isRetriableError && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Retriable error detected. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error("OpenRouter API call failed after all retries.");
}

/**
 * Calls the OpenRouter API for image generation.
 * @param imageDataUrl The base64 data URL of the input image.
 * @param prompt The text prompt for generation.
 * @returns The API response.
 */
export async function generateImage(imageDataUrl: string, prompt: string): Promise<OpenRouterResponse> {
    return callOpenRouterAPI({
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageDataUrl } }
                ]
            }
        ],
        max_tokens: 1024,
        temperature: 1.0,
    });
}

/**
 * Calls the OpenRouter API for image analysis.
 * @param imageDataUrl The base64 data URL of the input image.
 * @param analysisPrompt The analysis prompt.
 * @returns The API response.
 */
export async function analyzeImageAPI(imageDataUrl: string, analysisPrompt: string): Promise<OpenRouterResponse> {
    return callOpenRouterAPI({
        model: ANALYSIS_MODEL,
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: analysisPrompt },
                    { type: 'image_url', image_url: { url: imageDataUrl } }
                ]
            }
        ],
    });
}
