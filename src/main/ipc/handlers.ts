import { ipcMain, BrowserWindow, shell, clipboard, nativeImage } from 'electron';
import { captureEngine } from '../captures/CaptureEngine';
import { persistenceManager } from '../stores/PersistenceManager';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { CaptureItem } from '../../shared/types';
import {
    CaptureItemSchema,
    CaptureFlowSchema,
    ReportHistoryEntrySchema,
    ReportDraftSchema,
    OverlayStyleSchema,
    SaveDialogOptionsSchema,
} from '../../shared/schemas/captureSchemas';

export function setupHandlers() {
    ipcMain.handle('window:set-overlay-style', (event, style: unknown) => {
        const parsed = OverlayStyleSchema.safeParse(style);
        if (!parsed.success) {
            console.error('[IPC] Invalid overlay style:', parsed.error.message);
            return;
        }
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            win.setTitleBarOverlay(parsed.data);
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

    ipcMain.handle('captures:readImage', async (_event, pathUrl: unknown) => {
        const parsed = z.string().safeParse(pathUrl);
        if (!parsed.success) throw new Error('Invalid pathUrl');
        return persistenceManager.readImage(parsed.data);
    });

    ipcMain.handle('captures:save', async (_event, capture: unknown) => {
        const parsed = CaptureItemSchema.safeParse(capture);
        if (!parsed.success) throw new Error(`Invalid capture item: ${parsed.error.message}`);
        return persistenceManager.saveCapture(parsed.data as CaptureItem);
    });

    ipcMain.handle('captures:delete', async (_event, id: unknown) => {
        const parsed = z.string().safeParse(id);
        if (!parsed.success) throw new Error('Invalid capture ID');
        return persistenceManager.deleteCapture(parsed.data);
    });

    // User Profile Handlers
    ipcMain.handle('user:save-profile', async (_event, name: unknown) => {
        const parsed = z.string().min(1).max(100).safeParse(name);
        if (!parsed.success) throw new Error('Invalid profile name');
        return persistenceManager.saveUserProfile(parsed.data);
    });

    ipcMain.handle('user:get-profile', async () => {
        return persistenceManager.getUserProfile();
    });

    // Clear All Captures
    ipcMain.handle('captures:clear', async () => {
        return persistenceManager.clearAllCaptures();
    });

    // Report History Handlers
    ipcMain.handle('history:save', async (_event, report: unknown) => {
        const parsed = ReportHistoryEntrySchema.safeParse(report);
        if (!parsed.success) throw new Error(`Invalid report entry: ${parsed.error.message}`);
        return persistenceManager.saveReportToHistory(parsed.data);
    });

    ipcMain.handle('history:get', async () => {
        return persistenceManager.getReportHistory();
    });

    ipcMain.handle('history:delete', async (_event, id: unknown) => {
        const parsed = z.string().safeParse(id);
        if (!parsed.success) throw new Error('Invalid history ID');
        return persistenceManager.deleteReportFromHistory(parsed.data);
    });

    ipcMain.handle('shell:openPath', async (_event, pathUrl: unknown) => {
        const parsed = z.string().safeParse(pathUrl);
        if (!parsed.success) throw new Error('Invalid pathUrl');
        return shell.openPath(parsed.data);
    });

    // Report Drafts Handlers
    ipcMain.handle('drafts:get', async () => {
        return persistenceManager.getReportDrafts();
    });

    ipcMain.handle('drafts:save', async (_event, draft: unknown) => {
        const parsed = ReportDraftSchema.safeParse(draft);
        if (!parsed.success) throw new Error(`Invalid draft: ${parsed.error.message}`);
        return persistenceManager.saveReportDraft(parsed.data);
    });

    ipcMain.handle('drafts:delete', async (_event, id: unknown) => {
        const parsed = z.string().safeParse(id);
        if (!parsed.success) throw new Error('Invalid draft ID');
        return persistenceManager.deleteReportDraft(parsed.data);
    });

    // Save report file and return path
    ipcMain.handle('reports:saveFile', async (_event, fileName: unknown, content: unknown) => {
        const nameP = z.string().min(1).safeParse(fileName);
        if (!nameP.success) throw new Error('Invalid fileName');
        if (!(content instanceof ArrayBuffer) && !Buffer.isBuffer(content)) throw new Error('Invalid content');
        return persistenceManager.saveReportFile(nameP.data, content as ArrayBuffer);
    });

    // Capture Flows Handlers
    ipcMain.handle('flows:get', async () => {
        return persistenceManager.getFlows();
    });

    ipcMain.handle('flows:save', async (_event, flow: unknown) => {
        const parsed = CaptureFlowSchema.safeParse(flow);
        if (!parsed.success) throw new Error(`Invalid flow: ${parsed.error.message}`);
        return persistenceManager.saveFlow(parsed.data);
    });

    ipcMain.handle('flows:saveSession', async (_event, name: unknown, captures: unknown) => {
        const nameP = z.string().min(1).safeParse(name);
        const capturesP = z.array(CaptureItemSchema).safeParse(captures);
        if (!nameP.success) throw new Error('Invalid flow name');
        if (!capturesP.success) throw new Error(`Invalid captures array: ${capturesP.error.message}`);
        return persistenceManager.saveFlowSession(nameP.data, capturesP.data as CaptureItem[]);
    });

    ipcMain.handle('flows:add', async (_event, flowId: unknown, captures: unknown) => {
        const idP = z.string().safeParse(flowId);
        const capturesP = z.array(CaptureItemSchema).safeParse(captures);
        if (!idP.success) throw new Error('Invalid flowId');
        if (!capturesP.success) throw new Error(`Invalid captures array: ${capturesP.error.message}`);
        return persistenceManager.addToFlow(idP.data, capturesP.data as CaptureItem[]);
    });

    ipcMain.handle('flows:load', async (_event, flowId: unknown) => {
        const parsed = z.string().safeParse(flowId);
        if (!parsed.success) throw new Error('Invalid flowId');
        return persistenceManager.loadFlow(parsed.data);
    });

    ipcMain.handle('flows:openFolder', async (_event, flowId: unknown) => {
        const parsed = z.string().safeParse(flowId);
        if (!parsed.success) throw new Error('Invalid flowId');
        return persistenceManager.openFlowFolder(parsed.data);
    });

    ipcMain.handle('flows:delete', async (_event, id: unknown) => {
        const parsed = z.string().safeParse(id);
        if (!parsed.success) throw new Error('Invalid flow ID');
        return persistenceManager.deleteFlow(parsed.data);
    });

    // Open captures folder in file explorer
    ipcMain.handle('app:openCapturesFolder', async () => {
        const capturesPath = persistenceManager.getCapturesDir();
        await shell.openPath(capturesPath);
    });

    // Copy image to system clipboard
    ipcMain.handle('clipboard:copyImage', async (_event, imageSrc: unknown) => {
        const parsed = z.string().safeParse(imageSrc);
        if (!parsed.success) throw new Error('Invalid image source');

        const src = parsed.data;
        let imageBuffer: Buffer;

        if (src.startsWith('data:image')) {
            const base64Data = src.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (src.startsWith('media://')) {
            const base64DataUrl = await persistenceManager.readImage(src);
            const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            throw new Error('Unsupported image source format');
        }

        const image = nativeImage.createFromBuffer(imageBuffer);
        clipboard.writeImage(image);
        return true;
    });

    // Show native save dialog
    ipcMain.handle('dialog:showSaveDialog', async (_event, options: unknown) => {
        const win = BrowserWindow.getFocusedWindow();
        if (!win) return null;

        const parsed = SaveDialogOptionsSchema.safeParse(options);
        if (!parsed.success) throw new Error('Invalid dialog options');

        const { dialog } = require('electron');
        const result = await dialog.showSaveDialog(win, {
            defaultPath: parsed.data.defaultPath,
            filters: parsed.data.filters,
        });

        return result.canceled ? null : result.filePath;
    });

    // Reveal file in file explorer
    ipcMain.handle('shell:showItemInFolder', async (_event, filePath: unknown) => {
        const parsed = z.string().safeParse(filePath);
        if (!parsed.success) throw new Error('Invalid filePath');
        shell.showItemInFolder(parsed.data);
    });

    // === Jira B2B Integration Handlers ===
    ipcMain.handle('jira:testConnection', async (_event, config: unknown) => {
        const { JiraConfigSchema } = require('../../shared/schemas/captureSchemas');
        const { JiraIntegrationService } = require('../../shared/integrations/jira');
        const parsed = JiraConfigSchema.safeParse(config);
        if (!parsed.success) throw new Error(`Invalid Jira config: ${parsed.error.message}`);
        return JiraIntegrationService.testConnection(parsed.data);
    });

    ipcMain.handle('jira:getIssues', async (_event, config: unknown, query?: unknown) => {
        const { JiraConfigSchema } = require('../../shared/schemas/captureSchemas');
        const { JiraIntegrationService } = require('../../shared/integrations/jira');
        const parsedConfig = JiraConfigSchema.safeParse(config);
        if (!parsedConfig.success) throw new Error('Invalid Jira config');
        const parsedQuery = query ? (z.string().safeParse(query).data || '') : undefined;
        return JiraIntegrationService.searchIssues(parsedConfig.data, parsedQuery);
    });

    ipcMain.handle('jira:uploadAttachment', async (_event, payload: unknown) => {
        const { JiraUploadSchema } = require('../../shared/schemas/captureSchemas');
        const { JiraIntegrationService } = require('../../shared/integrations/jira');
        const parsed = JiraUploadSchema.safeParse(payload);
        if (!parsed.success) throw new Error(`Invalid upload payload: ${parsed.error.message}`);

        const { config, issueKey, fileName, imageSrc } = parsed.data;
        let imageBuffer: Buffer;

        if (imageSrc.startsWith('data:image')) {
            const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (imageSrc.startsWith('media://')) {
            const base64DataUrl = await persistenceManager.readImage(imageSrc);
            const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            throw new Error('Unsupported image format for Jira upload');
        }

        return JiraIntegrationService.uploadAttachment(config, issueKey, fileName, imageBuffer);
    });

    // === Azure DevOps B2B Integration Handlers ===
    ipcMain.handle('ado:testConnection', async (_event, config: unknown) => {
        const { AzureDevOpsConfigSchema } = require('../../shared/schemas/captureSchemas');
        const { AzureDevOpsService } = require('../../shared/integrations/azureDevOps');
        const parsed = AzureDevOpsConfigSchema.safeParse(config);
        if (!parsed.success) throw new Error(`Invalid Azure DevOps config: ${parsed.error.message}`);
        return AzureDevOpsService.testConnection(parsed.data);
    });

    ipcMain.handle('ado:getWorkItems', async (_event, config: unknown, query?: unknown) => {
        const { AzureDevOpsConfigSchema } = require('../../shared/schemas/captureSchemas');
        const { AzureDevOpsService } = require('../../shared/integrations/azureDevOps');
        const parsedConfig = AzureDevOpsConfigSchema.safeParse(config);
        if (!parsedConfig.success) throw new Error('Invalid Azure DevOps config');
        const parsedQuery = query ? (z.string().safeParse(query).data || '') : undefined;
        return AzureDevOpsService.searchWorkItems(parsedConfig.data, parsedQuery);
    });

    ipcMain.handle('ado:uploadAttachment', async (_event, payload: unknown) => {
        const { AzureDevOpsUploadSchema } = require('../../shared/schemas/captureSchemas');
        const { AzureDevOpsService } = require('../../shared/integrations/azureDevOps');
        const parsed = AzureDevOpsUploadSchema.safeParse(payload);
        if (!parsed.success) throw new Error(`Invalid Azure DevOps upload payload: ${parsed.error.message}`);

        const { config, workItemId, fileName, imageSrc } = parsed.data;
        let imageBuffer: Buffer;

        if (imageSrc.startsWith('data:image')) {
            const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (imageSrc.startsWith('media://')) {
            const base64DataUrl = await persistenceManager.readImage(imageSrc);
            const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            throw new Error('Unsupported image format for Azure DevOps upload');
        }

        return AzureDevOpsService.uploadAttachment(config, workItemId, fileName, imageBuffer);
    });
}
