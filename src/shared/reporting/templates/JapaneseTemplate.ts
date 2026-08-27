import { jsPDF } from 'jspdf';
import { TemplateBase } from './TemplateBase';
import { CaptureItem } from '../../types';
import { ReportConfig } from '../ReportThemes';

/**
 * Japanese Book Form Template
 * 2-column layout dividing the page in half, 4 items per page.
 * Reads left-column (top to bottom) then right-column (top to bottom).
 * Bubble-inspired aesthetics (rounded edges, circular step indicators).
 */
export class JapaneseTemplate extends TemplateBase {
    constructor(doc: jsPDF, config: ReportConfig) {
        super(doc, config);
    }

    async renderCover(): Promise<void> {
        console.log('[JapaneseTemplate:renderCover] Rendering Japanese Book cover...');
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);

        // Minimalist cover: Asymmetric decorative bubbles instead of a strict center line
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.circle(30, -10, 35, 'F'); // Top left peeking
        this.doc.circle(210, 150, 15, 'F'); // Middle right peeking
        
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.circle(180, 320, 50, 'F'); // Bottom right peeking large

        // Title on the right side
        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFontSize(36);
        this.doc.setFont('helvetica', 'bold');
        const titleLines = this.doc.splitTextToSize(this.config.title || 'REPORTE DE EVIDENCIA', 80);
        this.doc.text(titleLines, 120, 100);

        this.doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.setFontSize(16);
        this.doc.setFont('helvetica', 'normal');
        const subtitleLines = this.doc.splitTextToSize(this.config.subtitle || 'PRUEBAS DE CALIDAD', 80);
        this.doc.text(subtitleLines, 120, 100 + (titleLines.length * 15));

        // Metadata on the left side
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFontSize(10);
        this.doc.text(this.config.author || 'QA Engineer', 20, 250);
        this.doc.text(this.currentDate, 20, 260);
        if (this.config.projectName) {
            this.doc.text(this.config.projectName, 20, 270);
        }
    }

    async renderContent(captures: CaptureItem[]): Promise<void> {
        console.log(`[JapaneseTemplate:renderContent] Rendering ${captures.length} captures in 2-column Japanese Book format...`);
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);

        for (let idx = 0; idx < captures.length; idx += 4) {
            this.addPage();
            
            // Asymmetric background decorations
            this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
            this.doc.circle(210, 60, 12, 'F'); // Peeking from top right
            
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.circle(0, 240, 18, 'F'); // Peeking from bottom left

            // Left Column (Top & Bottom)
            if (idx < captures.length) {
                await this.renderColumnCapture(captures[idx], idx + 1, 15, 20);
            }
            if (idx + 1 < captures.length) {
                await this.renderColumnCapture(captures[idx + 1], idx + 2, 15, 155);
            }

            // Right Column (Top & Bottom)
            if (idx + 2 < captures.length) {
                await this.renderColumnCapture(captures[idx + 2], idx + 3, 115, 20);
            }
            if (idx + 3 < captures.length) {
                await this.renderColumnCapture(captures[idx + 3], idx + 4, 115, 155);
            }
        }
        console.log('[JapaneseTemplate:renderContent] Finished all Japanese Book pages.');
    }

    private async renderColumnCapture(capture: CaptureItem, stepNum: number, startX: number, startY: number) {
        console.log(`[JapaneseTemplate:renderColumnCapture] Step #${stepNum}: "${capture.title || 'Untitled'}" at (${startX},${startY})`);
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);
        const primaryRgb = this.hexToRgb(this.theme.primary);
        
        let currentY = startY;
        const colWidth = 80;

        // Bubble Step Indicator
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.circle(startX + 8, currentY + 4, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(stepNum.toString(), startX + 8, currentY + 4, { align: 'center', baseline: 'middle' });
        
        // Title (next to bubble)
        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFontSize(14);
        const titleLines = this.doc.splitTextToSize(capture.title || 'Untitled', colWidth - 20);
        this.doc.text(titleLines, startX + 20, currentY + 5);
        currentY += Math.max(titleLines.length * 6, 12) + 2;

        // Status Badge (Pill shape)
        const isSuccess = capture.status === 'success';
        const statusBg = isSuccess ? this.hexToRgb(this.theme.statusSuccess.bg) : this.hexToRgb(this.theme.statusFail.bg);
        const statusText = isSuccess ? this.hexToRgb(this.theme.statusSuccess.text) : this.hexToRgb(this.theme.statusFail.text);

        this.doc.setFillColor(statusBg.r, statusBg.g, statusBg.b);
        this.doc.roundedRect(startX, currentY, 20, 6, 3, 3, 'F');
        this.doc.setTextColor(statusText.r, statusText.g, statusText.b);
        this.doc.setFontSize(7);
        this.doc.text((capture.status || 'pending').toUpperCase(), startX + 2, currentY + 4.5);
        currentY += 10;

        // Image (Rounded Corners)
        const imgWidth = colWidth;
        const imgHeight = 55;

        const imgLoaded = await this.addImage(capture.thumbnail, startX, currentY, imgWidth, imgHeight);
        if (!imgLoaded) {
            this.doc.setFillColor(245, 245, 245);
            this.doc.roundedRect(startX, currentY, imgWidth, imgHeight, 5, 5, 'F');
            this.doc.setTextColor(150, 150, 150);
            this.doc.setFontSize(10);
            this.doc.text('No Image', startX + imgWidth / 2, currentY + imgHeight / 2, { align: 'center', baseline: 'middle' });
        } else {
            this.doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.setLineWidth(0.5);
            this.doc.roundedRect(startX, currentY, imgWidth, imgHeight, 5, 5, 'D');
        }
        currentY += imgHeight + 8;

        // Description
        if (capture.description) {
            this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'normal');
            const descLines = this.doc.splitTextToSize(capture.description, colWidth);
            this.doc.text(descLines, startX, currentY);
            currentY += descLines.length * 4;
        }
    }
}
