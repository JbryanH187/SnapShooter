
import { create } from 'zustand';
import { CaptureFlow } from '../../shared/types/FlowTypes';
import { logger } from '../services/Logger';
import { withRetry } from '../utils/ipcRetry';
import { CaptureItem } from '../../shared/types';
import { useCaptureStore } from './captureStore';

interface FlowStore {
    flows: CaptureFlow[];
    isLoading: boolean;
    error: string | null;
    quickFlowActive: boolean;
    activeFlowId: string | null;
    activeFlowName: string | null;

    // Actions
    setQuickFlowActive: (active: boolean) => void;
    setActiveFlow: (flow: { id: string; name: string } | null) => void;
    loadFlows: () => Promise<void>;
    saveFlow: (flow: CaptureFlow) => Promise<void>;
    saveFlowSession: (name: string, captures: CaptureItem[]) => Promise<void>;
    updateFlowSession: (flowId: string, name: string, captures: CaptureItem[]) => Promise<void>;
    addToFlow: (flowId: string, captures: CaptureItem[]) => Promise<void>;
    loadFlow: (flowId: string) => Promise<void>;
    continueFlowInRecents: (flow: CaptureFlow) => Promise<CaptureItem[] | undefined>;
    openFlowFolder: (flowId: string) => Promise<void>;
    deleteFlow: (id: string) => Promise<void>;
}

export const useFlowStore = create<FlowStore>((set, get) => ({
    flows: [],
    isLoading: false,
    error: null,
    quickFlowActive: false,
    activeFlowId: null,
    activeFlowName: null,

    setQuickFlowActive: (active: boolean) => set({ quickFlowActive: active }),
    setActiveFlow: (flow) => set({
        activeFlowId: flow ? flow.id : null,
        activeFlowName: flow ? flow.name : null
    }),

    loadFlows: async () => {
        set({ isLoading: true, error: null });
        try {
            if (window.electron?.getFlows) {
                const flows = await withRetry(() => window.electron.getFlows());
                set({ flows: flows || [] });
            }
        } catch (error) {

            logger.error('CAPTURE', 'Failed to load flow image', { error });
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
            logger.error('CAPTURE', 'Failed to save flow', { error });
            throw error;
        }
    },

    saveFlowSession: async (name: string, captures: CaptureItem[]) => {
        try {
            if (window.electron?.saveFlowSession) {
                const newFlow = await withRetry(() => window.electron.saveFlowSession(name, captures));
                set((state) => ({ flows: [...state.flows, newFlow] }));
            } else {
                logger.error('CAPTURE', 'Electron bridge missing: saveFlowSession');
                throw new Error('Electron bridge missing: saveFlowSession');
            }
        } catch (error) {
            logger.error('CAPTURE', 'Failed to save flow session', { error });
            throw error;
        }
    },

    updateFlowSession: async (flowId: string, name: string, captures: CaptureItem[]) => {
        try {
            if (window.electron?.updateFlowSession) {
                const updatedFlow = await withRetry(() => window.electron.updateFlowSession(flowId, name, captures));
                set((state) => ({
                    flows: state.flows.map(f => f.id === flowId ? updatedFlow : f),
                    activeFlowId: null,
                    activeFlowName: null
                }));
                useCaptureStore.getState().clearAllCaptures();
            } else {
                logger.error('CAPTURE', 'Electron bridge missing: updateFlowSession');
                throw new Error('Electron bridge missing: updateFlowSession');
            }
        } catch (error) {
            logger.error('CAPTURE', 'Failed to update flow session', { error });
            throw error;
        }
    },

    addToFlow: async (flowId: string, captures: CaptureItem[]) => {
        try {
            if (window.electron?.addToFlow) {
                const updatedFlow = await withRetry(() => window.electron.addToFlow(flowId, captures));
                set((state) => ({
                    flows: state.flows.map(f => f.id === flowId ? updatedFlow : f)
                }));
            } else {
                logger.error('CAPTURE', 'Electron bridge missing: addToFlow');
                throw new Error('Electron bridge missing: addToFlow');
            }
        } catch (error) {
            logger.error('CAPTURE', 'Failed to add to flow', { error });
            throw error;
        }
    },

    loadFlow: async (flowId: string) => {
        try {
            if (window.electron?.loadFlow) {
                await withRetry(() => window.electron.loadFlow(flowId));
                // We assume component or captureStore will reload captures
            }
        } catch (error) {
            logger.error('CAPTURE', 'Failed to load flow', { error });
            throw error;
        }
    },

    continueFlowInRecents: async (flow: CaptureFlow) => {
        try {
            if (window.electron?.loadFlow) {
                const restored = await withRetry(() => window.electron.loadFlow(flow.id));
                set({ activeFlowId: flow.id, activeFlowName: flow.name });
                await useCaptureStore.getState().loadCaptures();
                return restored;
            } else {
                logger.error('CAPTURE', 'Electron bridge missing: loadFlow');
                throw new Error('Electron bridge missing: loadFlow');
            }
        } catch (error) {
            logger.error('CAPTURE', 'Failed to continue flow in recents', { error });
            throw error;
        }
    },

    openFlowFolder: async (flowId: string) => {
        if (window.electron?.openFlowFolder) {
            await window.electron.openFlowFolder(flowId);
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
            logger.error('CAPTURE', 'Failed to delete flow', { error });
            throw error;
        }
    }
}));
