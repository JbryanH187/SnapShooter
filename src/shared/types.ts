import { SystemMetadata } from '../main/metadata/MetadataCollector';

export interface CaptureItem {
    id: string;
    thumbnail: string; // Base64 (fresh) or file:// URL (saved)
    timestamp: number;
    title: string;
    description: string;
    status: 'pending' | 'saved' | 'success' | 'failure';
    metadata?: SystemMetadata;
}


export type BlockType = 'header' | 'evidence' | 'text' | 'grid' | 'logo' | 'table' | 'footer' | 'summary' | 'toc' | 'conclusion' | 'page-break';

export type PageType = 'presentation' | 'content' | 'summary' | 'index' | 'conclusion';

export interface ReportPage {
    id: string;
    type: PageType;
    blocks: TemplateBlock[];
    order: number;
}

export interface TemplateBlock {
    id: string;
    type: BlockType;
    content: any;
    settings?: {
        variant?: string;
        showBorder?: boolean;
    };
    variant?: 'classic' | 'modern' | 'creative';
}

export interface ReportTemplate {
    id: string;
    name: string;
    description?: string;
    blocks?: TemplateBlock[]; // Deprecated, use pages
    pages?: ReportPage[];
    globalStyles?: {
        fontFamily?: string;
        primaryColor?: string;
        backgroundColor?: string;
    };
    createdAt: number;
    updatedAt: number;
    background?: TemplateBackground;
    decorations?: TemplateDecoration[];
    settings?: {
        accentColor: string;
        textColor: 'black' | 'white';
        globalBorderWidth?: number; // Legacy, prefer granular
        globalDecorationOpacity?: number; // 0-1
        blockBorderWidth?: number;
        decorationBorderWidth?: number;
    };
    aiConfig?: {
        summaryPrompt?: string;
        translationTarget?: string;
    };
}

export type BackgroundPattern = 'none' | 'circles' | 'waves' | 'hexagons' | 'grid-dots';

export interface TemplateBackground {
    pattern: BackgroundPattern;
    color: string;
    opacity: number;
}

export type DecorationType = 'circle' | 'square' | 'triangle' | 'wave_decoration';

export interface TemplateDecoration {
    id: string;
    type: DecorationType;
    x: number; // relative to page width (0-210mm approx)
    y: number; // relative to page height (0-297mm approx)
    width: number;
    height: number;
    color?: string;
    opacity: number;
    zIndex: number;
}
