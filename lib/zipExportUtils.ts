/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

/**
 * Convert a Blob URL to a Blob object
 */
async function blobUrlToBlob(blobUrl: string): Promise<Blob> {
    const response = await fetch(blobUrl);
    return response.blob();
}

/**
 * Create a ZIP file containing all generated images
 */
export async function createZipExport(
    generatedImages: Record<string, string>,
    fileName: string = 'past-forward-generations'
): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder('past-forward-images');

    if (!folder) {
        throw new Error('Failed to create ZIP folder');
    }

    // Add each generated image to the ZIP
    for (const [decade, blobUrl] of Object.entries(generatedImages)) {
        try {
            const blob = await blobUrlToBlob(blobUrl);
            folder.file(`${decade}.jpg`, blob);
        } catch (error) {
            console.error(`Failed to add ${decade} image to ZIP:`, error);
            throw new Error(`Failed to process ${decade} image for ZIP export`);
        }
    }

    // Generate the ZIP file
    return zip.generateAsync({ type: 'blob' });
}

/**
 * Download a ZIP file
 */
export function downloadZip(zipBlob: Blob, fileName: string = 'past-forward-generations'): void {
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Create and download a ZIP file in one step
 */
export async function createAndDownloadZip(
    generatedImages: Record<string, string>,
    fileName: string = 'past-forward-generations'
): Promise<void> {
    const zipBlob = await createZipExport(generatedImages, fileName);
    downloadZip(zipBlob, fileName);
}

