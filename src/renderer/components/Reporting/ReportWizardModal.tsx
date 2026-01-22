import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureItem } from '../../stores/captureStore';
import { ReportGenerator } from '../../../shared/reporting/ReportGenerator';
import { REPORT_THEMES, ReportConfig } from '../../../shared/reporting/ReportThemes';
import { FileText, FileType, Download, Check, Settings, Palette, Upload, X, RefreshCw, Save, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportDraft } from './ReportDraftsModal';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '../../utils/toast';
import { SectionErrorBoundary } from '../ErrorBoundaries/SectionErrorBoundary';
import { logger } from '../../services/Logger';
import { ExportProgressOverlay, ExportStep } from './ExportProgressOverlay';
import { useTemplateStore } from '../../stores/templateStore';

interface ReportWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    captures: CaptureItem[];
    authorName: string;
    initialDraft?: ReportDraft | null;
}

type Step = 'config' | 'export';

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({ isOpen, onClose, captures, authorName, initialDraft }) => {
    const { templates } = useTemplateStore();
    const [step, setStep] = useState<Step>('config');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportStep, setExportStep] = useState<ExportStep>('generating');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [exportFormat, setExportFormat] = useState<'docx' | 'pdf'>('pdf');
    const [draftId, setDraftId] = useState<string | null>(null);

    const [config, setConfig] = useState<ReportConfig>({
        layout: 'A',
        templateId: 'classic',
        theme: 'default',
        title: 'REPORTE DE EVIDENCIA',
        titleColor: undefined,
        subtitle: 'PRUEBAS UNITARIAS',
        subtitleColor: undefined,
        author: authorName,
        showLogoSymbol: true,
        showLogoText: true,
        customLogoSymbol: null,
        customLogoText: null,
        logoAlignment: 'split',
        logoGap: 'medium',
        projectName: ''
    });

    const fileInputSymbolRef = useRef<HTMLInputElement>(null);
    const fileInputTextRef = useRef<HTMLInputElement>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen && captures.length > 0) {
            setStep('config');

            if (initialDraft) {
                setDraftId(initialDraft.id);
                if (initialDraft.config) {
                    setConfig(initialDraft.config);
                }
            } else {
                setDraftId(null);
                setConfig(prev => ({ ...prev, author: authorName }));
            }

            generatePreview();
        } else {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            setDraftId(null);
        }
    }, [isOpen, captures, authorName, initialDraft]);

    useEffect(() => {
        if (step === 'config' && isOpen) {
            generatePreview();
        }
    }, [config.theme, config.layout, config.templateId, config.customTemplate, config.showLogoSymbol, config.showLogoText, config.customLogoSymbol, config.customLogoText, config.logoAlignment, config.logoGap, config.titleColor, config.subtitleColor, step, isOpen]);

    useEffect(() => {
        if (step === 'config' && isOpen) {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
            previewTimeoutRef.current = setTimeout(() => {
                generatePreview();
            }, 3000);
        }
        return () => {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
        };
    }, [config.title, config.subtitle, config.author, config.projectName, step, isOpen]);

    const updateConfig = (key: keyof ReportConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'customLogoSymbol' | 'customLogoText') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateConfig(key, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearCustomLogo = (key: 'customLogoSymbol' | 'customLogoText') => {
        updateConfig(key, null);
        if (key === 'customLogoSymbol' && fileInputSymbolRef.current) fileInputSymbolRef.current.value = "";
        if (key === 'customLogoText' && fileInputTextRef.current) fileInputTextRef.current.value = "";
    };

    const generatePreview = async () => {
        setIsGeneratingPreview(true);
        try {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            const blob = await ReportGenerator.generatePDF(captures, config, true) as Blob;
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (error) {
            logger.error('REPORT', 'Failed to generate preview', { error });
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        try {
            const draft: ReportDraft = {
                id: draftId || uuidv4(),
                title: config.title || 'Sin título',
                subtitle: config.subtitle || '',
                author: config.author || authorName,
                captureIds: captures.map(c => c.id),
                config: { ...config },
                projectName: config.projectName,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            if (window.electron?.saveReportDraft) {
                await window.electron.saveReportDraft(draft);
                setDraftId(draft.id);
                toast.success('Borrador guardado correctamente');
            }
        } catch (error) {
            logger.error('REPORT', 'Failed to save draft', { error });
            toast.error('Error al guardar el borrador');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportStep('generating');
        try {
            const blob = await ReportGenerator.generate(captures, config.author, exportFormat, config) as Blob;

            if (blob) {
                const fileName = `Reporte_${config.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;

                setExportStep('saving');
                let savedFilePath: string | null = null;
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    if (window.electron?.saveReportFile) {
                        savedFilePath = (await window.electron.saveReportFile(fileName, arrayBuffer)) as unknown as string;
                    }
                } catch (err) {
                    logger.error('REPORT', 'Failed to save report file', { err });
                }

                setExportStep('downloading');
                const { saveAs } = await import('file-saver');
                saveAs(blob, fileName);

                if (window.electron?.saveReportToHistory) {
                    await window.electron.saveReportToHistory({
                        id: crypto.randomUUID(),
                        title: config.title || 'Untitled Report',
                        date: Date.now(),
                        author: config.author,
                        format: exportFormat,
                        filePath: savedFilePath
                    });
                }

                setExportStep('complete');
                toast.success(`Reporte exportado exitosamente`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            onClose();
        } catch (error) {
            logger.error('REPORT', 'Failed to export', { error });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <ExportProgressOverlay
                isVisible={isExporting}
                currentStep={exportStep}
                fileName={`Reporte_${config.title.replace(/\s+/g, '_')}.${exportFormat}`}
                format={exportFormat}
            />

            <Modal
                isOpen={isOpen}
                type="info"
                title="Generador de Reportes"
                description={step === 'config' ? "Personaliza y previsualiza tu reporte en tiempo real." : "Selecciona el formato de exportación."}
                onCancel={onClose}
                cancelText="Cancelar"
                confirmText=""
                onConfirm={() => { }}
                showFooter={false}
                maxWidth="max-w-6xl"
            >
                <div className="w-full h-[85vh] max-h-[650px] flex flex-col">
                    <SectionErrorBoundary title="Error en el Wizard de Reportes">
                        <AnimatePresence mode="wait">
                            {step === 'config' ? (
                                <motion.div
                                    key="config"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex overflow-hidden"
                                >
                                    <div
                                        className="w-64 lg:w-72 border-r overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6"
                                        style={{
                                            background: 'var(--system-background-secondary)',
                                            borderColor: 'var(--separator-opaque)'
                                        }}
                                    >
                                        <div
                                            className="flex items-center gap-2 text-xs lg:text-sm font-bold uppercase tracking-wide pb-2 lg:pb-3 border-b"
                                            style={{
                                                color: 'var(--label-primary)',
                                                borderColor: 'var(--separator-opaque)'
                                            }}
                                        >
                                            <Settings size={16} />
                                            Configuración
                                        </div>

                                        {/* Template Selection */}
                                        <div>
                                            <label className="block text-xs font-bold mb-2 uppercase" style={{ color: 'var(--label-secondary)' }}>Diseño</label>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                {['classic', 'modern', 'creative', 'custom'].map((tId) => (
                                                    <button
                                                        key={tId}
                                                        onClick={() => updateConfig('templateId', tId)}
                                                        className="p-2 lg:p-3 border-2 rounded-lg transition-all text-xs capital"
                                                        style={config.templateId === tId ? {
                                                            borderColor: 'var(--system-blue)',
                                                            background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                                            color: 'var(--system-blue)',
                                                            fontWeight: 'bold'
                                                        } : {
                                                            borderColor: 'var(--separator-opaque)',
                                                            color: 'var(--label-secondary)'
                                                        }}
                                                    >
                                                        {tId.charAt(0).toUpperCase() + tId.slice(1)}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom Template Dropdown */}
                                            {config.templateId === 'custom' && (
                                                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--label-secondary)' }}>Select Saved Template</label>
                                                    <select
                                                        value={config.customTemplate?.id || ''}
                                                        onChange={(e) => {
                                                            const selected = templates.find(t => t.id === e.target.value);
                                                            updateConfig('customTemplate', selected);
                                                        }}
                                                        className="w-full border rounded p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                        style={{ borderColor: 'var(--separator-opaque)', background: 'var(--fill-secondary)', color: 'var(--label-primary)' }}
                                                    >
                                                        <option value="">-- Select Template --</option>
                                                        {templates.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Theme Selection - Hide if custom template is selected (as it overrides theme usually, or we can allow override) */}
                                        {/* Actually, custom templates might use themes too. Let's keep it but maybe warn? */}
                                        {/* For now, show it always as it applies to blocks that use theme colors */}
                                        <div>
                                            <label className="block text-xs font-bold mb-2 uppercase flex items-center gap-1" style={{ color: 'var(--label-secondary)' }}>
                                                <Palette size={14} /> Tema
                                            </label>
                                            <div className="flex gap-1.5 lg:gap-2 flex-wrap">
                                                {Object.entries(REPORT_THEMES).map(([key, palette]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => updateConfig('theme', key)}
                                                        className={`relative group`}
                                                        title={key.charAt(0).toUpperCase() + key.slice(1)}
                                                    >
                                                        <div className={`w-10 h-10 rounded-full border-4 transition-all ${config.theme === key ? 'border-primary-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                                            style={{ backgroundColor: palette.primary }}>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Title Color */}
                                        <div>
                                            <label className="block text-xs font-bold mb-2 uppercase" style={{ color: 'var(--label-secondary)' }}>Color Título</label>
                                            <div className="flex gap-1.5 items-center flex-wrap">
                                                {[
                                                    { color: undefined, label: 'Auto', display: config.layout === 'A' ? REPORT_THEMES[config.theme].primary : REPORT_THEMES[config.theme].textMain },
                                                    { color: '#ffffff', label: 'Blanco', display: '#ffffff' },
                                                    { color: '#000000', label: 'Negro', display: '#000000' },
                                                    { color: REPORT_THEMES[config.theme].primary, label: 'Primario', display: REPORT_THEMES[config.theme].primary },
                                                    { color: REPORT_THEMES[config.theme].secondary, label: 'Secundario', display: REPORT_THEMES[config.theme].secondary },
                                                ].map((option, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => updateConfig('titleColor', option.color)}
                                                        className={`w-7 h-7 rounded-full border-2 transition-all ${config.titleColor === option.color ? 'border-primary-500 scale-110 shadow-lg' : 'hover:scale-105'}`}
                                                        style={{ backgroundColor: option.display, borderColor: config.titleColor === option.color ? undefined : 'var(--separator-opaque)' }}
                                                        title={option.label}
                                                    />
                                                ))}
                                                <input
                                                    type="color"
                                                    value={config.titleColor || (config.layout === 'A' ? REPORT_THEMES[config.theme].primary : REPORT_THEMES[config.theme].textMain)}
                                                    onChange={(e) => updateConfig('titleColor', e.target.value)}
                                                    className="w-7 h-7 rounded cursor-pointer border"
                                                    style={{ borderColor: 'var(--separator-opaque)' }}
                                                    title="Color personalizado"
                                                />
                                            </div>
                                        </div>

                                        {/* Subtitle Color */}
                                        <div>
                                            <label className="block text-xs font-bold mb-2 uppercase" style={{ color: 'var(--label-secondary)' }}>Color Subtítulo</label>
                                            <div className="flex gap-1.5 items-center flex-wrap">
                                                {/* Preset colors */}
                                                {[
                                                    { color: undefined, label: 'Auto', display: config.layout === 'B' ? '#ffffff' : REPORT_THEMES[config.theme].textLight },
                                                    { color: '#ffffff', label: 'Blanco', display: '#ffffff' },
                                                    { color: '#000000', label: 'Negro', display: '#000000' },
                                                    { color: REPORT_THEMES[config.theme].primary, label: 'Primario', display: REPORT_THEMES[config.theme].primary },
                                                    { color: REPORT_THEMES[config.theme].secondary, label: 'Secundario', display: REPORT_THEMES[config.theme].secondary },
                                                ].map((option, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => updateConfig('subtitleColor', option.color)}
                                                        className={`w-7 h-7 rounded-full border-2 transition-all ${config.subtitleColor === option.color ? 'border-primary-500 scale-110 shadow-lg' : 'hover:scale-105'}`}
                                                        style={{ backgroundColor: option.display, borderColor: config.subtitleColor === option.color ? undefined : 'var(--separator-opaque)' }}
                                                        title={option.label}
                                                    />
                                                ))}
                                                {/* Custom color picker */}
                                                <input
                                                    type="color"
                                                    value={config.subtitleColor || (config.layout === 'B' ? '#ffffff' : REPORT_THEMES[config.theme].textLight)}
                                                    onChange={(e) => updateConfig('subtitleColor', e.target.value)}
                                                    className="w-7 h-7 rounded cursor-pointer border"
                                                    style={{ borderColor: 'var(--separator-opaque)' }}
                                                    title="Color personalizado"
                                                />
                                            </div>
                                        </div>

                                        {/* Logo Configuration */}
                                        <div className="space-y-2 lg:space-y-3">
                                            <label className="block text-xs font-bold uppercase" style={{ color: 'var(--label-secondary)' }}>Logos</label>

                                            <div
                                                className="border rounded-lg p-2 lg:p-3"
                                                style={{
                                                    background: 'var(--system-background)',
                                                    borderColor: 'var(--separator-opaque)'
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold" style={{ color: 'var(--label-primary)' }}>Símbolo</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={config.showLogoSymbol}
                                                        onChange={(e) => updateConfig('showLogoSymbol', e.target.checked)}
                                                        className="w-4 h-4"
                                                    />
                                                </div>
                                                {config.showLogoSymbol && (
                                                    <>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            ref={fileInputSymbolRef}
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, 'customLogoSymbol')}
                                                        />
                                                        {!config.customLogoSymbol ? (
                                                            <button
                                                                onClick={() => fileInputSymbolRef.current?.click()}
                                                                className="w-full text-xs flex items-center justify-center gap-2 border-2 border-dashed p-2 rounded"
                                                                style={{
                                                                    borderColor: 'var(--separator-opaque)',
                                                                    color: 'var(--label-secondary)'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <Upload size={12} /> Subir
                                                            </button>
                                                        ) : (
                                                            <div
                                                                className="flex items-center gap-2 border p-2 rounded"
                                                                style={{
                                                                    background: 'var(--fill-secondary)',
                                                                    borderColor: 'var(--separator-opaque)'
                                                                }}
                                                            >
                                                                <img src={config.customLogoSymbol} alt="Preview" className="w-6 h-6 object-contain" />
                                                                <span className="text-xs truncate flex-1" style={{ color: 'var(--label-secondary)' }}>Custom</span>
                                                                <button onClick={() => clearCustomLogo('customLogoSymbol')} className="text-red-400 hover:text-red-600 dark:hover:text-red-500">
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <div
                                                className="border rounded-lg p-3"
                                                style={{
                                                    background: 'var(--system-background)',
                                                    borderColor: 'var(--separator-opaque)'
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold" style={{ color: 'var(--label-primary)' }}>Texto</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={config.showLogoText}
                                                        onChange={(e) => updateConfig('showLogoText', e.target.checked)}
                                                        className="w-4 h-4"
                                                    />
                                                </div>
                                                {config.showLogoText && (
                                                    <>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            ref={fileInputTextRef}
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, 'customLogoText')}
                                                        />
                                                        {!config.customLogoText ? (
                                                            <button
                                                                onClick={() => fileInputTextRef.current?.click()}
                                                                className="w-full text-xs flex items-center justify-center gap-2 border-2 border-dashed p-2 rounded"
                                                                style={{
                                                                    borderColor: 'var(--separator-opaque)',
                                                                    color: 'var(--label-secondary)'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <Upload size={12} /> Subir
                                                            </button>
                                                        ) : (
                                                            <div
                                                                className="flex items-center gap-2 border p-2 rounded"
                                                                style={{
                                                                    background: 'var(--fill-secondary)',
                                                                    borderColor: 'var(--separator-opaque)'
                                                                }}
                                                            >
                                                                <img src={config.customLogoText} alt="Preview" className="w-12 h-4 object-contain" />
                                                                <span className="text-xs truncate flex-1" style={{ color: 'var(--label-secondary)' }}>Custom</span>
                                                                <button onClick={() => clearCustomLogo('customLogoText')} className="text-red-400 hover:text-red-600">
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Text Fields */}
                                        <div className="space-y-2 lg:space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--label-secondary)' }}>Título</label>
                                                <input
                                                    value={config.title}
                                                    onChange={(e) => updateConfig('title', e.target.value)}
                                                    className="w-full border rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                    style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--label-secondary)' }}>Subtítulo</label>
                                                <input
                                                    value={config.subtitle}
                                                    onChange={(e) => updateConfig('subtitle', e.target.value)}
                                                    className="w-full border rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                    style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--label-secondary)' }}>Proyecto</label>
                                                <input
                                                    value={config.projectName || ''}
                                                    onChange={(e) => updateConfig('projectName', e.target.value)}
                                                    className="w-full border rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                    style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--label-secondary)' }}>Autor</label>
                                                <input
                                                    value={config.author}
                                                    onChange={(e) => updateConfig('author', e.target.value)}
                                                    className="w-full border rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                    style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Manual Refresh Button */}
                                        <button
                                            onClick={generatePreview}
                                            disabled={isGeneratingPreview}
                                            className="w-full py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            style={{ background: 'var(--fill-secondary)', color: 'var(--label-primary)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                        >
                                            <RefreshCw size={12} className={isGeneratingPreview ? 'animate-spin' : ''} />
                                            {isGeneratingPreview ? 'Actualizando...' : 'Actualizar Vista'}
                                        </button>
                                    </div>

                                    {/* Preview Area */}
                                    <div className="flex-1 flex flex-col items-center justify-center p-3 lg:p-6 relative" style={{ background: 'var(--fill-tertiary)' }}>
                                        {isGeneratingPreview && !previewUrl ? (
                                            <div className="flex flex-col items-center gap-3" style={{ color: 'var(--label-tertiary)' }}>
                                                <div className="w-10 h-10 lg:w-12 lg:h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                                <p className="text-xs lg:text-sm">Generando Vista Previa...</p>
                                            </div>
                                        ) : previewUrl ? (
                                            <>
                                                {isGeneratingPreview && (
                                                    <div
                                                        className="absolute top-2 right-2 lg:top-4 lg:right-4 px-2 py-1 lg:px-3 lg:py-1 rounded-full shadow-md flex items-center gap-1.5 lg:gap-2 text-xs"
                                                        style={{ background: 'var(--system-background)', color: 'var(--label-secondary)' }}
                                                    >
                                                        <RefreshCw size={10} className="animate-spin" />
                                                        Actualizando...
                                                    </div>
                                                )}
                                                <iframe
                                                    src={previewUrl}
                                                    className="w-full h-full rounded-lg shadow-2xl bg-white"
                                                    title="PDF Preview"
                                                />
                                            </>
                                        ) : (
                                            <div className="text-error-500 text-xs lg:text-sm">
                                                Error al cargar vista previa.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="export"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex items-center justify-center p-8"
                                    style={{ background: 'var(--fill-quaternary)' }}
                                >
                                    <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                                        <button
                                            onClick={() => setExportFormat('docx')}
                                            className="p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 group relative"
                                            style={exportFormat === 'docx' ? {
                                                borderColor: 'var(--system-blue)',
                                                background: 'color-mix(in srgb, var(--system-blue) 10%, var(--system-background))',
                                                boxShadow: '0 0 0 1px var(--system-blue)'
                                            } : {
                                                borderColor: 'var(--separator-opaque)',
                                                background: 'var(--system-background)'
                                            }}
                                            onMouseEnter={(e) => { if (exportFormat !== 'docx') { e.currentTarget.style.borderColor = 'var(--system-blue)'; e.currentTarget.style.background = 'var(--fill-secondary)'; } }}
                                            onMouseLeave={(e) => { if (exportFormat !== 'docx') { e.currentTarget.style.borderColor = 'var(--separator-opaque)'; e.currentTarget.style.background = 'var(--system-background)'; } }}
                                        >
                                            <div
                                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                                style={exportFormat === 'docx' ? {
                                                    background: 'color-mix(in srgb, var(--system-blue) 20%, transparent)',
                                                    color: 'var(--system-blue)'
                                                } : {
                                                    background: 'var(--fill-secondary)',
                                                    color: 'var(--label-tertiary)'
                                                }}
                                            >
                                                <FileText size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-bold" style={{ color: exportFormat === 'docx' ? 'var(--system-blue)' : 'var(--label-primary)' }}>Word Document</h3>
                                                <p className="text-xs mt-1" style={{ color: 'var(--label-tertiary)' }}>.docx format</p>
                                            </div>
                                            {exportFormat === 'docx' && <div className="absolute top-4 right-4 text-primary-500"><Check size={20} /></div>}
                                        </button>

                                        <button
                                            onClick={() => setExportFormat('pdf')}
                                            className="p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 group relative"
                                            style={exportFormat === 'pdf' ? {
                                                borderColor: 'var(--system-blue)',
                                                background: 'color-mix(in srgb, var(--system-blue) 10%, var(--system-background))',
                                                boxShadow: '0 0 0 1px var(--system-blue)'
                                            } : {
                                                borderColor: 'var(--separator-opaque)',
                                                background: 'var(--system-background)'
                                            }}
                                            onMouseEnter={(e) => { if (exportFormat !== 'pdf') { e.currentTarget.style.borderColor = 'var(--system-blue)'; e.currentTarget.style.background = 'var(--fill-secondary)'; } }}
                                            onMouseLeave={(e) => { if (exportFormat !== 'pdf') { e.currentTarget.style.borderColor = 'var(--separator-opaque)'; e.currentTarget.style.background = 'var(--system-background)'; } }}
                                        >
                                            <div
                                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                                style={exportFormat === 'pdf' ? {
                                                    background: 'color-mix(in srgb, var(--system-blue) 20%, transparent)',
                                                    color: 'var(--system-blue)'
                                                } : {
                                                    background: 'var(--fill-secondary)',
                                                    color: 'var(--label-tertiary)'
                                                }}
                                            >
                                                <FileType size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-bold" style={{ color: exportFormat === 'pdf' ? 'var(--system-blue)' : 'var(--label-primary)' }}>PDF Document</h3>
                                                <p className="text-xs mt-1" style={{ color: 'var(--label-tertiary)' }}>.pdf format</p>
                                            </div>
                                            {exportFormat === 'pdf' && <div className="absolute top-4 right-4 text-primary-500"><Check size={20} /></div>}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer Controls */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 px-6 pb-2">
                            <div className="flex gap-2">
                                <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={isSavingDraft}
                                    className="px-4 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {isSavingDraft ? 'Guardando...' : 'Guardar Borrador'}
                                </button>
                            </div>

                            <div className="flex gap-3">
                                {step === 'config' ? (
                                    <>
                                        {/* Quick Export Button */}
                                        <button
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all disabled:opacity-50"
                                            title="Exportar rápidamente con configuración actual"
                                        >
                                            <Zap size={16} />
                                            Exportación Rápida
                                        </button>
                                        <button
                                            onClick={() => setStep('export')}
                                            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium shadow-sm transition-all"
                                        >
                                            Continuar a Exportar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setStep('config')}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                        >
                                            ← Volver
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            className="px-5 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
                                        >
                                            <Download size={18} />
                                            {isExporting ? 'Exportando...' : `Descargar ${exportFormat.toUpperCase()}`}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                    </SectionErrorBoundary>
                </div>
            </Modal>
        </>
    );
};
