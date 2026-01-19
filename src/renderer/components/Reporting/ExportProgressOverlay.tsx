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
                        className="rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
                        style={{ background: 'var(--system-background)' }}
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
                                className="inline-flex p-4 rounded-full mb-4"
                                style={{ background: currentStep === 'complete' ? 'color-mix(in srgb, var(--system-green) 15%, transparent)' : 'color-mix(in srgb, var(--system-blue) 15%, transparent)' }}
                            >
                                {currentStep === 'complete' ? (
                                    <CheckCircle2 size={32} className="text-green-500" />
                                ) : (
                                    <Loader2 size={32} className="text-primary-500 animate-spin" />
                                )}
                            </motion.div>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--label-primary)' }}>
                                {currentStep === 'complete' ? 'Exportación Completa' : 'Exportando Reporte'}
                            </h3>
                            {fileName && (
                                <p className="text-sm mt-1 truncate" style={{ color: 'var(--label-secondary)' }}>
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
                                        className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                                        style={isActive ? {
                                            background: 'color-mix(in srgb, var(--system-blue) 10%, transparent)',
                                            border: '1px solid color-mix(in srgb, var(--system-blue) 30%, transparent)'
                                        } : isComplete ? {
                                            background: 'color-mix(in srgb, var(--system-green) 10%, transparent)'
                                        } : {
                                            background: 'var(--fill-quaternary)'
                                        }}
                                    >
                                        {/* Step Icon */}
                                        <div
                                            className="p-2 rounded-full"
                                            style={isComplete ? {
                                                background: 'color-mix(in srgb, var(--system-green) 15%, transparent)'
                                            } : isActive ? {
                                                background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)'
                                            } : {
                                                background: 'var(--fill-tertiary)'
                                            }}
                                        >
                                            {isComplete ? (
                                                <Check size={16} className="text-green-500" />
                                            ) : isActive ? (
                                                <Loader2 size={16} className="text-primary-500 animate-spin" />
                                            ) : (
                                                <Icon size={16} className="text-gray-400" />
                                            )}
                                        </div>

                                        {/* Step Label */}
                                        <span
                                            className="font-medium"
                                            style={{ color: isComplete ? 'var(--system-green)' : isActive ? 'var(--system-blue)' : 'var(--label-tertiary)' }}
                                        >
                                            {step.label}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Format Badge */}
                        <div className="mt-6 flex justify-center">
                            <span
                                className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                                style={format === 'pdf' ? {
                                    background: 'color-mix(in srgb, var(--system-red) 15%, transparent)',
                                    color: 'var(--system-red)'
                                } : {
                                    background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                    color: 'var(--system-blue)'
                                }}
                            >
                                {format}
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
