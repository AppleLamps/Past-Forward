/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback } from 'react';
import { generateDecadeImage, generateCustomImage, DECADE_PROMPTS } from '../services/geminiService';
import { revokeBlobUrls } from '../lib/blobUtils';

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

        // Clean up old blob URL before regenerating
        revokeBlobUrls([generatedImages[decade]?.url]);

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

    const regenerateCustom = useCallback(async (label: string, uploadedFile: File, customPrompt: string) => {
        if (!uploadedFile) return;

        if (generatedImages[label]?.status === 'pending') {
            return;
        }

        console.log(`Regenerating custom image for ${label}...`);

        // Clean up old blob URL before regenerating
        revokeBlobUrls([generatedImages[label]?.url]);

        setGeneratedImages(prev => ({
            ...prev,
            [label]: { status: 'pending' },
        }));

        try {
            const resultUrl = await generateCustomImage(uploadedFile, customPrompt);

            setGeneratedImages(prev => ({
                ...prev,
                [label]: { status: 'done', url: resultUrl },
            }));

            onSuccess?.(label, resultUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [label]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate custom image for ${label}:`, err);
            onError?.(label, errorMessage);
        }
    }, [generatedImages, onError, onSuccess]);

    const generateCustomAll = useCallback(async (uploadedFile: File, customPrompt: string, count: number = 6) => {
        setIsLoading(true);

        const customLabels = Array.from({ length: count }, (_, i) => `Version ${i + 1}`);
        const initialImages: Record<string, GeneratedImage> = {};
        customLabels.forEach(label => {
            initialImages[label] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const labelsQueue = [...customLabels];

        const processCustom = async (label: string) => {
            try {
                const resultUrl = await generateCustomImage(uploadedFile, customPrompt);

                setGeneratedImages(prev => ({
                    ...prev,
                    [label]: { status: 'done', url: resultUrl },
                }));

                onSuccess?.(label, resultUrl);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [label]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate custom image for ${label}:`, err);
                onError?.(label, errorMessage);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (labelsQueue.length > 0) {
                const label = labelsQueue.shift();
                if (label) {
                    await processCustom(label);
                }
            }
        });

        await Promise.all(workers);
        setIsLoading(false);
    }, [concurrencyLimit, onError, onSuccess]);

    const reset = useCallback(() => {
        // Clean up Blob URLs to prevent memory leaks
        const urls = Object.values(generatedImages).map((image: GeneratedImage) => image.url);
        revokeBlobUrls(urls);
        setGeneratedImages({});
    }, [generatedImages]);

    return {
        generatedImages,
        isLoading,
        generateAll,
        generateCustomAll,
        regenerateDecade,
        regenerateCustom,
        reset,
    };
}

