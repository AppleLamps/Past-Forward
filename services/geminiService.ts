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

// Variation arrays for dynamic prompt generation
const POSE_VARIATIONS = [
    "formal pose",
    "casual pose",
    "candid pose",
    "studio pose",
    "confident pose",
    "relaxed pose",
    "dramatic pose",
    "playful pose",
    "elegant pose",
    "natural pose"
];

const LIGHTING_VARIATIONS = [
    "natural lighting",
    "studio lighting",
    "soft focus lighting",
    "flash photography",
    "golden hour lighting",
    "harsh lighting",
    "even lighting",
    "backlit",
    "side-lit",
    "rim lighting",
    "moonlight",
    "neon lighting",
    "candlelight"
];

const ACCESSORY_VARIATIONS = [
    "with subtle props",
    "with era-appropriate accessories",
    "minimalist setup",
    "vintage backdrop",
    "with period jewelry",
    "with hats",
    "with glasses",
    "with hand props",
    "with vintage furniture",
    "with outdoor elements",
    "with musical instruments",
    "with books",
    "with vehicles"
];

// Decade-specific prompts for more authentic and detailed image generation.
export const DECADE_PROMPTS: Record<string, string> = {
    '1950s': `Transform this person into a 1950s portrait photograph. Style: Post-war American aesthetic with high-contrast black and white or early Kodachrome color. Fashion: Men in fedoras, suits with wide lapels, slicked hair; Women in circle skirts, victory rolls, cat-eye glasses. Photography: Grainy film texture, studio lighting, formal pose. Maintain the person's facial features and identity exactly.`,

    '1960s': `Transform this person into a 1960s portrait photograph. Style: Mod era with vibrant colors or high-contrast B&W. Fashion: Men in slim suits, Beatles haircuts; Women in shift dresses, bouffant hair, bold eyeliner. Photography: Kodak Instamatic quality, natural lighting, candid pose. Preserve the person's exact facial features and likeness.`,

    '1970s': `Transform this person into a 1970s portrait photograph. Style: Warm, faded colors with orange/brown tones. Fashion: Men in wide collars, bell-bottoms, long hair/sideburns; Women in platform shoes, maxi dresses, feathered hair. Photography: Polaroid or 35mm film grain, soft focus, casual pose. Keep the person's face identical.`,

    '1980s': `Transform this person into a 1980s portrait photograph. Style: Bright, saturated colors with high contrast. Fashion: Men in power suits, mullets; Women in shoulder pads, big hair, bold makeup. Photography: Flash photography look, sharp focus, studio backdrop. Maintain exact facial features and identity.`,

    '1990s': `Transform this person into a 1990s portrait photograph. Style: Slightly desaturated colors or grunge aesthetic. Fashion: Men in baggy jeans, flannel, curtain hair; Women in chokers, slip dresses, straight hair. Photography: Disposable camera or early digital quality, casual lighting. Preserve the person's facial likeness exactly.`,

    '2000s': `Transform this person into a 2000s portrait photograph. Style: Early digital camera aesthetic with slight overexposure. Fashion: Men in popped collars, frosted tips; Women in low-rise jeans, butterfly clips, thin eyebrows. Photography: Digital camera quality, flash, MySpace-style pose. Keep the person's face and features identical.`
};


// --- Helper Functions ---

/**
 * Converts a File to a data URL string.
 * @param file The File to convert.
 * @returns A promise that resolves to the data URL string.
 */
const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Analyzes the input image to extract description and suggest adaptations for dynamic prompt generation.
 * @param imageFile The File of the image to analyze.
 * @returns A promise that resolves to an object with description and adaptation.
 */
export const analyzeImage = async (imageFile: File): Promise<{ description: string; adaptation: string }> => {
    const formData = new FormData();
    formData.append('model', 'openrouter/andromeda-alpha');
    formData.append('messages', JSON.stringify([
        {
            role: 'user',
            content: [
                { type: 'text', text: `Analyze this image and return a JSON object exactly like this format: {"description": "brief detailed description of the person, clothing, pose, expression, background", "adaptation": "suggest specific changes to setting, hair, facial hair, clothing, or other elements to match a vintage photo style, while keeping the person's facial features and identity identical"}. Be creative but ensure the core likeness is preserved.` },
                { type: 'image_url', image_url: { url: await fileToDataURL(imageFile) } }
            ]
        }
    ]));

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin, // Optional: for app attribution
            'X-Title': 'Past Forward', // Optional: for app attribution
        },
        body: JSON.stringify({
            model: 'openrouter/andromeda-alpha',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: `Analyze this image and return a JSON object exactly like this format: {"description": "brief detailed description of the person, clothing, pose, expression, background", "adaptation": "suggest specific changes to setting, hair, facial hair, clothing, or other elements to match a vintage photo style, while keeping the person's facial features and identity identical"}. Be creative but ensure the core likeness is preserved.` },
                        { type: 'image_url', image_url: { url: await fileToDataURL(imageFile) } }
                    ]
                }
            ],
        }),
    });

    if (!response.ok) throw new Error(`Analysis failed: ${response.statusText}`);
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content || '{}';

    try {
        const parsed = JSON.parse(content);
        return {
            description: parsed.description || 'A person in a photo.',
            adaptation: parsed.adaptation || 'Adapt clothing and style to the era while preserving facial features.'
        };
    } catch {
        // Fallback to random if JSON invalid
        return {
            description: content,
            adaptation: 'Adapt clothing and style to the era while preserving facial features.'
        };
    }
};

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
                    temperature: 1.0,
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
 * Generates a decade-styled image from a source image file and decade.
 * Performs image analysis to create dynamic prompts, with fallback mechanisms.
 * @param imageFile The File of the source image.
 * @param decade The decade string (e.g., "1950s").
 * @returns A promise that resolves to a Blob URL of the generated image.
 */
export async function generateDecadeImage(imageFile: File, decade: string): Promise<string> {
    try {
        const analysis = await analyzeImage(imageFile);
        const basePrompt = DECADE_PROMPTS[decade];
        const randomPose = POSE_VARIATIONS[Math.floor(Math.random() * POSE_VARIATIONS.length)];
        const randomLighting = LIGHTING_VARIATIONS[Math.floor(Math.random() * LIGHTING_VARIATIONS.length)];
        const randomAccessory = ACCESSORY_VARIATIONS[Math.floor(Math.random() * ACCESSORY_VARIATIONS.length)];

        const dynamicPrompt = `${basePrompt} Based on the uploaded photo: ${analysis.description}. Apply: ${analysis.adaptation}. Preserve the person's exact facial identity and biometric likeness (eyes, nose, mouth, bone structure). You may strongly change hairstyle, facial hair, makeup, accessories (including piercings and tattoos), wardrobe, background, and composition to match the ${decade} style. Incorporate ${randomPose}, ${randomLighting}, and ${randomAccessory}. Output a single photorealistic image.`;

        // Convert file to data URL for generation
        const imageDataUrl = await fileToDataURL(imageFile);

        // First attempt with dynamic prompt
        try {
            console.log("Attempting generation with dynamic prompt via OpenRouter...");
            const response = await callOpenRouterWithRetry(imageDataUrl, dynamicPrompt);
            return processOpenRouterResponse(response);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            console.log(`Dynamic prompt failed: ${errorMessage}. Using fallback prompt...`);
            const fallbackPrompt = getFallbackPrompt(decade);
            const fallbackResponse = await callOpenRouterWithRetry(imageDataUrl, fallbackPrompt);
            return processOpenRouterResponse(fallbackResponse);
        }
    } catch (analysisError) {
        console.log("Analysis failed, falling back to random selections.");
        // Fallback without analysis
        const basePrompt = DECADE_PROMPTS[decade];
        const randomPose = POSE_VARIATIONS[Math.floor(Math.random() * POSE_VARIATIONS.length)];
        const randomLighting = LIGHTING_VARIATIONS[Math.floor(Math.random() * LIGHTING_VARIATIONS.length)];
        const randomAccessory = ACCESSORY_VARIATIONS[Math.floor(Math.random() * ACCESSORY_VARIATIONS.length)];
        const dynamicPrompt = `${basePrompt} Incorporate ${randomPose}, ${randomLighting}, and ${randomAccessory}.`;

        const imageDataUrl = await fileToDataURL(imageFile);

        try {
            const response = await callOpenRouterWithRetry(imageDataUrl, dynamicPrompt);
            return processOpenRouterResponse(response);
        } catch (error) {
            const fallbackPrompt = getFallbackPrompt(decade);
            const fallbackResponse = await callOpenRouterWithRetry(imageDataUrl, fallbackPrompt);
            return processOpenRouterResponse(fallbackResponse);
        }
    }
}
