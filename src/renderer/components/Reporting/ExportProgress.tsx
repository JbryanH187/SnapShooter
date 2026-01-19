import React from 'react';
import { motion } from 'framer-motion';
import { FileText, X, CheckCircle } from 'lucide-react';

interface ExportProgressProps {
    progress: number; // 0-100
    status: 'processing' | 'complete' | 'error';
    currentStep?: string;
    onCancel?: () => void;
    fileName?: string;
}

export const ExportProgress: React.FC<ExportProgressProps> = ({
    progress,
    status,
    currentStep = 'Generating report...',
    onCancel,
    fileName
}) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
            {/* Circular Progress */}
            <div className="relative">
                <svg className="transform -rotate-90" width="160" height="160">
                    {/* Background circle */}
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        strokeWidth="8"
                        fill="none"
                        style={{ stroke: 'var(--fill-tertiary)' }}
                    />
                    {/* Progress circle */}
                    <motion.circle
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`transition-all duration-300 ${status === 'complete'
                            ? 'text-green-500'
                            : status === 'error'
                                ? 'text-red-500'
                                : 'text-primary-500'
                            }`}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {status === 'complete' ? (
                        <CheckCircle size={48} className="text-green-500" />
                    ) : (
                        <div className="text-center">
                            <div className="text-3xl font-bold" style={{ color: 'var(--label-primary)' }}>
                                {Math.round(progress)}%
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Text */}
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--label-primary)' }}>
                    {status === 'complete' ? 'Export Complete!' : 'Exporting Report'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--label-secondary)' }}>
                    {currentStep}
                </p>
                {fileName && (
                    <p className="text-xs font-mono" style={{ color: 'var(--label-tertiary)' }}>
                        {fileName}
                    </p>
                )}
            </div>

            {/* Cancel Button (only show if not complete) */}
            {status !== 'complete' && onCancel && (
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ color: 'var(--label-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fill-secondary)'; e.currentTarget.style.color = 'var(--label-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--label-secondary)'; }}
                >
                    <X size={16} />
                    Cancel Export
                </button>
            )}
        </div>
    );
};

/**
 * Progress milestones for report generation
 */
export const EXPORT_MILESTONES = {
    STARTING: { progress: 0, step: 'Starting export...' },
    PROCESSING_IMAGES: { progress: 25, step: 'Processing images...' },
    BUILDING_DOCUMENT: { progress: 50, step: 'Building document structure...' },
    RENDERING_CONTENT: { progress: 75, step: 'Rendering content...' },
    FINALIZING: { progress: 90, step: 'Finalizing...' },
    COMPLETE: { progress: 100, step: 'Export complete!' }
} as const;
