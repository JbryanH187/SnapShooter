import { desktopCapturer, BrowserWindow } from 'electron';
import Screenshots from 'electron-screenshots';
import { performanceTracker } from '../../shared/telemetry/PerformanceTracker';
import { MetadataCollector, SystemMetadata } from '../../main/metadata/MetadataCollector';

export interface CaptureResult {
    dataUrl: string;
    metadata: SystemMetadata;
}

export interface CaptureRequest {
    id: string;
    type: 'region' | 'window';
    region?: { x: number; y: number; width: number; height: number };
    windowId?: string;
}

export class CaptureEngine {
    private captureQueue: Array<CaptureRequest & { resolve: (v: any) => void, reject: (err: any) => void }> = [];
    private isProcessing = false;
    private screenshots: Screenshots | null = null;

    constructor() {
        // Defer initialization
    }

    init() {
        if (!this.screenshots) {
            this.screenshots = new Screenshots({
                lang: {
                    magnifier_position_label: "Posición",
                    operation_ok_title: "Aceptar",
                    operation_cancel_title: "Cancelar",
                    operation_save_title: "Guardar",
                    operation_redo_title: "Rehacer",
                    operation_undo_title: "Deshacer",
                    operation_mosaic_title: "Mosaico",
                    operation_text_title: "Texto",
                    operation_brush_title: "Pincel",
                    operation_arrow_title: "Flecha",
                    operation_ellipse_title: "Elipse",
                    operation_rectangle_title: "Rectángulo",
                }
            });
        }
    }

    async queueCapture(request: CaptureRequest): Promise<CaptureResult> {
        return new Promise((resolve, reject) => {
            this.captureQueue.push({ ...request, resolve, reject });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessing || this.captureQueue.length === 0) return;

        this.isProcessing = true;
        const item = this.captureQueue.shift();

        if (item) {
            try {
                const result = await this.processCapture(item);
                item.resolve(result);
            } catch (error) {
                item.reject(error);
            } finally {
                this.isProcessing = false;
                this.processQueue();
            }
        }
    }

    // CRÍTICO: < 500ms end-to-end
    private async processCapture(request: CaptureRequest): Promise<CaptureResult> {
        return performanceTracker.trackOperation('capture', async () => {
            const metadata = await MetadataCollector.collect();
            let dataUrl = '';

            if (request.type === 'region') {
                if (!this.screenshots) throw new Error('Screenshots not initialized');

                dataUrl = await new Promise<string>((resolve, reject) => {
                    const onOk = (_e: Event, buffer: Buffer, _bounds: any) => {
                        try {
                            const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
                            resolve(`data:image/png;base64,${buf.toString('base64')}`);
                        } catch (error) {
                            console.error('[ENGINE] Error processing capture buffer:', error);
                            reject(error);
                        } finally {
                            cleanup();
                        }
                    };

                    const onCancel = () => {
                        reject(new Error('Capture cancelled by user'));
                        cleanup();
                    };

                    const onSave = (_e: Event, buffer: Buffer) => {
                        try {
                            const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
                            resolve(`data:image/png;base64,${buf.toString('base64')}`);
                        } catch (error) {
                            reject(error);
                        } finally {
                            cleanup();
                        }
                    }

                    const cleanup = () => {
                        this.screenshots?.off('ok', onOk);
                        this.screenshots?.off('cancel', onCancel);
                        this.screenshots?.off('save', onSave);
                    };

                    this.screenshots?.on('ok', onOk);
                    this.screenshots?.on('cancel', onCancel);
                    this.screenshots?.on('save', onSave);

                    this.screenshots?.startCapture();
                });
            } else {
                // Fallback or Window capture
                const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
                const screen = sources[0];
                if (!screen) throw new Error('No screen found');
                dataUrl = screen.thumbnail.toDataURL();
            }

            return { dataUrl, metadata };
        });
    }
}

export const captureEngine = new CaptureEngine();
