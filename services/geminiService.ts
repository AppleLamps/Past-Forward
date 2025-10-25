/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fileToDataURL } from '../lib/fileUtils';
import { generateImage, analyzeImageAPI } from './openRouterClient';
import { parseImageResponse, parseAnalysisResponse } from './responseParser';
import { DECADE_PROMPTS, getRandomVariations, getFallbackPrompt, sanitizePrompt } from './prompts';

// Re-export for backward compatibility
export { DECADE_PROMPTS };

/**
 * Analyzes the input image to extract description and suggest adaptations for dynamic prompt generation.
 * @param imageFile The File of the image to analyze.
 * @returns A promise that resolves to an object with description and adaptation.
 */
export const analyzeImage = async (imageFile: File): Promise<{ description: string; adaptation: string }> => {
    const imageDataUrl = await fileToDataURL(imageFile);
    const analysisPrompt = `Analyze this image and return a JSON object exactly like this format: {"description": "brief detailed description of the person, clothing, pose, expression, background", "adaptation": "suggest specific changes to setting, hair, facial hair, clothing, or other elements to match a vintage photo style, while keeping the person's facial features and identity identical"}. Be creative but ensure the core likeness is preserved.`;
    
    const response = await analyzeImageAPI(imageDataUrl, analysisPrompt);
    return parseAnalysisResponse(response);
};


/**
 * Generates a decade-styled image from a source image file and decade.
 * Performs image analysis to create dynamic prompts, with fallback mechanisms.
 * @param imageFile The File of the source image.
 * @param decade The decade string (e.g., "1950s").
 * @returns A promise that resolves to a Blob URL of the generated image.
 */
export async function generateDecadeImage(imageFile: File, decade: string): Promise<string> {
    const imageDataUrl = await fileToDataURL(imageFile);
    
    try {
        const analysis = await analyzeImage(imageFile);
        const basePrompt = DECADE_PROMPTS[decade];
        const { pose, lighting, accessory } = getRandomVariations();

        const dynamicPrompt = `${basePrompt} Based on the uploaded photo: ${analysis.description}. Apply: ${analysis.adaptation}. Preserve the person's exact facial identity and biometric likeness (eyes, nose, mouth, bone structure). You may strongly change hairstyle, facial hair, makeup, accessories (including piercings and tattoos), wardrobe, background, and composition to match the ${decade} style. Incorporate ${pose}, ${lighting}, and ${accessory}. Output a single photorealistic image.`;

        // First attempt with dynamic prompt
        try {
            console.log("Attempting generation with dynamic prompt via OpenRouter...");
            const response = await generateImage(imageDataUrl, dynamicPrompt);
            return parseImageResponse(response);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            console.log(`Dynamic prompt failed: ${errorMessage}. Using fallback prompt...`);
            const fallbackPrompt = getFallbackPrompt(decade);
            const fallbackResponse = await generateImage(imageDataUrl, fallbackPrompt);
            return parseImageResponse(fallbackResponse);
        }
    } catch (analysisError) {
        console.log("Analysis failed, falling back to random selections.");
        // Fallback without analysis
        const basePrompt = DECADE_PROMPTS[decade];
        const { pose, lighting, accessory } = getRandomVariations();
        const dynamicPrompt = `${basePrompt} Incorporate ${pose}, ${lighting}, and ${accessory}.`;

        try {
            const response = await generateImage(imageDataUrl, dynamicPrompt);
            return parseImageResponse(response);
        } catch (error) {
            const fallbackPrompt = getFallbackPrompt(decade);
            const fallbackResponse = await generateImage(imageDataUrl, fallbackPrompt);
            return parseImageResponse(fallbackResponse);
        }
    }
}

export async function generateCustomImage(imageFile: File, userPrompt: string): Promise<string> {
    const sanitizedPrompt = sanitizePrompt(userPrompt);
    const imageDataUrl = await fileToDataURL(imageFile);
    
    try {
        const analysis = await analyzeImage(imageFile);
        const { pose, lighting, accessory } = getRandomVariations();

        const dynamicPrompt = `Create a photorealistic image of this person that reflects: ${sanitizedPrompt}. Based on the uploaded photo: ${analysis.description}. Apply: ${analysis.adaptation}. Preserve the person's exact facial identity and biometric likeness (eyes, nose, mouth, bone structure). You may strongly change hairstyle, facial hair, makeup, accessories (including piercings and tattoos), wardrobe, background, and composition to achieve the requested style. Incorporate ${pose}, ${lighting}, and ${accessory}. Output a single photorealistic image.`;

        try {
            const response = await generateImage(imageDataUrl, dynamicPrompt);
            return parseImageResponse(response);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            console.log(`Custom prompt failed: ${errorMessage}. Using simplified prompt...`);
            const fallbackPrompt = `Create a photorealistic photograph of the person in this image styled as: ${sanitizedPrompt}. Ensure identity is clearly preserved while adapting styling to match the request.`;
            const response = await generateImage(imageDataUrl, fallbackPrompt);
            return parseImageResponse(response);
        }
    } catch (analysisError) {
        console.log("Custom analysis failed, proceeding without analysis.");
        const { pose, lighting, accessory } = getRandomVariations();

        const dynamicPrompt = `Create a photorealistic image of this person that reflects: ${sanitizedPrompt}. Preserve the person's facial identity. Incorporate ${pose}, ${lighting}, and ${accessory}.`;
        const response = await generateImage(imageDataUrl, dynamicPrompt);
        return parseImageResponse(response);
    }
}
