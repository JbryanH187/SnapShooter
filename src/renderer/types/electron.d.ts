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
    copyImageToClipboard: (imageSrc: string) => Promise<boolean>;
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
    saveReportFile: (fileName: string, content: ArrayBuffer) => Promise<string>;
    saveFileToPath: (filePath: string, content: ArrayBuffer) => Promise<string>;
    showSaveDialog: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
    showItemInFolder: (filePath: string) => Promise<void>;

    // Flows
    getFlows: () => Promise<any[]>;
    saveFlow: (flow: any) => Promise<any>;
    saveFlowSession: (name: string, captures: any[]) => Promise<any>;
    updateFlowSession: (flowId: string, name: string, captures: any[]) => Promise<any>;
    addToFlow: (flowId: string, captures: any[]) => Promise<any>;
    loadFlow: (flowId: string) => Promise<CaptureItem[]>;
    openFlowFolder: (flowId: string) => Promise<void>;
    deleteFlow: (id: string) => Promise<void>;

    // Window Controls
    setOverlayStyle: (style: { color: string; symbolColor: string }) => Promise<void>;

    // Quick Flow Mode events
    onQuickFlowModeChange: (callback: (active: boolean) => void) => () => void;
    onQuickFlowCapture: (callback: (data: any) => void) => () => void;
    onQuickFlowComplete: (callback: (data: any) => void) => () => void;

    // Resolution Picker
    onRequestResolutionPicker: (callback: () => void) => () => void;
    setResolution: (width: number, height: number) => Promise<void>;

    // Jira B2B Integration
    jiraTestConnection: (config: any) => Promise<{ success: boolean; message: string; user?: string }>;
    jiraGetIssues: (config: any, query?: string) => Promise<Array<{ id: string; key: string; summary: string; status: string; issueType: string }>>;
    jiraUploadAttachment: (payload: { config: any; issueKey: string; fileName: string; imageSrc: string }) => Promise<boolean>;

    // Azure DevOps B2B Integration
    adoTestConnection: (config: any) => Promise<{ success: boolean; message: string; project?: string }>;
    adoGetWorkItems: (config: any, query?: string) => Promise<Array<{ id: number; title: string; type: string; state: string; assignedTo?: string }>>;
    adoUploadAttachment: (payload: { config: any; workItemId: number; fileName: string; imageSrc: string }) => Promise<boolean>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}