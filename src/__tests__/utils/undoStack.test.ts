import { UndoStack, createDeleteCommand, createUpdateCommand } from '../../../renderer/utils/undoStack';

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
                execute: () => { executed = true; },
                undo: () => { executed = false; }
            };

            stack.execute(command);
            expect(executed).toBe(true);
            expect(stack.canUndo()).toBe(true);
        });

        it('should undo command', () => {
            let value = 0;
            const command = {
                execute: () => { value = 1; },
                undo: () => { value = 0; }
            };

            stack.execute(command);
            expect(value).toBe(1);

            stack.undo();
            expect(value).toBe(0);
            expect(stack.canRedo()).toBe(true);
        });

        it('should redo command', () => {
            let value = 0;
            const command = {
                execute: () => { value = 1; },
                undo: () => { value = 0; }
            };

            stack.execute(command);
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
                execute: () => { },
                undo: () => { }
            };
            const command2 = {
                execute: () => { },
                undo: () => { }
            };

            stack.execute(command1);
            stack.undo();
            expect(stack.canRedo()).toBe(true);

            stack.execute(command2);
            expect(stack.canRedo()).toBe(false);
        });

        it('should respect max size (50)', () => {
            for (let i = 0; i < 60; i++) {
                stack.execute({
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
            stack.execute({
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
                stack.execute({
                    execute: () => values.push(i),
                    undo: () => values.pop()
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
            const mockItem = { id: 'test-1', name: 'Test' };
            let items = [mockItem];

            const command = createDeleteCommand(
                mockItem,
                () => { items = items.filter(i => i.id !== mockItem.id); },
                () => { items.push(mockItem); }
            );

            expect(command.type).toBe('delete');
            expect(typeof command.execute).toBe('function');
            expect(typeof command.undo).toBe('function');
        });
    });

    describe('createUpdateCommand', () => {
        it('should create valid update command', () => {
            const mockItem = { id: 'test-1', value: 'old' };
            const oldValue = 'old';
            const newValue = 'new';

            const command = createUpdateCommand(
                mockItem,
                oldValue,
                newValue,
                (val) => { mockItem.value = val; }
            );

            expect(command.type).toBe('update');

            command.execute();
            expect(mockItem.value).toBe('new');

            command.undo();
            expect(mockItem.value).toBe('old');
        });
    });
});
