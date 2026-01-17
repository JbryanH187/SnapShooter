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
        this.theme = REPORT_THEMES[config.theme];
        this.currentDate = new Date().toLocaleDateString('es-ES', {
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
    protected hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * Load an image and add it to the PDF
     */
    protected async addImage(src: string, x: number, y: number, width: number, height: number): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    this.doc.addImage(img, 'PNG', x, y, width, height);
                    resolve(true);
                } catch (error) {
                    console.error('Error adding image:', error);
                    resolve(false);
                }
            };
            img.onerror = () => {
                console.warn('Failed to load image:', src);
                resolve(false);
            };
            img.src = src;
        });
    }

    /**
     * Add a new page and reset position
     */
    protected addPage(): void {
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
        id: 'creative',
        name: 'Creative Bold',
        description: 'Eye-catching layout with large hero images and accent colors',
        previewClass: 'bg-gradient-to-br from-purple-600 to-pink-500'
    }
];
