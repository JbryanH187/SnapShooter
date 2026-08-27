import { jsPDF, GState } from 'jspdf';
import { TemplateBase } from './templates';
import { ReportConfig } from './ReportThemes';
import { CaptureItem } from '../types';

export class DynamicTemplate extends TemplateBase {
    constructor(doc: jsPDF, config: ReportConfig) {
        super(doc, config);
    }

    async renderCover(): Promise<void> {
        // Blocks handle the cover content usually. 
        // If a header block is present, it acts as the cover header.
        return;
    }

    async renderContent(captures: CaptureItem[]): Promise<void> {
        const customTemplate = this.config.customTemplate as any;
        const pages = customTemplate?.pages || [];
        const flatBlocks = customTemplate?.blocks || [];

        console.log(`[DynamicTemplate:renderContent] START - pages: ${pages.length}, flatBlocks: ${flatBlocks.length}, captures: ${captures?.length || 0}`);

        // If template has pages, render page by page
        if (pages.length > 0) {
            for (let pIdx = 0; pIdx < pages.length; pIdx++) {
                const pageBlocks = pages[pIdx].blocks || [];
                console.log(`[DynamicTemplate:renderContent] Processing Page #${pIdx + 1} (${pages[pIdx].type || 'content'}) with ${pageBlocks.length} blocks`);
                if (pIdx > 0) {
                    await this.addPageWithBackground();
                } else {
                    await this.drawBackground();
                    await this.renderDecorations();
                }

                let yPos = 20;
                for (const block of pageBlocks) {
                    if (block.type !== 'page-break' && block.type !== 'footer' && yPos > this.doc.internal.pageSize.height - 30) {
                        console.log(`[DynamicTemplate:renderContent] Page overflow at yPos=${yPos.toFixed(1)}, auto-adding page`);
                        await this.addPageWithBackground();
                        yPos = 20;
                    }

                    const startY = yPos;
                    console.log(`[DynamicTemplate:renderContent] Rendering block "${block.type}" at yPos=${yPos.toFixed(1)}`);
                    try {
                        switch (block.type) {
                            case 'header':
                                yPos = await this.renderHeaderBlock(block, yPos);
                                break;
                            case 'footer':
                                yPos = await this.renderFooterBlock(block, yPos);
                                break;
                            case 'page-break':
                                await this.addPageWithBackground();
                                yPos = 20;
                                break;
                            case 'text':
                            case 'summary':
                            case 'conclusion':
                            case 'toc':
                                yPos = await this.renderTextBlock(block, yPos);
                                break;
                            case 'logo':
                                yPos = await this.renderLogoBlock(block, yPos);
                                break;
                            case 'table':
                                yPos = await this.renderTableBlock(block, yPos);
                                break;
                            case 'evidence':
                                yPos = await this.renderCaptureLoop(captures, block, yPos);
                                break;
                            case 'grid':
                                yPos = await this.renderGridBlock(block, yPos);
                                break;
                            default:
                                console.warn(`[DynamicTemplate:renderContent] Unknown block type: "${block.type}"`);
                        }
                    } catch (blockErr) {
                        console.error(`[DynamicTemplate:renderContent] Error rendering block "${block.type}":`, blockErr);
                    }

                    if (block.settings?.showBorder && block.type !== 'page-break') {
                        const accentColor = this.config.customTemplate?.settings?.accentColor || '#3b82f6';
                        const globalBorderWidthPx = this.config.customTemplate?.settings?.blockBorderWidth ?? this.config.customTemplate?.settings?.globalBorderWidth ?? 1;
                        const borderWidthMm = globalBorderWidthPx * 0.264;

                        const rgb = this.hexToRgb(accentColor);
                        this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
                        this.doc.setLineWidth(borderWidthMm);
                        this.doc.rect(15, startY - 2, 180, (yPos - startY) + 4);
                    }

                    if (block.type !== 'page-break') {
                        yPos += 5;
                    }
                }
            }
            console.log('[DynamicTemplate:renderContent] Finished rendering all pages.');
            return;
        }

        // Fallback for flat blocks
        let yPos = 20;
        await this.drawBackground();
        await this.renderDecorations();

        for (const block of flatBlocks) {
            if (block.type !== 'page-break' && block.type !== 'footer' && yPos > this.doc.internal.pageSize.height - 30) {
                await this.addPageWithBackground();
                yPos = 20;
            }

            const startY = yPos;
            switch (block.type) {
                case 'header':
                    yPos = await this.renderHeaderBlock(block, yPos);
                    break;
                case 'footer':
                    yPos = await this.renderFooterBlock(block, yPos);
                    break;
                case 'page-break':
                    await this.addPageWithBackground();
                    yPos = 20;
                    break;
                case 'text':
                case 'summary':
                case 'conclusion':
                case 'toc':
                    yPos = await this.renderTextBlock(block, yPos);
                    break;
                case 'logo':
                    yPos = await this.renderLogoBlock(block, yPos);
                    break;
                case 'table':
                    yPos = await this.renderTableBlock(block, yPos);
                    break;
                case 'evidence':
                    yPos = await this.renderCaptureLoop(captures, block, yPos);
                    break;
                case 'grid':
                    yPos = await this.renderGridBlock(block, yPos);
                    break;
            }

            if (block.settings?.showBorder && block.type !== 'page-break') {
                const accentColor = this.config.customTemplate?.settings?.accentColor || '#3b82f6';
                const globalBorderWidthPx = this.config.customTemplate?.settings?.blockBorderWidth ?? this.config.customTemplate?.settings?.globalBorderWidth ?? 1;
                const borderWidthMm = globalBorderWidthPx * 0.264;

                const rgb = this.hexToRgb(accentColor);
                this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
                this.doc.setLineWidth(borderWidthMm);
                this.doc.rect(15, startY - 2, 180, (yPos - startY) + 4);
            }

            if (block.type !== 'page-break') {
                yPos += 5;
            }
        }
    }

    private async addPageWithBackground(): Promise<void> {
        this.doc.addPage();
        await this.drawBackground();
        await this.renderDecorations();
    }

    private async drawBackground(): Promise<void> {
        const bg = this.config.customTemplate?.background;
        if (!bg || bg.pattern === 'none') return;

        const { pattern, color, opacity } = bg;
        const width = this.doc.internal.pageSize.width;
        const height = this.doc.internal.pageSize.height;

        // Set opacity using GState
        try {
            if (opacity < 1) {
                const gState = new GState({ opacity });
                this.doc.setGState(gState);
            }
        } catch (e) {
            console.warn("GState not supported or failed", e);
        }

        const rgb = this.hexToRgb(color);
        this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        this.doc.setFillColor(rgb.r, rgb.g, rgb.b);

        if (pattern === 'circles') {
            const spacing = 20;
            for (let x = 0; x < width; x += spacing) {
                for (let y = 0; y < height; y += spacing) {
                    this.doc.circle(x, y, 1, 'F');
                }
            }
        } else if (pattern === 'grid-dots') {
            const spacing = 10;
            for (let x = 0; x < width; x += spacing) {
                for (let y = 0; y < height; y += spacing) {
                    this.doc.circle(x, y, 0.5, 'F');
                }
            }
        } else if (pattern === 'waves') {
            const spacing = 10;
            this.doc.setLineWidth(0.5);
            for (let y = 0; y < height; y += spacing) {
                // Simple sine wave approximation with bezier curves
                // Just straight lines for now or simple zig zag as waves are hard to draw manually
                // Let's do a simple diagonal stripe pattern instead of complex waves for robustness, or simple sine
                let startX = 0;
                while (startX < width) {
                    this.doc.line(startX, y, startX + 5, y + 2);
                    this.doc.line(startX + 5, y + 2, startX + 10, y);
                    startX += 10;
                }
            }
        } else if (pattern === 'hexagons') {
            // Draw simple hexagons
            const size = 5;
            const dx = size * Math.sqrt(3);
            const dy = size * 1.5;

            for (let y = 0; y < height + dy; y += dy) {
                for (let x = 0; x < width + dx; x += dx) {
                    const xOffset = (Math.floor(y / dy) % 2) * (dx / 2);
                    this.drawHexagon(x + xOffset, y, size);
                }
            }
        }

        // Reset opacity
        try {
            this.doc.setGState(new GState({ opacity: 1 }));
        } catch (e) { }
    }

    private async renderDecorations(): Promise<void> {
        const decorations = this.config.customTemplate?.decorations || [];
        const settings = this.config.customTemplate?.settings;
        const accentColor = settings?.accentColor || '#3b82f6';
        const globalOpacity = settings?.globalDecorationOpacity ?? 1;

        const decorationBorderWidthPx = settings?.decorationBorderWidth ?? settings?.globalBorderWidth ?? 0;

        // Convert screen px to PDF mm (approx 0.264)
        const borderWidthMm = decorationBorderWidthPx * 0.264;

        for (const deco of decorations) {
            // Set opacity using GState
            const opacity = deco.opacity !== undefined ? deco.opacity : globalOpacity;
            try {
                this.doc.setGState(new GState({ opacity: opacity }));
            } catch (e) { }

            const colorToUse = deco.color || accentColor;
            const rgb = this.hexToRgb(colorToUse);
            this.doc.setFillColor(rgb.r, rgb.g, rgb.b);

            // For borders
            if (borderWidthMm > 0) {
                // If the user wants specific border colors, we might need a setting. 
                // For now assuming same color or label-primary (dark) like in UI?
                // UI used 'var(--label-primary)' (blackish) or transparent? 
                // SortableBlock used accentColor for border.
                // DraggableDecoration used var(--label-primary) for border color of square/circle?
                // Wait, DraggableDecoration used: borderColor: 'var(--label-primary)' for shapes.
                // Let's use black or dark grey for shape borders in PDF to match label-primary.
                this.doc.setDrawColor(50, 50, 50); // Dark grey
                this.doc.setLineWidth(borderWidthMm);
            } else {
                this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
            }

            const style = borderWidthMm > 0 ? 'FD' : 'F'; // Fill and stroke, or just Fill

            if (deco.type === 'circle') {
                // Determine radius from width/height (approx)
                const r = Math.min(deco.width, deco.height) / 2;
                this.doc.circle(deco.x + r, deco.y + r, r, style);
            } else if (deco.type === 'square') {
                this.doc.rect(deco.x, deco.y, deco.width, deco.height, style);
            } else if (deco.type === 'triangle') {
                this.doc.triangle(
                    deco.x + deco.width / 2, deco.y,
                    deco.x + deco.width, deco.y + deco.height,
                    deco.x, deco.y + deco.height,
                    style
                );
            } else if (deco.type === 'wave_decoration') {
                // Simple wave line placeholder
                this.doc.setLineWidth(Math.max(1, borderWidthMm));
                this.doc.setDrawColor(rgb.r, rgb.g, rgb.b); // Waves are usually the color itself
                this.doc.line(deco.x, deco.y + deco.height / 2, deco.x + deco.width, deco.y + deco.height / 2);
            }

            // Reset opacity
            try {
                this.doc.setGState(new GState({ opacity: 1 }));
            } catch (e) { }
        }
    }

    private drawHexagon(x: number, y: number, size: number) {
        const angle = Math.PI / 3;
        const points: { x: number, y: number }[] = [];
        for (let i = 0; i < 6; i++) {
            points.push({
                x: x + size * Math.cos(i * angle),
                y: y + size * Math.sin(i * angle)
            });
        }

        for (let i = 0; i < 6; i++) {
            this.doc.line(points[i].x, points[i].y, points[(i + 1) % 6].x, points[(i + 1) % 6].y);
        }
    }

    private async renderHeaderBlock(block: any, y: number): Promise<number> {
        const { content, settings } = block;
        const { title, logo, showDate } = content;
        const variant = settings?.variant || 'classic';

        let currentY = y;

        if (variant === 'modern') {
            // Modern: Colored background bar
            this.doc.setFillColor(this.theme.primary); // Use theme color
            this.doc.rect(0, 0, 210, 40, 'F');
            this.doc.setTextColor(255, 255, 255);
            currentY = 15;
        } else {
            this.doc.setTextColor(this.theme.primary);
        }

        // Logo Processing
        if (logo) {
            try {
                const logoW = 30;
                const logoH = 15;
                const loaded = await this.addImage(logo, 20, currentY, logoW, logoH);
                if (loaded && variant !== 'modern') currentY += logoH + 5;
            } catch (e) {
                console.error("Failed to render header logo", e);
            }
        }

        // Title
        this.doc.setFontSize(24);
        if (variant === 'modern') {
            this.doc.text(title || '', 60, 25); // Offset text
            currentY = 50; // Reset Y below header
            this.doc.setTextColor(0, 0, 0); // Reset text color
        } else {
            this.doc.text(title || '', 20, currentY);
            currentY += 10;
        }

        // Date
        if (showDate) {
            this.doc.setFontSize(10);
            this.doc.setTextColor(this.theme.textLight);
            const dateSource = this.config.reportDate
                ? new Date(this.config.reportDate + 'T12:00:00')
                : new Date();
            const dateStr = dateSource.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            if (variant === 'modern') {
                this.doc.setTextColor(255, 255, 255);
                this.doc.text(dateStr, 180, 25, { align: 'right' });
                this.doc.setTextColor(0, 0, 0);
            } else {
                this.doc.text(dateStr, 20, currentY);
                currentY += 10;
            }
        }

        return currentY;
    }

    private async renderFooterBlock(block: any, y: number): Promise<number> {
        const { text } = block.content;
        this.doc.setDrawColor(this.theme.border);
        this.doc.line(20, y, 190, y);

        this.doc.setFontSize(9);
        this.doc.setTextColor(this.theme.textLight);
        this.doc.text(text || '', 105, y + 5, { align: 'center' });

        return y + 15;
    }

    private async renderLogoBlock(block: any, y: number): Promise<number> {
        const { image, width = 150, alignment = 'left' } = block.content || {};

        if (!image) return y;

        try {
            const renderWidth = Math.min((width / 500) * 170, 170);
            const renderHeight = (renderWidth / 16) * 9;
            let x = 20;

            if (alignment === 'center') {
                x = (210 - renderWidth) / 2;
            } else if (alignment === 'right') {
                x = 190 - renderWidth;
            }

            await this.addImage(image, x, y, renderWidth, renderHeight);
            return y + renderHeight + 5;
        } catch (e) {
            console.error("Logo block render error", e);
        }
        return y;
    }

    private async renderTableBlock(block: any, y: number): Promise<number> {
        const { rows = 3, cols = 3 } = block.content || {};
        const cellWidth = 170 / cols;
        const cellHeight = 10;

        this.doc.setDrawColor(this.theme.border);
        this.doc.setFillColor(255, 255, 255);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.doc.rect(20 + (j * cellWidth), y + (i * cellHeight), cellWidth, cellHeight);
            }
        }

        return y + (rows * cellHeight) + 5;
    }

    private async renderTextBlock(block: any, y: number): Promise<number> {
        const { text } = block.content || {};

        if (block.type === 'summary') {
            this.doc.setFontSize(14);
            this.doc.setFont("helvetica", "bold");
            this.doc.setTextColor(this.theme.primary);
            this.doc.text("Executive Summary", 20, y);
            y += 7;
            this.doc.setFont("helvetica", "normal");
        } else if (block.type === 'conclusion') {
            this.doc.setFontSize(14);
            this.doc.setFont("helvetica", "bold");
            this.doc.setTextColor(this.theme.primary);
            this.doc.text("Conclusion", 20, y);
            y += 7;
            this.doc.setFont("helvetica", "normal");
        } else if (block.type === 'toc') {
            this.doc.setFontSize(14);
            this.doc.setFont("helvetica", "bold");
            this.doc.text("Table of Contents", 20, y);
            y += 10;
            this.doc.setFontSize(10);
            this.doc.setFont("helvetica", "normal");
            this.doc.text("1. Executive Summary ................................. 1", 20, y);
            y += 6;
            this.doc.text("2. Evidence Detail ........................................ 2", 20, y);
            y += 6;
            this.doc.text("3. Conclusion ................................................. 5", 20, y);
            return y + 10;
        }

        this.doc.setFontSize(11);
        this.doc.setTextColor(this.theme.textMain);

        const splitText = this.doc.splitTextToSize(text || '', 170);
        this.doc.text(splitText, 20, y);

        return y + (splitText.length * 5);
    }

    private async renderGridBlock(block: any, y: number): Promise<number> {
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.theme.textLight);
        this.doc.text("[Image Grid Placeholder]", 20, y);
        this.doc.rect(20, y + 2, 80, 80);
        this.doc.line(60, y + 2, 60, y + 82);
        this.doc.line(20, y + 42, 100, y + 42);
        return y + 90;
    }

    private async renderCaptureLoop(captures: CaptureItem[], block: any, startY: number): Promise<number> {
        const { content } = block;
        const layout = content?.layout || 'split-right';
        let currentY = startY;

        const effectiveCaptures = captures.length > 0 ? captures : [
            {
                id: 'sample-1',
                title: 'Ejemplo de Captura de Evidencia',
                description: 'Descripción de prueba para previsualizar el bloque de evidencias en la plantilla.',
                thumbnail: '',
                status: 'success',
                timestamp: Date.now()
            } as CaptureItem
        ];

        for (const [index, capture] of effectiveCaptures.entries()) {
            if (currentY > this.doc.internal.pageSize.height - 60) {
                await this.addPageWithBackground();
                currentY = 20;
            }

            // Title
            this.doc.setFontSize(14);
            this.doc.setFont("helvetica", "bold");
            this.doc.setTextColor(this.theme.primary);
            this.doc.text(`${index + 1}. ${capture.title || 'Evidencia'}`, 20, currentY);
            currentY += 7;

            // Status Badge
            if (capture.status) {
                const isSuccess = capture.status === 'success';
                this.doc.setFillColor(isSuccess ? '#dcfce7' : '#fee2e2');
                this.doc.roundedRect(20, currentY - 4, 20, 6, 2, 2, 'F');
                this.doc.setFontSize(8);
                this.doc.setTextColor(isSuccess ? '#166534' : '#991b1b');
                this.doc.text(capture.status.toUpperCase(), 22, currentY);
                currentY += 8;
            }

            this.doc.setFont("helvetica", "normal");

            if (layout === 'top-bottom') {
                const maxWidth = 130;
                const maxHeight = 70;
                const loaded = await this.addImage(capture.thumbnail, 40, currentY, maxWidth, maxHeight);
                if (!loaded) {
                    this.doc.setFillColor(245, 245, 245);
                    this.doc.roundedRect(40, currentY, maxWidth, maxHeight, 2, 2, 'F');
                    this.doc.setTextColor(150, 150, 150);
                    this.doc.setFontSize(10);
                    this.doc.text('[Captura de Evidencia]', 40 + maxWidth / 2, currentY + maxHeight / 2, { align: 'center' });
                }
                currentY += maxHeight + 5;

                if (capture.description) {
                    this.doc.setFontSize(10);
                    this.doc.setTextColor(this.theme.textMain);
                    const desc = this.doc.splitTextToSize(capture.description, 170);
                    this.doc.text(desc, 20, currentY);
                    currentY += (desc.length * 5);
                }

            } else if (layout === 'split-left') {
                const w = 80;
                const h = 45;
                const loaded = await this.addImage(capture.thumbnail, 20, currentY, w, h);
                if (!loaded) {
                    this.doc.setFillColor(245, 245, 245);
                    this.doc.roundedRect(20, currentY, w, h, 2, 2, 'F');
                    this.doc.setTextColor(150, 150, 150);
                    this.doc.setFontSize(9);
                    this.doc.text('[Captura]', 20 + w / 2, currentY + h / 2, { align: 'center' });
                }

                if (capture.description) {
                    this.doc.setFontSize(10);
                    this.doc.setTextColor(this.theme.textMain);
                    const desc = this.doc.splitTextToSize(capture.description, 85);
                    this.doc.text(desc, 105, currentY + 5);
                }
                currentY += Math.max(h, 20) + 5;

            } else { // split-right
                const w = 80;
                const h = 45;
                let descHeight = 0;
                if (capture.description) {
                    this.doc.setFontSize(10);
                    this.doc.setTextColor(this.theme.textMain);
                    const desc = this.doc.splitTextToSize(capture.description, 80);
                    this.doc.text(desc, 20, currentY + 5);
                    descHeight = desc.length * 5;
                }

                const loaded = await this.addImage(capture.thumbnail, 110, currentY, w, h);
                if (!loaded) {
                    this.doc.setFillColor(245, 245, 245);
                    this.doc.roundedRect(110, currentY, w, h, 2, 2, 'F');
                    this.doc.setTextColor(150, 150, 150);
                    this.doc.setFontSize(9);
                    this.doc.text('[Captura]', 110 + w / 2, currentY + h / 2, { align: 'center' });
                }
                currentY += Math.max(h, descHeight) + 5;
            }

            currentY += 10;
        }
        return currentY;
    }
}

