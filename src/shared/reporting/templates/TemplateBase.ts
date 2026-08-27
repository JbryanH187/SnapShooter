import { jsPDF } from 'jspdf';
import { CaptureItem } from '../../types';
import { ReportConfig, ColorPalette, REPORT_THEMES } from '../ReportThemes';

/**
 * Abstract base class for PDF report templates.
 * Each template implements its own cover page and content rendering logic.
 */
export abstract class TemplateBase {
    protected doc: jsPDF;
    protected config: ReportConfig;
    protected theme: ColorPalette;
    protected currentDate: string;

    constructor(doc: jsPDF, config: ReportConfig) {
        this.doc = doc;
        this.config = config;
        this.theme = (config.theme && REPORT_THEMES[config.theme]) || REPORT_THEMES.default;
        
        let dateSource = new Date();
        if (config.reportDate && config.reportDate.trim().length > 0) {
            const parsed = new Date(config.reportDate.includes('T') ? config.reportDate : config.reportDate + 'T12:00:00');
            if (!isNaN(parsed.getTime())) {
                dateSource = parsed;
            }
        }

        this.currentDate = dateSource.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Render the cover page of the report
     */
    abstract renderCover(): Promise<void>;

    /**
     * Render the content pages with captures
     */
    abstract renderContent(captures: CaptureItem[]): Promise<void>;

    /**
     * Helper to convert hex color to RGB
     */
    protected hexToRgb(hex?: string): { r: number; g: number; b: number } {
        if (!hex) return { r: 0, g: 0, b: 0 };
        const result = /^#?([a-d\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * Draw vector cursor / click target indicator on top of screenshot
     */
    protected drawCursorMarker(x: number, y: number, style = 'hand'): void {
        try {
            // 1. Semi-transparent outer pulse halo
            this.doc.setFillColor(245, 158, 11);
            this.doc.circle(x, y, 4.5, 'F');

            // 2. White inner border
            this.doc.setFillColor(255, 255, 255);
            this.doc.circle(x, y, 3.2, 'F');

            // 3. Center target indicator
            if (style === 'target') {
                this.doc.setFillColor(239, 68, 68);
                this.doc.circle(x, y, 1.8, 'F');
                this.doc.setDrawColor(239, 68, 68);
                this.doc.setLineWidth(0.4);
                this.doc.line(x - 3.8, y, x + 3.8, y);
                this.doc.line(x, y - 3.8, x, y + 3.8);
            } else if (style === 'dot') {
                this.doc.setFillColor(239, 68, 68);
                this.doc.circle(x, y, 2.2, 'F');
            } else {
                // 'hand' / 'mouse' / default amber
                this.doc.setFillColor(245, 158, 11);
                this.doc.circle(x, y, 2.2, 'F');
            }
        } catch (e) {
            console.warn('[TemplateBase:drawCursorMarker] Error drawing marker:', e);
        }
    }

    /**
     * Load an image and add it to the PDF with optional cursor click indicator overlay
     */
    protected async addImage(
        src: string,
        x: number,
        y: number,
        maxWidth: number,
        maxHeight: number,
        cursorOverlay?: { clickPosition?: { x: number; y: number }; clickStyle?: string; enabled?: boolean }
    ): Promise<boolean> {
        if (!src || typeof src !== 'string' || src.trim().length === 0) {
            console.warn('[TemplateBase:addImage] Received empty or invalid image src');
            return false;
        }

        console.log(`[TemplateBase:addImage] Processing image: "${src.slice(0, 60)}..." (bounds: ${maxWidth}x${maxHeight} at (${x},${y}))`);

        let resolvedSrc = src;
        if (!resolvedSrc.startsWith('data:')) {
            try {
                if (typeof window !== 'undefined' && (window as any).electron?.readImage) {
                    const result = await (window as any).electron.readImage(src);
                    if (typeof result === 'string' && result.startsWith('data:')) {
                        resolvedSrc = result;
                        console.log(`[TemplateBase:addImage] IPC readImage succeeded, data length: ${resolvedSrc.length}`);
                    } else {
                        console.warn('[TemplateBase:addImage] IPC readImage returned non-data URI:', result);
                    }
                }
            } catch (err) {
                console.warn('[TemplateBase:addImage] IPC readImage error for:', src, err);
            }
        }

        return new Promise((resolve) => {
            let finished = false;
            const finish = (result: boolean) => {
                if (!finished) {
                    finished = true;
                    clearTimeout(safetyTimer);
                    resolve(result);
                }
            };

            // Strict safety timeout (2000ms) to ensure PDF generation never hangs
            const safetyTimer = setTimeout(() => {
                console.warn('[TemplateBase:addImage] Safety timeout (2000ms) triggered for:', resolvedSrc.slice(0, 60));
                finish(false);
            }, 2000);

            const img = new Image();
            if (!resolvedSrc.startsWith('data:')) {
                img.crossOrigin = 'anonymous';
            }
            img.onload = () => {
                try {
                    const naturalW = img.naturalWidth || img.width || 1;
                    const naturalH = img.naturalHeight || img.height || 1;
                    const imgRatio = naturalW / naturalH;
                    const maxRatio = maxWidth / maxHeight;
                    
                    let drawWidth = maxWidth;
                    let drawHeight = maxHeight;
                    let drawX = x;
                    let drawY = y;
                    
                    if (imgRatio > maxRatio) {
                        // Image is wider than max bound
                        drawHeight = maxWidth / imgRatio;
                        drawY = y + (maxHeight - drawHeight) / 2; // Center vertically
                    } else {
                        // Image is taller than max bound
                        drawWidth = maxHeight * imgRatio;
                        drawX = x + (maxWidth - drawWidth) / 2; // Center horizontally
                    }

                    let format = 'PNG';
                    if (resolvedSrc.includes('image/jpeg') || resolvedSrc.includes('image/jpg')) {
                        format = 'JPEG';
                    } else if (resolvedSrc.includes('image/webp')) {
                        format = 'WEBP';
                    }

                    console.log(`[TemplateBase:addImage] Drawing image: natural ${naturalW}x${naturalH}, draw ${drawWidth.toFixed(1)}x${drawHeight.toFixed(1)} at (${drawX.toFixed(1)},${drawY.toFixed(1)}), format: ${format}`);
                    
                    if (resolvedSrc.startsWith('data:')) {
                        this.doc.addImage(resolvedSrc, format, drawX, drawY, drawWidth, drawHeight);
                    } else {
                        this.doc.addImage(img, format, drawX, drawY, drawWidth, drawHeight);
                    }

                    // Render cursor indicator over image if present and enabled
                    if (cursorOverlay?.clickPosition && cursorOverlay.enabled !== false) {
                        const markerX = drawX + (cursorOverlay.clickPosition.x / 100) * drawWidth;
                        const markerY = drawY + (cursorOverlay.clickPosition.y / 100) * drawHeight;
                        this.drawCursorMarker(markerX, markerY, cursorOverlay.clickStyle);
                    }

                    finish(true);
                } catch (error) {
                    console.warn('[TemplateBase:addImage] doc.addImage direct failed, trying canvas fallback:', error);
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width || 800;
                        canvas.height = img.naturalHeight || img.height || 600;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            const pngData = canvas.toDataURL('image/png');
                            this.doc.addImage(pngData, 'PNG', x, y, maxWidth, maxHeight);
                            if (cursorOverlay?.clickPosition && cursorOverlay.enabled !== false) {
                                const markerX = x + (cursorOverlay.clickPosition.x / 100) * maxWidth;
                                const markerY = y + (cursorOverlay.clickPosition.y / 100) * maxHeight;
                                this.drawCursorMarker(markerX, markerY, cursorOverlay.clickStyle);
                            }
                            console.log('[TemplateBase:addImage] Canvas fallback succeeded');
                            finish(true);
                            return;
                        }
                    } catch (canvasErr) {
                        console.error('[TemplateBase:addImage] Canvas fallback also failed:', canvasErr);
                    }
                    finish(false);
                }
            };
            img.onerror = (e) => {
                console.warn('[TemplateBase:addImage] HTML Image.onerror failed to load:', resolvedSrc.slice(0, 80), e);
                finish(false);
            };
            img.src = resolvedSrc;
        });
    }

    /**
     * Add a new page and reset position
     */
    protected addPage(): void {
        console.log('[TemplateBase:addPage] Adding new page to PDF');
        this.doc.addPage();
    }

    /**
     * Get page dimensions
     */
    protected get pageWidth(): number {
        return this.doc.internal.pageSize.width;
    }

    protected get pageHeight(): number {
        return this.doc.internal.pageSize.height;
    }
}

/**
 * Template metadata for UI display
 */
export interface TemplateInfo {
    id: string;
    name: string;
    description: string;
    previewClass: string; // CSS class for preview styling
}

/**
 * Available templates registry
 */
export const REPORT_TEMPLATES: TemplateInfo[] = [
    {
        id: 'slides',
        name: 'PPTX',
        description: 'Presentación ejecutiva estilo Bubble con tarjetas flotantes, márgenes limpios y modo dual',
        previewClass: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500'
    },
    {
        id: 'classic',
        name: 'Classic Corporate',
        description: 'Clean professional layout with centered title and info table',
        previewClass: 'bg-gradient-to-b from-blue-900 to-blue-800'
    },
    {
        id: 'modern',
        name: 'Modern Sidebar',
        description: 'Contemporary design with sidebar branding and large typography',
        previewClass: 'bg-gradient-to-r from-indigo-900 to-slate-900'
    },
    {
        id: 'bubble',
        name: 'Bubbles',
        description: 'Playful and modern layout with circular elements and soft edges',
        previewClass: 'bg-gradient-to-br from-pink-400 to-orange-400'
    },
    {
        id: 'japanese',
        name: 'Japanese Book',
        description: 'Elegant 2-column layout flowing top-to-bottom',
        previewClass: 'bg-gradient-to-br from-stone-200 to-stone-400'
    }
];
