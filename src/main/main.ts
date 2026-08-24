import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';
import { setupHandlers } from './ipc/handlers';
import { registerShortcuts } from './shortcuts/GlobalShortcuts';
import { captureEngine } from './captures/CaptureEngine';
import { quickFlowEngine } from './captures/QuickFlowEngine';
import { registerMediaProtocol } from './ipc/MediaProtocol';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    // Initialize Capture Engine
    captureEngine.init();
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#fcfcfd', // gray-25
        icon: path.join(__dirname, '../../build/icon.png'),
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Required for contextBridge
            preload: path.join(__dirname, '../preload/index.js'),
        },
        // Frameless for custom UI if needed, or standard
        titleBarStyle: 'hidden',
        titleBarOverlay: true
    });

    // Setup IPC Handlers
    setupHandlers();

    // Register Shortcuts
    registerShortcuts(mainWindow);

    // Initialize Quick Flow Engine
    quickFlowEngine.initialize(mainWindow);

    // In dev mode, VITE_DEV_SERVER_URL might not be set by concurrently
    // but we know Vite runs on 5173 by default.
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

    // Check if we are running from dist-electron (production/packaged)
    const isDev = !app.isPackaged;

    if (isDev) {
        const loadWithRetry = async (retries = 10, delay = 500) => {
            for (let i = 0; i < retries; i++) {
                try {
                    await mainWindow?.loadURL(devUrl);
                    mainWindow?.show();
                    mainWindow?.focus();
                    return;
                } catch (e) {
                    console.log(`[Dev] Waiting for Vite server (${i + 1}/${retries})...`);
                    await new Promise(res => setTimeout(res, delay));
                }
            }
            console.error('Failed to load Vite dev URL after retries');
        };
        loadWithRetry();
    } else {
        // Path relative to dist-electron/main/main.js -> dist-electron -> root -> dist/index.html
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html')).catch(e => console.error('Failed to load file:', e));
    }
}

app.whenReady().then(() => {
    console.log('[Main] Application Ready');

    // CSP: Mitigate XSS and restrict sources
    const { session } = require('electron');
    session.defaultSession.webRequest.onHeadersReceived((details: any, callback: any) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self';" +
                    " script-src 'self' 'unsafe-inline';" +
                    " style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" +
                    " font-src 'self' https://fonts.gstatic.com;" +
                    " img-src 'self' data: media: blob:;" +
                    " frame-src 'self' blob: data:;" +
                    " object-src 'self' blob: data:;" +
                    " connect-src 'self' ws://localhost:* http://localhost:*;"
                ]
            }
        });
    });

    // Register custom protocol 'media'
    registerMediaProtocol();

    createWindow();

    // Auto-update check in production
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
            console.error('[AutoUpdater] Failed to check for updates:', err);
        });
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
