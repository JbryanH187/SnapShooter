
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
                <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--system-background-secondary)' }}>
                    <div className="max-w-md w-full rounded-xl shadow-lg border p-8 text-center" style={{ background: 'var(--system-background)', borderColor: 'var(--separator-opaque)' }}>
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                            style={{ background: 'color-mix(in srgb, var(--system-red) 15%, transparent)' }}
                        >
                            <AlertTriangle style={{ color: 'var(--system-red)' }} size={32} />
                        </div>

                        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--label-primary)' }}>
                            Ups, algo salió mal
                        </h1>

                        <p className="mb-6" style={{ color: 'var(--label-secondary)' }}>
                            SnapProof ha encontrado un error inesperado. Hemos registrado este problema.
                        </p>

                        {this.state.error && (
                            <div className="mb-6 p-4 rounded-lg text-left overflow-auto max-h-32" style={{ background: 'var(--fill-tertiary)' }}>
                                <p className="font-mono text-xs break-words" style={{ color: 'var(--system-red)' }}>
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
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 border rounded-lg transition-colors font-medium"
                                style={{ background: 'var(--system-background)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--system-background)'}
                            >
                                <Home size={18} />
                                Intentar Continuar
                            </button>

                            <button
                                onClick={this.handleCopyError}
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                                style={{ background: 'var(--fill-secondary)', color: 'var(--label-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
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
