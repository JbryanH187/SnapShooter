import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureFlow, FlowCapture } from '../../../shared/types/FlowTypes';
import { Save, Hand, Target, Circle, MousePointer2 } from 'lucide-react';
import { ClickStyle } from './ClickIconSelector';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableStepItem } from './SortableStepItem';

interface FlowEditorModalProps {
    isOpen: boolean;
    flow: CaptureFlow | null;
    onClose: () => void;
    onSave: (flow: CaptureFlow) => void;
}

export const FlowEditorModal: React.FC<FlowEditorModalProps> = ({ isOpen, flow, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [captures, setCaptures] = useState<FlowCapture[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (flow) {
            setName(flow.name || '');
            setCaptures([...flow.captures].sort((a, b) => a.order - b.order));
        }
    }, [flow]);

    const handleSave = () => {
        if (!flow) return;
        onSave({
            ...flow,
            name,
            captures: captures.map((c, idx) => ({ ...c, order: idx })),
            updatedAt: Date.now()
        });
        onClose();
    };

    const handleCaptureUpdate = (captureId: string, field: 'title' | 'description' | 'clickStyle', value: string) => {
        setCaptures(prev => prev.map(c =>
            c.id === captureId ? { ...c, [field]: value } : c
        ));
    };

    const handleDeleteCapture = (captureId: string) => {
        setCaptures(prev => prev.filter(c => c.id !== captureId));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCaptures((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const renderClickIcon = (style: string = 'hand') => {
        const commonProps = "drop-shadow-lg filter";
        switch (style) {
            case 'target':
                return <Target size={24} className={`text-red-500 ${commonProps}`} strokeWidth={2.5} />;
            case 'dot':
                return <Circle size={20} className={`fill-red-500 text-white ${commonProps}`} strokeWidth={2} />;
            case 'mouse':
                return <MousePointer2 size={24} className={`text-white fill-black ${commonProps}`} />;
            case 'hand':
            default:
                return <Hand size={24} className={`text-amber-500 fill-white ${commonProps}`} />;
        }
    };

    if (!flow) return null;

    return (
        <Modal
            isOpen={isOpen}
            onCancel={onClose}
            title="Editar Flujo"
            maxWidth="max-w-4xl"
            description={
                <span className="opacity-80">
                    Organiza, renombra y personaliza los pasos de tu flujo.
                </span>
            }
            showFooter={false}
            type="info"
        >
            <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto px-2 py-2">
                {/* Flow Name */}
                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-3xl border border-white/20">
                    <label className="block text-sm font-bold mb-2 ml-1" style={{ color: 'var(--label-primary)' }}>
                        Nombre del Flujo
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Flujo de Login..."
                        className="w-full px-5 py-3 rounded-2xl border outline-none transition-all focus:ring-4 focus:ring-amber-500/20"
                        style={{
                            background: 'var(--system-background)',
                            borderColor: 'var(--separator-opaque)',
                            color: 'var(--label-primary)'
                        }}
                    />
                </div>

                {/* Captures Grid */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <label className="text-sm font-bold" style={{ color: 'var(--label-primary)' }}>
                            Pasos ({captures.length})
                        </label>
                        <span className="text-xs opacity-60">Arrastra para reordenar</span>
                    </div>

                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-3xl border border-white/20 min-h-[200px]">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={captures.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {captures.length === 0 ? (
                                        <div className="text-center py-12 opacity-50 italic">
                                            No hay capturas en este flujo
                                        </div>
                                    ) : (
                                        captures.map((capture, idx) => (
                                            <SortableStepItem
                                                key={capture.id}
                                                capture={capture}
                                                index={idx}
                                                onUpdate={handleCaptureUpdate}
                                                onDelete={handleDeleteCapture}
                                                renderClickIcon={renderClickIcon}
                                            />
                                        ))
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 mt-2">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-2xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                        style={{ color: 'var(--label-secondary)' }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, var(--system-orange), #f97316)'
                        }}
                    >
                        <Save size={18} />
                        Guardar Flujo
                    </button>
                </div>
            </div>
        </Modal>
    );
};
