import { ipcMain, BrowserWindow, app, shell } from 'electron';
import { captureEngine } from '../captures/CaptureEngine';
import { persistenceManager } from '../stores/PersistenceManager';
import { v4 as uuidv4 } from 'uuid';
import { CaptureItem } from '../../shared/types';

export function setupHandlers() {
    ipcMain.handle('window:set-overlay-style', (event, style: { color: string; symbolColor: string }) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            win.setTitleBarOverlay(style);
        }
    });

    ipcMain.handle('capture:full', async () => {
        const id = uuidv4();
        return captureEngine.queueCapture({ id, type: 'window' });
    });

    ipcMain.handle('capture:region', async () => {
        const id = uuidv4();
        return captureEngine.queueCapture({ id, type: 'region' });
    });

    // Persistence Handlers
    ipcMain.handle('captures:get', async () => {
        return persistenceManager.getCaptures();
    });

    ipcMain.handle('captures:readImage', async (_event, pathUrl: string) => {
        return persistenceManager.readImage(pathUrl);
    });

    ipcMain.handle('captures:save', async (_event, capture: CaptureItem) => {
        return persistenceManager.saveCapture(capture);
    });

    ipcMain.handle('captures:delete', async (_event, id: string) => {
        return persistenceManager.deleteCapture(id);
    });

    // User Profile Handlers
    ipcMain.handle('user:save-profile', async (_event, name: string) => {
        return persistenceManager.saveUserProfile(name);
    });

    ipcMain.handle('user:get-profile', async () => {
        return persistenceManager.getUserProfile();
    });
    // Clear All Captures
    ipcMain.handle('captures:clear', async () => {
        return persistenceManager.clearAllCaptures();
    });

    // Report History Handlers
    ipcMain.handle('history:save', async (_event, report: any) => {
        return persistenceManager.saveReportToHistory(report);
    });

    ipcMain.handle('history:get', async () => {
        return persistenceManager.getReportHistory();
    });

    ipcMain.handle('history:delete', async (_event, id: string) => {
        return persistenceManager.deleteReportFromHistory(id);
    });

    ipcMain.handle('shell:openPath', async (_event, pathUrl: string) => {
        // The shell import is already at the top, so this line is redundant.
        // const { shell } = require('electron');
        return shell.openPath(pathUrl);
    });

    // Report Drafts Handlers
    ipcMain.handle('drafts:get', async () => {
        return persistenceManager.getReportDrafts();
    });

    ipcMain.handle('drafts:save', async (_event, draft: any) => {
        return persistenceManager.saveReportDraft(draft);
    });

    ipcMain.handle('drafts:delete', async (_event, id: string) => {
        return persistenceManager.deleteReportDraft(id);
    });

    // Save report file and return path
    ipcMain.handle('reports:saveFile', async (_event, fileName: string, content: ArrayBuffer) => {
        return persistenceManager.saveReportFile(fileName, content);
    });

    // Capture Flows Handlers
    ipcMain.handle('flows:get', async () => {
        return persistenceManager.getFlows();
    });

    ipcMain.handle('flows:save', async (_event, flow: any) => {
        return persistenceManager.saveFlow(flow);
    });

    ipcMain.handle('flows:saveSession', async (_event, name: string, captures: CaptureItem[]) => {
        return persistenceManager.saveFlowSession(name, captures);
    });

    ipcMain.handle('flows:add', async (_event, flowId: string, captures: CaptureItem[]) => {
        return persistenceManager.addToFlow(flowId, captures);
    });

    ipcMain.handle('flows:load', async (_event, flowId: string) => {
        return persistenceManager.loadFlow(flowId);
    });

    ipcMain.handle('flows:openFolder', async (_event, flowId: string) => {
        return persistenceManager.openFlowFolder(flowId);
    });

    ipcMain.handle('flows:delete', async (_event, id: string) => {
        return persistenceManager.deleteFlow(id);
    });

    // Open captures folder in file explorer
    ipcMain.handle('app:openCapturesFolder', async () => {
        const capturesPath = persistenceManager.getCapturesDir();
        await shell.openPath(capturesPath);
    });

    // Show native save dialog
    ipcMain.handle('dialog:showSaveDialog', async (_event, options: { defaultPath: string; filters: any[] }) => {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return null;

        const { dialog } = require('electron');
        const result = await dialog.showSaveDialog(win, {
            defaultPath: options.defaultPath,
            filters: options.filters
        });

        return result.canceled ? null : result.filePath;
    });

    // Reveal file in file explorer
    ipcMain.handle('shell:showItemInFolder', async (_event, filePath: string) => {
        shell.showItemInFolder(filePath);
    });
}
