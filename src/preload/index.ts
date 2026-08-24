import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    onCaptureComplete: (callback: (data: any) => void) => {
        const subscription = (_e: any, data: any) => callback(data);
        ipcRenderer.on('capture:complete', subscription);
        return () => {
            ipcRenderer.removeListener('capture:complete', subscription);
        };
    },

    // Persistence
    getCaptures: () => ipcRenderer.invoke('captures:get'),
    saveCapture: (capture: any) => ipcRenderer.invoke('captures:save', capture),
    readImage: (path: string) => ipcRenderer.invoke('captures:readImage', path),
    deleteCapture: (id: string) => ipcRenderer.invoke('captures:delete', id),
    clearCaptures: () => ipcRenderer.invoke('captures:clear'),
    openCapturesFolder: () => ipcRenderer.invoke('app:openCapturesFolder'),
    copyImageToClipboard: (imageSrc: string) => ipcRenderer.invoke('clipboard:copyImage', imageSrc),
    saveUserProfile: (name: string) => ipcRenderer.invoke('user:save-profile', name),
    getUserProfile: () => ipcRenderer.invoke('user:get-profile'),

    // History
    getReportHistory: () => ipcRenderer.invoke('history:get'),
    saveReportToHistory: (report: any) => ipcRenderer.invoke('history:save', report),
    deleteReportFromHistory: (id: string) => ipcRenderer.invoke('history:delete', id),
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),

    // Drafts
    getReportDrafts: () => ipcRenderer.invoke('drafts:get'),
    saveReportDraft: (draft: any) => ipcRenderer.invoke('drafts:save', draft),
    deleteReportDraft: (id: string) => ipcRenderer.invoke('drafts:delete', id),

    // Reports
    saveReportFile: (fileName: string, content: ArrayBuffer) => ipcRenderer.invoke('reports:saveFile', fileName, content),

    // Flows
    getFlows: () => ipcRenderer.invoke('flows:get'),
    saveFlow: (flow: any) => ipcRenderer.invoke('flows:save', flow),
    saveFlowSession: (name: string, captures: any[]) => ipcRenderer.invoke('flows:saveSession', name, captures),
    addToFlow: (flowId: string, captures: any[]) => ipcRenderer.invoke('flows:add', flowId, captures),
    loadFlow: (flowId: string) => ipcRenderer.invoke('flows:load', flowId),
    openFlowFolder: (flowId: string) => ipcRenderer.invoke('flows:openFolder', flowId),
    deleteFlow: (id: string) => ipcRenderer.invoke('flows:delete', id),

    // Window Controls
    setOverlayStyle: (style: { color: string; symbolColor: string }) => ipcRenderer.invoke('window:set-overlay-style', style),

    // Quick Flow Mode events
    onQuickFlowModeChange: (callback: (active: boolean) => void) => {
        const subscription = (_e: any, active: boolean) => callback(active);
        ipcRenderer.on('quickflow:modeChange', subscription);
        return () => {
            ipcRenderer.removeListener('quickflow:modeChange', subscription);
        };
    },
    onQuickFlowCapture: (callback: (data: any) => void) => {
        const subscription = (_e: any, data: any) => callback(data);
        ipcRenderer.on('quickflow:capture', subscription);
        return () => {
            ipcRenderer.removeListener('quickflow:capture', subscription);
        };
    },
    onQuickFlowComplete: (callback: (data: any) => void) => {
        const subscription = (_e: any, data: any) => callback(data);
        ipcRenderer.on('quickflow:flowComplete', subscription);
        return () => {
            ipcRenderer.removeListener('quickflow:flowComplete', subscription);
        };
    },

    // Resolution Picker
    onRequestResolutionPicker: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on('resolution:request-picker', subscription);
        return () => {
            ipcRenderer.removeListener('resolution:request-picker', subscription);
        };
    },
    setResolution: (width: number, height: number) => ipcRenderer.invoke('resolution:set', width, height),

    // Jira B2B Integration
    jiraTestConnection: (config: any) => ipcRenderer.invoke('jira:testConnection', config),
    jiraGetIssues: (config: any, query?: string) => ipcRenderer.invoke('jira:getIssues', config, query),
    jiraUploadAttachment: (payload: { config: any; issueKey: string; fileName: string; imageSrc: string }) => ipcRenderer.invoke('jira:uploadAttachment', payload),

    // Azure DevOps B2B Integration
    adoTestConnection: (config: any) => ipcRenderer.invoke('ado:testConnection', config),
    adoGetWorkItems: (config: any, query?: string) => ipcRenderer.invoke('ado:getWorkItems', config, query),
    adoUploadAttachment: (payload: { config: any; workItemId: number; fileName: string; imageSrc: string }) => ipcRenderer.invoke('ado:uploadAttachment', payload),
});
