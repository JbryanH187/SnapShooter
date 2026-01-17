import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { CaptureItem } from '../../renderer/stores/captureStore';
import { REPORT_THEMES, ReportConfig, ColorPalette } from './ReportThemes';

// Default logos SVG as base64 (simplified - you can replace with actual base64)
const DEFAULT_LOGO_SYMBOL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTIiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCA5MiAxOSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNS4wMDY2IDE0LjAwMjJDNy43NzE2NCAxNC4wMDIyIDEwLjAxMzIgMTEuODQ5MiAxMC4wMTMyIDkuMTkzMjFDMTAuMDEzMiA2LjUzNzI0IDcuNzcxNjQgNC4zODQxNiA1LjAwNjYgNC4zODQxNkMyLjI0MTUzIDQuMzg0MTYgMCA2LjUzNzI0IDAgOS4xOTMyMUMwIDExLjg0OTIgMi4yNDE1MyAxNC4wMDIyIDUuMDA2NiAxNC4wMDIyWiIgZmlsbD0iI0YwRDIyNCIvPjwvc3ZnPg==';
const DEFAULT_LOGO_TEXT = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQxIiBoZWlnaHQ9IjIxIiB2aWV3Qm94PSIwIDAgMjQxIDIxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik03LjIwMDEyIDE0LjhMNC4xMjAxMiA5LjM1OTk5SDIuODAwMTJWMTQuOEgwLjAwMDExNzMwMlYwLjgzOTk4OEg1LjI0MDEyQzYuMzIwMTIgMC44Mzk5ODggNy4yNDAxMiAxLjAzMzMyIDguMDAwMTIgMS40MTk5OSIgZmlsbD0iIzA4MTc1NCIvPjwvc3ZnPg==';

export class ReportGenerator {
    static async generate(
        captures: CaptureItem[],
        authorName?: string,
        format: 'docx' | 'pdf' = 'docx',
        config?: Partial<ReportConfig>
    ): Promise<Blob | void> {
        if (captures.length === 0) return;

        const fullConfig: ReportConfig = {
            layout: config?.layout || 'A',
            theme: config?.theme || 'default',
            title: config?.title || 'REPORTE DE EVIDENCIA',
            subtitle: config?.subtitle || 'PRUEBAS UNITARIAS',
            author: config?.author || authorName || 'QA Engineer',
            showLogoSymbol: config?.showLogoSymbol ?? true,
            showLogoText: config?.showLogoText ?? true,
            customLogoSymbol: config?.customLogoSymbol || null,
            customLogoText: config?.customLogoText || null,
            logoAlignment: config?.logoAlignment || 'split',
            logoGap: config?.logoGap || 'medium'
        };

        if (format === 'pdf') {
            return await this.generatePDF(captures, fullConfig, true);
        } else {
            return await this.generateDOCX(captures, fullConfig, true);
        }
    }

    // PDF Generation with Premium Design
    static async generatePDF(captures: CaptureItem[], config: ReportConfig, returnBlob = false): Promise<Blob | void> {
        const doc = new jsPDF();
        const theme = REPORT_THEMES[config.theme];
        const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

        // Helper to convert hex to RGB
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        };

        if (config.layout === 'A') {
            // LAYOUT A: Corporate Classic Cover
            const primaryRgb = hexToRgb(theme.primary);
            const secondaryRgb = hexToRgb(theme.secondary);

            // Top accent bar
            doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
            doc.rect(0, 0, 210, 3, 'F');

            // Load and add logos
            let logoXPos = 20;

            // Logo Symbol
            if (config.showLogoSymbol && config.customLogoSymbol) {
                try {
                    const logoImg = new Image();
                    logoImg.crossOrigin = 'anonymous';
                    await new Promise<void>((resolve) => {
                        logoImg.onload = () => {
                            try {
                                doc.addImage(logoImg, 'PNG', logoXPos, 12, 15, 15);
                                resolve();
                            } catch (error) {
                                console.error('Error adding logo symbol:', error);
                                resolve(); // Skip logo, continue report
                            }
                        };
                        logoImg.onerror = () => {
                            console.warn('Failed to load logo symbol, skipping');
                            resolve();
                        };
                        logoImg.src = config.customLogoSymbol!;
                    });
                    logoXPos += 18;
                } catch (error) {
                    console.warn('Logo symbol unavailable, continuing without it');
                }
            }

            // Logo Text
            if (config.showLogoText && config.customLogoText) {
                try {
                    const logoTextImg = new Image();
                    logoTextImg.crossOrigin = 'anonymous';
                    await new Promise<void>((resolve) => {
                        logoTextImg.onload = () => {
                            try {
                                doc.addImage(logoTextImg, 'PNG', logoXPos, 12, 40, 15);
                                resolve();
                            } catch (error) {
                                console.error('Error adding logo text:', error);
                                // Silently skip logo, continue with report
                                resolve();
                            }
                        };
                        logoTextImg.onerror = () => {
                            console.warn('Failed to load logo text, skipping');
                            resolve(); // Don't fail the entire report
                        };
                        logoTextImg.src = config.customLogoText!;
                    });
                    logoXPos += 43;
                } catch (error) {
                    console.warn('Logo text unavailable, continuing without it');
                }
            }

            // Title
            doc.setFontSize(36);
            doc.setFont('helvetica', 'bold');
            const titleColor = hexToRgb(config.titleColor || theme.primary);
            const subtitleColor = hexToRgb(config.subtitleColor || theme.textLight);
            const projectNameColor = hexToRgb(theme.textLight);
            doc.setTextColor(titleColor.r, titleColor.g, titleColor.b);
            doc.text(config.title, 105, 100, { align: 'center' });

            // Accent line
            doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
            doc.rect(93, 110, 24, 2, 'F');

            // Subtitle
            doc.setFontSize(18);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(subtitleColor.r, subtitleColor.g, subtitleColor.b);
            doc.text(config.subtitle, 105, 125, { align: 'center' });

            // Common text light color for other text
            const textLightRgb = hexToRgb(theme.textLight);

            // Info Table
            doc.setFontSize(10);
            const tableY = 150;
            doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            doc.rect(60, tableY, 90, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('INFORMACIÓN DEL DOCUMENTO', 105, tableY + 5, { align: 'center' });

            const bgLightRgb = hexToRgb(theme.bgLight);
            doc.setFillColor(bgLightRgb.r, bgLightRgb.g, bgLightRgb.b);
            doc.rect(60, tableY + 8, 90, 30, 'F');

            doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            doc.setFont('helvetica', 'normal');
            doc.text('Autor:', 65, tableY + 15);
            doc.text('Fecha:', 65, tableY + 23);
            doc.text('Proyecto:', 65, tableY + 31);

            const textMainRgb = hexToRgb(theme.textMain);
            doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            doc.setFont('helvetica', 'bold');
            doc.text(config.author, 145, tableY + 15, { align: 'right' });
            doc.text(currentDate, 145, tableY + 23, { align: 'right' });
            doc.text(config.projectName || '', 145, tableY + 31, { align: 'right' }); // Use projectName if available

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            doc.text(`Generado por: ${config.author}`, 105, 280, { align: 'center' });

        } else {
            // LAYOUT B: Modern Sidebar Cover
            const primaryRgb = hexToRgb(theme.primary);
            const secondaryRgb = hexToRgb(theme.secondary);

            // Sidebar
            doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            doc.rect(0, 0, 70, 297, 'F');

            // Load and add logo in sidebar
            if (config.showLogoSymbol && config.customLogoSymbol) {
                try {
                    const logoImg = new Image();
                    logoImg.crossOrigin = 'anonymous';
                    await new Promise<void>((resolve, reject) => {
                        logoImg.onload = () => {
                            try {
                                // White logo in sidebar
                                doc.addImage(logoImg, 'PNG', 10, 12, 20, 20);
                                resolve();
                            } catch (error) {
                                console.error('Error adding logo in sidebar:', error);
                                reject(error);
                            }
                        };
                        logoImg.onerror = () => reject(new Error('Failed to load logo'));
                        logoImg.src = config.customLogoSymbol!;
                    });
                } catch (error) {
                    console.warn('Failed to load logo, skipping');
                }
            }

            // Sidebar accent
            doc.setFillColor(255, 255, 255);
            doc.rect(10, 30, 12, 1, 'F');

            // Title & Subtitle + Project Name
            const subtitleColor = hexToRgb(config.subtitleColor || '#ffffff');
            const projectNameColor = hexToRgb('#ffffff'); // Project name in sidebar is always white

            // Removed Title from sidebar as requested

            doc.setFontSize(14);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(subtitleColor.r, subtitleColor.g, subtitleColor.b);
            doc.text(config.subtitle, 10, 53); // Moved to X=10

            if (config.projectName) {
                doc.setFontSize(10);
                doc.setTextColor(projectNameColor.r, projectNameColor.g, projectNameColor.b);
                doc.text(`PROYECTO: ${config.projectName.toUpperCase()}`, 10, 60); // Moved to X=10
            }

            // Line
            const themeRgb = hexToRgb(theme.primary); // Assuming themeRgb is primary for the line
            doc.setDrawColor(themeRgb.r, themeRgb.g, themeRgb.b);
            doc.setLineWidth(1);
            doc.line(10, 65, 190, 65); // Adjusted start to 10

            let currentY = 75; // This variable seems to be unused in the provided snippet, keeping it as is.

            // Author info in sidebar
            doc.setFontSize(9);
            doc.text('AUTOR', 10, 250);
            doc.setFontSize(10);
            doc.text(config.author, 10, 257);
            doc.text('FECHA', 10, 267);
            doc.text(currentDate, 10, 274);

            // Main content area - Title
            const titleColorBHex = config.titleColor || theme.textMain;
            const titleRgbB = hexToRgb(titleColorBHex);
            doc.setTextColor(titleRgbB.r, titleRgbB.g, titleRgbB.b);
            doc.setFontSize(42);
            doc.setFont('helvetica', 'bold');

            const titleWords = config.title.split(' ');
            let yPos = 100;
            titleWords.forEach(word => {
                doc.text(word, 90, yPos);
                yPos += 15;
            });

            // Accent border
            const secondaryRgbCalc = hexToRgb(theme.secondary);
            doc.setDrawColor(secondaryRgbCalc.r, secondaryRgbCalc.g, secondaryRgbCalc.b);
            doc.setLineWidth(2);
            doc.line(90, yPos + 5, 90, yPos + 30);

            const textLightRgb = hexToRgb(theme.textLight);
            doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const descText = doc.splitTextToSize('Reporte técnico de aseguramiento de calidad y pruebas unitarias.', 110);
            doc.text(descText, 95, yPos + 15);
        }

        // Content Pages
        doc.addPage();
        await this.renderPDFContent(doc, captures, config, theme, currentDate);

        if (returnBlob) {
            return doc.output('blob');
        } else {
            doc.save(`Evidence_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
    }

    private static async renderPDFContent(doc: jsPDF, captures: CaptureItem[], config: ReportConfig, theme: ColorPalette, currentDate: string) {
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        };

        const primaryRgb = hexToRgb(theme.primary);
        const textMainRgb = hexToRgb(theme.textMain);
        const textLightRgb = hexToRgb(theme.textLight);

        // Header
        doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.setLineWidth(1);
        doc.line(20, 20, 190, 20);

        doc.setFontSize(10);
        doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
        doc.text(config.subtitle, 20, 17);
        doc.text(currentDate, 190, 17, { align: 'right' });

        let yPos = 35;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;

        for (let idx = 0; idx < captures.length; idx++) {
            const capture = captures[idx];
            if (yPos > pageHeight - 80) {
                doc.addPage();
                yPos = 35;
            }

            // Step number
            doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            doc.circle(margin + 4, yPos, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text((idx + 1).toString(), margin + 4, yPos + 1, { align: 'center' });

            // Title
            doc.setTextColor(textMainRgb.r, textMainRgb.g, textMainRgb.b);
            doc.setFontSize(14);
            doc.text(capture.title, margin + 12, yPos);

            // Status badge
            const statusRgb = capture.status === 'success' ? hexToRgb(theme.statusSuccess.bg) : hexToRgb(theme.statusFail.bg);
            const statusTextRgb = capture.status === 'success' ? hexToRgb(theme.statusSuccess.text) : hexToRgb(theme.statusFail.text);

            doc.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
            doc.roundedRect(margin + 12, yPos + 3, 20, 5, 1, 1, 'F');
            doc.setTextColor(statusTextRgb.r, statusTextRgb.g, statusTextRgb.b);
            doc.setFontSize(8);
            doc.text(capture.status.toUpperCase(), margin + 14, yPos + 6.5);

            yPos += 12;

            // Description
            if (capture.description) {
                doc.setTextColor(textLightRgb.r, textLightRgb.g, textLightRgb.b);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const descLines = doc.splitTextToSize(capture.description, 150);
                doc.text(descLines, margin + 12, yPos);
                yPos += descLines.length * 5 + 5;
            }

            // Metadata
            if (capture.metadata) {
                doc.setFontSize(8);
                doc.text(`OS: ${capture.metadata.os} | Res: ${capture.metadata.resolution}`, margin + 12, yPos);
                yPos += 8;
            }

            // Load and add real image
            const imgWidth = 150;
            const imgHeight = 80;

            if (yPos + imgHeight > pageHeight - 20) {
                doc.addPage();
                yPos = 35;
            }

            try {
                // Convert image to Base64 and add to PDF
                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise<void>((resolve, reject) => {
                    img.onload = () => {
                        try {
                            // Calculate aspect ratio
                            const aspectRatio = img.width / img.height;
                            let finalWidth = imgWidth;
                            let finalHeight = imgHeight;

                            if (aspectRatio > imgWidth / imgHeight) {
                                // Image is wider
                                finalHeight = imgWidth / aspectRatio;
                            } else {
                                // Image is taller
                                finalWidth = imgHeight * aspectRatio;
                            }

                            // Center the image
                            const xOffset = margin + 12 + (imgWidth - finalWidth) / 2;
                            const yOffset = yPos + (imgHeight - finalHeight) / 2;

                            // Add image to PDF
                            doc.addImage(
                                img,
                                'PNG',
                                xOffset,
                                yOffset,
                                finalWidth,
                                finalHeight
                            );
                            resolve();
                        } catch (error) {
                            console.error('Error adding image to PDF:', error);
                            reject(error);
                        }
                    };

                    img.onerror = () => {
                        console.error('Error loading image:', capture.thumbnail);
                        reject(new Error('Failed to load image'));
                    };

                    img.src = capture.thumbnail;
                });
            } catch (error) {
                // Fallback to placeholder if image fails to load
                console.warn('Failed to load image, using placeholder:', error);
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(245, 245, 245);
                doc.rect(margin + 12, yPos, imgWidth, imgHeight, 'FD');
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(12);
                doc.text('[Imagen no disponible]', margin + 12 + imgWidth / 2, yPos + imgHeight / 2, { align: 'center' });
            }

            yPos += imgHeight + 15;
        }
    }

    // DOCX Generation (simplified - similar structure)
    private static async generateDOCX(captures: CaptureItem[], config: ReportConfig, returnBlob = false): Promise<Blob | void> {
        const theme = REPORT_THEMES[config.theme];
        const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Cover Page
                    new Paragraph({
                        text: config.title,
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 3000, after: 300 }
                    }),
                    new Paragraph({
                        text: config.subtitle,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 2000 }
                    }),
                    // Info Table
                    new Table({
                        width: { size: 80, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Autor:", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph(config.author)] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Fecha:", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph(currentDate)] }),
                                ],
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    // Content sections
                    ...await this.createCaptureSections(captures, theme)
                ],
            }],
        });

        if (returnBlob) {
            return await Packer.toBlob(doc);
        } else {
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Reporte_SnapProof_${config.author.replace(/\s+/g, '_')
                }.docx`);
        }
    }


    private static async createCaptureSections(captures: CaptureItem[], theme: ColorPalette): Promise<Paragraph[]> {
        const paragraphs: Paragraph[] = [];

        for (const [index, capture] of captures.entries()) {
            paragraphs.push(new Paragraph({
                text: `${index + 1}. ${capture.title || 'Untitled Capture'} `,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }));

            if (capture.status && capture.status !== 'pending') {
                const color = capture.status === 'success' ? "22c55e" : "ef4444";
                paragraphs.push(new Paragraph({
                    children: [
                        new TextRun({ text: `[${capture.status.toUpperCase()}]`, bold: true, color: color }),
                    ],
                    spacing: { after: 100 }
                }));
            }

            if (capture.description) {
                paragraphs.push(new Paragraph({
                    children: [
                        new TextRun({ text: "Descripción: ", bold: true }),
                        new TextRun(capture.description)
                    ],
                    spacing: { after: 200 }
                }));
            }

            // Image handling (existing logic)
            try {
                let imageBuffer: ArrayBuffer;
                if (capture.thumbnail.startsWith('data:')) {
                    const base64Data = capture.thumbnail.split(',')[1];
                    const binaryString = atob(base64Data);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    imageBuffer = bytes.buffer;
                } else if (capture.thumbnail.startsWith('media://')) {
                    if ((window as any).electron?.readImage) {
                        const buffer = await (window as any).electron.readImage(capture.thumbnail);
                        const bytes = buffer.buffer ? new Uint8Array(buffer.buffer) : new Uint8Array(buffer);
                        let binary = '';
                        const len = bytes.byteLength;
                        for (let i = 0; i < len; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const base64 = btoa(binary);
                        const binaryString = atob(base64);
                        const len2 = binaryString.length;
                        const bytes2 = new Uint8Array(len2);
                        for (let i = 0; i < len2; i++) {
                            bytes2[i] = binaryString.charCodeAt(i);
                        }
                        imageBuffer = bytes2.buffer;
                    } else {
                        throw new Error("Read Image capability missing");
                    }
                } else {
                    const response = await fetch(capture.thumbnail);
                    imageBuffer = await response.arrayBuffer();
                }

                paragraphs.push(new Paragraph({
                    children: [new ImageRun({ data: imageBuffer, transformation: { width: 500, height: 300 }, type: "png" })],
                    spacing: { after: 400 }
                }));
            } catch (e) {
                console.error("Failed to add image", e);
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: "[Image Error]", color: "FF0000" })]
                }));
            }

            paragraphs.push(new Paragraph({
                text: "",
                border: { bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { after: 400 }
            }));
        }

        return paragraphs;
    }
}
