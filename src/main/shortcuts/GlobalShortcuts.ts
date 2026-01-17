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
}
