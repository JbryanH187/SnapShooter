
import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useCaptureStore } from '../../stores/captureStore';
import { useFlowStore } from '../../stores/flowStore';

export const RecoveryBanner: React.FC = () => {
    const captureError = useCaptureStore(state => state.error);
    const flowError = useFlowStore(state => state.error);
    const loadCaptures = useCaptureStore(state => state.loadCaptures);
    const loadFlows = useFlowStore(state => state.loadFlows);

    const error = captureError || flowError;

    if (!error) return null;

    const handleRetry = () => {
        if (captureError) loadCaptures();
        if (flowError) loadFlows();
    };

    return (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                </span>
            </div>
            <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-100 rounded-lg text-sm font-medium transition-colors"
            >
                <RotateCcw size={14} />
                Retry
            </button>
        </div>
    );
};
