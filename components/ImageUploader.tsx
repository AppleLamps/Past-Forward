/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';
import PolaroidCard from './PolaroidCard';

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-full">
            {/* Ghost polaroids for intro animation */}
            {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                <motion.div
                    key={index}
                    className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-100/10 blur-sm"
                    initial={config.initial}
                    animate={{
                        x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20,
                        scale: 0,
                        opacity: 0,
                    }}
                    transition={{
                        ...config.transition,
                        ease: "circOut",
                        duration: 2,
                    }}
                />
            ))}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2, duration: 0.8, type: 'spring' }}
                className="flex flex-col items-center"
            >
                <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                    <PolaroidCard 
                        caption="Click to begin"
                        status="done"
                    />
                </label>
                <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleFileChange} 
                />
                <p className="mt-8 font-permanent-marker text-neutral-500 text-center max-w-xs text-lg">
                    Click the polaroid to upload your photo and start your journey through time.
                </p>
            </motion.div>
        </div>
    );
};

export default ImageUploader;

