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

interface ReportWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    captures: CaptureItem[];
    authorName: string;
    initialDraft?: ReportDraft | null;
}

type Step = 'config' | 'export';

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({ isOpen, onClose, captures, authorName, initialDraft }) => {
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
        theme: 'default',
        title: 'REPORTE DE EVIDENCIA',
        titleColor: undefined, // Will use theme default if undefined
        subtitle: 'PRUEBAS UNITARIAS',
        subtitleColor: undefined, // Will use theme default if undefined
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

            // If loading from a draft, restore its config
            if (initialDraft) {
                setDraftId(initialDraft.id);
                if (initialDraft.config) {
                    setConfig(initialDraft.config);
                }
            } else {
                setDraftId(null);
                setConfig(prev => ({ ...prev, author: authorName }));
            }

            // Generate initial preview
            generatePreview();
        } else {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            setDraftId(null);
        }
    }, [isOpen, captures, authorName, initialDraft]);

    // Auto-regenerate preview when visual config changes (instant)
    useEffect(() => {
        if (step === 'config' && isOpen) {
            // Only regenerate for visual changes (theme, layout, logos, colors)
            generatePreview();
        }
    }, [config.theme, config.layout, config.showLogoSymbol, config.showLogoText, config.customLogoSymbol, config.customLogoText, config.logoAlignment, config.logoGap, config.titleColor, config.subtitleColor, step, isOpen]);

    // Auto-regenerate preview when text fields change (debounced)
    useEffect(() => {
        if (step === 'config' && isOpen) {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
            previewTimeoutRef.current = setTimeout(() => {
                generatePreview();
            }, 3000); // Debounce 3 seconds - wait for user to stop typing
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
            // Revoke old URL
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            const blob = await ReportGenerator.generatePDF(captures, config, true) as Blob;
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (error) {
            logger.error("Failed to generate preview", error);
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
            logger.error("Failed to save draft:", error);
            toast.error('Error al guardar el borrador');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportStep('generating');
        try {
            // Step 1: Generate the report blob
            const blob = await ReportGenerator.generate(captures, config.author, exportFormat, config) as Blob;

            // 2. Convert to Base64/Buffer for IPC transfer if needed, but since we are in renderer, handling blobs via IPC might require reading it as array buffer.
            // Actually, ReportGenerator with new flag returns Blob.
            // But we also want to trigger download for the user as usual?
            // User requirement: "Save generated report previews".
            // ReportGenerator.generate returns Blob if returnBlob=true? No, I updated it to accept a flag but default is false/void.
            // Wait, I updated ReportGenerator.generate to CALL generateDOCX/PDF with true?
            // In step 1920 diff: I changed it to return `await this.generatePDF(..., true)`. So it ALWAYS returns blob now and does NOT save automatically?
            // Checking step 1920 again.
            // Yes: `return await this.generatePDF(captures, fullConfig, true);`
            // So `ReportGenerator.generate` NOW returns a Blob and DOES NOT download automatically.
            // I need to trigger the download MANUALLY here using file-saver, AND save to history.

            if (blob) {
                // A. Trigger Download
                const fileName = `Reporte_${config.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
                logger.info('[ReportWizard] Triggering download:', fileName, 'Size:', blob.size);

                // Let's handle download here. 
                // I need `file-saver`.

                // Create a Report History Item
                const reportId = crypto.randomUUID();
                const reportHistoryItem = {
                    id: reportId,
                    title: config.title,
                    date: new Date().toISOString(),
                    author: config.author,
                    format: exportFormat,
                    path: null // We don't have a stable path if we just download.
                };

                // To do this right: I should ask Main process to save the file.
                // I will add `saveReportFile` to IPC.

                // But let's stick to the current plan:
                // 1. Download to user (saveAs).
                // 2. Save metadata to history.
                // (Limitation: specific path might be unknown if use saveAs, but usually we can't get the path back from web saveAs).

                // BETTER PLAN:
                // Use IPC key `history:save-file` which takes `{ name, buffer }` and returns `absolutePath`.
                // Then save metadata with that path.
                // I'll use `window.electron.saveReportToHistory` taking `{ ...metadata, content: ArrayBuffer }`?
                // `PersistenceManager.saveReportToHistory` in step 1869 just pushes `report` (any) to store.
                // It does NOT write file.

                // I'll stick to:
                // 1. Trigger download (saveAs).
                // 2. Save metadata.
                // 3. (Future) Implement robust file saving.
                // But for "Open" to work, I need a path.

                // COMPROMISE:
                // Use a hacked "save" via Node FS if exposed, OR just accept that "Open" might not work without a path.
                // BUT, I can use `window.electron.saveCapture` mechanism logic: send base64/buffer.

                // I will modify `ReportWizardModal` to:
                // 1. Get blob.
                // 2. Send blob + metadata to `window.electron.saveReportToHistory`.
                // 3. `PersistenceManager` needs to update to handle content saving if present.
                //    (I viewed `PersistenceManager` in step 1869... it assumes `report.filePath` for deletion but doesn't write it).

                // Step 2: Save to history
                setExportStep('saving');
                let savedFilePath: string | null = null;
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    if (window.electron?.saveReportFile) {
                        savedFilePath = (await window.electron.saveReportFile(fileName, arrayBuffer)) as unknown as string;
                    }
                } catch (err) {
                    logger.error("Failed to save report file:", err);
                }

                // Step 3: Trigger download
                setExportStep('downloading');
                const { saveAs } = await import('file-saver');
                saveAs(blob, fileName);

                // Save to history with the actual file path
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

                // Step 4: Complete
                setExportStep('complete');
                toast.success(`Reporte exportado exitosamente`);

                // Wait a moment to show completion state
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            onClose();
        } catch (error) {
            logger.error("Failed to export", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {/* Export Progress Overlay */}
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

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            {step === 'config' ? (
                                <motion.div
                                    key="config"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex overflow-hidden"
                                >
                                    {/* Sidebar - Configuration Panel */}
                                    <div className="w-64 lg:w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
                                        <div className="flex items-center gap-2 text-xs lg:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide pb-2 lg:pb-3 border-b border-gray-300 dark:border-gray-700">
                                            <Settings size={16} /> Configuración
                                        </div>

                                        {/* Layout Selection */}
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase">Diseño</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => updateConfig('layout', 'A')}
                                                    className={`p-2 lg:p-3 border-2 rounded-lg transition-all text-xs ${config.layout === 'A' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold' : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 text-gray-700 dark:text-gray-300'}`}
                                                >
                                                    Clásico
                                                </button>
                                                <button
                                                    onClick={() => updateConfig('layout', 'B')}
                                                    className={`p-2 lg:p-3 border-2 rounded-lg transition-all text-xs ${config.layout === 'B' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold' : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 text-gray-700 dark:text-gray-300'}`}
                                                >
                                                    Moderno
                                                </button>
                                            </div>
                                        </div>

                                        {/* Theme Selection */}
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase flex items-center gap-1">
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
                                            <label className="block text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase">Color Título</label>
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
                                                        className={`w-7 h-7 rounded-full border-2 transition-all ${config.titleColor === option.color ? 'border-primary-500 scale-110 shadow-lg' : 'border-gray-300 dark:border-gray-600 hover:scale-105'}`}
                                                        style={{ backgroundColor: option.display }}
                                                        title={option.label}
                                                    />
                                                ))}
                                                <input
                                                    type="color"
                                                    value={config.titleColor || (config.layout === 'A' ? REPORT_THEMES[config.theme].primary : REPORT_THEMES[config.theme].textMain)}
                                                    onChange={(e) => updateConfig('titleColor', e.target.value)}
                                                    className="w-7 h-7 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                                                    title="Color personalizado"
                                                />
                                            </div>
                                        </div>

                                        {/* Subtitle Color */}
                                        <div>
                                            <label className="block text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase">Color Subtítulo</label>
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
                                                        className={`w-7 h-7 rounded-full border-2 transition-all ${config.subtitleColor === option.color ? 'border-primary-500 scale-110 shadow-lg' : 'border-gray-300 dark:border-gray-600 hover:scale-105'}`}
                                                        style={{ backgroundColor: option.display }}
                                                        title={option.label}
                                                    />
                                                ))}
                                                {/* Custom color picker */}
                                                <input
                                                    type="color"
                                                    value={config.subtitleColor || (config.layout === 'B' ? '#ffffff' : REPORT_THEMES[config.theme].textLight)}
                                                    onChange={(e) => updateConfig('subtitleColor', e.target.value)}
                                                    className="w-7 h-7 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                                                    title="Color personalizado"
                                                />
                                            </div>
                                        </div>

                                        {/* Logo Configuration */}
                                        <div className="space-y-2 lg:space-y-3">
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Logos</label>

                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 lg:p-3 bg-white dark:bg-gray-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Símbolo</span>
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
                                                                className="w-full text-xs flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                                            >
                                                                <Upload size={12} /> Subir
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 rounded">
                                                                <img src={config.customLogoSymbol} alt="Preview" className="w-6 h-6 object-contain" />
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">Custom</span>
                                                                <button onClick={() => clearCustomLogo('customLogoSymbol')} className="text-red-400 hover:text-red-600 dark:hover:text-red-500">
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Texto</span>
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
                                                                className="w-full text-xs flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                                            >
                                                                <Upload size={12} /> Subir
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 rounded">
                                                                <img src={config.customLogoText} alt="Preview" className="w-12 h-4 object-contain" />
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">Custom</span>
                                                                <button onClick={() => clearCustomLogo('customLogoText')} className="text-red-400 hover:text-red-600 dark:hover:text-red-500">
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
                                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Título</label>
                                                <input
                                                    value={config.title}
                                                    onChange={(e) => updateConfig('title', e.target.value)}
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Subtítulo</label>
                                                <input
                                                    value={config.subtitle}
                                                    onChange={(e) => updateConfig('subtitle', e.target.value)}
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Proyecto</label>
                                                <input
                                                    value={config.projectName || ''}
                                                    onChange={(e) => updateConfig('projectName', e.target.value)}
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Autor</label>
                                                <input
                                                    value={config.author}
                                                    onChange={(e) => updateConfig('author', e.target.value)}
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded p-1.5 lg:p-2 text-xs lg:text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                        </div>

                                        {/* Manual Refresh Button */}
                                        <button
                                            onClick={generatePreview}
                                            disabled={isGeneratingPreview}
                                            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <RefreshCw size={12} className={isGeneratingPreview ? 'animate-spin' : ''} />
                                            {isGeneratingPreview ? 'Actualizando...' : 'Actualizar Vista'}
                                        </button>
                                    </div>

                                    {/* Preview Area */}
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-3 lg:p-6 relative">
                                        {isGeneratingPreview && !previewUrl ? (
                                            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                                                <div className="w-10 h-10 lg:w-12 lg:h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
                                                <p className="text-xs lg:text-sm">Generando Vista Previa...</p>
                                            </div>
                                        ) : previewUrl ? (
                                            <>
                                                {isGeneratingPreview && (
                                                    <div className="absolute top-2 right-2 lg:top-4 lg:right-4 bg-white dark:bg-gray-700 px-2 py-1 lg:px-3 lg:py-1 rounded-full shadow-md flex items-center gap-1.5 lg:gap-2 text-xs text-gray-600 dark:text-gray-300">
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
                                            <div className="text-error-500 dark:text-error-400 text-xs lg:text-sm">
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
                                    className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900"
                                >
                                    <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                                        <button
                                            onClick={() => setExportFormat('docx')}
                                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 group relative ${exportFormat === 'docx' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500 dark:ring-primary-400' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                                        >
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${exportFormat === 'docx' ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400'}`}>
                                                <FileText size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className={`font-bold ${exportFormat === 'docx' ? 'text-primary-900 dark:text-primary-100' : 'text-gray-700 dark:text-gray-300'}`}>Word Document</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">.docx format</p>
                                            </div>
                                            {exportFormat === 'docx' && <div className="absolute top-4 right-4 text-primary-500"><Check size={20} /></div>}
                                        </button>

                                        <button
                                            onClick={() => setExportFormat('pdf')}
                                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 group relative ${exportFormat === 'pdf' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500 dark:ring-primary-400' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                                        >
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${exportFormat === 'pdf' ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400'}`}>
                                                <FileType size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className={`font-bold ${exportFormat === 'pdf' ? 'text-primary-900 dark:text-primary-100' : 'text-gray-700 dark:text-gray-300'}`}>PDF Document</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">.pdf format</p>
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
