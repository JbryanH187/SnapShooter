import { evaluatePredicate, matchesSmartFolder, PREDEFINED_SMART_FOLDERS } from '../../../shared/types/SmartFolder';

describe('Smart Folders', () => {
    const mockCapture = {
        id: 'test-1',
        timestamp: Date.now(),
        title: 'Test Capture',
        description: 'Test description',
        status: 'success' as const,
        path: '/path/to/image.png',
        flowId: 'flow-1'
    };

    const yesterdayCapture = {
        ...mockCapture,
        id: 'test-2',
        timestamp: Date.now() - (24 * 60 * 60 * 1000)
    };

    describe('evaluatePredicate', () => {
        it('should match status equals predicate', () => {
            const predicate = { field: 'status' as const, operator: 'equals' as const, value: 'success' };
            expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
        });

        it('should not match wrong status', () => {
            const predicate = { field: 'status' as const, operator: 'equals' as const, value: 'failure' };
            expect(evaluatePredicate(mockCapture, predicate)).toBe(false);
        });

        it('should match title contains predicate', () => {
            const predicate = { field: 'title' as const, operator: 'contains' as const, value: 'Test' };
            expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
        });

        it('should be case-insensitive for title', () => {
            const predicate = { field: 'title' as const, operator: 'contains' as const, value: 'test' };
            expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
        });

        it('should match today date predicate', () => {
            const predicate = { field: 'date' as const, operator: 'equals' as const, value: 'today' };
            expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
            expect(evaluatePredicate(yesterdayCapture, predicate)).toBe(false);
        });

        it('should match week date predicate', () => {
            const predicate = { field: 'date' as const, operator: 'equals' as const, value: 'week' };
            expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
            expect(evaluatePredicate(yesterdayCapture, predicate)).toBe(true);
        });

        it('should match hasFlow exists predicate', () => {
            const predicate = { field: 'hasFlow' as const, operator: 'exists' as const };
            expect(evaluatePredicate(mockCapture, predicate)).toBe(true);
        });

        it('should match hasFlow notExists predicate', () => {
            const captureWithoutFlow = { ...mockCapture, flowId: undefined };
            const predicate = { field: 'hasFlow' as const, operator: 'notExists' as const };
            expect(evaluatePredicate(captureWithoutFlow, predicate)).toBe(true);
            expect(evaluatePredicate(mockCapture, predicate)).toBe(false);
        });
    });

    describe('matchesSmartFolder', () => {
        it('should match folder with all predicates met', () => {
            const folder = {
                id: 'test-folder',
                name: 'Test',
                icon: 'Folder',
                isPredefined: false,
                predicates: [
                    { field: 'status' as const, operator: 'equals' as const, value: 'success' },
                    { field: 'hasFlow' as const, operator: 'exists' as const }
                ]
            };

            expect(matchesSmartFolder(mockCapture, folder)).toBe(true);
        });

        it('should not match if any predicate fails', () => {
            const folder = {
                id: 'test-folder',
                name: 'Test',
                icon: 'Folder',
                isPredefined: false,
                predicates: [
                    { field: 'status' as const, operator: 'equals' as const, value: 'success' },
                    { field: 'hasFlow' as const, operator: 'notExists' as const }
                ]
            };

            expect(matchesSmartFolder(mockCapture, folder)).toBe(false);
        });
    });

    describe('PREDEFINED_SMART_FOLDERS', () => {
        it('should have 5 predefined folders', () => {
            expect(PREDEFINED_SMART_FOLDERS).toHaveLength(5);
        });

        it('should all be marked as predefined', () => {
            PREDEFINED_SMART_FOLDERS.forEach(folder => {
                expect(folder.isPredefined).toBe(true);
            });
        });

        it('should have unique IDs', () => {
            const ids = PREDEFINED_SMART_FOLDERS.map(f => f.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should all have at least one predicate', () => {
            PREDEFINED_SMART_FOLDERS.forEach(folder => {
                expect(folder.predicates.length).toBeGreaterThan(0);
            });
        });

        it('should match Today folder for today\'s captures', () => {
            const todayFolder = PREDEFINED_SMART_FOLDERS.find(f => f.id === 'today');
            expect(todayFolder).toBeDefined();
            expect(matchesSmartFolder(mockCapture, todayFolder!)).toBe(true);
            expect(matchesSmartFolder(yesterdayCapture, todayFolder!)).toBe(false);
        });

        it('should match Successes folder for success status', () => {
            const successFolder = PREDEFINED_SMART_FOLDERS.find(f => f.id === 'successes');
            expect(successFolder).toBeDefined();
            expect(matchesSmartFolder(mockCapture, successFolder!)).toBe(true);
        });

        it('should match Unassigned folder for captures without flow', () => {
            const unassignedFolder = PREDEFINED_SMART_FOLDERS.find(f => f.id === 'unassigned');
            const captureWithoutFlow = { ...mockCapture, flowId: undefined };
            expect(unassignedFolder).toBeDefined();
            expect(matchesSmartFolder(captureWithoutFlow, unassignedFolder!)).toBe(true);
            expect(matchesSmartFolder(mockCapture, unassignedFolder!)).toBe(false);
        });
    });
});
