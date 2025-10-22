/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GenerationRecord, getAllGenerations, deleteGeneration, clearAllGenerations } from '../lib/indexedDBUtils';
import { createAndDownloadZip } from '../lib/zipExportUtils';
import { useToast } from './Toast';

interface GalleryProps {
    onClose: () => void;
    onSelectGeneration: (record: GenerationRecord) => void;
}

const Gallery: React.FC<GalleryProps> = ({ onClose, onSelectGeneration }) => {
    const [generations, setGenerations] = useState<GenerationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadGenerations();
    }, []);

    const loadGenerations = async () => {
        try {
            setIsLoading(true);
            const records = await getAllGenerations();
            setGenerations(records);
        } catch (error) {
            console.error('Failed to load generations:', error);
            showToast('Failed to load gallery', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGeneration(id);
            setGenerations(prev => prev.filter(g => g.id !== id));
            showToast('Generation deleted', 'success', 2000);
        } catch (error) {
            console.error('Failed to delete generation:', error);
            showToast('Failed to delete generation', 'error');
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to delete all generations? This cannot be undone.')) {
            return;
        }
        try {
            await clearAllGenerations();
            setGenerations([]);
            showToast('All generations cleared', 'success', 2000);
        } catch (error) {
            console.error('Failed to clear generations:', error);
            showToast('Failed to clear generations', 'error');
        }
    };

    const handleExportZip = async (record: GenerationRecord) => {
        try {
            setIsExporting(true);
            showToast('Creating ZIP file...', 'info');
            const timestamp = new Date(record.timestamp).toISOString().split('T')[0];
            await createAndDownloadZip(record.generatedImages, `past-forward-${timestamp}`);
            showToast('ZIP file downloaded!', 'success', 2000);
        } catch (error) {
            console.error('Failed to export ZIP:', error);
            showToast('Failed to export ZIP file', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleSelectGeneration = (record: GenerationRecord) => {
        setSelectedId(record.id);
        onSelectGeneration(record);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-neutral-700"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-700">
                    <h2 className="text-2xl font-caveat font-bold text-neutral-100">Gallery</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-100 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-neutral-400">Loading gallery...</p>
                        </div>
                    ) : generations.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-neutral-400">No generations saved yet. Create one to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {generations.map((record) => (
                                <motion.div
                                    key={record.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                                        selectedId === record.id
                                            ? 'border-yellow-400 bg-yellow-400/10'
                                            : 'border-neutral-700 hover:border-neutral-500'
                                    }`}
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-neutral-800 overflow-hidden">
                                        <img
                                            src={record.generatedImages['1950s']}
                                            alt="Generation thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 bg-neutral-800">
                                        <p className="text-xs text-neutral-400 mb-2">
                                            {formatDate(record.timestamp)}
                                        </p>
                                        <p className="text-sm text-neutral-300 mb-3">
                                            {record.metadata?.fileName || 'Untitled'}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSelectGeneration(record)}
                                                className="flex-1 text-xs bg-yellow-400 text-black py-1 px-2 rounded hover:bg-yellow-300 transition-colors font-semibold"
                                            >
                                                Load
                                            </button>
                                            <button
                                                onClick={() => handleExportZip(record)}
                                                disabled={isExporting}
                                                className="flex-1 text-xs bg-neutral-700 text-neutral-100 py-1 px-2 rounded hover:bg-neutral-600 transition-colors disabled:opacity-50"
                                            >
                                                ZIP
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                className="flex-1 text-xs bg-red-900/50 text-red-200 py-1 px-2 rounded hover:bg-red-900 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {generations.length > 0 && (
                    <div className="border-t border-neutral-700 p-4 flex justify-between">
                        <button
                            onClick={handleClearAll}
                            className="text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={onClose}
                            className="text-sm bg-neutral-700 text-neutral-100 py-2 px-4 rounded hover:bg-neutral-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Gallery;

