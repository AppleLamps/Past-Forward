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


// --- Helper Functions ---

/**
 * Creates a fallback prompt to use when the primary one is blocked.
 * @param decade The decade string (e.g., "1950s").
 * @returns The fallback prompt string.
 */
function getFallbackPrompt(decade: string): string {
    return `Create a photograph of the person in this image as if they were living in the ${decade}. The photograph should capture the distinct fashion, hairstyles, and overall atmosphere of that time period. Ensure the final image is a clear photograph that looks authentic to the era.`;
}

/**
 * Extracts the decade (e.g., "1950s") from a prompt string.
 * @param prompt The original prompt.
 * @returns The decade string or null if not found.
 */
function extractDecade(prompt: string): string | null {
    const match = prompt.match(/(\d{4}s)/);
    return match ? match[1] : null;
}

/**
 * Processes the OpenRouter API response, extracting the image or throwing an error if none is found.
 * @param response The response from the OpenRouter API call.
 * @returns A Blob URL string for the generated image.
 */
function processOpenRouterResponse(response: any): string {
    console.log("OpenRouter response:", JSON.stringify(response, null, 2));

    // OpenRouter returns the response in the same format as OpenAI
    const message = response.choices?.[0]?.message;

    if (!message) {
        throw new Error("No message in API response");
    }

    // Check if images are in message.images array (OpenRouter format for Gemini)
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const imageData = message.images[0];
        const imageUrl = imageData.image_url?.url || imageData.url;

        if (imageUrl && imageUrl.startsWith('data:image/')) {
            // It's a base64 data URL, convert to Blob URL
            const match = imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
            if (match) {
                const [, mimeType, base64Data] = match;

                // Convert base64 to Blob
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });

                // Create and return a Blob URL
                console.log("Successfully converted image to Blob URL");
                return URL.createObjectURL(blob);
            }
        }
    }

    // Check message.content (could be string or array)
    let content = message.content;

    // If content is a string, it might be a data URL directly
    if (typeof content === 'string') {
        if (content.startsWith('data:image/')) {
            // It's a base64 data URL, convert to Blob URL
            const match = content.match(/^data:(image\/\w+);base64,(.*)$/);
            if (match) {
                const [, mimeType, base64Data] = match;

                // Convert base64 to Blob
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });

                // Create and return a Blob URL
                return URL.createObjectURL(blob);
            }
        }

        // If it's text, throw error
        console.error("API returned text instead of image:", content);
        throw new Error(`The AI model responded with text instead of an image: "${content}"`);
    }

    // If content is an array, look for image_url
    if (Array.isArray(content)) {
        const imageContent = content.find((part: any) =>
            part.type === 'image_url' || (part.image_url && part.image_url.url)
        );

        if (imageContent?.image_url?.url) {
            const imageUrl = imageContent.image_url.url;

            // If it's a base64 data URL, convert to Blob URL for better memory efficiency
            if (imageUrl.startsWith('data:image/')) {
                const match = imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
                if (match) {
                    const [, mimeType, base64Data] = match;

                    // Convert base64 to Blob
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimeType });

                    // Create and return a Blob URL
                    return URL.createObjectURL(blob);
                }
            }

            // If it's already a URL, return it directly
            return imageUrl;
        }

        // Check for text content
        const textContent = content.find((part: any) => part.type === 'text')?.text;
        if (textContent) {
            console.error("API returned text instead of image:", textContent);
            throw new Error(`The AI model responded with text instead of an image: "${textContent}"`);
        }
    }

    // If we get here, we couldn't find an image
    console.error("API did not return an image. Full response:", response);
    throw new Error(`The AI model did not return an image. Response: ${JSON.stringify(message)}`);
}

/**
 * A wrapper for the OpenRouter API call that includes a retry mechanism for internal server errors.
 * @param imageDataUrl The base64 data URL of the image.
 * @param prompt The text prompt for image generation.
 * @returns The response from the API.
 */
async function callOpenRouterWithRetry(imageDataUrl: string, prompt: string): Promise<any> {
    const maxRetries = 3;
    const initialDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin, // Optional: for app attribution
                    'X-Title': 'Past Forward', // Optional: for app attribution
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: imageDataUrl
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1024,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenRouter API error (${response.status}): ${JSON.stringify(errorData)}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error calling OpenRouter API (Attempt ${attempt}/${maxRetries}):`, error);
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            const isInternalError = errorMessage.includes('500') || errorMessage.includes('INTERNAL') || errorMessage.includes('429');

            if (isInternalError && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.log(`Internal error detected. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error; // Re-throw if not a retriable error or if max retries are reached.
        }
    }
    // This should be unreachable due to the loop and throw logic above.
    throw new Error("OpenRouter API call failed after all retries.");
}


/**
 * Generates a decade-styled image from a source image and a prompt.
 * It includes a fallback mechanism for prompts that might be blocked in certain regions.
 * @param imageDataUrl A data URL string of the source image (e.g., 'data:image/png;base64,...').
 * @param prompt The prompt to guide the image generation.
 * @returns A promise that resolves to a Blob URL of the generated image.
 */
export async function generateDecadeImage(imageDataUrl: string, prompt: string): Promise<string> {
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid image data URL format. Expected 'data:image/...;base64,...'");
    }

    // --- First attempt with the original prompt ---
    try {
        console.log("Attempting generation with original prompt via OpenRouter...");
        const response = await callOpenRouterWithRetry(imageDataUrl, prompt);
        return processOpenRouterResponse(response);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        const isNoImageError = errorMessage.includes("The AI model responded with text instead of an image");

        if (isNoImageError) {
            console.warn("Original prompt was likely blocked. Trying a fallback prompt.");
            const decade = extractDecade(prompt);
            if (!decade) {
                console.error("Could not extract decade from prompt, cannot use fallback.");
                throw error; // Re-throw the original "no image" error.
            }

            // --- Second attempt with the fallback prompt ---
            try {
                const fallbackPrompt = getFallbackPrompt(decade);
                console.log(`Attempting generation with fallback prompt for ${decade}...`);
                const fallbackResponse = await callOpenRouterWithRetry(imageDataUrl, fallbackPrompt);
                return processOpenRouterResponse(fallbackResponse);
            } catch (fallbackError) {
                console.error("Fallback prompt also failed.", fallbackError);
                const finalErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`The AI model failed with both original and fallback prompts. Last error: ${finalErrorMessage}`);
            }
        } else {
            // This is for other errors, like a final internal server error after retries.
            console.error("An unrecoverable error occurred during image generation.", error);
            throw new Error(`The AI model failed to generate an image. Details: ${errorMessage}`);
        }
    }
}
