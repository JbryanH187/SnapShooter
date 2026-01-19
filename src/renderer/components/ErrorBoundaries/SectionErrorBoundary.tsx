
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { logger } from '../../services/Logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    title?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('UI', 'Section error', { error, errorInfo });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 rounded-lg border text-center" style={{ background: 'var(--fill-quaternary)', borderColor: 'var(--separator-opaque)' }}>
                    <AlertCircle className="text-red-500 mb-3" size={24} />
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--system-red)' }}>
                        {this.props.title || 'Error en esta sección'}
                    </h3>
                    <p className="text-sm mb-4 max-w-xs" style={{ color: 'color-mix(in srgb, var(--system-red) 80%, var(--label-primary))' }}>
                        No se pudo cargar el contenido correctamente.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors shadow-sm"
                        style={{ background: 'var(--system-background)', borderColor: 'var(--separator-opaque)', color: 'var(--system-red)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--system-background)'}
                    >
                        <RefreshCw size={14} />
                        Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
