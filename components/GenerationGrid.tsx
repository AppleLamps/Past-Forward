/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import PolaroidCard from './PolaroidCard';
import type { GeneratedImage } from '../hooks/useImageGeneration';
import ImageLightbox from './ImageLightbox';

interface GenerationGridProps {
    decades: string[];
    generatedImages: Record<string, GeneratedImage>;
    isMobile: boolean;
    onShake: (decade: string) => void;
    onDownload: (decade: string) => void;
}

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '5%', left: '10%', rotate: -8 },
    { top: '15%', left: '60%', rotate: 5 },
    { top: '45%', left: '5%', rotate: 3 },
    { top: '2%', left: '35%', rotate: 10 },
    { top: '40%', left: '70%', rotate: -12 },
    { top: '50%', left: '38%', rotate: -3 },
];

const GenerationGrid: React.FC<GenerationGridProps> = ({
    decades,
    generatedImages,
    isMobile,
    onShake,
    onDownload,
}) => {
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | undefined>(undefined);
    const [lightboxCaption, setLightboxCaption] = useState<string | undefined>(undefined);

    if (isMobile) {
        return (
            <>
                <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                    {decades.map((decade) => (
                        <div key={decade} className="flex justify-center">
                            <PolaroidCard
                                caption={decade}
                                status={generatedImages[decade]?.status || 'pending'}
                                imageUrl={generatedImages[decade]?.url}
                                error={generatedImages[decade]?.error}
                                onShake={onShake}
                                onDownload={onDownload}
                                isMobile={isMobile}
                                onOpen={(caption, url) => { setLightboxCaption(caption); setLightboxImage(url); setLightboxOpen(true); }}
                            />
                        </div>
                    ))}
                </div>
                <ImageLightbox
                    isOpen={lightboxOpen}
                    imageUrl={lightboxImage}
                    caption={lightboxCaption}
                    onClose={() => setLightboxOpen(false)}
                />
            </>
        );
    }

    return (
        <>
            <div ref={dragAreaRef} className="relative w-full max-w-5xl h-[600px] mt-4">
                {decades.map((decade, index) => {
                    const { top, left, rotate } = POSITIONS[index];
                    return (
                        <motion.div
                            key={decade}
                            className="absolute cursor-grab active:cursor-grabbing"
                            style={{ top, left }}
                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1, 
                                y: 0,
                                rotate: `${rotate}deg`,
                            }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                        >
                            <PolaroidCard 
                                dragConstraintsRef={dragAreaRef}
                                caption={decade}
                                status={generatedImages[decade]?.status || 'pending'}
                                imageUrl={generatedImages[decade]?.url}
                                error={generatedImages[decade]?.error}
                                onShake={onShake}
                                onDownload={onDownload}
                                isMobile={isMobile}
                                onOpen={(caption, url) => { setLightboxCaption(caption); setLightboxImage(url); setLightboxOpen(true); }}
                            />
                        </motion.div>
                    );
                })}
            </div>
            <ImageLightbox
                isOpen={lightboxOpen}
                imageUrl={lightboxImage}
                caption={lightboxCaption}
                onClose={() => setLightboxOpen(false)}
            />
        </>
    );
};

export default GenerationGrid;

