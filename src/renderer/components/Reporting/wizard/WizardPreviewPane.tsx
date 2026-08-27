import React from 'react';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface WizardPreviewPaneProps {
    previewUrl: string | null;
    previewError?: string | null;
    isGeneratingPreview: boolean;
    onRefresh: () => void;
}

export const WizardPreviewPane: React.FC<WizardPreviewPaneProps> = ({
    previewUrl,
    previewError,
    isGeneratingPreview,
    onRefresh
}) => {
    const handleOpenInNewWindow = async () => {
        if (!previewUrl) return;
        try {
            if (window.electron?.saveReportFile && window.electron?.openPath) {
                const response = await fetch(previewUrl);
                const arrayBuffer = await response.arrayBuffer();
                const tempName = `Preview_${Date.now()}.pdf`;
                const savedPath = await window.electron.saveReportFile(tempName, arrayBuffer);
                if (savedPath) {
                    await window.electron.openPath(savedPath);
                    return;
                }
            }
            window.open(previewUrl, '_blank');
        } catch (e) {
            window.open(previewUrl, '_blank');
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Vista Previa en Vivo
                </span>
                <div className="flex items-center gap-1.5">
                    {previewUrl && (
                        <button
                            onClick={handleOpenInNewWindow}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                            title="Abrir en Visor"
                        >
                            <ExternalLink size={14} />
                        </button>
                    )}
                    <button
                        onClick={onRefresh}
                        disabled={isGeneratingPreview}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        title="Actualizar Vista Previa"
                    >
                        <RefreshCw size={14} className={isGeneratingPreview ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-[380px] relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
                {isGeneratingPreview ? (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span className="text-xs font-medium">Generando vista previa...</span>
                    </div>
                ) : previewError ? (
                    <div className="flex flex-col items-center gap-3 text-red-500 p-6 text-center max-w-md">
                        <AlertCircle size={32} className="text-red-500" />
                        <span className="text-sm font-semibold">Error al generar la vista previa</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-red-50 dark:bg-red-950/40 p-2.5 rounded border border-red-200 dark:border-red-800 break-words w-full max-h-36 overflow-y-auto">
                            {previewError}
                        </span>
                        <button
                            onClick={onRefresh}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <RefreshCw size={12} /> Reintentar
                        </button>
                    </div>
                ) : previewUrl ? (
                    <iframe
                        src={previewUrl}
                        className="w-full h-full border-none rounded-lg bg-white"
                        title="PDF Live Preview"
                    />
                ) : (
                    <div className="text-xs text-gray-400">Sin vista previa disponible</div>
                )}
            </div>
        </div>
    );
};

