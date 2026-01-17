import { CaptureItem } from '../../shared/types';
// Note: You might need to export types for Flow/Report in shared/types if you want stricter types here.
// For now we use any for Flow/Report specific structures if not imported.

export interface ElectronAPI {
    onCaptureComplete: (callback: (data: any) => void) => () => void;

    // Persistence
    getCaptures: () => Promise<CaptureItem[]>;
    saveCapture: (capture: any) => Promise<any>; // saveCapture might return the saved object with different path
    readImage: (path: string) => Promise<string>;
    deleteCapture: (id: string) => Promise<void>;
    clearCaptures: () => Promise<void>;
    openCapturesFolder: () => Promise<void>;
    saveUserProfile: (name: string) => Promise<void>;
    getUserProfile: () => Promise<{ name: string; initialized: boolean }>;

    // History
    getReportHistory: () => Promise<any[]>;
    saveReportToHistory: (report: any) => Promise<void>;
    deleteReportFromHistory: (id: string) => Promise<void>;
    openPath: (path: string) => Promise<void>;

    // Drafts
    getReportDrafts: () => Promise<any[]>;
    saveReportDraft: (draft: any) => Promise<void>;
    deleteReportDraft: (id: string) => Promise<void>;

    // Reports
    saveReportFile: (fileName: string, content: ArrayBuffer) => Promise<void>;

    // Flows
    getFlows: () => Promise<any[]>;
    saveFlow: (flow: any) => Promise<void>;
    deleteFlow: (id: string) => Promise<void>;

    // Window Controls
    setOverlayStyle: (style: { color: string; symbolColor: string }) => Promise<void>;

    // Quick Flow Mode events
    onQuickFlowModeChange: (callback: (active: boolean) => void) => () => void;
    onQuickFlowCapture: (callback: (data: any) => void) => () => void;
    onQuickFlowComplete: (callback: (data: any) => void) => () => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}