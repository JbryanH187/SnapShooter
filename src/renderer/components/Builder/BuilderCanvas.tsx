import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTemplateStore } from '../../stores/templateStore';
import { SortableBlock } from './SortableBlock';

export const BuilderCanvas: React.FC = () => {
    const { activeTemplate } = useTemplateStore();
    const { setNodeRef } = useDroppable({
        id: 'canvas-droppable',
    });

    if (!activeTemplate) return null;

    return (
        <div ref={setNodeRef} className="min-h-full pb-20">
            <SortableContext
                items={activeTemplate.blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
            >
                {activeTemplate.blocks.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl mt-10">
                        <p>Drag blocks here to start</p>
                    </div>
                ) : (
                    activeTemplate.blocks.map((block) => (
                        <SortableBlock key={block.id} block={block} />
                    ))
                )}
            </SortableContext>
        </div>
    );
};
