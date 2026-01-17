import { jsPDF } from 'jspdf';
import { TemplateBase } from './TemplateBase';
import { CaptureItem } from '../../types';
import { ReportConfig } from '../ReportThemes';

/**
 * Modern Sidebar Template (Layout B)
 * Contemporary design with a bold sidebar and large typography
 */
export class ModernTemplate extends TemplateBase {
    constructor(doc: jsPDF, config: ReportConfig) {
        super(doc, config);
    }

    async renderCover(): Promise<void> {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);

        // Sidebar
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.rect(0, 0, 70, 297, 'F');

        // Logo in sidebar
        if (this.config.showLogoSymbol && this.config.customLogoSymbol) {
            await this.addImage(this.config.customLogoSymbol, 10, 12, 20, 20);
        }

        // Sidebar accent line
        this.doc.setFillColor(255, 255, 255);
        this.doc.rect(10, 35, 12, 1, 'F');

        // Subtitle in sidebar
        const subtitleColor = this.hexToRgb(this.config.subtitleColor || '#ffffff');
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(subtitleColor.r, subtitleColor.g, subtitleColor.b);
        this.doc.text(this.config.subtitle, 10, 50);

        // Project name in sidebar
        if (this.config.projectName) {
            this.doc.setFontSize(10);
            this.doc.setTextColor(255, 255, 255);
            this.doc.text(`PROYECTO: ${this.config.projectName.toUpperCase()}`, 10, 60);
        }

        // Author info in sidebar (bottom)
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(9);
        this.doc.text('AUTOR', 10, 250);
        this.doc.setFontSize(10);
        this.doc.text(this.config.author, 10, 257);
        this.doc.text('FECHA', 10, 267);
        this.doc.text(this.currentDate, 10, 274);

        // Main content area - Large Title
        const titleColor = this.hexToRgb(this.config.titleColor || this.theme.textMain);
        this.doc.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        this.doc.setFontSize(42);
        this.doc.setFont('helvetica', 'bold');

        const titleWords = this.config.title.split(' ');
        let yPos = 100;
        titleWords.forEach(word => {
            this.doc.text(word, 90, yPos);
            yPos += 15;
        });

        // Accent vertical line
        this.doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.setLineWidth(2);
        this.doc.line(90, yPos + 5, 90, yPos + 30);

        // Description text
        const textLightRgb = this.hexToRgb(this.theme.textLight);
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        const descText = this.doc.splitTextToSize('Reporte técnico de aseguramiento de calidad y pruebas unitarias.', 110);
        this.doc.text(descText, 95, yPos + 15);
    }

    async renderContent(captures: CaptureItem[]): Promise<void> {
        this.addPage();

        const primaryRgb = this.hexToRgb(this.theme.primary);
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);

        // Thin sidebar on content pages
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.rect(0, 0, 8, this.pageHeight, 'F');

        let yPos = 30;
        const margin = 20;

        for (let idx = 0; idx < captures.length; idx++) {
            const capture = captures[idx];

            if (yPos > this.pageHeight - 100) {
                this.addPage();
                this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
                this.doc.rect(0, 0, 8, this.pageHeight, 'F');
                yPos = 30;
            }

            // Step indicator with accent color
            this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
            this.doc.roundedRect(margin, yPos - 5, 30, 8, 2, 2, 'F');
            this.doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(`PASO ${idx + 1}`, margin + 2, yPos);

            // Title
            this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            this.doc.setFontSize(16);
            this.doc.text(capture.title || 'Untitled', margin, yPos + 12);

            yPos += 20;

            // Description
            if (capture.description) {
                this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
                this.doc.setFontSize(10);
                this.doc.setFont('helvetica', 'normal');
                const descLines = this.doc.splitTextToSize(capture.description, 170);
                this.doc.text(descLines, margin, yPos);
                yPos += descLines.length * 5 + 5;
            }

            // Image - full width
            const imgWidth = 170;
            const imgHeight = 90;

            if (yPos + imgHeight > this.pageHeight - 20) {
                this.addPage();
                this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
                this.doc.rect(0, 0, 8, this.pageHeight, 'F');
                yPos = 30;
            }

            const imgLoaded = await this.addImage(capture.thumbnail, margin, yPos, imgWidth, imgHeight);
            if (!imgLoaded) {
                this.doc.setDrawColor(200, 200, 200);
                this.doc.setFillColor(250, 250, 250);
                this.doc.rect(margin, yPos, imgWidth, imgHeight, 'FD');
                this.doc.setTextColor(150, 150, 150);
                this.doc.setFontSize(12);
                this.doc.text('[Imagen no disponible]', margin + imgWidth / 2, yPos + imgHeight / 2, { align: 'center' });
            }

            yPos += imgHeight + 20;
        }
    }
}
