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
        const blocks = this.config.customTemplate?.blocks || [];
        let yPos = 20;

        // Draw background on the first page
        await this.drawBackground();
        await this.renderDecorations();

        for (const block of blocks) {
            // Auto-page break check (except for page-break block and footer which handles itself)
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

            // Draw Border if enabled
            // @ts-ignore
            if (block.settings?.showBorder && block.type !== 'page-break') {
                const accentColor = this.config.customTemplate?.settings?.accentColor || '#3b82f6';
                const globalBorderWidthPx = this.config.customTemplate?.settings?.blockBorderWidth ?? this.config.customTemplate?.settings?.globalBorderWidth ?? 1;
                const borderWidthMm = globalBorderWidthPx * 0.264;

                const rgb = this.hexToRgb(accentColor);
                this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
                this.doc.setLineWidth(borderWidthMm);
                // Draw rect around the block content (approximate with padding)
                // content width typically 170 (20 margin left)
                this.doc.rect(15, startY - 2, 180, (yPos - startY) + 4);
            }

            // Add spacing between blocks (unless page break)
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
                // In modern variant, maybe logo in white box or just overlay? 
                // Keeping simple for now
                this.doc.addImage(logo, 'PNG', 20, currentY, logoW, logoH, undefined, 'FAST');
                if (variant !== 'modern') currentY += logoH + 5;
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
            const dateStr = new Date().toLocaleDateString();
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
        // Check if we are near bottom, if so, just put it there. 
        // Or if 'footer' block means "Insert Footer Here"
        // Let's draw a separator line
        this.doc.setDrawColor(this.theme.border);
        this.doc.line(20, y, 190, y);

        this.doc.setFontSize(9);
        this.doc.setTextColor(this.theme.textLight);
        this.doc.text(text || '', 105, y + 5, { align: 'center' });

        return y + 15;
    }

    private async renderLogoBlock(block: any, y: number): Promise<number> {
        const { image, width = 150, alignment = 'left' } = block.content;

        if (!image) return y;

        try {
            const imgProps = await this.processImage(image);
            if (imgProps) {
                // Determine X based on alignment
                let x = 20;
                const availableWidth = 170;
                // Convert screen width mapping to PDF mm roughly (builder uses pixels, PDF uses mm)
                // Let's assume 'width' from builder is relative to max 500px -> 170mm
                const renderWidth = Math.min((width / 500) * 170, 170);
                const renderHeight = (renderWidth / imgProps.width) * imgProps.height;

                if (alignment === 'center') {
                    x = (210 - renderWidth) / 2;
                } else if (alignment === 'right') {
                    x = 190 - renderWidth;
                }

                this.doc.addImage(imgProps.data, imgProps.format, x, y, renderWidth, renderHeight, undefined, 'FAST');
                return y + renderHeight + 5;
            }
        } catch (e) {
            console.error("Logo block render error", e);
        }
        return y;
    }

    private async renderTableBlock(block: any, y: number): Promise<number> {
        const { rows = 3, cols = 3 } = block.content;
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
        const { text } = block.content;

        // Handle different types (Summary/Conclusion/TOC) with slight styling nuances
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
            // Mock TOC items
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
        // Draw a dummy grid
        this.doc.rect(20, y + 2, 80, 80);
        this.doc.line(60, y + 2, 60, y + 82);
        this.doc.line(20, y + 42, 100, y + 42);
        return y + 90;
    }

    private async renderCaptureLoop(captures: CaptureItem[], block: any, startY: number): Promise<number> {
        const { content } = block;
        const layout = content.layout || 'split-right';
        let currentY = startY;

        for (const [index, capture] of captures.entries()) {
            if (currentY > this.doc.internal.pageSize.height - 60) {
                await this.addPageWithBackground();
                currentY = 20;
            }

            // Title
            this.doc.setFontSize(14);
            this.doc.setFont("helvetica", "bold");
            this.doc.setTextColor(this.theme.primary);
            this.doc.text(`${index + 1}. ${capture.title}`, 20, currentY);
            currentY += 7;

            // Status Badge (Mock)
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

            try {
                const imgProps = await this.processImage(capture.thumbnail);

                if (imgProps) {
                    if (layout === 'top-bottom') {
                        // Full width image
                        const maxWidth = 130;
                        const w = maxWidth;
                        const h = (w / imgProps.width) * imgProps.height;
                        this.doc.addImage(imgProps.data, imgProps.format, 40, currentY, w, h, undefined, 'FAST');
                        currentY += h + 5;

                        // Description below
                        if (capture.description) {
                            this.doc.setFontSize(10);
                            this.doc.setTextColor(this.theme.textMain);
                            const desc = this.doc.splitTextToSize(capture.description, 170);
                            this.doc.text(desc, 20, currentY);
                            currentY += (desc.length * 5);
                        }

                    } else if (layout === 'split-left') {
                        // Image Left, Text Right
                        const w = 80;
                        const h = (w / imgProps.width) * imgProps.height;
                        this.doc.addImage(imgProps.data, imgProps.format, 20, currentY, w, h, undefined, 'FAST');

                        // Description Right
                        if (capture.description) {
                            this.doc.setFontSize(10);
                            this.doc.setTextColor(this.theme.textMain);
                            const desc = this.doc.splitTextToSize(capture.description, 85);
                            this.doc.text(desc, 105, currentY + 5);
                        }
                        currentY += Math.max(h, 20) + 5;

                    } else { // split-right (Default)
                        const w = 80;
                        const h = (w / imgProps.width) * imgProps.height;

                        // Description Left
                        let descHeight = 0;
                        if (capture.description) {
                            this.doc.setFontSize(10);
                            this.doc.setTextColor(this.theme.textMain);
                            const desc = this.doc.splitTextToSize(capture.description, 80);
                            this.doc.text(desc, 20, currentY + 5);
                            descHeight = desc.length * 5;
                        }

                        // Image Right
                        this.doc.addImage(imgProps.data, imgProps.format, 110, currentY, w, h, undefined, 'FAST');
                        currentY += Math.max(h, descHeight) + 5;
                    }

                } else {
                    // No image, just text
                    if (capture.description) {
                        this.doc.setFontSize(10);
                        const desc = this.doc.splitTextToSize(capture.description, 170);
                        this.doc.text(desc, 20, currentY);
                        currentY += (desc.length * 5);
                    }
                }
            } catch (e) {
                console.error("Image render error", e);
            }

            currentY += 10;
        }
        return currentY;
    }

    private async processImage(src: string): Promise<{ data: any, width: number, height: number, format: string } | null> {
        if (!src) return null;
        try {
            if (src.startsWith('data:')) {
                const format = src.includes('png') ? 'PNG' : 'JPEG';
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ data: src, width: img.width, height: img.height, format });
                    img.onerror = () => resolve(null);
                    img.src = src;
                });
            }
            return null;
        } catch {
            return null;
        }
    }
}
