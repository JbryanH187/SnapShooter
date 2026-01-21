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

    constructor() {
        this.flowsDir = path.join(app.getPath('userData'), 'flows');
        fs.ensureDirSync(this.flowsDir);
    }

    initialize(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.registerShortcuts();
    }

    private registerShortcuts() {
        // Register Ctrl+Shift+Q to toggle Quick Flow mode
        globalShortcut.register('CommandOrControl+Shift+Q', () => {
            this.toggleMode();
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

        // Register Ctrl+Shift+C for quick capture while in flow mode
        globalShortcut.register('CommandOrControl+Shift+C', async () => {
            if (this.isActive) {
                const cursorPos = screen.getCursorScreenPoint();
                await this.captureWithClick(cursorPos);
            }
        });

        // Notify renderer that Quick Flow mode is active
        if (this.mainWindow) {
            this.mainWindow.webContents.send('quickflow:modeChange', true);
        }

        // Create transparent overlay window
        this.createOverlay();
    }

    private stopMode() {
        this.isActive = false;

        // Unregister the capture shortcut
        globalShortcut.unregister('CommandOrControl+Shift+C');

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
                    <span class="hint">Ctrl+Shift+C captura | Ctrl+Shift+Q salir</span>
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

            // Capture the screen
            const primaryDisplay = screen.getPrimaryDisplay();
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: primaryDisplay.size
            });

            if (sources.length > 0) {
                const imageBuffer = sources[0].thumbnail.toPNG();
                const captureId = uuidv4();
                const imagePath = path.join(this.flowsDir, `${captureId}.png`);

                await fs.writeFile(imagePath, imageBuffer);

                // Calculate click position as percentage
                const screenWidth = primaryDisplay.size.width;
                const screenHeight = primaryDisplay.size.height;

                const clickPosition = {
                    x: (clickData.x / screenWidth) * 100,
                    y: (clickData.y / screenHeight) * 100
                };

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
        if (this.overlayWindow) {
            this.overlayWindow.close();
            this.overlayWindow = null;
        }
    }
}

export const quickFlowEngine = new QuickFlowEngine();
