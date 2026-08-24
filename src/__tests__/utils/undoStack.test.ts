import { UndoStack, createDeleteCommand, createUpdateCommand } from '../../renderer/utils/undoStack';
import { CaptureItem } from '../../shared/types';

describe('UndoStack', () => {
    let stack: UndoStack;

    beforeEach(() => {
        stack = new UndoStack();
    });

    describe('Basic Operations', () => {
        it('should start with empty stacks', () => {
            expect(stack.canUndo()).toBe(false);
            expect(stack.canRedo()).toBe(false);
        });

        it('should execute and store command', () => {
            let executed = false;
            const command = {
                description: 'test command',
                execute: () => { executed = true; },
                undo: () => { executed = false; }
            };

            stack.executeCommand(command);
            expect(executed).toBe(true);
            expect(stack.canUndo()).toBe(true);
        });

        it('should undo command', () => {
            let value = 0;
            const command = {
                description: 'increment value',
                execute: () => { value = 1; },
                undo: () => { value = 0; }
            };

            stack.executeCommand(command);
            expect(value).toBe(1);

            stack.undo();
            expect(value).toBe(0);
            expect(stack.canRedo()).toBe(true);
        });

        it('should redo command', () => {
            let value = 0;
            const command = {
                description: 'increment value',
                execute: () => { value = 1; },
                undo: () => { value = 0; }
            };

            stack.executeCommand(command);
            stack.undo();
            expect(value).toBe(0);

            stack.redo();
            expect(value).toBe(1);
            expect(stack.canUndo()).toBe(true);
        });
    });

    describe('Stack Management', () => {
        it('should clear redo stack on new command', () => {
            const command1 = {
                description: 'command 1',
                execute: () => { },
                undo: () => { }
            };
            const command2 = {
                description: 'command 2',
                execute: () => { },
                undo: () => { }
            };

            stack.executeCommand(command1);
            stack.undo();
            expect(stack.canRedo()).toBe(true);

            stack.executeCommand(command2);
            expect(stack.canRedo()).toBe(false);
        });

        it('should respect max size (50)', () => {
            for (let i = 0; i < 60; i++) {
                stack.executeCommand({
                    description: `command ${i}`,
                    execute: () => { },
                    undo: () => { }
                });
            }

            // Should only keep last 50
            let undoCount = 0;
            while (stack.canUndo()) {
                stack.undo();
                undoCount++;
            }
            expect(undoCount).toBe(50);
        });

        it('should clear all stacks', () => {
            stack.executeCommand({
                description: 'clear test',
                execute: () => { },
                undo: () => { }
            });

            stack.clear();
            expect(stack.canUndo()).toBe(false);
            expect(stack.canRedo()).toBe(false);
        });
    });

    describe('Multiple Commands', () => {
        it('should handle multiple undo/redo operations', () => {
            const values: number[] = [];

            for (let i = 1; i <= 5; i++) {
                const val = i;
                stack.executeCommand({
                    description: `push ${val}`,
                    execute: () => { values.push(val); },
                    undo: () => { values.pop(); }
                });
            }

            expect(values).toEqual([1, 2, 3, 4, 5]);

            stack.undo();
            stack.undo();
            expect(values).toEqual([1, 2, 3]);

            stack.redo();
            expect(values).toEqual([1, 2, 3, 4]);
        });
    });
});

describe('Command Factories', () => {
    describe('createDeleteCommand', () => {
        it('should create valid delete command', () => {
            const mockItem: CaptureItem = {
                id: 'test-1',
                thumbnail: 'data:image/png;base64,test',
                timestamp: Date.now(),
                title: 'Test',
                description: 'Test description',
                status: 'success'
            };
            let items = [mockItem];

            const command = createDeleteCommand(
                mockItem,
                () => { items = items.filter(i => i.id !== mockItem.id); },
                () => { items.push(mockItem); }
            );

            expect(command.description).toMatch(/Delete/);
            expect(typeof command.execute).toBe('function');
            expect(typeof command.undo).toBe('function');
        });
    });

    describe('createUpdateCommand', () => {
        it('should create valid update command', () => {
            let mockItem: Partial<CaptureItem> = { title: 'old' };
            const oldValues: Partial<CaptureItem> = { title: 'old' };
            const newValues: Partial<CaptureItem> = { title: 'new' };

            const command = createUpdateCommand(
                'test-1',
                oldValues,
                newValues,
                (val) => { mockItem = { ...mockItem, ...val }; }
            );

            expect(command.description).toMatch(/Update/);

            command.execute();
            expect(mockItem.title).toBe('new');

            command.undo();
            expect(mockItem.title).toBe('old');
        });
    });
});
