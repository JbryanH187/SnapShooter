import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { CaptureItem } from '../types';
import { REPORT_THEMES, ReportConfig, ColorPalette } from './ReportThemes';
import { ClassicTemplate, ModernTemplate, CreativeTemplate, TemplateBase } from './templates';
import { DynamicTemplate } from './DynamicTemplate';

/**
 * Helper to get template instance based on templateId or legacy layout
 */
function getTemplate(doc: jsPDF, config: ReportConfig): TemplateBase {
    // New templateId takes precedence over legacy layout
    if (config.templateId) {
        switch (config.templateId) {
            case 'modern':
                return new ModernTemplate(doc, config);
            case 'creative':
                return new CreativeTemplate(doc, config);
            case 'custom':
                return new DynamicTemplate(doc, config);
            case 'classic':
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

            // Image handling
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
