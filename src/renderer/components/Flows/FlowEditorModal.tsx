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
            title="Editar Flujo de Capturas"
            maxWidth="4xl"
            description={null}
            showFooter={false}
        >
            <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                {/* Flow Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Flujo
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Flujo de Login, Proceso de Checkout..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                </div>

                {/* Captures Grid */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Capturas ({captures.length} pasos)
                    </label>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={captures.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {captures.map((capture, idx) => (
                                    <SortableStepItem
                                        key={capture.id}
                                        capture={capture}
                                        index={idx}
                                        onUpdate={handleCaptureUpdate}
                                        onDelete={handleDeleteCapture}
                                        renderClickIcon={renderClickIcon}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
                    >
                        <Save size={18} />
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </Modal>
    );
};
