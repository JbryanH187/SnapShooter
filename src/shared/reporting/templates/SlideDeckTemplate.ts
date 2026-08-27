import { jsPDF } from 'jspdf';
import { TemplateBase } from './TemplateBase';
import { CaptureItem } from '../../types';
import { ReportConfig } from '../ReportThemes';

/**
 * SlideDeckTemplate (Executive Presentation PDF)
 * Clean, modern, Bubble-inspired slide deck format with balanced image margins,
 * dual-capture comparison slides, and executive metadata cards.
 */
export class SlideDeckTemplate extends TemplateBase {
    constructor(doc: jsPDF, config: ReportConfig) {
        super(doc, config);
    }

    private getStatusColors(status?: string): { bg: { r: number; g: number; b: number }; text: { r: number; g: number; b: number }; label: string } {
        const s = (status || 'pending').toLowerCase();
        if (s === 'success' || s === 'passed') {
            return {
                bg: { r: 220, g: 252, b: 231 },   // #dcfce7
                text: { r: 21, g: 128, b: 61 },    // #15803d
                label: 'SUCCESS'
            };
        } else if (s === 'failed' || s === 'fail' || s === 'error') {
            return {
                bg: { r: 254, g: 226, b: 226 },   // #fee2e2
                text: { r: 185, g: 28, b: 28 },    // #b91c1c
                label: 'FAILED'
            };
        } else if (s === 'warning' || s === 'warn') {
            return {
                bg: { r: 254, g: 243, b: 199 },   // #fef3c7
                text: { r: 180, g: 83, b: 9 },     // #b45309
                label: 'WARNING'
            };
        }
        return {
            bg: { r: 241, g: 245, b: 249 },       // #f1f5f9
            text: { r: 100, g: 116, b: 139 },     // #64748b
            label: 'PENDING'
        };
    }

    private drawStatusPill(status: string | undefined, x: number, y: number, width = 24, height = 7): void {
        const colors = this.getStatusColors(status);
        this.doc.setFillColor(colors.bg.r, colors.bg.g, colors.bg.b);
        this.doc.roundedRect(x, y, width, height, 2, 2, 'F');
        this.doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        this.doc.setFontSize(7.5);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(colors.label, x + width / 2, y + height / 2 + 1, { align: 'center' });
    }

    /**
     * Draw random decorative Bubble accents in background behind content
     */
    private drawDecorativeBubbles(seed: number): void {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);
        const w = this.pageWidth;
        const h = this.pageHeight;

        // Deterministic pseudo-random number generator
        const pseudoRandom = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
        };

        const bubbleCount = 8 + Math.floor(pseudoRandom(seed * 2.3 + 1.1) * 6); // 8 to 13 bubbles

        for (let b = 0; b < bubbleCount; b++) {
            const rSeed = seed * 17.13 + b * 11.41;
            const radius = 10 + pseudoRandom(rSeed) * 38; // 10mm to 48mm radius
            const isPrimary = b % 2 === 0;

            const baseColor = isPrimary ? primaryRgb : secondaryRgb;
            // Soft pastel blending for subtle background depth
            const r = Math.min(255, Math.round(baseColor.r + (255 - baseColor.r) * 0.76));
            const g = Math.min(255, Math.round(baseColor.g + (255 - baseColor.g) * 0.76));
            const blue = Math.min(255, Math.round(baseColor.b + (255 - baseColor.b) * 0.76));

            // Distribute around corners, edges and background
            let cx = 0;
            let cy = 0;
            const edgeChoice = Math.floor(pseudoRandom(rSeed + 1.7) * 4);
            if (edgeChoice === 0) { // Top edge
                cx = pseudoRandom(rSeed + 2.3) * w;
                cy = pseudoRandom(rSeed + 3.1) * 40 - 10;
            } else if (edgeChoice === 1) { // Bottom edge
                cx = pseudoRandom(rSeed + 2.3) * w;
                cy = h - pseudoRandom(rSeed + 3.1) * 40 + 10;
            } else if (edgeChoice === 2) { // Right edge
                cx = w - pseudoRandom(rSeed + 2.3) * 45 + 10;
                cy = pseudoRandom(rSeed + 3.1) * h;
            } else { // Left edge
                cx = pseudoRandom(rSeed + 2.3) * 45 - 10;
                cy = pseudoRandom(rSeed + 3.1) * h;
            }

            this.doc.setFillColor(r, g, blue);
            this.doc.circle(cx, cy, radius, 'F');
        }
    }

    async renderCover(): Promise<void> {
        console.log('[SlideDeckTemplate:renderCover] Rendering executive Bubble-inspired cover...');
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const secondaryRgb = this.hexToRgb(this.theme.secondary);
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);

        const w = this.pageWidth; // ~338.67 mm
        const h = this.pageHeight; // ~190.5 mm

        // 1. Background with subtle modern tint
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(0, 0, w, h, 'F');

        // 2. Soft decorative Bubble accents in background
        this.drawDecorativeBubbles(0);

        // Light overlay card over the canvas for depth
        this.doc.setFillColor(255, 255, 255);
        this.doc.setDrawColor(230, 235, 245);
        this.doc.roundedRect(18, 16, w - 36, h - 32, 6, 6, 'FD');

        // 3. Header Section (Logo + Category Badges)
        let headerLeftX = 36;
        if (this.config.showLogoSymbol && this.config.customLogoSymbol) {
            console.log('[SlideDeckTemplate:renderCover] Adding logo symbol...');
            const logoAdded = await this.addImage(this.config.customLogoSymbol, 36, 30, 28, 28);
            if (logoAdded) headerLeftX = 72;
        }

        // Category Tag Pill
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.roundedRect(headerLeftX, 36, 68, 8, 3, 3, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(8.5);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text((this.config.subtitle || 'PRESENTACIÓN DE EVIDENCIAS').toUpperCase(), headerLeftX + 34, 41.5, { align: 'center' });

        // Project Name Tag
        if (this.config.projectName) {
            const projX = headerLeftX + 74;
            this.doc.setFillColor(241, 245, 249);
            this.doc.setDrawColor(226, 232, 240);
            this.doc.roundedRect(projX, 36, 56, 8, 3, 3, 'FD');
            this.doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.setFontSize(8.5);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(this.config.projectName.toUpperCase(), projX + 28, 41.5, { align: 'center' });
        }

        // 4. Main Title
        const titleColor = this.hexToRgb(this.config.titleColor || this.theme.primary);
        this.doc.setTextColor(titleColor.r, titleColor.g, titleColor.b);
        this.doc.setFontSize(32);
        this.doc.setFont('helvetica', 'bold');
        const titleLines = this.doc.splitTextToSize(this.config.title || 'Reporte de Evidencia', w - 100);
        this.doc.text(titleLines, 36, 68);

        // Decorative subtle divider line
        const dividerY = 68 + (titleLines.length * 10) + 4;
        this.doc.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        this.doc.setLineWidth(1.2);
        this.doc.line(36, dividerY, 140, dividerY);

        // 5. Executive Metadata Cards (3-Card Clean Grid)
        const cardY = Math.max(108, dividerY + 14);
        const cardW = (w - 72 - 24) / 3; // 3 equal columns with gaps
        const cardH = 34;

        // Card 1: Autor
        const c1X = 36;
        this.doc.setFillColor(248, 250, 252);
        this.doc.setDrawColor(226, 232, 240);
        this.doc.roundedRect(c1X, cardY, cardW, cardH, 4, 4, 'FD');
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('PRESENTADOR / AUTOR', c1X + 12, cardY + 12);
        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.config.author || 'QA Engineer', c1X + 12, cardY + 24);

        // Card 2: Fecha de Emisión
        const c2X = c1X + cardW + 12;
        this.doc.setFillColor(248, 250, 252);
        this.doc.setDrawColor(226, 232, 240);
        this.doc.roundedRect(c2X, cardY, cardW, cardH, 4, 4, 'FD');
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('FECHA DE EMISIÓN', c2X + 12, cardY + 12);
        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(this.currentDate, c2X + 12, cardY + 24);

        // Card 3: Formato / Proyecto
        const c3X = c2X + cardW + 12;
        this.doc.setFillColor(248, 250, 252);
        this.doc.setDrawColor(226, 232, 240);
        this.doc.roundedRect(c3X, cardY, cardW, cardH, 4, 4, 'FD');
        this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('TIPO DE INFORME', c3X + 12, cardY + 12);
        this.doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.setFontSize(11);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Presentación Ejecutiva', c3X + 12, cardY + 24);
    }

    async renderContent(captures: CaptureItem[]): Promise<void> {
        console.log(`[SlideDeckTemplate:renderContent] Rendering ${captures.length} slides...`);
        const layoutMode = this.config.slideLayout || 'hero';

        if (layoutMode === 'dual') {
            await this.renderDualContent(captures);
        } else {
            await this.renderHeroContent(captures);
        }
        console.log('[SlideDeckTemplate:renderContent] Finished all slides.');
    }

    /**
     * Hero Mode: 1 high-resolution, proportional capture per slide with generous margins
     */
    private async renderHeroContent(captures: CaptureItem[]): Promise<void> {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);
        const w = this.pageWidth;
        const h = this.pageHeight;
        const totalSlides = captures.length;

        for (let i = 0; i < captures.length; i++) {
            this.addPage();
            const capture = captures[i];

            // 1. Clean Canvas Background with Decorative Bubbles
            this.doc.setFillColor(248, 250, 252);
            this.doc.rect(0, 0, w, h, 'F');
            this.drawDecorativeBubbles(i + 1);

            // 2. Top Header Navigation Bar
            this.doc.setFillColor(255, 255, 255);
            this.doc.setDrawColor(226, 232, 240);
            this.doc.roundedRect(16, 10, w - 32, 16, 4, 4, 'FD');

            // Slide Number Badge
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.roundedRect(22, 13, 24, 10, 2, 2, 'F');
            this.doc.setTextColor(255, 255, 255);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(`SLIDE ${i + 1}`, 34, 19.5, { align: 'center' });

            // Slide Title
            this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            this.doc.setFontSize(12);
            this.doc.setFont('helvetica', 'bold');
            const titleText = capture.title || `Evidencia #${i + 1}`;
            this.doc.text(titleText, 52, 20.5);

            // Status Pill
            if (capture.status && capture.status !== 'pending') {
                this.drawStatusPill(capture.status, w - 82, 14.5, 26, 7);
            }

            // Timestamp
            this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            this.doc.setFontSize(8.5);
            this.doc.setFont('helvetica', 'normal');
            const timeStr = new Date(capture.timestamp || Date.now()).toLocaleTimeString('es-ES');
            this.doc.text(timeStr, w - 50, 20);

            // 3. Proportional Card Viewport (Hero Card)
            const cardX = 24;
            const cardY = 30;
            const cardW = w - 48; // ~290 mm
            const hasDescription = Boolean(capture.description && capture.description.trim().length > 0);
            const cardH = hasDescription ? 122 : 142; // mm

            // Rounded Card Container
            this.doc.setFillColor(255, 255, 255);
            this.doc.setDrawColor(226, 232, 240);
            this.doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'FD');

            // Image Viewport inside card (with 6mm padding for breathing room)
            const imgPadding = 6;
            const imgW = cardW - (imgPadding * 2);
            const imgH = cardH - (imgPadding * 2);
            const imgLoaded = await this.addImage(capture.thumbnail, cardX + imgPadding, cardY + imgPadding, imgW, imgH);
            if (!imgLoaded) {
                this.doc.setTextColor(160, 160, 160);
                this.doc.setFontSize(11);
                this.doc.setFont('helvetica', 'normal');
                this.doc.text('[Captura no disponible]', cardX + cardW / 2, cardY + cardH / 2, { align: 'center' });
            }

            // 4. Description Pill (if present)
            if (hasDescription) {
                const descY = cardY + cardH + 4;
                const descH = 16;
                this.doc.setFillColor(255, 255, 255);
                this.doc.setDrawColor(226, 232, 240);
                this.doc.roundedRect(cardX, descY, cardW, descH, 3, 3, 'FD');

                // Accent dot
                this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
                this.doc.circle(cardX + 6, descY + 8, 2, 'F');

                this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
                this.doc.setFontSize(8.5);
                this.doc.setFont('helvetica', 'normal');
                const descLines = this.doc.splitTextToSize(capture.description || '', cardW - 20);
                this.doc.text(descLines.slice(0, 2), cardX + 12, descY + 7);
            }

            // 5. Slide Footer
            this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(`${this.config.title || 'Reporte de Evidencias'} • ${this.config.projectName || 'SnapProof QA'}`, 24, h - 5);
            this.doc.text(`Diapositiva ${i + 1} de ${totalSlides}`, w - 48, h - 5);
        }
    }

    /**
     * Dual Mode: 2 symmetrical side-by-side cards per slide for direct flow comparisons
     */
    private async renderDualContent(captures: CaptureItem[]): Promise<void> {
        const primaryRgb = this.hexToRgb(this.theme.primary);
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const textLightRgb = this.hexToRgb(this.theme.textLight);
        const w = this.pageWidth;
        const h = this.pageHeight;
        const totalSlides = Math.ceil(captures.length / 2);

        let slideCount = 0;
        for (let i = 0; i < captures.length; i += 2) {
            slideCount++;
            this.addPage();
            const capA = captures[i];
            const capB = captures[i + 1]; // May be undefined if odd total

            // 1. Clean Canvas Background with Decorative Bubbles
            this.doc.setFillColor(248, 250, 252);
            this.doc.rect(0, 0, w, h, 'F');
            this.drawDecorativeBubbles(slideCount);

            // 2. Top Header Navigation Bar
            this.doc.setFillColor(255, 255, 255);
            this.doc.setDrawColor(226, 232, 240);
            this.doc.roundedRect(16, 10, w - 32, 16, 4, 4, 'FD');

            // Header Title
            this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            this.doc.roundedRect(22, 13, 26, 10, 2, 2, 'F');
            this.doc.setTextColor(255, 255, 255);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(`SLIDE ${slideCount}`, 35, 19.5, { align: 'center' });

            this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            this.doc.setFontSize(12);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(this.config.title || 'Comparativa de Evidencias', 54, 20.5);

            this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            this.doc.setFontSize(8.5);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(this.config.projectName || 'SnapProof QA', w - 50, 20);

            // If capB exists: render 2 side-by-side cards
            if (capB) {
                const cardGap = 12;
                const marginX = 16;
                const cardW = (w - (marginX * 2) - cardGap) / 2; // ~147 mm
                const cardY = 30;
                const cardH = 144;

                // Left Card (Capture A)
                await this.renderDualCard(capA, i + 1, marginX, cardY, cardW, cardH);

                // Right Card (Capture B)
                await this.renderDualCard(capB, i + 2, marginX + cardW + cardGap, cardY, cardW, cardH);
            } else {
                // Odd last capture: Center as a single hero card
                const cardW = 220;
                const cardX = (w - cardW) / 2;
                const cardY = 30;
                const cardH = 144;
                await this.renderDualCard(capA, i + 1, cardX, cardY, cardW, cardH);
            }

            // Slide Footer
            this.doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(`${this.config.title || 'Reporte de Evidencias'} • ${this.config.projectName || 'SnapProof QA'}`, 16, h - 5);
            this.doc.text(`Diapositiva ${slideCount} de ${totalSlides}`, w - 48, h - 5);
        }
    }

    private async renderDualCard(capture: CaptureItem, index: number, x: number, y: number, w: number, h: number): Promise<void> {
        const textMainRgb = this.hexToRgb(this.theme.textMain);
        const primaryRgb = this.hexToRgb(this.theme.primary);

        // Card Container
        this.doc.setFillColor(255, 255, 255);
        this.doc.setDrawColor(226, 232, 240);
        this.doc.roundedRect(x, y, w, h, 4, 4, 'FD');

        // Card Subheader: Index Badge + Title + Status
        this.doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        this.doc.roundedRect(x + 6, y + 6, 12, 6, 1.5, 1.5, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(7);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`#${index}`, x + 12, y + 10.5, { align: 'center' });

        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFontSize(9.5);
        this.doc.setFont('helvetica', 'bold');
        const titleText = capture.title || `Captura #${index}`;
        const truncatedTitle = titleText.length > 28 ? titleText.slice(0, 26) + '...' : titleText;
        this.doc.text(truncatedTitle, x + 22, y + 10.5);

        if (capture.status && capture.status !== 'pending') {
            this.drawStatusPill(capture.status, x + w - 28, y + 5.5, 22, 6);
        }

        // Image Canvas Area
        const imgPadding = 6;
        const imgX = x + imgPadding;
        const imgY = y + 15;
        const imgW = w - (imgPadding * 2);
        const imgH = h - 38; // 15 header + 23 description

        this.doc.setFillColor(248, 250, 252);
        this.doc.setDrawColor(235, 240, 248);
        this.doc.roundedRect(imgX, imgY, imgW, imgH, 3, 3, 'FD');

        await this.addImage(capture.thumbnail, imgX + 2, imgY + 2, imgW - 4, imgH - 4);

        // Description at bottom of card
        const descY = imgY + imgH + 3;
        const descH = 16;
        this.doc.setFillColor(248, 250, 252);
        this.doc.setDrawColor(235, 240, 248);
        this.doc.roundedRect(imgX, descY, imgW, descH, 2, 2, 'FD');

        this.doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
        this.doc.setFontSize(7.5);
        this.doc.setFont('helvetica', 'normal');
        const desc = capture.description && capture.description.trim().length > 0
            ? capture.description
            : 'Sin descripción adicional.';
        const descLines = this.doc.splitTextToSize(desc, imgW - 8);
        this.doc.text(descLines.slice(0, 2), imgX + 4, descY + 6);
    }
}
