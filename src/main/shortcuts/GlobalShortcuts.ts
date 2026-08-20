import { globalShortcut, BrowserWindow } from 'electron';
import { captureEngine } from '../captures/CaptureEngine';
import { v4 as uuidv4 } from 'uuid';

export function registerShortcuts(mainWindow: BrowserWindow) {
    // Ctrl+Shift+1 -> Region Capture
    globalShortcut.register('CommandOrControl+Shift+1', async () => {
        try {
            const id = uuidv4();
            const { dataUrl, metadata } = await captureEngine.queueCapture({ id, type: 'region' });
            mainWindow.webContents.send('capture:complete', { id, thumbnail: dataUrl, metadata });
        } catch (error: any) {
            if (error.message && error.message.includes('cancelled')) {
                console.log('[MAIN] Capture cancelled by user');
            } else {
                console.error('[MAIN] Capture failed:', error);
            }
        }
    });

    // Ctrl+Shift+2 -> Full Window Capture
    globalShortcut.register('CommandOrControl+Shift+2', async () => {
        try {
            const id = uuidv4();
            const { dataUrl, metadata } = await captureEngine.queueCapture({ id, type: 'window' });
            mainWindow.webContents.send('capture:complete', { id, thumbnail: dataUrl, metadata });
        } catch (error) {
            console.error('Capture failed:', error);
        }
    });

    // Ctrl+Shift+E -> Fixed Region Capture (prompts for resolution then captures)
    globalShortcut.register('CommandOrControl+Shift+E', async () => {
        // We'll reuse the Quick Flow mode logic for this by having a single-shot capture
        // But the easiest way is to let the user use Quick Flow for fixed sizes, 
        // as implementing a whole new single-shot fixed size capture engine replicates QuickFlowEngine.
        // Let's notify renderer to handle a single fixed capture if needed, or just let them use Quick Flow.
        mainWindow.webContents.send('resolution:request-picker');
    });
}
