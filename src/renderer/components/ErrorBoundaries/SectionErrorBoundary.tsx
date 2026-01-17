
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
        logger.error('Section error:', error, errorInfo);
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
                <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 text-center">
                    <AlertCircle className="text-red-500 mb-3" size={24} />
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-1">
                        {this.props.title || 'Error en esta sección'}
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4 max-w-xs">
                        No se pudo cargar el contenido correctamente.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
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
