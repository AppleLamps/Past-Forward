/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a File to a data URL string.
 * @param file The File to convert.
 * @returns A promise that resolves to the data URL string.
 */
export function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Converts a Blob to a data URL string.
 * @param blob The Blob to convert.
 * @returns A promise that resolves to the data URL string.
 */
export function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Converts a Blob URL to a data URL for canvas operations.
 * @param blobUrl The blob URL to convert.
 * @returns A promise that resolves to the data URL string.
 */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return blobToDataURL(blob);
}
