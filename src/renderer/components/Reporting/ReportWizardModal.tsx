import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureItem } from '../../stores/captureStore';
import { ReportGenerator } from '../../../shared/reporting/ReportGenerator';
import { ReportConfig } from '../../../shared/reporting/ReportThemes';
import { FileText, FileType, Download, Check, Settings, Save, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportDraft } from './ReportDraftsModal';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '../../utils/toast';
import { SectionErrorBoundary } from '../ErrorBoundaries/SectionErrorBoundary';
import { logger } from '../../services/Logger';
import { ExportProgressOverlay, ExportStep } from './ExportProgressOverlay';
import { useTemplateStore } from '../../stores/templateStore';

import { saveAs } from 'file-saver';

// Modular subcomponents
import { WizardPreviewPane } from './wizard/WizardPreviewPane';
import { WizardTemplateSelector } from './wizard/WizardTemplateSelector';
import { WizardThemeSelector } from './wizard/WizardThemeSelector';
import { WizardLogoCustomizer } from './wizard/WizardLogoCustomizer';
import { WizardFormFields } from './wizard/WizardFormFields';

interface ReportWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    captures: CaptureItem[];
    authorName: string;
    initialDraft?: ReportDraft | null;
}

type Step = 'config' | 'export';

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({
    isOpen,
    onClose,
    captures,
    authorName,
    initialDraft
}) => {
    const { templates } = useTemplateStore();
    const [step, setStep] = useState<Step>('config');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
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
        reportDate: new Date().toISOString().slice(0, 10),
        showLogoSymbol: true,
        showLogoText: true,
        customLogoSymbol: null,
        customLogoText: null,
        logoAlignment: 'split',
        logoGap: 'medium',
        projectName: ''
    });

    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updateConfig = (key: keyof ReportConfig, value: any) => {
        console.log(`[ReportWizardModal] updateConfig: "${key}" ->`, value);
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const previewGenIdRef = useRef(0);

    const generatePreview = async (configToUse?: ReportConfig) => {
        if (captures.length === 0) {
            console.warn('[ReportWizardModal:generatePreview] No captures available to generate preview');
            return;
        }
        const currentGenId = ++previewGenIdRef.current;
        console.log(`[ReportWizardModal:generatePreview] Triggering preview generation #${currentGenId}...`);
        setIsGeneratingPreview(true);
        setPreviewError(null);
        const effectiveConfig = configToUse || config;
        try {
            const blob = await ReportGenerator.generatePDF(captures, effectiveConfig, true);
            if (blob && currentGenId === previewGenIdRef.current) {
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
                const url = URL.createObjectURL(blob);
                console.log(`[ReportWizardModal:generatePreview] Preview #${currentGenId} successfully ready: ${url}`);
                setPreviewUrl(url);
                setPreviewError(null);
            }
        } catch (error: any) {
            console.error(`[ReportWizardModal:generatePreview] Preview generation #${currentGenId} failed:`, error);
            logger.error('REPORT', 'Failed to generate preview', { error: error?.message || error });
            if (currentGenId === previewGenIdRef.current) {
                setPreviewError(error?.message || 'Error desconocido al generar PDF');
            }
        } finally {
            if (currentGenId === previewGenIdRef.current) {
                setIsGeneratingPreview(false);
            }
        }
    };

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
        } else {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            setDraftId(null);
        }
    }, [isOpen, initialDraft, authorName]);

    useEffect(() => {
        if (step === 'config' && isOpen && captures.length > 0) {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
            previewTimeoutRef.current = setTimeout(() => {
                generatePreview(config);
            }, 250);
        }
        return () => {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
        };
    }, [config, step, isOpen, captures]);

    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        try {
            const draft: ReportDraft = {
                id: draftId || uuidv4(),
                title: config.title || 'Borrador sin título',
                subtitle: config.subtitle || '',
                author: config.author || '',
                projectName: config.projectName,
                captureIds: captures.map(c => c.id),
                config: config,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            if (window.electron?.saveReportDraft) {
                await window.electron.saveReportDraft(draft);
                setDraftId(draft.id);
                toast.success('Borrador guardado exitosamente');
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
            console.log('[ReportWizardModal:handleExport] Starting export for format:', exportFormat);
            const blob = await ReportGenerator.generate(captures, config.author, exportFormat, config);
            if (!blob) throw new Error('No se pudo generar el documento');

            const ext = exportFormat.toLowerCase();
            const filterName = ext === 'pdf' ? 'PDF Document' : 'Word Document';
            const fileName = `Reporte_${config.title?.replace(/\s+/g, '_') || 'Evidencia'}_${new Date().toISOString().slice(0, 10)}.${ext}`;

            setExportStep('saving');

            let savedPath: string | null = null;
            if (window.electron?.showSaveDialog && window.electron?.saveFileToPath) {
                const targetPath = await window.electron.showSaveDialog({
                    defaultPath: fileName,
                    filters: [{ name: filterName, extensions: [ext] }]
                });

                if (!targetPath) {
                    console.log('[ReportWizardModal:handleExport] User canceled save dialog');
                    setIsExporting(false);
                    return;
                }

                const buffer = await blob.arrayBuffer();
                savedPath = await window.electron.saveFileToPath(targetPath, buffer);
                console.log('[ReportWizardModal:handleExport] Saved to target path:', savedPath);
            } else {
                saveAs(blob, fileName);
                console.log('[ReportWizardModal:handleExport] Saved via file-saver');
            }

            // Save to history
            if (window.electron?.saveReportToHistory) {
                await window.electron.saveReportToHistory({
                    id: uuidv4(),
                    title: config.title || 'Reporte de Evidencia',
                    format: exportFormat,
                    createdAt: Date.now(),
                    captureCount: captures.length,
                    filePath: savedPath || undefined
                });
            }

            setExportStep('complete');
            toast.success(`Reporte ${exportFormat.toUpperCase()} guardado exitosamente`);
            setTimeout(() => {
                setIsExporting(false);
                onClose();
            }, 800);
        } catch (error: any) {
            console.error('[ReportWizardModal:handleExport] Error exporting report:', error);
            logger.error('REPORT', 'Failed to export report', { error: error?.message || error });
            setExportStep('complete');
            toast.error(`Error al generar el reporte: ${error?.message || 'Error desconocido'}`);
            setIsExporting(false);
        }
    };

    return (
        <>
            <ExportProgressOverlay
                isVisible={isExporting}
                currentStep={exportStep}
                format={exportFormat}
            />

            <Modal
                isOpen={isOpen}
                onCancel={onClose}
                title="Asistente de Reportes"
                description={null}
                showFooter={false}
                maxWidth="6xl"
            >
                <div className="flex flex-col h-[75vh] max-h-[800px] overflow-hidden">
                    <SectionErrorBoundary title="ReportWizard">
                        <AnimatePresence mode="wait">
                            {step === 'config' ? (
                                <motion.div
                                    key="config"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex overflow-hidden gap-4 p-4"
                                >
                                    {/* Configuration Sidebar */}
                                    <div className="w-80 overflow-y-auto pr-2 space-y-4 border-r border-gray-200 dark:border-gray-800">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-200 dark:border-gray-800">
                                            <Settings size={14} />
                                            Configuración del Reporte
                                        </div>

                                        <WizardTemplateSelector
                                            config={config}
                                            updateConfig={updateConfig}
                                            templates={templates}
                                        />

                                        <WizardThemeSelector
                                            config={config}
                                            updateConfig={updateConfig}
                                        />

                                        <WizardFormFields
                                            config={config}
                                            updateConfig={updateConfig}
                                        />

                                        <WizardLogoCustomizer
                                            config={config}
                                            updateConfig={updateConfig}
                                        />
                                    </div>

                                    {/* Preview Pane */}
                                    <WizardPreviewPane
                                        previewUrl={previewUrl}
                                        previewError={previewError}
                                        isGeneratingPreview={isGeneratingPreview}
                                        onRefresh={() => generatePreview(config)}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="export"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/30"
                                >
                                    <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                                        <button
                                            onClick={() => setExportFormat('pdf')}
                                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 relative ${
                                                exportFormat === 'pdf'
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <FileType size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Documento PDF</h3>
                                                <p className="text-xs text-gray-500 mt-1">Formato estándar de alta fidelidad</p>
                                            </div>
                                            {exportFormat === 'pdf' && (
                                                <div className="absolute top-4 right-4 text-blue-600">
                                                    <Check size={20} />
                                                </div>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setExportFormat('docx')}
                                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 relative ${
                                                exportFormat === 'docx'
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                                            }`}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <FileText size={32} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Documento Word</h3>
                                                <p className="text-xs text-gray-500 mt-1">Formato editable .docx</p>
                                            </div>
                                            {exportFormat === 'docx' && (
                                                <div className="absolute top-4 right-4 text-blue-600">
                                                    <Check size={20} />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer Controls */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800 px-6 pb-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={isSavingDraft}
                                    className="px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    {isSavingDraft ? 'Guardando...' : 'Guardar Borrador'}
                                </button>
                            </div>

                            <div className="flex gap-3">
                                {step === 'config' ? (
                                    <>
                                        <button
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 font-medium shadow-sm transition-all disabled:opacity-50"
                                        >
                                            <Zap size={14} />
                                            Exportación Rápida
                                        </button>
                                        <button
                                            onClick={() => setStep('export')}
                                            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 font-medium shadow-sm transition-all"
                                        >
                                            Continuar a Exportar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setStep('config')}
                                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 font-medium"
                                        >
                                            ← Volver a Configurar
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            disabled={isExporting}
                                            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 font-medium shadow-sm disabled:opacity-50"
                                        >
                                            <Download size={14} />
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
