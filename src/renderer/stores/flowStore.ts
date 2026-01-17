
import { create } from 'zustand';
import { CaptureFlow } from '../../shared/types/FlowTypes';
import { logger } from '../services/Logger';
import { withRetry } from '../utils/ipcRetry';

interface FlowStore {
    flows: CaptureFlow[];
    isLoading: boolean;
    error: string | null;
    quickFlowActive: boolean;

    // Actions
    setQuickFlowActive: (active: boolean) => void;
    loadFlows: () => Promise<void>;
    saveFlow: (flow: CaptureFlow) => Promise<void>;
    deleteFlow: (id: string) => Promise<void>;
}

export const useFlowStore = create<FlowStore>((set, get) => ({
    flows: [],
    isLoading: false,
    error: null,
    quickFlowActive: false,

    setQuickFlowActive: (active: boolean) => set({ quickFlowActive: active }),

    loadFlows: async () => {
        set({ isLoading: true, error: null });
        try {
            if (window.electron?.getFlows) {
                const flows = await withRetry(() => window.electron.getFlows());
                set({ flows: flows || [] });
            }
        } catch (error) {

            logger.error('Failed to load flow image:', error);
            set({ error: 'Failed to load flows' });
        } finally {
            set({ isLoading: false });
        }
    },

    saveFlow: async (flow: CaptureFlow) => {
        try {
            if (window.electron?.saveFlow) {
                await withRetry(() => window.electron.saveFlow(flow));

                // Optimistic update or reload
                set((state) => {
                    const idx = state.flows.findIndex(f => f.id === flow.id);
                    if (idx >= 0) {
                        const updated = [...state.flows];
                        updated[idx] = flow;
                        return { flows: updated };
                    } else {
                        return { flows: [...state.flows, flow] };
                    }
                });
            }
        } catch (error) {
            logger.error('Failed to save flow:', error);
            throw error;
        }
    },

    deleteFlow: async (id: string) => {
        try {
            if (window.electron?.deleteFlow) {
                await withRetry(() => window.electron.deleteFlow(id));
                set((state) => ({
                    flows: state.flows.filter(f => f.id !== id)
                }));
            }
        } catch (error) {
            logger.error('Failed to delete flow:', error);
            throw error;
        }
    }
}));
