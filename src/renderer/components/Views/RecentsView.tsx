
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
import OnlyEyesSnapProof from '../../../assets/OnlyEyesSnapProof.png';
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
                    className="px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-4 min-w-[320px] pointer-events-auto"
                    style={{
                        background: 'var(--system-background-secondary)',
                        border: '1px solid var(--separator-opaque)',
                        color: 'var(--label-primary)'
                    }}
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
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                            style={{ color: 'var(--system-blue)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
            key={c.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className={`flex flex-col p-4 border rounded-xl shadow-sm hover:shadow-md transition-all group relative h-full
                ${c.status === 'success' ? 'border-l-4 border-l-success-500' : ''}
                ${c.status === 'failure' ? 'border-l-4 border-l-error-500' : ''}
            `}
            style={{
                ...style,
                background: 'var(--system-background-secondary)',
                borderColor: 'var(--separator-non-opaque)',
                borderRadius: 'var(--radius-card)'
            }}
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
                <h3 className="font-semibold mb-1 truncate text-sm" style={{ color: 'var(--label-primary)' }}>{c.title || 'Untitled Capture'}</h3>
                <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--label-secondary)' }}>{c.description || 'No description.'}</p>
                <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                        background: 'var(--fill-secondary)',
                        color: 'var(--label-secondary)'
                    }}
                >
                    {new Date(c.timestamp).toLocaleTimeString()}
                </span>
            </div>

            {/* Status Toggles */}
            <div
                className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg shadow-sm border"
                style={{
                    background: 'var(--system-background-secondary)',
                    borderColor: 'var(--separator-opaque)'
                }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); updateCapture(c.id, { status: 'success' }); }}
                    className="p-1 rounded-md transition-colors"
                    style={c.status === 'success' ? {
                        color: 'var(--system-green)',
                        background: 'color-mix(in srgb, var(--system-green) 15%, transparent)'
                    } : {
                        color: 'var(--label-quaternary)'
                    }}
                    onMouseEnter={(e) => { if (c.status !== 'success') { e.currentTarget.style.color = 'var(--system-green)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-green) 10%, transparent)'; } }}
                    onMouseLeave={(e) => { if (c.status !== 'success') { e.currentTarget.style.color = 'var(--label-quaternary)'; e.currentTarget.style.background = 'transparent'; } }}
                    title="Mark as Success"
                >
                    <CheckCircle size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); updateCapture(c.id, { status: 'failure' }); }}
                    className="p-1 rounded-md transition-colors"
                    style={c.status === 'failure' ? {
                        color: 'var(--system-red)',
                        background: 'color-mix(in srgb, var(--system-red) 15%, transparent)'
                    } : {
                        color: 'var(--label-quaternary)'
                    }}
                    onMouseEnter={(e) => { if (c.status !== 'failure') { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 10%, transparent)'; } }}
                    onMouseLeave={(e) => { if (c.status !== 'failure') { e.currentTarget.style.color = 'var(--label-quaternary)'; e.currentTarget.style.background = 'transparent'; } }}
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
                className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:text-error-600 hover:bg-error-50"
                style={{ color: 'var(--label-tertiary)' }}
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
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--label-primary)' }}>
                    <Camera size={20} style={{ color: 'var(--system-blue)' }} />
                    Recents
                </h2>
                <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                        background: 'var(--fill-secondary)',
                        color: 'var(--label-secondary)'
                    }}
                >
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
                    className="flex-1 flex flex-col items-center justify-center text-center mx-6"
                >
                    {/* Animated Logo with Glow */}
                    <motion.div
                        className="relative mb-8"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {/* Glow Effect */}
                        <div
                            className="absolute inset-0 rounded-full blur-3xl opacity-40"
                            style={{ background: 'var(--system-blue)', transform: 'scale(1.5)' }}
                        />
                        <img
                            src={OnlyEyesSnapProof}
                            alt="SnapProof"
                            className="w-28 h-28 object-contain rounded-2xl relative z-10"
                            style={{
                                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))',
                                borderRadius: 'var(--radius-card)'
                            }}
                        />
                    </motion.div>

                    {/* Title */}
                    <h3
                        className="text-2xl font-bold mb-3"
                        style={{ color: 'var(--label-primary)' }}
                    >
                        No tienes capturas aún
                    </h3>

                    {/* Description */}
                    <p
                        className="text-base mb-8 max-w-sm mx-auto leading-relaxed"
                        style={{ color: 'var(--label-secondary)' }}
                    >
                        Tu evidencia capturada aparecerá aquí, organizada cronológicamente.
                    </p>

                    {/* Keyboard Shortcut Pill */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl cursor-default"
                        style={{
                            background: 'color-mix(in srgb, var(--system-blue) 10%, var(--fill-secondary))',
                            border: '1px solid color-mix(in srgb, var(--system-blue) 20%, transparent)'
                        }}
                    >
                        <span style={{ color: 'var(--label-secondary)' }}>Presiona</span>
                        <kbd
                            className="font-bold px-2.5 py-1 rounded-lg text-xs font-mono"
                            style={{
                                color: 'var(--system-blue)',
                                background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--system-blue) 30%, transparent)'
                            }}
                        >Ctrl+Shift+1</kbd>
                        <span style={{ color: 'var(--label-secondary)' }}>para capturar</span>
                    </motion.div>
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
