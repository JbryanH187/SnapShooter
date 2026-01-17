
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCaptureStore } from '../../stores/captureStore';
import { useFlowStore } from '../../stores/flowStore';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { X, Edit3, FolderPlus, Trash2, Check } from 'lucide-react';
import { logger } from '../../services/Logger';
import { toast } from 'react-hot-toast';

export const CapturePreview: React.FC = () => {
    const previewCapture = useCaptureStore(state => state.previewCapture);
    const setPreviewCapture = useCaptureStore(state => state.setPreviewCapture);
    const deleteCapture = useCaptureStore(state => state.deleteCapture);
    const { flows } = useFlowStore();
    const { openImageEditor } = useGlobalModal();
    const [isHovered, setIsHovered] = useState(false);

    // Auto-dismiss after 5 seconds (unless hovered)
    useEffect(() => {
        if (previewCapture && !isHovered) {
            const timer = setTimeout(() => {
                setPreviewCapture(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [previewCapture, isHovered, setPreviewCapture]);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewCapture) {
            logger.info('UI', 'Opening capture in editor from preview');
            openImageEditor(previewCapture);
            setPreviewCapture(null);
        }
    };

    const handleAddToFlow = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewCapture) {
            logger.info('UI', 'Add to flow requested from preview', { captureId: previewCapture.id });
            // TODO: Implement flow selector modal in next iteration
            toast('Feature coming soon: Select flow to add capture', {
                icon: '🚧'
            });
            setPreviewCapture(null);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewCapture) {
            logger.info('UI', 'Deleting capture from preview', { captureId: previewCapture.id });
            await deleteCapture(previewCapture.id);
            setPreviewCapture(null);
            toast.success('Capture deleted');
        }
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewCapture(null);
    };

    if (!previewCapture) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
            >
                {/* Main Preview Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden backdrop-blur-xl">
                    {/* Header with Dismiss */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Screenshot Saved</span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Preview Image */}
                    <div className="p-4">
                        <div className="relative w-72 h-48 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                                src={previewCapture.thumbnail}
                                className="w-full h-full object-contain"
                                alt="Screenshot preview"
                            />
                            {/* Success checkmark overlay */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                                className="absolute top-2 left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                                <Check size={18} className="text-white" strokeWidth={3} />
                            </motion.div>
                        </div>

                        {/* Capture Info */}
                        <div className="mt-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {previewCapture.title || 'Untitled Screenshot'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(previewCapture.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions - macOS Style */}
                    <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-end gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDelete}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1.5"
                            title="Delete"
                        >
                            <Trash2 size={13} />
                            Delete
                        </motion.button>

                        {flows.length > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddToFlow}
                                className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center gap-1.5"
                                title="Add to Flow"
                            >
                                <FolderPlus size={13} />
                                Add to Flow
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEdit}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                            title="Edit Details"
                        >
                            <Edit3 size={13} />
                            Edit
                        </motion.button>
                    </div>
                </div>

                {/* Auto-dismiss indicator */}
                {!isHovered && (
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className="h-1 bg-primary-500 rounded-full"
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
};
