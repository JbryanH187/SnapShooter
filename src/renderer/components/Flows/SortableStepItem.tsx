import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical } from 'lucide-react';
import { FlowCapture } from '../../../shared/types/FlowTypes';
import { ClickIconSelector, ClickStyle } from './ClickIconSelector';

interface SortableStepItemProps {
    capture: FlowCapture;
    index: number;
    onUpdate: (id: string, field: 'title' | 'description' | 'clickStyle', value: string) => void;
    onDelete: (id: string) => void;
    renderClickIcon: (style: string) => React.ReactNode;
}

export const SortableStepItem: React.FC<SortableStepItemProps> = ({
    capture,
    index,
    onUpdate,
    onDelete,
    renderClickIcon
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: capture.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl ${isDragging ? 'shadow-xl ring-2 ring-primary-500' : ''}`}
        >
            {/* Drag Handle & Number */}
            <div className="flex flex-col items-center gap-2">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-primary-500 touch-none">
                    <GripVertical size={16} className="text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                </div>
            </div>

            {/* Thumbnail */}
            <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 group">
                <img
                    src={`media://${capture.imagePath.split(/[\\/]/).pop()}`}
                    alt={`Step ${index + 1}`}
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
                        {renderClickIcon(capture.clickStyle || 'hand')}
                    </div>
                )}
            </div>

            {/* Title & Description & Selector */}
            <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={capture.title || ''}
                        onChange={(e) => onUpdate(capture.id, 'title', e.target.value)}
                        placeholder={`Paso ${index + 1}: Título...`}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    {/* Click Icon Selector */}
                    <ClickIconSelector
                        value={(capture.clickStyle as ClickStyle) || 'hand'}
                        onChange={(style) => onUpdate(capture.id, 'clickStyle', style)}
                    />
                </div>

                <textarea
                    value={capture.description || ''}
                    onChange={(e) => onUpdate(capture.id, 'description', e.target.value)}
                    placeholder="Descripción opcional..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
            </div>

            {/* Delete */}
            <button
                onClick={() => onDelete(capture.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors self-start"
                title="Eliminar este paso"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};
