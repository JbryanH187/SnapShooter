
import React, { useEffect, useState, useRef } from 'react';
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
    const updateCapture = useCaptureStore(state => state.updateCapture);
    const deleteCapture = useCaptureStore(state => state.deleteCapture);
    const { flows } = useFlowStore();
    const { openImageEditor } = useGlobalModal();
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // New state to pause dismiss

    // Auto-dismiss after 5 seconds (unless hovered or editing)
    useEffect(() => {
        if (previewCapture && !isHovered && !isEditing) {
            const timer = setTimeout(() => {
                setPreviewCapture(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [previewCapture, isHovered, isEditing, setPreviewCapture]);

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

    // Metadata handlers
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (previewCapture) {
            updateCapture(previewCapture.id, { title: e.target.value });
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (previewCapture) {
            updateCapture(previewCapture.id, { description: e.target.value });
        }
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
                <div
                    className="rounded-xl shadow-2xl border overflow-hidden backdrop-blur-xl"
                    style={{
                        background: 'var(--system-background)',
                        borderColor: 'var(--separator-opaque)',
                        width: '340px'
                    }}
                >
                    {/* Header with Dismiss */}
                    <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--separator-non-opaque)', background: 'var(--fill-quaternary)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-semibold" style={{ color: 'var(--label-primary)' }}>Screenshot Saved</span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--label-tertiary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Preview Image & Inputs */}
                    <div className="p-4 flex flex-col gap-3">
                        <div className="relative w-full h-40 rounded-lg overflow-hidden border" style={{ background: 'var(--fill-tertiary)', borderColor: 'var(--separator-opaque)' }}>
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

                        {/* Capture Info Inputs */}
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Capture Title"
                                value={previewCapture.title || ''}
                                onChange={handleTitleChange}
                                onFocus={() => setIsEditing(true)}
                                onBlur={() => setIsEditing(false)}
                                className="w-full px-3 py-1.5 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                style={{
                                    background: 'var(--fill-tertiary)',
                                    border: '1px solid var(--separator-opaque)',
                                    color: 'var(--label-primary)'
                                }}
                            />
                            <textarea
                                placeholder="Add a description..."
                                value={previewCapture.description || ''}
                                onChange={handleDescriptionChange}
                                onFocus={() => setIsEditing(true)}
                                onBlur={() => setIsEditing(false)}
                                rows={2}
                                className="w-full px-3 py-1.5 text-xs rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                                style={{
                                    background: 'var(--fill-tertiary)',
                                    border: '1px solid var(--separator-opaque)',
                                    color: 'var(--label-secondary)'
                                }}
                            />
                        </div>
                    </div>


                    {/* Quick Actions - macOS Style */}
                    <div className="px-4 py-3 border-t flex items-center justify-end gap-2" style={{ background: 'var(--fill-quaternary)', borderColor: 'var(--separator-non-opaque)' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDelete}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)', // Red tint background
                                color: 'var(--system-red)',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.color = 'var(--system-red)';
                            }}
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
                                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                                style={{ color: 'var(--system-blue)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--system-blue) 10%, transparent)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                            style={{ background: 'var(--system-blue)' }}
                            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                            title="Edit Details"
                        >
                            <Edit3 size={13} />
                            Edit
                        </motion.button>
                    </div>
                </div>

                {/* Auto-dismiss indicator */}
                {!isHovered && !isEditing && (
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
