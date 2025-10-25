/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dataUrlToBlobUrl } from '../lib/blobUtils';
import { OpenRouterResponse } from './openRouterClient';

/**
 * Processes the OpenRouter API response, extracting the image or throwing an error if none is found.
 * @param response The response from the OpenRouter API call.
 * @returns A Blob URL string for the generated image.
 */
export function parseImageResponse(response: OpenRouterResponse): string {
    console.log("OpenRouter response:", JSON.stringify(response, null, 2));

    const message = response.choices?.[0]?.message;

    if (!message) {
        throw new Error("No message in API response");
    }

    // Check if images are in message.images array (OpenRouter format for Gemini)
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const imageData = message.images[0];
        const imageUrl = imageData.image_url?.url || imageData.url;

        if (imageUrl && imageUrl.startsWith('data:image/')) {
            const blobUrl = dataUrlToBlobUrl(imageUrl);
            if (blobUrl) {
                console.log("Successfully converted image to Blob URL");
                return blobUrl;
            }
        }
    }

    // Check message.content (could be string or array)
    let content = message.content;

    // If content is a string, it might be a data URL directly
    if (typeof content === 'string') {
        if (content.startsWith('data:image/')) {
            const blobUrl = dataUrlToBlobUrl(content);
            if (blobUrl) {
                return blobUrl;
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
                const blobUrl = dataUrlToBlobUrl(imageUrl);
                if (blobUrl) {
                    return blobUrl;
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
 * Parses the analysis response to extract description and adaptation suggestions.
 * @param response The API response from image analysis.
 * @returns An object with description and adaptation fields.
 */
export function parseAnalysisResponse(response: OpenRouterResponse): { description: string; adaptation: string } {
    const message = response.choices?.[0]?.message;
    const content = message?.content || '{}';

    try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        return {
            description: parsed.description || 'A person in a photo.',
            adaptation: parsed.adaptation || 'Adapt clothing and style to the era while preserving facial features.'
        };
    } catch {
        // Fallback if JSON parsing fails
        return {
            description: typeof content === 'string' ? content : 'A person in a photo.',
            adaptation: 'Adapt clothing and style to the era while preserving facial features.'
        };
    }
}
