/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback } from 'react';
import { generateDecadeImage } from '../services/geminiService';

/**
 * Decade-specific prompts for more authentic and detailed image generation.
 * Each prompt is tailored to the unique characteristics of that decade.
 */
export const DECADE_PROMPTS: Record<string, string> = {
    '1950s': `Transform this person into a 1950s portrait photograph. Style: Post-war American aesthetic with high-contrast black and white or early Kodachrome color. Fashion: Men in fedoras, suits with wide lapels, slicked hair; Women in circle skirts, victory rolls, cat-eye glasses. Photography: Grainy film texture, studio lighting, formal pose. Maintain the person's facial features and identity exactly.`,

    '1960s': `Transform this person into a 1960s portrait photograph. Style: Mod era with vibrant colors or high-contrast B&W. Fashion: Men in slim suits, Beatles haircuts; Women in shift dresses, bouffant hair, bold eyeliner. Photography: Kodak Instamatic quality, natural lighting, candid pose. Preserve the person's exact facial features and likeness.`,

    '1970s': `Transform this person into a 1970s portrait photograph. Style: Warm, faded colors with orange/brown tones. Fashion: Men in wide collars, bell-bottoms, long hair/sideburns; Women in platform shoes, maxi dresses, feathered hair. Photography: Polaroid or 35mm film grain, soft focus, casual pose. Keep the person's face identical.`,

    '1980s': `Transform this person into a 1980s portrait photograph. Style: Bright, saturated colors with high contrast. Fashion: Men in power suits, mullets; Women in shoulder pads, big hair, bold makeup. Photography: Flash photography look, sharp focus, studio backdrop. Maintain exact facial features and identity.`,

    '1990s': `Transform this person into a 1990s portrait photograph. Style: Slightly desaturated colors or grunge aesthetic. Fashion: Men in baggy jeans, flannel, curtain hair; Women in chokers, slip dresses, straight hair. Photography: Disposable camera or early digital quality, casual lighting. Preserve the person's facial likeness exactly.`,

    '2000s': `Transform this person into a 2000s portrait photograph. Style: Early digital camera aesthetic with slight overexposure. Fashion: Men in popped collars, frosted tips; Women in low-rise jeans, butterfly clips, thin eyebrows. Photography: Digital camera quality, flash, MySpace-style pose. Keep the person's face and features identical.`
};

export type ImageStatus = 'pending' | 'done' | 'error';

export interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

interface UseImageGenerationOptions {
    decades: string[];
    concurrencyLimit?: number;
    onError?: (decade: string, error: string) => void;
    onSuccess?: (decade: string, url: string) => void;
}

export function useImageGeneration(options: UseImageGenerationOptions) {
    const { decades, concurrencyLimit = 6, onError, onSuccess } = options;
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const generateAll = useCallback(async (uploadedImage: string) => {
        setIsLoading(true);

        const initialImages: Record<string, GeneratedImage> = {};
        decades.forEach(decade => {
            initialImages[decade] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const decadesQueue = [...decades];

        const processDecade = async (decade: string) => {
            try {
                const prompt = DECADE_PROMPTS[decade] || `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;
                const resultUrl = await generateDecadeImage(uploadedImage, prompt);

                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'done', url: resultUrl },
                }));

                onSuccess?.(decade, resultUrl);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${decade}:`, err);
                onError?.(decade, errorMessage);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (decadesQueue.length > 0) {
                const decade = decadesQueue.shift();
                if (decade) {
                    await processDecade(decade);
                }
            }
        });

        await Promise.all(workers);
        setIsLoading(false);
    }, [decades, concurrencyLimit, onError, onSuccess]);

    const regenerateDecade = useCallback(async (decade: string, uploadedImage: string) => {
        if (!uploadedImage) return;

        // Prevent re-triggering if a generation is already in progress
        if (generatedImages[decade]?.status === 'pending') {
            return;
        }

        console.log(`Regenerating image for ${decade}...`);

        setGeneratedImages(prev => ({
            ...prev,
            [decade]: { status: 'pending' },
        }));

        try {
            const prompt = DECADE_PROMPTS[decade] || `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;
            const resultUrl = await generateDecadeImage(uploadedImage, prompt);

            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'done', url: resultUrl },
            }));

            onSuccess?.(decade, resultUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${decade}:`, err);
            onError?.(decade, errorMessage);
        }
    }, [generatedImages, onError, onSuccess]);

    const reset = useCallback(() => {
        // Clean up Blob URLs to prevent memory leaks
        Object.values(generatedImages).forEach(image => {
            if (image.url && image.url.startsWith('blob:')) {
                URL.revokeObjectURL(image.url);
            }
        });
        setGeneratedImages({});
    }, [generatedImages]);

    return {
        generatedImages,
        isLoading,
        generateAll,
        regenerateDecade,
        reset,
    };
}

