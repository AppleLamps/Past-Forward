/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import ImageUploader from './components/ImageUploader';
import ImagePreview from './components/ImagePreview';
import GenerationGrid from './components/GenerationGrid';
import Footer from './components/Footer';
import { createAlbumPage } from './lib/albumUtils';
import { validateImage } from './lib/imageValidation';
import { useImageGeneration } from './hooks/useImageGeneration';
import { useMediaQuery } from './hooks/useMediaQuery';

const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s'];

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

function AppContent() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { showToast } = useToast();

    const { generatedImages, isLoading, generateAll, regenerateDecade, reset: resetGeneration } = useImageGeneration({
        decades: DECADES,
        concurrencyLimit: 2,
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
            if (uploadedImage && uploadedImage.startsWith('blob:')) {
                URL.revokeObjectURL(uploadedImage);
            }

            setUploadedImage(validation.dataUrl);
            setAppState('image-uploaded');
            resetGeneration(); // Clear previous results
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;
        setAppState('generating');
        await generateAll(uploadedImage);
        setAppState('results-shown');
    };

    const handleRegenerateDecade = async (decade: string) => {
        if (!uploadedImage) return;
        await regenerateDecade(decade, uploadedImage);
    };

    const handleReset = () => {
        // Clean up Blob URLs
        if (uploadedImage && uploadedImage.startsWith('blob:')) {
            URL.revokeObjectURL(uploadedImage);
        }

        setUploadedImage(null);
        resetGeneration();
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
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < DECADES.length) {
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

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>

            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-caveat font-bold text-neutral-100">Past Forward</h1>
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">Generate yourself through the decades.</p>
                </div>

                {appState === 'idle' && (
                    <ImageUploader onImageSelect={handleImageSelect} />
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <ImagePreview
                        imageUrl={uploadedImage}
                        onGenerate={handleGenerateClick}
                        onReset={handleReset}
                    />
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                    <>
                        <GenerationGrid
                            decades={DECADES}
                            generatedImages={generatedImages}
                            isMobile={isMobile}
                            onShake={handleRegenerateDecade}
                            onDownload={handleDownloadIndividualImage}
                        />
                        <div className="h-20 mt-4 flex items-center justify-center">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button
                                        onClick={handleDownloadAlbum}
                                        disabled={isDownloading}
                                        className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating Album...' : 'Download Album'}
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
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