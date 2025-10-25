/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a base64 data URL to a Blob URL.
 * @param dataUrl The base64 data URL (e.g., "data:image/png;base64,...")
 * @returns The Blob URL string, or null if conversion fails.
 */
export function dataUrlToBlobUrl(dataUrl: string): string | null {
    if (!dataUrl.startsWith('data:image/')) {
        return null;
    }

    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        return null;
    }

    const [, mimeType, base64Data] = match;

    try {
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
    } catch (error) {
        console.error('Failed to convert data URL to Blob URL:', error);
        return null;
    }
}

/**
 * Revokes a Blob URL to free memory.
 * @param url The URL to revoke (only revokes if it's a blob: URL).
 */
export function revokeBlobUrl(url: string | undefined | null): void {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

/**
 * Revokes multiple Blob URLs to free memory.
 * @param urls Array of URLs to revoke.
 */
export function revokeBlobUrls(urls: (string | undefined | null)[]): void {
    urls.forEach(revokeBlobUrl);
}

/**
 * Checks if a URL is a Blob URL.
 * @param url The URL to check.
 * @returns True if the URL is a blob: URL.
 */
export function isBlobUrl(url: string | undefined | null): boolean {
    return typeof url === 'string' && url.startsWith('blob:');
}
