/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import PolaroidCard from './PolaroidCard';

interface ImagePreviewProps {
    imageUrl: string;
    onGenerate: () => void;
    onReset: () => void;
}

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onGenerate, onReset }) => {
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
        </div>
    );
};

export default ImagePreview;

