
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
        <div
            className="border-b px-4 py-3 flex items-center justify-between transition-all"
            style={{
                background: 'color-mix(in srgb, var(--system-red) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--system-red) 25%, transparent)'
            }}
        >
            <div className="flex items-center gap-3">
                <AlertCircle style={{ color: 'var(--system-red)' }} size={20} />
                <span className="text-sm font-medium" style={{ color: 'var(--system-red)' }}>
                    {error}
                </span>
            </div>
            <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                    background: 'color-mix(in srgb, var(--system-red) 15%, transparent)',
                    color: 'var(--system-red)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 25%, transparent)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 15%, transparent)'}
            >
                <RotateCcw size={14} />
                Retry
            </button>
        </div>
    );
};
