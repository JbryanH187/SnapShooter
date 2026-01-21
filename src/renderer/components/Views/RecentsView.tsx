
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCaptureStore } from '../../stores/captureStore';
import { useUI } from '../../contexts/UIContext';
import { useCaptureSearch, DateFilter, StatusFilter } from '../../hooks/useCaptureSearch';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { FilterBar } from '../UI/FilterBar';
import { toast, confirm } from '../../utils/toast';
import { toast as hotToast } from 'react-hot-toast';
import { Camera, Trash2, Save } from 'lucide-react';
import OnlyEyesSnapProof from '../../../assets/OnlyEyesSnapProof.png';
import { logger } from '../../services/Logger';
import { useFlowStore } from '../../stores/flowStore';
import { RecentsSkeleton } from '../UI/Skeletons';

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';

import { SortableCaptureCard } from './SortableCaptureCard';
import { CaptureCard } from './CaptureCard';
import { CaptureItem } from '../../../shared/types';

export const RecentsView: React.FC = () => {
    const { captures, deleteCapture, updateCapture, isLoading, reorderCaptures, clearAllCaptures } = useCaptureStore();
    const { saveFlowSession, flows, addToFlow } = useFlowStore(); // Includes addToFlow now (or will soon)
    const { searchQuery } = useUI();
    const { openImageEditor } = useGlobalModal();

    // Local state for Save FLow
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [flowName, setFlowName] = useState('');
    const [selectedFlowId, setSelectedFlowId] = useState<string>(''); // For appending to existing flow

    // DnD State
    const [activeId, setActiveId] = useState<string | null>(null);

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

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (!hasActiveFilters) {
            setActiveId(event.active.id as string);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = captures.findIndex((c) => c.id === active.id);
            const newIndex = captures.findIndex((c) => c.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(captures, oldIndex, newIndex);
                reorderCaptures(newOrder);
            }
        }
    };

    const handleClearFilters = () => {
        setDateFilter('all');
        setStatusFilter('all');
    };

    const handleSaveFlow = async () => {
        if (!flowName.trim() && !selectedFlowId) {
            toast.error('Por favor ingresa un nombre o selecciona un flujo existente');
            return;
        }

        try {
            if (selectedFlowId) {
                await addToFlow(selectedFlowId, captures);
                toast.success('Agregado al flujo exitosamente');
            } else {
                await saveFlowSession(flowName, captures);
                toast.success('Flujo guardado exitosamente');
            }
            clearAllCaptures();
            setIsSaveModalOpen(false);
            setFlowName('');
            setSelectedFlowId('');
        } catch (error) {
            toast.error('Error al guardar el flujo');
            logger.error('CAPTURE', 'Failed to save flow', { error });
        }
    };

    const handleDeleteCapture = async (captureId: string) => {
        try {
            await deleteCapture(captureId);
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
            logger.error('CAPTURE', 'Failed to delete capture', { error: error instanceof Error ? error.message : String(error), captureId });
            toast.error('Error al eliminar la captura');
        }
    };

    const activeCapture = activeId ? captures.find(c => c.id === activeId) : null;

    return (
        <motion.div
            key="recents"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Save Flow Modal */}
            <AnimatePresence>
                {isSaveModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-96 max-h-[80vh] flex flex-col"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--label-primary)' }}>
                                Guardar en Storage
                            </h3>

                            <div className="flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
                                <div>
                                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--label-secondary)' }}>
                                        Nuevo Flujo
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del nuevo flujo..."
                                        className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900"
                                        style={{
                                            borderColor: selectedFlowId ? 'var(--separator-opaque)' : 'var(--system-blue)',
                                            color: 'var(--label-primary)',
                                            opacity: selectedFlowId ? 0.6 : 1
                                        }}
                                        value={flowName}
                                        onChange={(e) => {
                                            setFlowName(e.target.value);
                                            setSelectedFlowId('');
                                        }}
                                        disabled={!!selectedFlowId}
                                    />
                                </div>

                                {flows.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium" style={{ color: 'var(--label-secondary)' }}>
                                            O agregar a existente:
                                        </label>
                                        <div className="flex flex-col gap-2 border rounded-xl p-2 max-h-40 overflow-y-auto" style={{ borderColor: 'var(--separator-opaque)' }}>
                                            {flows.map(flow => (
                                                <button
                                                    key={flow.id}
                                                    onClick={() => {
                                                        setSelectedFlowId(selectedFlowId === flow.id ? '' : flow.id);
                                                        setFlowName('');
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedFlowId === flow.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    <span className="truncate flex-1" style={{ color: selectedFlowId === flow.id ? 'var(--system-blue)' : 'var(--label-primary)' }}>
                                                        {flow.name}
                                                    </span>
                                                    <span className="text-xs ml-2 opacity-60">
                                                        {flow.captures?.length || 0} items
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--separator-opaque)' }}>
                                <button
                                    onClick={() => {
                                        setIsSaveModalOpen(false);
                                        setFlowName('');
                                        setSelectedFlowId('');
                                    }}
                                    className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    style={{ color: 'var(--label-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveFlow}
                                    disabled={!flowName.trim() && !selectedFlowId}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={16} />
                                    {selectedFlowId ? 'Agregar' : 'Guardar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <div className="flex items-center gap-3">
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
                {captures.length > 0 && (
                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        style={{ color: 'var(--system-blue)' }}
                    >
                        <Save size={16} />
                        Guardar en Storage
                    </button>
                )}
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
                    <motion.div
                        className="relative mb-8"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
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
                    <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--label-primary)' }}>
                        No tienes capturas aún
                    </h3>
                    <p className="text-base mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--label-secondary)' }}>
                        Tu evidencia capturada aparecerá aquí.
                    </p>
                </motion.div>
            ) : (
                <div data-tour="captures-list" className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={filteredCaptures.map(c => c.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredCaptures.map((c, index) => (
                                    <SortableCaptureCard key={c.id} id={c.id}>
                                        <CaptureCard
                                            capture={c}
                                            index={index}
                                            onEdit={openImageEditor}
                                            onDelete={handleDeleteCapture}
                                            onUpdateStatus={(id, s) => updateCapture(id, { status: s })}
                                        />
                                    </SortableCaptureCard>
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay adjustScale={true}>
                            {activeCapture ? (
                                <CaptureCard
                                    capture={activeCapture}
                                    index={captures.findIndex(c => c.id === activeCapture.id)}
                                    onEdit={() => { }}
                                    onDelete={() => { }}
                                    onUpdateStatus={() => { }}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            )}
        </motion.div>
    );
};
