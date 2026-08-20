import { BrowserWindow, globalShortcut, screen, desktopCapturer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';

export class QuickFlowEngine {
    private isActive = false;
    private mainWindow: BrowserWindow | null = null;
    private overlayWindow: BrowserWindow | null = null;
    private currentFlowCaptures: any[] = [];
    private flowsDir: string;
    private currentResolution: { width: number; height: number } | null = null;
    
    // Add ipcMain to imports dynamically if needed, but it's cleaner to inject or just require it
    private ipcMain: any;

    constructor() {
        this.flowsDir = path.join(app.getPath('userData'), 'flows');
        fs.ensureDirSync(this.flowsDir);
    }

    initialize(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.ipcMain = require('electron').ipcMain;
        
        // Handle resolution set from renderer
        this.ipcMain.handle('resolution:set', (_event: any, width: number, height: number) => {
            this.setResolution(width, height);
        });

        this.registerShortcuts();
    }
    
    setResolution(width: number, height: number) {
        if (width === 0 || height === 0) {
            this.currentResolution = null; // Full screen
        } else {
            this.currentResolution = { width, height };
        }
    }

    private registerShortcuts() {
        // Register Ctrl+Shift+Q to toggle Quick Flow mode
        globalShortcut.register('CommandOrControl+Shift+Q', () => {
            this.toggleMode();
        });

        // Register Ctrl+Shift+B to change resolution
        globalShortcut.register('CommandOrControl+Shift+B', () => {
            if (this.isActive && this.mainWindow) {
                this.mainWindow.webContents.send('resolution:request-picker');
            }
        });
    }

    private toggleMode() {
        if (this.isActive) {
            this.stopMode();
        } else {
            this.startMode();
        }
    }

    private startMode() {
        this.isActive = true;
        this.currentFlowCaptures = [];

        // Register multiple shortcuts to avoid OS conflicts
        const captureAction = async () => {
            console.log('[QuickFlowEngine] Capture shortcut triggered!');
            if (this.isActive) {
                const cursorPos = screen.getCursorScreenPoint();
                console.log(`[QuickFlowEngine] Cursor position: ${cursorPos.x}, ${cursorPos.y}`);
                await this.captureWithClick(cursorPos);
            }
        };

        const c1 = globalShortcut.register('CommandOrControl+Shift+C', captureAction);
        const c2 = globalShortcut.register('CommandOrControl+Shift+X', captureAction);
        const c3 = globalShortcut.register('Alt+S', captureAction);
        
        console.log(`[QuickFlowEngine] Shortcuts registered - Ctrl+Shift+C: ${c1}, Ctrl+Shift+X: ${c2}, Alt+S: ${c3}`);

        // Notify renderer that Quick Flow mode is active
        if (this.mainWindow) {
            this.mainWindow.webContents.send('quickflow:modeChange', true);
            // Prompt for resolution when starting flow
            this.mainWindow.webContents.send('resolution:request-picker');
        }

        // Create transparent overlay window
        this.createOverlay();
    }

    private stopMode() {
        this.isActive = false;

        // Unregister the capture shortcuts
        globalShortcut.unregister('CommandOrControl+Shift+C');
        globalShortcut.unregister('CommandOrControl+Shift+X');
        globalShortcut.unregister('Alt+S');

        // Close overlay
        if (this.overlayWindow) {
            this.overlayWindow.close();
            this.overlayWindow = null;
        }

        // Notify renderer with captures
        if (this.mainWindow) {
            this.mainWindow.webContents.send('quickflow:modeChange', false);

            // Send the captured flow data
            if (this.currentFlowCaptures.length > 0) {
                this.mainWindow.webContents.send('quickflow:flowComplete', {
                    id: uuidv4(),
                    captures: this.currentFlowCaptures
                });
            }
        }

        this.currentFlowCaptures = [];
    }

    private createOverlay() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;

        this.overlayWindow = new BrowserWindow({
            width,
            height,
            x: 0,
            y: 0,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            focusable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        // Make window completely click-through
        this.overlayWindow.setIgnoreMouseEvents(true);

        // Load a simple HTML for the overlay indicator
        this.overlayWindow.loadURL(`data:text/html,
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    * { margin: 0; padding: 0; }
                    html, body {
                        width: 100vw;
                        height: 100vh;
                        background: transparent;
                        pointer-events: none;
                        overflow: hidden;
                    }
                    .indicator {
                        position: fixed;
                        top: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(249, 115, 22, 0.95));
                        color: white;
                        padding: 12px 24px;
                        border-radius: 50px;
                        font-family: system-ui, -apple-system, sans-serif;
                        font-size: 14px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    }
                    .logo {
                        width: 24px;
                        height: 24px;
                        background: white;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                    }
                    .count {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background: rgba(0, 0, 0, 0.85);
                        color: #22c55e;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-family: system-ui;
                        font-size: 14px;
                        font-weight: 600;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    }
                    .hint {
                        font-weight: normal;
                        opacity: 0.9;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="indicator">
                    <div class="logo">📸</div>
                    <span>Quick Flow</span>
                    <span class="hint">Alt+S o Ctrl+Shift+X para capturar | Ctrl+Shift+Q salir</span>
                </div>
                <div class="count" id="count">📷 Capturas: 0</div>
            </body>
            </html>
        `);
    }

    private updateOverlayCount() {
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.webContents.executeJavaScript(`
                document.getElementById('count').textContent = '📷 Capturas: ${this.currentFlowCaptures.length}';
            `).catch(() => { });
        }
    }

    private async captureWithClick(clickData: { x: number, y: number }) {
        try {
            // Hide overlay temporarily for clean capture
            if (this.overlayWindow) {
                this.overlayWindow.hide();
            }

            // Small delay to ensure overlay is hidden
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture the screen based on where the cursor is
            const currentDisplay = screen.getDisplayNearestPoint(clickData);
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { 
                    width: currentDisplay.size.width * currentDisplay.scaleFactor, 
                    height: currentDisplay.size.height * currentDisplay.scaleFactor 
                }
            });

            if (sources.length > 0) {
                // Find the source matching our current display
                let source = sources.find(s => s.display_id === currentDisplay.id.toString());
                if (!source) source = sources[0];

                let nativeImg = source.thumbnail;
                const screenWidth = currentDisplay.size.width;
                const screenHeight = currentDisplay.size.height;
                
                // Adjust coordinates relative to the specific monitor's bounds
                const localClickX = clickData.x - currentDisplay.bounds.x;
                const localClickY = clickData.y - currentDisplay.bounds.y;
                
                let clickPosition = {
                    x: (localClickX / screenWidth) * 100,
                    y: (localClickY / screenHeight) * 100
                };

                // Apply predefined resolution crop
                if (this.currentResolution) {
                    const { width, height } = this.currentResolution;
                    
                    // We need to scale the crop coordinates to the actual nativeImg size if scaleFactor > 1
                    const scale = currentDisplay.scaleFactor;
                    const scaledWidth = width * scale;
                    const scaledHeight = height * scale;
                    
                    let cropX = (localClickX * scale) - scaledWidth / 2;
                    let cropY = (localClickY * scale) - scaledHeight / 2;

                    // Clamp to native image bounds
                    const imgSize = nativeImg.getSize();
                    cropX = Math.max(0, Math.min(cropX, imgSize.width - scaledWidth));
                    cropY = Math.max(0, Math.min(cropY, imgSize.height - scaledHeight));

                    // Crop image
                    nativeImg = nativeImg.crop({
                        x: Math.round(cropX),
                        y: Math.round(cropY),
                        width: Math.round(scaledWidth),
                        height: Math.round(scaledHeight)
                    });

                    // Recalculate click position relative to cropped area (unscaled)
                    const croppedLocalX = localClickX - (cropX / scale);
                    const croppedLocalY = localClickY - (cropY / scale);
                    clickPosition = {
                        x: (croppedLocalX / width) * 100,
                        y: (croppedLocalY / height) * 100
                    };
                }

                const imageBuffer = nativeImg.toPNG();
                const captureId = uuidv4();
                const imagePath = path.join(this.flowsDir, `${captureId}.png`);

                await fs.writeFile(imagePath, imageBuffer);

                const capture = {
                    id: captureId,
                    imagePath: `media://${captureId}.png`,
                    clickPosition,
                    order: this.currentFlowCaptures.length,
                    createdAt: Date.now()
                };

                this.currentFlowCaptures.push(capture);

                // Notify renderer about new capture
                if (this.mainWindow) {
                    this.mainWindow.webContents.send('quickflow:capture', capture);
                }
            }

            // Show overlay again and update count
            if (this.overlayWindow) {
                this.overlayWindow.show();
                this.updateOverlayCount();
            }
        } catch (error) {
            console.error('Failed to capture for quick flow:', error);
            // Show overlay again even on error
            if (this.overlayWindow) {
                this.overlayWindow.show();
            }
        }
    }

    cleanup() {
        globalShortcut.unregister('CommandOrControl+Shift+Q');
        globalShortcut.unregister('CommandOrControl+Shift+C');
        globalShortcut.unregister('CommandOrControl+Shift+X');
        globalShortcut.unregister('Alt+S');
        if (this.overlayWindow) {
            this.overlayWindow.close();
            this.overlayWindow = null;
        }
    }
}

export const quickFlowEngine = new QuickFlowEngine();
