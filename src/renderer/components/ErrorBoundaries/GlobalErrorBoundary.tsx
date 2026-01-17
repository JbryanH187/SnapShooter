
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Clipboard } from 'lucide-react';
import { logger } from '../../services/Logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('UI', 'Uncaught React error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
        this.setState({ errorInfo });

        // Here you could send this to an external logging service
        // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        // Attempt to reset state or navigate home if possible
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/'; // Simple reload to root
    };

    private handleCopyError = () => {
        const errorDetails = {
            error: this.state.error?.toString(),
            stack: this.state.error?.stack,
            componentStack: this.state.errorInfo?.componentStack,
            logs: logger.exportLogs()
        };

        navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
            .then(() => alert('Error details copied to clipboard'))
            .catch(() => alert('Failed to copy error details'));
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Ups, algo salió mal
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            SnapProof ha encontrado un error inesperado. Hemos registrado este problema.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left overflow-auto max-h-32">
                                <p className="font-mono text-xs text-red-600 dark:text-red-400 break-words">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                            >
                                <RefreshCw size={18} />
                                Reiniciar Aplicación
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium"
                            >
                                <Home size={18} />
                                Intentar Continuar
                            </button>

                            <button
                                onClick={this.handleCopyError}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors font-medium text-sm"
                            >
                                <Clipboard size={16} />
                                Copiar Detalles del Error
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
