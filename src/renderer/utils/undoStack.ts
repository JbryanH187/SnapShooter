import { CaptureItem } from '../../shared/types';
import { logger } from '../services/Logger';

/**
 * Command Pattern for Undo/Redo
 * Each action (delete, update, etc.) is a command that can be undone
 */

export interface Command {
    execute: () => void;
    undo: () => void;
    description: string;
}

export class UndoStack {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];
    private maxSize: number = 50;

    executeCommand(command: Command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack on new action

        // Limit stack size
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }

        logger.debug('UI', `Command executed: ${command.description}`, {
            undoStackSize: this.undoStack.length
        });
    }

    undo(): string | null {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
            logger.info('UI', `Undo: ${command.description}`);
            return command.description;
        }
        return null;
    }

    redo(): string | null {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
            logger.info('UI', `Redo: ${command.description}`);
            return command.description;
        }
        return null;
    }

    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }

    getUndoDescription(): string | null {
        const command = this.undoStack[this.undoStack.length - 1];
        return command ? command.description : null;
    }

    getRedoDescription(): string | null {
        const command = this.redoStack[this.redoStack.length - 1];
        return command ? command.description : null;
    }
}

/**
 * Command Factory Functions
 */

export const createDeleteCommand = (
    capture: CaptureItem,
    onDelete: () => void,
    onRestore: () => void
): Command => ({
    execute: onDelete,
    undo: onRestore,
    description: `Delete "${capture.title || 'Untitled'}"`
});

export const createUpdateCommand = (
    captureId: string,
    oldValues: Partial<CaptureItem>,
    newValues: Partial<CaptureItem>,
    onUpdate: (values: Partial<CaptureItem>) => void
): Command => ({
    execute: () => onUpdate(newValues),
    undo: () => onUpdate(oldValues),
    description: `Update capture`
});

export const createStatusChangeCommand = (
    captureId: string,
    oldStatus: 'pending' | 'success' | 'failure',
    newStatus: 'pending' | 'success' | 'failure',
    onUpdate: (status: 'pending' | 'success' | 'failure') => void
): Command => ({
    execute: () => onUpdate(newStatus),
    undo: () => onUpdate(oldStatus),
    description: `Change status to ${newStatus}`
});

// Global undo stack singleton
export const globalUndoStack = new UndoStack();
