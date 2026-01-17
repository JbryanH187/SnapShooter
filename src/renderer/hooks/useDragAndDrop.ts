import { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

/**
 * Custom hook for drag and drop functionality
 * Provides configured sensors and handlers for @dnd-kit
 */
export const useDragAndDrop = () => {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Configure sensors for mouse, touch, and keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag (prevents accidental drags)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent, items: any[], onReorder: (newItems: any[]) => void) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            onReorder(newItems);
        }

        setActiveId(null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    return {
        sensors,
        activeId,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
        // Export components for use
        DndContext,
        SortableContext,
        DragOverlay,
        closestCenter,
        verticalListSortingStrategy,
    };
};
