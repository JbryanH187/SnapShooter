import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureFlow, FlowCapture } from '../../../shared/types/FlowTypes';
import { Trash2, GripVertical, Save, Hand, Target, Circle, MousePointer2 } from 'lucide-react';
import { ClickIconSelector, ClickStyle } from './ClickIconSelector';

interface FlowEditorModalProps {
    isOpen: boolean;
    flow: CaptureFlow | null;
    onClose: () => void;
    onSave: (flow: CaptureFlow) => void;
}

export const FlowEditorModal: React.FC<FlowEditorModalProps> = ({ isOpen, flow, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [captures, setCaptures] = useState<FlowCapture[]>([]);

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

                    <div className="space-y-4">
                        {captures.map((capture, idx) => (
                            <div
                                key={capture.id}
                                className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl"
                            >
                                {/* Drag Handle & Number */}
                                <div className="flex flex-col items-center gap-2">
                                    <GripVertical size={16} className="text-gray-400 cursor-grab" />
                                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 group">
                                    <img
                                        src={`media://${capture.imagePath.split(/[\\/]/).pop()}`}
                                        alt={`Step ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Click indicator */}
                                    {capture.clickPosition && (
                                        <div
                                            className="absolute pointer-events-none"
                                            style={{
                                                left: `${capture.clickPosition.x}%`,
                                                top: `${capture.clickPosition.y}%`,
                                                transform: 'translate(-50%, -50%) scale(0.6)'
                                            }}
                                        >
                                            {renderClickIcon(capture.clickStyle)}
                                        </div>
                                    )}
                                </div>

                                {/* Title & Description & Selector */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={capture.title || ''}
                                            onChange={(e) => handleCaptureUpdate(capture.id, 'title', e.target.value)}
                                            placeholder={`Paso ${idx + 1}: Título...`}
                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        />
                                        {/* Click Icon Selector */}
                                        <ClickIconSelector
                                            value={(capture.clickStyle as ClickStyle) || 'hand'}
                                            onChange={(style) => handleCaptureUpdate(capture.id, 'clickStyle', style)}
                                        />
                                    </div>

                                    <textarea
                                        value={capture.description || ''}
                                        onChange={(e) => handleCaptureUpdate(capture.id, 'description', e.target.value)}
                                        placeholder="Descripción opcional..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDeleteCapture(capture.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors self-start"
                                    title="Eliminar este paso"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
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
