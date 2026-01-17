import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../services/Logger';
import { withRetry } from '../utils/ipcRetry';
import { subscribeWithSelector } from 'zustand/middleware';
import { CaptureItem } from '../../shared/types';

export type { CaptureItem }; // Re-export for components

interface CaptureState {
    captures: CaptureItem[];
    currentCapture: CaptureItem | null;
    previewCapture: CaptureItem | null;
    error: string | null;
    isLoading: boolean; // [NEW] Loading state

    // Undo State
    lastDeleted: { item: CaptureItem; timeoutId: NodeJS.Timeout } | null;

    // Actions
    addCapture: (capture: CaptureItem) => void;
    updateCapture: (id: string, updates: Partial<CaptureItem>) => void;
    deleteCapture: (id: string) => void;
    undoLastDelete: () => void;
    clearAllCaptures: () => void;
    setCurrentCapture: (capture: CaptureItem | null) => void;
    setPreviewCapture: (capture: CaptureItem | null) => void;

    // User Profile
    userProfile: { name: string; initialized: boolean };
    setUserProfile: (name: string) => void;

    // Tutorial State
    tutorial: {
        hasSeenOnboarding: boolean;
        isActive: boolean;
        currentStep: number;
    };
    setTutorialState: (state: Partial<{ hasSeenOnboarding: boolean; isActive: boolean; currentStep: number }>) => void;
    startTutorial: () => void;
    endTutorial: () => void;

    // Async
    loadCaptures: () => Promise<void>;
}

export const useCaptureStore = create<CaptureState>()(subscribeWithSelector((set, get) => ({
    captures: [],
    currentCapture: null,
    previewCapture: null,
    error: null,
    isLoading: true, // Start loading by default
    lastDeleted: null,

    loadCaptures: async () => {
        set({ isLoading: true });
        try {
            if (window.electron?.getCaptures) {
                const captures = await withRetry(() => window.electron.getCaptures());
                if (captures) {
                    set({ captures });
                }

                // Load User Profile
                if (window.electron?.getUserProfile) {
                    const profile = await window.electron.getUserProfile();
                    set({ userProfile: profile });
                }
            }
        } catch (e) {
            logger.error("Failed to load captures", e);
            set({ error: "Failed to load captures. Please reload." });
        } finally {
            set({ isLoading: false });
        }
    },

    addCapture: (capture) => {
        set((state) => ({
            captures: [capture, ...state.captures],
            previewCapture: capture
        }));
        // Async save
        withRetry(() => window.electron?.saveCapture(capture)).then((saved: any) => {
            set(state => ({
                captures: state.captures.map(c => c.id === saved.id ? saved : c),
                previewCapture: state.previewCapture?.id === saved.id ? saved : state.previewCapture,
                currentCapture: state.currentCapture?.id === saved.id ? saved : state.currentCapture
            }));
        });
    },

    updateCapture: (id, updates) => {
        set((state) => {
            const updatedCaptures = state.captures.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            );
            const updatedCurrent = state.currentCapture?.id === id ? { ...state.currentCapture, ...updates } : state.currentCapture;
            const updatedPreview = state.previewCapture?.id === id ? { ...state.previewCapture, ...updates } : state.previewCapture;

            // Async save the updated item
            const itemToSave = updatedCaptures.find(c => c.id === id);
            if (itemToSave) {
                withRetry(() => window.electron?.saveCapture(itemToSave));
            }

            return { captures: updatedCaptures, currentCapture: updatedCurrent, previewCapture: updatedPreview };
        });
    },

    deleteCapture: (id) => {
        const state = get();

        // If there was a previous pending delete, force it to complete now
        if (state.lastDeleted) {
            clearTimeout(state.lastDeleted.timeoutId);
            withRetry(() => window.electron?.deleteCapture(state.lastDeleted!.item.id));
        }

        const captureToDelete = state.captures.find(c => c.id === id);
        if (!captureToDelete) return;

        // 1. Optimistic Remove
        set((state) => ({
            captures: state.captures.filter((c) => c.id !== id),
            currentCapture: state.currentCapture?.id === id ? null : state.currentCapture,
            previewCapture: state.previewCapture?.id === id ? null : state.previewCapture
        }));

        // 2. Setup Delayed Undo
        const timeoutId = setTimeout(() => {
            // Actually delete after timeout
            withRetry(() => window.electron?.deleteCapture(id));
            // Clear undo state if it's still this item
            const currentState = get();
            if (currentState.lastDeleted?.item.id === id) {
                set({ lastDeleted: null });
            }
        }, 4000); // 4 seconds to undo

        set({ lastDeleted: { item: captureToDelete, timeoutId } });
    },

    undoLastDelete: () => {
        const state = get();
        if (state.lastDeleted) {
            clearTimeout(state.lastDeleted.timeoutId);

            set((state) => {
                const item = state.lastDeleted!.item;
                // Add back to top (or we could try to find original index, but top is okay for Recents)
                return {
                    captures: [item, ...state.captures].sort((a, b) => b.timestamp - a.timestamp), // Ensure correct order
                    lastDeleted: null
                };
            });

            logger.info(`Undo delete for ${state.lastDeleted.item.id}`);
        }
    },

    clearAllCaptures: () => {
        set({ captures: [], currentCapture: null, previewCapture: null, lastDeleted: null });
        window.electron?.clearCaptures?.();
    },

    setCurrentCapture: (capture) => set({ currentCapture: capture }),
    setPreviewCapture: (capture) => set({ previewCapture: capture }),

    userProfile: { name: '', initialized: false },
    setUserProfile: (name: string) => {
        set({ userProfile: { name, initialized: true } });
        window.electron?.saveUserProfile?.(name);
    },

    tutorial: {
        hasSeenOnboarding: false,
        isActive: false,
        currentStep: 0
    },

    setTutorialState: (newState) => set((state) => ({
        tutorial: { ...state.tutorial, ...newState }
    })),

    startTutorial: () => set((state) => ({
        tutorial: { ...state.tutorial, isActive: true, currentStep: 0 }
    })),

    endTutorial: () => {
        set((state) => ({
            tutorial: { ...state.tutorial, isActive: false, hasSeenOnboarding: true }
        }));
        // Persist this if possible
        // window.electron?.saveSettings({ hasSeenOnboarding: true }); 
        // (Assuming we have a generic saveSettings or similar, if not, explicit IPC later)
    }
})));
