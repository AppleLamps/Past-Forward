/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
    isOpen: boolean;
    imageUrl?: string | null;
    caption?: string;
    onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, imageUrl, caption, onClose }) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && imageUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-6xl w-full max-h-[85vh] flex flex-col items-center"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-neutral-300 hover:text-white bg-neutral-800/60 rounded-full p-2"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <div className="w-full h-full flex items-center justify-center">
                            <img
                                src={imageUrl}
                                alt={caption || 'Image'}
                                className="max-h-[80vh] max-w-full object-contain rounded"
                            />
                        </div>
                        {caption && (
                            <div className="mt-3 text-neutral-300 text-sm font-permanent-marker">
                                {caption}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ImageLightbox;
