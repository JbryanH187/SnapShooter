import { useEffect, useCallback } from 'react';
import { globalUndoStack } from '../utils/undoStack';
import { toast } from 'react-hot-toast';
import { logger } from '../services/Logger';

/**
 * Hook for undo/redo functionality with keyboard shortcuts
 * Ctrl+Z = Undo
 * Ctrl+Shift+Z / Ctrl+Y = Redo
 */
export const useUndoRedo = () => {
    const undo = useCallback(() => {
        const description = globalUndoStack.undo();
        if (description) {
            toast.success(`Undone: ${description}`, {
                icon: '↶',
                duration: 2000
            });
            logger.info('UI', 'Undo executed', { action: description });
        } else {
            toast('Nothing to undo', { icon: 'ℹ️' });
        }
    }, []);

    const redo = useCallback(() => {
        const description = globalUndoStack.redo();
        if (description) {
            toast.success(`Redone: ${description}`, {
                icon: '↷',
                duration: 2000
            });
            logger.info('UI', 'Redo executed', { action: description });
        } else {
            toast('Nothing to redo', { icon: 'ℹ️' });
        }
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z (Undo)
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }

            // Ctrl+Shift+Z or Ctrl+Y (Redo)
            if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return {
        undo,
        redo,
        canUndo: globalUndoStack.canUndo(),
        canRedo: globalUndoStack.canRedo(),
        undoDescription: globalUndoStack.getUndoDescription(),
        redoDescription: globalUndoStack.getRedoDescription()
    };
};
