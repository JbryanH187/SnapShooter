import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface WizardPreviewPaneProps {
    previewUrl: string | null;
    isGeneratingPreview: boolean;
    onRefresh: () => void;
}

export const WizardPreviewPane: React.FC<WizardPreviewPaneProps> = ({
    previewUrl,
    isGeneratingPreview,
    onRefresh
}) => {
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Vista Previa en Vivo
                </span>
                <button
                    onClick={onRefresh}
                    disabled={isGeneratingPreview}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    title="Actualizar Vista Previa"
                >
                    <RefreshCw size={14} className={isGeneratingPreview ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 min-h-[380px] relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center">
                {isGeneratingPreview ? (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span className="text-xs font-medium">Generando vista previa...</span>
                    </div>
                ) : previewUrl ? (
                    <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="w-full h-full border-none"
                        title="PDF Live Preview"
                    />
                ) : (
                    <div className="text-xs text-gray-400">Sin vista previa disponible</div>
                )}
            </div>
        </div>
    );
};
