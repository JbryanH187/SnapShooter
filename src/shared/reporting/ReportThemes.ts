// Definición de temas corporativos para reportes
export interface ColorPalette {
    primary: string;
    secondary: string;
    textMain: string;
    textLight: string;
    bgLight: string;
    statusSuccess: { bg: string; text: string };
    statusFail: { bg: string; text: string };
}

export const REPORT_THEMES: Record<string, ColorPalette> = {
    default: {
        primary: '#081754',
        secondary: '#F0D224',
        textMain: '#1e293b',
        textLight: '#64748b',
        bgLight: '#f8fafc',
        statusSuccess: { bg: '#dcfce7', text: '#15803d' },
        statusFail: { bg: '#fee2e2', text: '#b91c1c' }
    },
    crimson: {
        primary: '#7f1d1d',
        secondary: '#fbbf24',
        textMain: '#27272a',
        textLight: '#71717a',
        bgLight: '#fafafa',
        statusSuccess: { bg: '#ecfccb', text: '#3f6212' },
        statusFail: { bg: '#ffe4e6', text: '#881337' }
    },
    teal: {
        primary: '#0f766e',
        secondary: '#22d3ee',
        textMain: '#134e4a',
        textLight: '#5eead4',
        bgLight: '#f0fdfa',
        statusSuccess: { bg: '#ccfbf1', text: '#0f766e' },
        statusFail: { bg: '#ffe4e6', text: '#be123c' }
    },
    emerald: {
        primary: '#064e3b',
        secondary: '#a3e635',
        textMain: '#022c22',
        textLight: '#6b7280',
        bgLight: '#ecfdf5',
        statusSuccess: { bg: '#d1fae5', text: '#065f46' },
        statusFail: { bg: '#fee2e2', text: '#991b1b' }
    },
    amethyst: {
        primary: '#581c87',
        secondary: '#f472b6',
        textMain: '#3b0764',
        textLight: '#6b7280',
        bgLight: '#faf5ff',
        statusSuccess: { bg: '#d8b4fe', text: '#581c87' },
        statusFail: { bg: '#fce7f3', text: '#9d174d' }
    }
};

export type ReportLayout = 'A' | 'B';
export type LogoAlignment = 'left' | 'center' | 'right' | 'split';
export type LogoGap = 'small' | 'medium' | 'large';

export interface ReportConfig {
    layout: ReportLayout; // Deprecated: use templateId instead
    templateId?: 'classic' | 'modern' | 'creative'; // New template system
    theme: keyof typeof REPORT_THEMES;
    title: string;
    titleColor?: string; // Optional custom color for title
    subtitle: string;
    subtitleColor?: string; // Optional custom color for subtitle
    projectName?: string; // Project Name to appear in report
    author: string;
    showLogoSymbol: boolean;
    showLogoText: boolean;
    customLogoSymbol?: string | null;
    customLogoText?: string | null;
    logoAlignment: LogoAlignment;
    logoGap: LogoGap;
}
