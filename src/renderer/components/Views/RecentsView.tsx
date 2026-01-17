
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCaptureStore } from '../../stores/captureStore';
import { useUI } from '../../contexts/UIContext';
import { useCaptureSearch, DateFilter, StatusFilter } from '../../hooks/useCaptureSearch';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { VirtualGrid } from '../UI/VirtualGrid';
import { FilterBar } from '../UI/FilterBar';
import { confirm, toast } from '../../utils/toast';
import { toast as hotToast } from 'react-hot-toast';
import { Camera, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import OnlyEyesSnapProof from '../../../assets/OnlyEyesSnapProof.jpg';
import { logger } from '../../services/Logger';

import { RecentsSkeleton } from '../UI/Skeletons';

export const RecentsView: React.FC = () => {
    const { captures, deleteCapture, updateCapture, loadCaptures, isLoading } = useCaptureStore();
    const { searchQuery } = useUI();
    const { openImageEditor } = useGlobalModal();

    // Filter state
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Enhanced search with filters
    const searchResult = useCaptureSearch(captures, searchQuery, {
        dateRange: dateFilter,
        status: statusFilter
    });

    const filteredCaptures = searchResult.captures;
    const hasActiveFilters = searchResult.hasActiveFilters;

    const handleClearFilters = () => {
        setDateFilter('all');
        setStatusFilter('all');
    };

    const handleDeleteCapture = async (captureId: string) => {
        // Optimistic delete, so no confirmation needed for speed, OR we keep confirmation but auto-dismiss.
        // Let's keep it simple: confirm -> delete -> show Undo toast. 
        // OR better for productivity: No confirm dialog for single click, just Undo option.
        // But since this is a destructive action, let's stick to the current plan: 
        // 1. Delete (optimistic) 2. Show Undo Toast.
        // Wait, the plan was: User clicks Delete -> Remove immediately -> Show Undo.
        // So we should REMOVE the confirm dialog for a smoother "macOS feel", or keep it minimal.
        // Given the requirement "Undo/Redo Stack", removing the blocking confirm is better UX if Undo exists.

        try {
            await deleteCapture(captureId);

            // Custom Toast with Undo using react-hot-toast
            hotToast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-4 min-w-[320px] border border-gray-700 pointer-events-auto"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Trash2 size={16} className="text-red-500" />
                        </div>
                        <span className="font-medium text-sm">Capture deleted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                useCaptureStore.getState().undoLastDelete();
                                hotToast.dismiss(t.id);
                            }}
                            className="text-primary-400 hover:text-primary-300 hover:bg-white/5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Undo
                        </button>
                    </div>
                </motion.div>
            ), { duration: 4000, id: 'undo-toast' });

        } catch (error) {
            logger.error('CAPTURE', 'Failed to delete capture', {
                error: error instanceof Error ? error.message : String(error),
                captureId
            });
            toast.error('Error al eliminar la captura');
        }
    };

    const renderCard = (c: any, index: number, style: React.CSSProperties) => (
        <motion.div
            layout
            style={style}
            key={c.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className={`flex flex-col p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all group relative h-full
                ${c.status === 'success' ? 'border-l-4 border-l-success-500' : ''}
                ${c.status === 'failure' ? 'border-l-4 border-l-error-500' : ''}
            `}
        >
            {/* Step Badge */}
            <div className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10 border-2 border-white
                ${c.status === 'success' ? 'bg-success-500 text-white' :
                    c.status === 'failure' ? 'bg-error-500 text-white' : 'bg-gray-800 text-white'
                }
            `}>
                {filteredCaptures.indexOf(c) + 1}
            </div>

            {/* Thumbnail */}
            <div
                className="relative cursor-pointer mb-3"
                onClick={() => openImageEditor(c)}
            >
                <img src={c.thumbnail} className="w-full h-32 object-cover rounded-lg bg-gray-100 border border-gray-200" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                    <span className="bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm">Edit</span>
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate text-sm">{c.title || 'Untitled Capture'}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{c.description || 'No description.'}</p>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                    {new Date(c.timestamp).toLocaleTimeString()}
                </span>
            </div>

            {/* Status Toggles */}
            <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                <button
                    onClick={(e) => { e.stopPropagation(); updateCapture(c.id, { status: 'success' }); }}
                    className={`p-1 rounded-md hover:bg-success-50 dark:hover:bg-success-900/30 transition-colors ${c.status === 'success' ? 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30' : 'text-gray-300 dark:text-gray-500 hover:text-success-600 dark:hover:text-success-400'}`}
                    title="Mark as Success"
                >
                    <CheckCircle size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); updateCapture(c.id, { status: 'failure' }); }}
                    className={`p-1 rounded-md hover:bg-error-50 dark:hover:bg-error-900/30 transition-colors ${c.status === 'failure' ? 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/30' : 'text-gray-300 dark:text-gray-500 hover:text-error-600 dark:hover:text-error-400'}`}
                    title="Mark as Failure"
                >
                    <XCircle size={14} />
                </button>
            </div>

            {/* Delete Button */}
            <button
                onClick={async (e) => {
                    e.stopPropagation();
                    await handleDeleteCapture(c.id);
                }}
                className="absolute top-3 right-3 p-1.5 text-gray-300 dark:text-gray-600 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Capture"
            >
                <Trash2 size={14} />
            </button>
        </motion.div>
    );

    return (
        <motion.div
            key="recents"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Camera size={20} className="text-primary-500" />
                    Recents
                </h2>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {filteredCaptures.length} / {captures.length}
                </span>
            </div>

            {/* Filter Bar */}
            {captures.length > 0 && (
                <FilterBar
                    dateFilter={dateFilter}
                    statusFilter={statusFilter}
                    onDateFilterChange={setDateFilter}
                    onStatusFilterChange={setStatusFilter}
                    resultCount={searchResult.count}
                    totalCount={captures.length}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={handleClearFilters}
                />
            )}

            {isLoading ? (
                <div className="flex-1 overflow-hidden overflow-y-auto no-scrollbar px-6">
                    <RecentsSkeleton />
                </div>
            ) : captures.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-800/30 p-8 text-center mx-6"
                >
                    <img
                        src={OnlyEyesSnapProof}
                        alt="No captures"
                        className="w-32 h-32 object-contain mb-6 opacity-60 dark:opacity-60 rounded-full"
                    />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No captures yet</h3>
                    <p className="text-sm mb-6 max-w-xs mx-auto text-gray-500 dark:text-gray-400">Your captured evidence will appear here properly organized.</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm text-gray-600 dark:text-gray-300">
                        <span>Press</span>
                        <kbd className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-xs font-mono">Ctrl+Shift+1</kbd>
                        <span>to start</span>
                    </div>
                </motion.div>
            ) : (
                <div data-tour="captures-list" className="flex-1 overflow-hidden px-6">
                    <VirtualGrid
                        items={filteredCaptures}
                        renderItem={renderCard}
                        itemHeight={300}

                        minColumnWidth={320}
                        gap={16}
                    />
                </div>
            )}
        </motion.div>
    );
};
