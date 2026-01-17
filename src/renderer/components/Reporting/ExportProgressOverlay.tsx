import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Check, Download, Archive, CheckCircle2 } from 'lucide-react';

export type ExportStep = 'generating' | 'saving' | 'downloading' | 'complete';

interface ExportProgressOverlayProps {
    isVisible: boolean;
    currentStep: ExportStep;
    fileName?: string;
    format?: 'pdf' | 'docx';
}

const STEPS: { id: ExportStep; label: string; icon: React.ElementType }[] = [
    { id: 'generating', label: 'Generando reporte...', icon: FileText },
    { id: 'saving', label: 'Guardando en historial...', icon: Archive },
    { id: 'downloading', label: 'Descargando archivo...', icon: Download },
    { id: 'complete', label: '¡Exportación completa!', icon: CheckCircle2 }
];

export const ExportProgressOverlay: React.FC<ExportProgressOverlayProps> = ({
    isVisible,
    currentStep,
    fileName,
    format = 'pdf'
}) => {
    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <motion.div
                                animate={{ rotate: currentStep !== 'complete' ? 360 : 0 }}
                                transition={{
                                    duration: 2,
                                    repeat: currentStep !== 'complete' ? Infinity : 0,
                                    ease: 'linear'
                                }}
                                className={`inline-flex p-4 rounded-full mb-4 ${currentStep === 'complete'
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-primary-100 dark:bg-primary-900/30'
                                    }`}
                            >
                                {currentStep === 'complete' ? (
                                    <CheckCircle2 size={32} className="text-green-500" />
                                ) : (
                                    <Loader2 size={32} className="text-primary-500 animate-spin" />
                                )}
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {currentStep === 'complete' ? 'Exportación Completa' : 'Exportando Reporte'}
                            </h3>
                            {fileName && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                                    {fileName}
                                </p>
                            )}
                        </div>

                        {/* Progress Steps */}
                        <div className="space-y-3">
                            {STEPS.map((step, index) => {
                                const isActive = step.id === currentStep;
                                const isComplete = index < currentStepIndex || currentStep === 'complete';
                                const Icon = step.icon;

                                return (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                                : isComplete
                                                    ? 'bg-green-50 dark:bg-green-900/10'
                                                    : 'bg-gray-50 dark:bg-gray-800/50'
                                            }`}
                                    >
                                        {/* Step Icon */}
                                        <div className={`p-2 rounded-full ${isComplete
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : isActive
                                                    ? 'bg-primary-100 dark:bg-primary-900/40'
                                                    : 'bg-gray-200 dark:bg-gray-700'
                                            }`}>
                                            {isComplete ? (
                                                <Check size={16} className="text-green-500" />
                                            ) : isActive ? (
                                                <Loader2 size={16} className="text-primary-500 animate-spin" />
                                            ) : (
                                                <Icon size={16} className="text-gray-400" />
                                            )}
                                        </div>

                                        {/* Step Label */}
                                        <span className={`font-medium ${isComplete
                                                ? 'text-green-600 dark:text-green-400'
                                                : isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Format Badge */}
                        <div className="mt-6 flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${format === 'pdf'
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {format}
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
