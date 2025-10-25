/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider, useToast } from './components/Toast';
import ImageUploader from './components/ImageUploader';
import ImagePreview from './components/ImagePreview';
import GenerationGrid from './components/GenerationGrid';
import ImageLightbox from './components/ImageLightbox';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import { createAlbumPage } from './lib/albumUtils';
import { validateImage } from './lib/imageValidation';
import { useImageGeneration, GeneratedImage } from './hooks/useImageGeneration';
import { useMediaQuery } from './hooks/useMediaQuery';
import { saveGeneration, GenerationRecord } from './lib/indexedDBUtils';
import { createAndDownloadZip } from './lib/zipExportUtils';
import { generateCustomImage } from './services/geminiService';
import { revokeBlobUrl } from './lib/blobUtils';

const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s'];

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";
const navButtonClasses = "font-permanent-marker text-lg text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/60 py-2 px-6 rounded-sm transform transition-all duration-200 hover:scale-105 hover:rotate-1 hover:bg-white hover:text-black shadow-[2px_2px_0px_1px_rgba(255,255,255,0.1)]";

function AppContent() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const [showGallery, setShowGallery] = useState(false);
    const [activeLabels, setActiveLabels] = useState<string[]>(DECADES);
    const [generationMode, setGenerationMode] = useState<'decades' | 'custom'>('decades');
    const [currentCustomPrompt, setCurrentCustomPrompt] = useState<string>('');
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { showToast } = useToast();

    const { generatedImages, isLoading, generateAll, generateCustomAll, regenerateDecade, regenerateCustom, reset: resetGeneration } = useImageGeneration({
        decades: DECADES,
        concurrencyLimit: DECADES.length,
        onError: (decade, error) => {
            showToast(`Failed to generate ${decade}: ${error}`, 'error');
        },
        onSuccess: (decade) => {
            showToast(`${decade} generated successfully!`, 'success', 3000);
        },
    });

    const handleImageSelect = async (file: File) => {
        const validation = await validateImage(file, {
            maxSizeMB: 5,
            maxWidth: 4096,
            maxHeight: 4096,
        });

        if (!validation.valid) {
            showToast(validation.error || 'Invalid image', 'error');
            return;
        }

        if (validation.dataUrl) {
            // Clean up previous uploaded image if it was a Blob URL
            revokeBlobUrl(uploadedImage);

            setUploadedImage(validation.dataUrl);
            setUploadedFile(file);
            setAppState('image-uploaded');
            resetGeneration(); // Clear previous results
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage || !uploadedFile) return;
        setActiveLabels(DECADES);
        setGenerationMode('decades');
        setAppState('generating');
        await generateAll(uploadedFile);
        setAppState('results-shown');
    };

    const handleGenerateCustom = async (prompt: string) => {
        if (!uploadedFile) return;
        setCurrentCustomPrompt(prompt);
        const customLabels = ['Version 1', 'Version 2', 'Version 3', 'Version 4', 'Version 5', 'Version 6'];
        setActiveLabels(customLabels);
        setGenerationMode('custom');
        setAppState('generating');
        await generateCustomAll(uploadedFile, prompt, 6);
        setAppState('results-shown');
    };

    const handleRegenerateDecade = async (label: string) => {
        if (!uploadedFile) return;
        if (generationMode === 'custom') {
            await regenerateCustom(label, uploadedFile, currentCustomPrompt);
        } else {
            await regenerateDecade(label, uploadedFile);
        }
    };

    const handleReset = () => {
        // Clean up Blob URLs
        revokeBlobUrl(uploadedImage);

        setUploadedImage(null);
        setUploadedFile(null);
        resetGeneration();
        setActiveLabels(DECADES);
        setGenerationMode('decades');
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `past-forward-${decade}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`Downloaded ${decade} image!`, 'success', 2000);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]: [string, GeneratedImage]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]: [string, GeneratedImage]) => {
                    acc[decade] = image.url!;
                    return acc;
                }, {} as Record<string, string>);

            const expectedCount = generationMode === 'decades' ? DECADES.length : 6;
            if (Object.keys(imageData).length < expectedCount) {
                showToast("Please wait for all images to finish generating before downloading the album.", 'warning');
                return;
            }

            showToast("Creating your album...", 'info', 2000);
            const albumDataUrl = await createAlbumPage(imageData, isMobile);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'past-forward-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast("Album downloaded successfully!", 'success');
        } catch (error) {
            console.error("Failed to create or download album:", error);
            showToast("Sorry, there was an error creating your album. Please try again.", 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadZip = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]: [string, GeneratedImage]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]: [string, GeneratedImage]) => {
                    acc[decade] = image.url!;
                    return acc;
                }, {} as Record<string, string>);

            const expectedCount = generationMode === 'decades' ? DECADES.length : 6;
            if (Object.keys(imageData).length < expectedCount) {
                showToast("Please wait for all images to finish generating before downloading.", 'warning');
                return;
            }

            showToast("Creating ZIP file...", 'info', 2000);
            await createAndDownloadZip(imageData, 'past-forward-generations');
            showToast("ZIP file downloaded successfully!", 'success');
        } catch (error) {
            console.error("Failed to create ZIP:", error);
            showToast("Sorry, there was an error creating the ZIP file. Please try again.", 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const saveToHistory = async () => {
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]: [string, GeneratedImage]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]: [string, GeneratedImage]) => {
                    acc[decade] = image.url!;
                    return acc;
                }, {} as Record<string, string>);

            const expectedCount = generationMode === 'decades' ? DECADES.length : 6;
            if (Object.keys(imageData).length < expectedCount) {
                showToast("Please wait for all images to finish generating.", 'warning');
                return;
            }

            const record: GenerationRecord = {
                id: `gen-${Date.now()}`,
                timestamp: Date.now(),
                originalImageUrl: uploadedImage || '',
                generatedImages: imageData,
                metadata: {
                    fileName: 'Generation',
                },
            };

            await saveGeneration(record);
            showToast("Generation saved to history!", 'success', 2000);
        } catch (error) {
            console.error("Failed to save to history:", error);
            showToast("Failed to save to history", 'error');
        }
    };

    const handleSelectFromGallery = (record: GenerationRecord) => {
        setUploadedImage(record.originalImageUrl);
        setAppState('results-shown');
        setShowGallery(false);
        showToast("Generation loaded from history!", 'success', 2000);
    };

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>

            {/* Top Navigation */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                    onClick={() => setShowGallery(true)}
                    className={navButtonClasses}
                >
                    📷 Gallery
                </button>
            </div>

            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-caveat font-bold text-neutral-100">Past Forward</h1>
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">
                        {isLoading 
                            ? (generationMode === 'custom' ? 'Generating custom variations...' : 'Generating across the decades...') 
                            : 'Generate yourself through the decades.'}
                    </p>
                </div>

                {appState === 'idle' && (
                    <>
                        <ImageUploader
                            onImageSelect={handleImageSelect}
                        />
                    </>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <ImagePreview
                        imageUrl={uploadedImage}
                        onGenerate={handleGenerateClick}
                        onReset={handleReset}
                        onGenerateCustom={handleGenerateCustom}
                    />
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                    <>
                        <GenerationGrid
                            decades={activeLabels}
                            generatedImages={generatedImages}
                            isMobile={isMobile}
                            onShake={handleRegenerateDecade}
                            onDownload={handleDownloadIndividualImage}
                        />
                        <div className="mt-40 flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-center">
                            {appState === 'results-shown' && (
                                <>
                                    <button
                                        onClick={handleDownloadAlbum}
                                        disabled={isDownloading}
                                        className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating...' : 'Download Album'}
                                    </button>
                                    <button
                                        onClick={handleDownloadZip}
                                        disabled={isDownloading}
                                        className={`${secondaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating...' : 'Download ZIP'}
                                    </button>
                                    <button
                                        onClick={saveToHistory}
                                        className="font-permanent-marker text-xl text-center text-white bg-green-600/50 border-2 border-green-500 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:bg-green-600"
                                    >
                                        💾 Save
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />

            {/* Gallery Modal */}
            <AnimatePresence>
                {showGallery && (
                    <Gallery
                        onClose={() => setShowGallery(false)}
                        onSelectGeneration={handleSelectFromGallery}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}

function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;