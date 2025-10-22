/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
    dataUrl?: string;
}

export interface ImageValidationOptions {
    maxSizeMB?: number;
    maxWidth?: number;
    maxHeight?: number;
    allowedTypes?: string[];
}

const DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
    maxSizeMB: 5,
    maxWidth: 4096,
    maxHeight: 4096,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
};

/**
 * Validates an image file for size, dimensions, and type
 * @param file The file to validate
 * @param options Validation options
 * @returns Promise with validation result
 */
export async function validateImage(
    file: File,
    options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Check file type
    if (!opts.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Please upload a PNG, JPEG, or WebP image.`,
        };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > opts.maxSizeMB) {
        return {
            valid: false,
            error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds the maximum allowed size of ${opts.maxSizeMB}MB.`,
        };
    }

    // Load image to check dimensions
    try {
        const dataUrl = await readFileAsDataURL(file);
        const dimensions = await getImageDimensions(dataUrl);

        if (dimensions.width > opts.maxWidth || dimensions.height > opts.maxHeight) {
            return {
                valid: false,
                error: `Image dimensions (${dimensions.width}x${dimensions.height}) exceed the maximum allowed size of ${opts.maxWidth}x${opts.maxHeight}px.`,
            };
        }

        return {
            valid: true,
            dataUrl,
        };
    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Failed to load image',
        };
    }
}

/**
 * Reads a file as a data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Gets the dimensions of an image from a data URL
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

