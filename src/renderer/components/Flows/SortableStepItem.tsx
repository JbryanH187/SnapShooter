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
            className={`flex gap-4 p-4 border rounded-xl ${isDragging ? 'shadow-xl ring-2 ring-primary-500' : ''}`}
            style={{
                ...style,
                background: 'var(--fill-secondary)',
                borderColor: 'var(--separator-opaque)'
            }}
        >
            {/* Drag Handle & Number */}
            <div className="flex flex-col items-center gap-2">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-primary-500 touch-none">
                    <GripVertical size={16} style={{ color: 'var(--label-tertiary)' }} />
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                </div>
            </div>

            {/* Thumbnail */}
            <div
                className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 border group"
                style={{ borderColor: 'var(--separator-opaque)' }}
            >
                <img
                    src={capture.imagePath}
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
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        style={{
                            background: 'var(--system-background)',
                            borderColor: 'var(--separator-opaque)',
                            color: 'var(--label-primary)'
                        }}
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
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    style={{
                        background: 'var(--system-background)',
                        borderColor: 'var(--separator-opaque)',
                        color: 'var(--label-primary)'
                    }}
                />
            </div>

            {/* Delete */}
            <button
                onClick={() => onDelete(capture.id)}
                className="p-2 rounded-lg transition-colors self-start"
                style={{ color: 'var(--label-tertiary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 10%, transparent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
                title="Eliminar este paso"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};
