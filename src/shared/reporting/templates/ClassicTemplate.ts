import { jsPDF } from 'jspdf';
import { TemplateBase } from './TemplateBase';
import { CaptureItem } from '../../types';
import { ReportConfig } from '../ReportThemes';

/**
 * Classic Corporate Template (Layout A)
 * Clean professional layout with centered title, accent bars, and info table
 */
export class ClassicTemplate extends TemplateBase {
    constructor(doc: jsPDF, config: ReportConfig) {
        super(doc, config);
    }

    async renderCover(): Promise<void> {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);

        // Top accent bar
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.rect(0, 0, 210, 3, 'F');

        // Logo handling
        let logoXPos = 20;
        if (this.config.showLogoSymbol && this.config.customLogoSymbol) {
            const success = await this.addImage(this.config.customLogoSymbol, logoXPos, 12, 15, 15);
            if (success) logoXPos += 18;
        }
        if (this.config.showLogoText && this.config.customLogoText) {
            await this.addImage(this.config.customLogoText, logoXPos, 12, 40, 15);
        }

        // Title
        const titleColor = this.hexToRgb(this.config.titleColor || this.theme.primary);
        this.doc.setFontSize(36);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        this.doc.text(this.config.title, 105, 100, { align: 'center' });

        // Accent line
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.rect(93, 110, 24, 2, 'F');

        // Subtitle
        const subtitleColor = this.hexToRgb(this.config.subtitleColor || this.theme.textLight);
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(subtitleColor.r, subtitleColor.g, subtitleColor.b);
        this.doc.text(this.config.subtitle, 105, 125, { align: 'center' });

        // Info Table
        const tableY = 150;
        this.doc.setFontSize(10);
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.rect(60, tableY, 90, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('INFORMACIÓN DEL DOCUMENTO', 105, tableY + 5, { align: 'center' });

        const bgLightRgb = this.hexToRgb(this.theme.bgLight);
        this.doc.setFillColor(bgLightRgb.r, bgLightRgb.g, bgLightRgb.b);
        this.doc.rect(60, tableY + 8, 90, 30, 'F');

        const textLightRgb = this.hexToRgb(this.theme.textLight);
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text('Autor:', 65, tableY + 15);
        this.doc.text('Fecha:', 65, tableY + 23);
        this.doc.text('Proyecto:', 65, tableY + 31);

        const textMainRgb = this.hexToRgb(this.theme.textMain);
        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.config.author, 145, tableY + 15, { align: 'right' });
        this.doc.text(this.currentDate, 145, tableY + 23, { align: 'right' });
        this.doc.text(this.config.projectName || '', 145, tableY + 31, { align: 'right' });

        // Footer
        this.doc.setFontSize(8);
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.text(`Generado por: ${this.config.author}`, 105, 280, { align: 'center' });
    }

    async renderContent(captures: CaptureItem[]): Promise<void> {
        this.addPage();

        const primaryRgb = this.hexToRgb(this.theme.primary);
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);
        const margin = 20;

        // Header line
        this.doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.setLineWidth(1);
        this.doc.line(20, 20, 190, 20);

        this.doc.setFontSize(10);
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.text(this.config.subtitle, 20, 17);
        this.doc.text(this.currentDate, 190, 17, { align: 'right' });

        let yPos = 35;

        for (let idx = 0; idx < captures.length; idx++) {
            const capture = captures[idx];

            if (yPos > this.pageHeight - 80) {
                this.addPage();
                yPos = 35;
            }

            // Step number circle
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.circle(margin + 4, yPos, 4, 'F');
            this.doc.setTextColor(255, 255, 255);
            this.doc.setFontSize(10);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text((idx + 1).toString(), margin + 4, yPos + 1, { align: 'center' });

            // Title
            this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            this.doc.setFontSize(14);
            this.doc.text(capture.title || 'Untitled', margin + 12, yPos);

            // Status badge
            const statusRgb = capture.status === 'success'
                ? this.hexToRgb(this.theme.statusSuccess.bg)
                : this.hexToRgb(this.theme.statusFail.bg);
            const statusTextRgb = capture.status === 'success'
                ? this.hexToRgb(this.theme.statusSuccess.text)
                : this.hexToRgb(this.theme.statusFail.text);

            this.doc.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
            this.doc.roundedRect(margin + 12, yPos + 3, 20, 5, 1, 1, 'F');
            this.doc.setTextColor(statusTextRgb.r, statusTextRgb.g, statusTextRgb.b);
            this.doc.setFontSize(8);
            this.doc.text((capture.status || 'pending').toUpperCase(), margin + 14, yPos + 6.5);

            yPos += 12;

            // Description
            if (capture.description) {
                this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
                this.doc.setFontSize(10);
                this.doc.setFont('helvetica', 'normal');
                const descLines = this.doc.splitTextToSize(capture.description, 150);
                this.doc.text(descLines, margin + 12, yPos);
                yPos += descLines.length * 5 + 5;
            }

            // Image
            const imgWidth = 150;
            const imgHeight = 80;

            if (yPos + imgHeight > this.pageHeight - 20) {
                this.addPage();
                yPos = 35;
            }

            const imgLoaded = await this.addImage(capture.thumbnail, margin + 12, yPos, imgWidth, imgHeight);
            if (!imgLoaded) {
                // Placeholder
                this.doc.setDrawColor(200, 200, 200);
                this.doc.setFillColor(245, 245, 245);
                this.doc.rect(margin + 12, yPos, imgWidth, imgHeight, 'FD');
                this.doc.setTextColor(150, 150, 150);
                this.doc.setFontSize(12);
                this.doc.text('[Imagen no disponible]', margin + 12 + imgWidth / 2, yPos + imgHeight / 2, { align: 'center' });
            }

            yPos += imgHeight + 15;
        }
    }
}
