/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface BatchItem {
    id: string;
    fileName: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    progress: number; // 0-100
    error?: string;
}

interface BatchUploadProgressProps {
    items: BatchItem[];
    totalProgress: number; // 0-100
    isProcessing: boolean;
    onCancel?: () => void;
}

const BatchUploadProgress: React.FC<BatchUploadProgressProps> = ({
    items,
    totalProgress,
    isProcessing,
    onCancel,
}) => {
    const completedCount = items.filter(item => item.status === 'done').length;
    const errorCount = items.filter(item => item.status === 'error').length;

    const getStatusColor = (status: BatchItem['status']) => {
        switch (status) {
            case 'done':
                return 'text-green-400';
            case 'error':
                return 'text-red-400';
            case 'processing':
                return 'text-yellow-400';
            default:
                return 'text-neutral-400';
        }
    };

    const getStatusIcon = (status: BatchItem['status']) => {
        switch (status) {
            case 'done':
                return '✓';
            case 'error':
                return '✕';
            case 'processing':
                return '⟳';
            default:
                return '○';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-neutral-900 border-2 border-neutral-700 rounded-lg p-6"
        >
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-caveat font-bold text-neutral-100 mb-2">
                    Batch Processing
                </h3>
                <p className="text-sm text-neutral-400">
                    {completedCount} of {items.length} completed
                    {errorCount > 0 && ` • ${errorCount} error${errorCount > 1 ? 's' : ''}`}
                </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-neutral-400">Overall Progress</span>
                    <span className="text-xs font-semibold text-neutral-300">{totalProgress}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                        className="bg-yellow-400 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-neutral-800 rounded p-3"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`text-lg ${getStatusColor(item.status)}`}>
                                    {getStatusIcon(item.status)}
                                </span>
                                <span className="text-sm text-neutral-300 truncate">
                                    {item.fileName}
                                </span>
                            </div>
                            <span className="text-xs text-neutral-400 ml-2">
                                {item.progress}%
                            </span>
                        </div>

                        {/* Item Progress Bar */}
                        <div className="w-full bg-neutral-700 rounded-full h-1 overflow-hidden">
                            <motion.div
                                className={`h-full ${
                                    item.status === 'error'
                                        ? 'bg-red-500'
                                        : item.status === 'done'
                                        ? 'bg-green-500'
                                        : 'bg-yellow-400'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Error Message */}
                        {item.error && (
                            <p className="text-xs text-red-400 mt-2">{item.error}</p>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Actions */}
            {isProcessing && onCancel && (
                <button
                    onClick={onCancel}
                    className="w-full bg-red-900/50 text-red-200 py-2 px-4 rounded hover:bg-red-900 transition-colors text-sm font-semibold"
                >
                    Cancel Processing
                </button>
            )}
        </motion.div>
    );
};

export default BatchUploadProgress;

