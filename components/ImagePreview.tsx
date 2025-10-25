/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import PolaroidCard from './PolaroidCard';

interface ImagePreviewProps {
    imageUrl: string;
    onGenerate: () => void;
    onReset: () => void;
    onGenerateCustom?: (prompt: string) => void;
}

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onGenerate, onReset, onGenerateCustom }) => {
    const [customPrompt, setCustomPrompt] = useState('');
    return (
        <div className="flex flex-col items-center gap-6">
            <PolaroidCard 
                imageUrl={imageUrl} 
                caption="Your Photo" 
                status="done"
            />
            <div className="flex items-center gap-4 mt-4">
                <button onClick={onReset} className={secondaryButtonClasses}>
                    Different Photo
                </button>
                <button onClick={onGenerate} className={primaryButtonClasses}>
                    Generate
                </button>
            </div>
            <div className="flex items-center gap-3 mt-2 w-full max-w-2xl">
                <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Custom style or era (e.g., cyberpunk, 1920s noir, watercolor)"
                    className="flex-1 bg-white/10 text-white placeholder:text-neutral-400 border border-white/30 rounded-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                    onClick={() => {
                        const p = customPrompt.trim();
                        if (p && onGenerateCustom) onGenerateCustom(p);
                    }}
                    className={secondaryButtonClasses}
                >
                    Custom
                </button>
            </div>
        </div>
    );
};

export default ImagePreview;

