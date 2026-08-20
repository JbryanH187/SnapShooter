import { jsPDF } from 'jspdf';
import { TemplateBase } from './TemplateBase';
import { CaptureItem } from '../../types';
import { ReportConfig } from '../ReportThemes';

/**
 * Bubble Template
 * Playful and modern layout with circular elements and soft edges.
 */
export class BubbleTemplate extends TemplateBase {
    constructor(doc: jsPDF, config: ReportConfig) {
        super(doc, config);
    }

    async renderCover(): Promise<void> {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);

        // Decoraciones de burbujas en la portada
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.circle(0, 0, 60, 'F'); // Top left
        
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.circle(210, 297, 80, 'F'); // Bottom right

        // Burbujas secundarias pequeñas
        this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.circle(180, 40, 15, 'F');
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.circle(40, 250, 25, 'F');

        // Textos de la portada centrados
        this.doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.setFontSize(40);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.config.title, 105, 120, { align: 'center' });

        this.doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(this.config.subtitle, 105, 140, { align: 'center' });

        const textLightRgb = this.hexToRgb(this.theme.textLight);
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFontSize(12);
        
        this.doc.text(`Autor: ${this.config.author}`, 105, 180, { align: 'center' });
        this.doc.text(`Fecha: ${this.currentDate}`, 105, 190, { align: 'center' });
        
        if (this.config.projectName) {
            this.doc.text(`Proyecto: ${this.config.projectName}`, 105, 200, { align: 'center' });
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

            // Burbujas decorativas laterales en cada página
            this.doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
            this.doc.circle(0, 150, 20, 'F'); // Left middle bubble
            
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.circle(210, 50, 15, 'F'); // Right top bubble

            // Número del paso en una burbuja
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.circle(25, 25, 12, 'F');
            this.doc.setTextColor(255, 255, 255);
            this.doc.setFontSize(16);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text((idx + 1).toString(), 25, 25, { align: 'center', baseline: 'middle' });

            // Título
            this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            this.doc.setFontSize(20);
            this.doc.text(capture.title || 'Untitled', 45, 31);

            // Status badge con bordes MUY redondeados
            const isSuccess = capture.status === 'success';
            const statusBg = isSuccess ? this.hexToRgb(this.theme.statusSuccess.bg) : this.hexToRgb(this.theme.statusFail.bg);
            const statusText = isSuccess ? this.hexToRgb(this.theme.statusSuccess.text) : this.hexToRgb(this.theme.statusFail.text);

            this.doc.setFillColor(statusBg.r, statusBg.g, statusBg.b);
            this.doc.roundedRect(45, 38, 25, 8, 4, 4, 'F'); // 4 radio = pill shape
            this.doc.setTextColor(statusText.r, statusText.g, statusText.b);
            this.doc.setFontSize(8);
            this.doc.text((capture.status || 'pending').toUpperCase(), 47, 44);

            // Imagen con bordes redondeados
            const imgWidth = 160;
            const imgHeight = 110;
            const imgX = 25;
            const imgY = 60;

            const imgLoaded = await this.addImage(capture.thumbnail, imgX, imgY, imgWidth, imgHeight);
            if (!imgLoaded) {
                this.doc.setFillColor(240, 240, 240);
                this.doc.setDrawColor(200, 200, 200);
                this.doc.roundedRect(imgX, imgY, imgWidth, imgHeight, 8, 8, 'FD');
                this.doc.setTextColor(150, 150, 150);
                this.doc.setFontSize(14);
                this.doc.text('[Imagen no disponible]', imgX + imgWidth / 2, imgY + imgHeight / 2, { align: 'center' });
            } else {
                // Agregar un marco redondeado a la imagen para mantener la estética de burbuja
                this.doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
                this.doc.setLineWidth(1);
                this.doc.roundedRect(imgX, imgY, imgWidth, imgHeight, 8, 8, 'D');
            }

            // Descripción debajo de la imagen
            if (capture.description) {
                this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
                this.doc.setFontSize(11);
                this.doc.setFont('helvetica', 'normal');
                const descLines = this.doc.splitTextToSize(capture.description, 160);
                this.doc.text(descLines, 25, imgY + imgHeight + 15);
            }
        }
    }
}
