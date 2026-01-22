import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTemplateStore } from '../../stores/templateStore';
import { TemplateBlock } from '../../../shared/types';
import { BlockRenderer } from './BuilderBlocks';
import { GripVertical, X, Square } from 'lucide-react';

interface SortableBlockProps {
    block: TemplateBlock;
}

export const SortableBlock: React.FC<SortableBlockProps> = ({ block }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id });

    const { removeBlock, updateBlock, activeTemplate } = useTemplateStore();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        borderColor: block.settings?.showBorder ? (activeTemplate?.settings?.accentColor || '#3b82f6') : 'transparent',
        borderWidth: block.settings?.showBorder ? (activeTemplate?.settings?.blockBorderWidth ?? activeTemplate?.settings?.globalBorderWidth ? `${activeTemplate?.settings?.blockBorderWidth ?? activeTemplate.settings.globalBorderWidth}px` : '1px') : '1px',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            // Explicitly set white background and black text for print consistency
            className={`group relative mb-4 rounded-lg border-solid transition-all bg-gray-50 text-black ${isDragging ? 'z-50' : ''} ${!block.settings?.showBorder ? 'hover:border-blue-200' : ''}`}
        >
            {/* Controls Container */}
            <div className="absolute right-[-2.5rem] top-0 bottom-0 flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="p-2 cursor-grab text-gray-300 hover:text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100"
                    title="Drag to reorder"
                >
                    <GripVertical size={16} />
                </div>

                {/* Border Toggle */}
                <button
                    onClick={() => updateBlock(block.id, { settings: { ...block.settings, showBorder: !block.settings?.showBorder } })}
                    className={`p-2 rounded-lg shadow-sm border transition-colors ${block.settings?.showBorder ? 'bg-blue-50 text-blue-500 border-blue-200' : 'bg-white text-gray-300 hover:text-gray-500 border-gray-100'}`}
                    title="Toggle Border"
                >
                    <Square size={16} />
                </button>

                {/* Remove Button */}
                <button
                    onClick={() => removeBlock(block.id)}
                    className="p-2 text-red-300 hover:text-red-500 bg-white rounded-lg shadow-sm border border-gray-100"
                    title="Remove Block"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Block Content */}
            <BlockRenderer block={block} />
        </div>
    );
};
