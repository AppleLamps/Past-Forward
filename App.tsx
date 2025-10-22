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
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import BatchUploadProgress, { BatchItem } from './components/BatchUploadProgress';
import { createAlbumPage } from './lib/albumUtils';
import { validateImage } from './lib/imageValidation';
import { useImageGeneration, DECADE_PROMPTS } from './hooks/useImageGeneration';
import { useMediaQuery } from './hooks/useMediaQuery';
import { saveGeneration, GenerationRecord } from './lib/indexedDBUtils';
import { createAndDownloadZip } from './lib/zipExportUtils';
import { generateDecadeImage } from './services/geminiService';

const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s'];

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";
const navButtonClasses = "font-permanent-marker text-lg text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/60 py-2 px-6 rounded-sm transform transition-all duration-200 hover:scale-105 hover:rotate-1 hover:bg-white hover:text-black shadow-[2px_2px_0px_1px_rgba(255,255,255,0.1)]";
const toggleButtonClasses = "font-permanent-marker text-lg text-center py-2 px-6 rounded-sm transform transition-all duration-200 hover:scale-105 shadow-[2px_2px_0px_1px_rgba(0,0,0,0.2)]";

function AppContent() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const [showGallery, setShowGallery] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [batchProgress, setBatchProgress] = useState(0);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
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

    const handleDownloadZip = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < DECADES.length) {
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
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < DECADES.length) {
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

    const handleBatchUpload = async (files: File[]) => {
        if (files.length === 0) return;

        setIsBatchMode(true);
        setIsProcessingBatch(true);
        setAppState('generating');

        // Initialize batch items
        const items: BatchItem[] = files.map((file, index) => ({
            id: `batch-${Date.now()}-${index}`,
            fileName: file.name,
            status: 'pending',
            progress: 0,
        }));
        setBatchItems(items);

        let completedCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const itemId = items[i].id;

            try {
                // Update status to processing
                setBatchItems(prev =>
                    prev.map(item =>
                        item.id === itemId ? { ...item, status: 'processing', progress: 10 } : item
                    )
                );

                // Validate image
                const validation = await validateImage(file, {
                    maxSizeMB: 5,
                    maxWidth: 4096,
                    maxHeight: 4096,
                });

                if (!validation.valid) {
                    throw new Error(validation.error || 'Invalid image');
                }

                if (!validation.dataUrl) {
                    throw new Error('Failed to process image');
                }

                // Update progress
                setBatchItems(prev =>
                    prev.map(item =>
                        item.id === itemId ? { ...item, progress: 30 } : item
                    )
                );

                // Generate all decades
                const imageData: Record<string, string> = {};
                const decadePromises = DECADES.map(async (decade) => {
                    try {
                        const result = await generateDecadeImage(validation.dataUrl!, DECADE_PROMPTS[decade] || `Reimagine the person in this photo in the style of the ${decade}.`);
                        imageData[decade] = result;
                    } catch (error) {
                        console.error(`Failed to generate ${decade}:`, error);
                    }
                });

                await Promise.all(decadePromises);

                // Update progress
                setBatchItems(prev =>
                    prev.map(item =>
                        item.id === itemId ? { ...item, progress: 80 } : item
                    )
                );

                // Save to history
                const record: GenerationRecord = {
                    id: `gen-${Date.now()}-${i}`,
                    timestamp: Date.now(),
                    originalImageUrl: validation.dataUrl,
                    generatedImages: imageData,
                    metadata: {
                        fileName: file.name,
                    },
                };

                await saveGeneration(record);

                // Mark as done
                setBatchItems(prev =>
                    prev.map(item =>
                        item.id === itemId ? { ...item, status: 'done', progress: 100 } : item
                    )
                );

                completedCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setBatchItems(prev =>
                    prev.map(item =>
                        item.id === itemId
                            ? { ...item, status: 'error', progress: 0, error: errorMessage }
                            : item
                    )
                );
            }

            // Update overall progress
            setBatchProgress(Math.round(((i + 1) / files.length) * 100));
        }

        setIsProcessingBatch(false);
        showToast(`Batch processing complete! ${completedCount}/${files.length} images processed.`, 'success');
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
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">Generate yourself through the decades.</p>
                </div>

                {appState === 'idle' && !isProcessingBatch && (
                    <>
                        <ImageUploader
                            onImageSelect={handleImageSelect}
                            onBatchSelect={handleBatchUpload}
                            isBatchMode={isBatchMode}
                        />
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => setIsBatchMode(!isBatchMode)}
                                className={`${toggleButtonClasses} ${isBatchMode
                                    ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:-rotate-1'
                                    : 'bg-white/10 backdrop-blur-sm border-2 border-white/60 text-white hover:bg-white hover:text-black hover:rotate-1'
                                    }`}
                            >
                                {isBatchMode ? '✓ Batch Mode' : 'Single Mode'}
                            </button>
                        </div>
                    </>
                )}

                {isProcessingBatch && (
                    <BatchUploadProgress
                        items={batchItems}
                        totalProgress={batchProgress}
                        isProcessing={isProcessingBatch}
                    />
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