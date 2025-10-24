/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback } from 'react';
import { generateDecadeImage, DECADE_PROMPTS } from '../services/geminiService';

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

    const generateAll = useCallback(async (uploadedFile: File) => {
        setIsLoading(true);

        const initialImages: Record<string, GeneratedImage> = {};
        decades.forEach(decade => {
            initialImages[decade] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const decadesQueue = [...decades];

        const processDecade = async (decade: string) => {
            try {
                const resultUrl = await generateDecadeImage(uploadedFile, decade);

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

    const regenerateDecade = useCallback(async (decade: string, uploadedFile: File) => {
        if (!uploadedFile) return;

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
            const resultUrl = await generateDecadeImage(uploadedFile, decade);

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
        Object.values(generatedImages).forEach((image: GeneratedImage) => {
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

