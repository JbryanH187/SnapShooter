import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { CaptureItem } from '../types';
import { REPORT_THEMES, ReportConfig, ColorPalette } from './ReportThemes';
import { ClassicTemplate, ModernTemplate, BubbleTemplate, JapaneseTemplate, TemplateBase } from './templates';
import { DynamicTemplate } from './DynamicTemplate';

/**
 * Compress an image to reduce export file size.
 * Re-renders to a canvas at max 1280x960, exports as JPEG at 82% quality.
 * Preserves aspect ratio. Falls back to original src if canvas fails.
 */
async function compressImageForExport(
    src: string,
    maxW = 1280,
    maxH = 960,
    quality = 0.82
): Promise<{ dataUrl: string; width: number; height: number } | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
                const w = Math.round(img.width * ratio);
                const h = Math.round(img.height * ratio);
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve({ dataUrl, width: w, height: h });
            } catch (e) {
                console.warn('Image compression failed, using original', e);
                resolve({ dataUrl: src, width: img.width, height: img.height });
            }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

/**
 * Helper to get template instance based on templateId or legacy layout
 */
function getTemplate(doc: jsPDF, config: ReportConfig): TemplateBase {
    // New templateId takes precedence over legacy layout
    if (config.templateId) {
        switch (config.templateId) {
            case 'classic':
                return new ClassicTemplate(doc, config);
            case 'modern':
                return new ModernTemplate(doc, config);
            case 'bubble':
                return new BubbleTemplate(doc, config);
            case 'japanese':
                return new JapaneseTemplate(doc, config);
            case 'custom':
                return new DynamicTemplate(doc, config);
            default:
                return new ClassicTemplate(doc, config);
        }
    }

    // Backward compatibility: map legacy layout to templates
    switch (config.layout) {
        case 'B':
            return new ModernTemplate(doc, config);
        case 'A':
        default:
            return new ClassicTemplate(doc, config);
    }
}

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
            templateId: config?.templateId,
            theme: config?.theme || 'default',
            title: config?.title || 'REPORTE DE EVIDENCIA',
            subtitle: config?.subtitle || 'PRUEBAS UNITARIAS',
            author: config?.author || authorName || 'QA Engineer',
            showLogoSymbol: config?.showLogoSymbol ?? true,
            showLogoText: config?.showLogoText ?? true,
            customLogoSymbol: config?.customLogoSymbol || null,
            customLogoText: config?.customLogoText || null,
            logoAlignment: config?.logoAlignment || 'split',
            logoGap: config?.logoGap || 'medium',
            customTemplate: config?.customTemplate,
            projectName: config?.projectName
        };

        if (format === 'pdf') {
            return await this.generatePDF(captures, fullConfig, true);
        } else {
            return await this.generateDOCX(captures, fullConfig, true);
        }
    }

    // Template-based PDF generation
    static async generatePDF(captures: CaptureItem[], config: ReportConfig, returnBlob = false): Promise<Blob | void> {
        const doc = new jsPDF();
        const template = getTemplate(doc, config);

        await template.renderCover();
        await template.renderContent(captures);

        if (returnBlob) {
            return doc.output('blob');
        } else {
            saveAs(doc.output('blob'), `Evidence_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
    }

    // DOCX Generation
    private static async generateDOCX(captures: CaptureItem[], config: ReportConfig, returnBlob = false): Promise<Blob | void> {
        const theme = REPORT_THEMES[config.theme];
        const dateSource = config.reportDate ? new Date(config.reportDate + 'T12:00:00') : new Date();
        const currentDate = dateSource.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

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
            saveAs(blob, `Reporte_SnapProof_${config.author.replace(/\s+/g, '_')}.docx`);
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

            // Image handling — compress first, then calculate proper aspect ratio
            try {
                let srcForCompression = capture.thumbnail;

                // Resolve media:// protocol to a data URL before compression
                if (capture.thumbnail.startsWith('media://')) {
                    if ((window as any).electron?.readImage) {
                        const buffer = await (window as any).electron.readImage(capture.thumbnail);
                        const bytes = buffer.buffer ? new Uint8Array(buffer.buffer) : new Uint8Array(buffer);
                        let binary = '';
                        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                        srcForCompression = 'data:image/png;base64,' + btoa(binary);
                    } else {
                        throw new Error('Read Image capability missing');
                    }
                }

                // Compress the image before embedding
                const compressed = await compressImageForExport(srcForCompression);

                if (compressed) {
                    // Calc DOCX dimensions in EMUs: max width = 450px, keep aspect ratio
                    const maxDocxW = 450;
                    const ratio = compressed.width / compressed.height;
                    const docxW = Math.min(maxDocxW, compressed.width);
                    const docxH = Math.round(docxW / ratio);

                    // Convert compressed JPEG data URL to ArrayBuffer
                    const base64Data = compressed.dataUrl.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

                    paragraphs.push(new Paragraph({
                        children: [new ImageRun({ data: bytes.buffer, transformation: { width: docxW, height: docxH }, type: 'jpg' })],
                        spacing: { after: 400 }
                    }));
                } else {
                    throw new Error('Could not process image');
                }
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
