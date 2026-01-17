import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CaptureItem } from '../../shared/types';

export type { CaptureItem }; // Re-export for components

interface CaptureState {
    captures: CaptureItem[];
    currentCapture: CaptureItem | null;

    // Actions
    addCapture: (capture: CaptureItem) => void;
    updateCapture: (id: string, updates: Partial<CaptureItem>) => void;
    deleteCapture: (id: string) => void;
    clearAllCaptures: () => void;
    setCurrentCapture: (capture: CaptureItem | null) => void;

    // User Profile
    userProfile: { name: string; initialized: boolean };
    setUserProfile: (name: string) => void;

    // Async
    loadCaptures: () => Promise<void>;
}

export const useCaptureStore = create<CaptureState>()(subscribeWithSelector((set, get) => ({
    captures: [],
    currentCapture: null,

    loadCaptures: async () => {
        try {
            if ((window as any).electron?.getCaptures) {
                const loaded = await (window as any).electron.getCaptures();
                set({ captures: loaded || [] });

                // Load User Profile
                if ((window as any).electron.getUserProfile) {
                    const profile = await (window as any).electron.getUserProfile();
                    if (profile && profile.initialized) {
                        set({ userProfile: profile });
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load captures", e);
        }
    },

    addCapture: (capture) => {
        set((state) => ({
            captures: [capture, ...state.captures],
            currentCapture: capture
        }));
        // Async save
        (window as any).electron?.saveCapture(capture).then((saved: any) => {
            // Update with saved version (which might have file:// url instead of base64)
            set(state => ({
                captures: state.captures.map(c => c.id === saved.id ? saved : c),
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

            // Async save the updated item
            const itemToSave = updatedCaptures.find(c => c.id === id);
            if (itemToSave) {
                (window as any).electron?.saveCapture(itemToSave);
            }

            return { captures: updatedCaptures, currentCapture: updatedCurrent };
        });
    },

    deleteCapture: (id) => {
        set((state) => ({
            captures: state.captures.filter((c) => c.id !== id),
            currentCapture: state.currentCapture?.id === id ? null : state.currentCapture
        }));
        (window as any).electron?.deleteCapture(id);
    },

    clearAllCaptures: () => {
        set({ captures: [], currentCapture: null });
        (window as any).electron?.clearCaptures?.();
    },

    setCurrentCapture: (capture) => set({ currentCapture: capture }),

    userProfile: { name: '', initialized: false },
    setUserProfile: (name: string) => {
        set({ userProfile: { name, initialized: true } });
        (window as any).electron?.saveUserProfile?.(name);
    }
})));
