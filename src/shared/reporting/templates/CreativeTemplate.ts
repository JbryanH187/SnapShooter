import { jsPDF } from 'jspdf';
import { TemplateBase } from './TemplateBase';
import { CaptureItem } from '../../types';
import { ReportConfig } from '../ReportThemes';

/**
 * Creative Bold Template
 * Eye-catching layout with large hero images, gradient accents, and bold typography
 */
export class CreativeTemplate extends TemplateBase {
    constructor(doc: jsPDF, config: ReportConfig) {
        super(doc, config);
    }

    async renderCover(): Promise<void> {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);

        // Full page background gradient effect (simulated with rectangles)
        for (let i = 0; i < 10; i++) {
            const alpha = 0.1 - i * 0.01;
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.rect(0, i * 30, 210, 30, 'F');
        }

        // Diagonal accent stripe
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.triangle(0, 180, 210, 120, 210, 180, 'F');

        // Large centered title
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(48);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.config.title, 105, 100, { align: 'center' });

        // Subtitle with accent background
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        const subtitleWidth = this.doc.getTextWidth(this.config.subtitle) + 20;
        this.doc.roundedRect(105 - subtitleWidth / 2, 115, subtitleWidth, 12, 3, 3, 'F');

        this.doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.config.subtitle, 105, 124, { align: 'center' });

        // Bottom info card
        this.doc.setFillColor(255, 255, 255);
        this.doc.roundedRect(30, 220, 150, 50, 5, 5, 'F');

        const textMainRgb = this.hexToRgb(this.theme.textMain);
        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.config.author, 105, 238, { align: 'center' });

        const textLightRgb = this.hexToRgb(this.theme.textLight);
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(this.currentDate, 105, 250, { align: 'center' });

        if (this.config.projectName) {
            this.doc.text(`Proyecto: ${this.config.projectName}`, 105, 262, { align: 'center' });
        }
    }

    async renderContent(captures: CaptureItem[]): Promise<void> {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);

        for (let idx = 0; idx < captures.length; idx++) {
            const capture = captures[idx];
            this.addPage();

            // Top accent bar
            this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
            this.doc.rect(0, 0, this.pageWidth, 5, 'F');

            // Large step number
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.circle(30, 30, 15, 'F');
            this.doc.setTextColor(255, 255, 255);
            this.doc.setFontSize(20);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text((idx + 1).toString(), 30, 35, { align: 'center' });

            // Title next to number
            this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            this.doc.setFontSize(24);
            this.doc.text(capture.title || 'Untitled', 55, 35);

            // Status badge
            const isSuccess = capture.status === 'success';
            const statusBg = isSuccess ? this.hexToRgb(this.theme.statusSuccess.bg) : this.hexToRgb(this.theme.statusFail.bg);
            const statusText = isSuccess ? this.hexToRgb(this.theme.statusSuccess.text) : this.hexToRgb(this.theme.statusFail.text);

            this.doc.setFillColor(statusBg.r, statusBg.g, statusBg.b);
            this.doc.roundedRect(55, 40, 25, 8, 2, 2, 'F');
            this.doc.setTextColor(statusText.r, statusText.g, statusText.b);
            this.doc.setFontSize(8);
            this.doc.text((capture.status || 'pending').toUpperCase(), 57, 46);

            // Large hero image
            const imgWidth = 170;
            const imgHeight = 120;
            const imgX = 20;
            const imgY = 60;

            const imgLoaded = await this.addImage(capture.thumbnail, imgX, imgY, imgWidth, imgHeight);
            if (!imgLoaded) {
                this.doc.setFillColor(240, 240, 240);
                this.doc.setDrawColor(200, 200, 200);
                this.doc.roundedRect(imgX, imgY, imgWidth, imgHeight, 5, 5, 'FD');
                this.doc.setTextColor(150, 150, 150);
                this.doc.setFontSize(14);
                this.doc.text('[Imagen no disponible]', imgX + imgWidth / 2, imgY + imgHeight / 2, { align: 'center' });
            }

            // Description below image
            if (capture.description) {
                this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
                this.doc.setFontSize(12);
                this.doc.setFont('helvetica', 'normal');
                const descLines = this.doc.splitTextToSize(capture.description, 170);
                this.doc.text(descLines, 20, imgY + imgHeight + 15);
            }

            // Metadata footer
            if (capture.metadata) {
                this.doc.setFontSize(8);
                this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
                this.doc.text(
                    `OS: ${capture.metadata.os} | Resolución: ${capture.metadata.resolution}`,
                    20,
                    this.pageHeight - 20
                );
            }
        }
    }
}
