import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, Trash2, X } from 'lucide-react';
import { LiquidGlass } from './LiquidGlass';
import { RippleButton } from './Animations';

export type ModalType = 'success' | 'danger' | 'warning' | 'info';

interface ModalProps {
    isOpen: boolean;
    type?: ModalType;
    title: string;
    description: React.ReactNode;
    children?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    showFooter?: boolean;
    maxWidth?: string;
}

// Use semantic tokens
const icons = {
    success: <CheckCircle style={{ color: 'var(--system-green)' }} size={32} />,
    danger: <Trash2 style={{ color: 'var(--system-red)' }} size={32} />,
    warning: <AlertTriangle style={{ color: 'var(--system-orange)' }} size={32} />,
    info: <Info style={{ color: 'var(--system-blue)' }} size={32} />
};

const semanticColors: Record<ModalType, string> = {
    success: 'var(--system-green)',
    danger: 'var(--system-red)',
    warning: 'var(--system-orange)',
    info: 'var(--system-blue)'
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    type = 'info',
    title,
    description,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isLoading,
    showFooter = true,
    maxWidth = 'max-w-md'
}) => {
    // ESc to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const accentColor = semanticColors[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur - Liquid Glass style */}
            <div
                className="absolute inset-0 transition-opacity"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                }}
                onClick={onCancel}
            />

            {/* Modal Content with LiquidGlass */}
            <LiquidGlass
                material="thick"
                className={`relative w-full ${maxWidth} overflow-hidden transform transition-all scale-100`}
                style={{
                    borderRadius: 'var(--radius-modal)',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)'
                }}
            >
                {/* Header Accent Strip */}
                <div
                    className="h-1 w-full"
                    style={{ background: accentColor }}
                />

                <div className="p-6">
                    {/* Icon Container */}
                    <div
                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{
                            backgroundColor: 'var(--fill-secondary)',
                            border: '1px solid var(--separator-non-opaque)'
                        }}
                    >
                        {icons[type]}
                    </div>

                    <div className="text-center mb-6">
                        <h3
                            className="text-xl font-bold mb-2"
                            style={{ color: 'var(--label-primary)' }}
                        >
                            {title}
                        </h3>
                        <div
                            className="text-sm leading-relaxed"
                            style={{ color: 'var(--label-secondary)' }}
                        >
                            {description}
                        </div>
                    </div>

                    {children}

                    {showFooter && (onCancel || onConfirm) && (
                        <div className="flex gap-3 justify-center mt-6">
                            {onCancel && (
                                <RippleButton
                                    onClick={onCancel}
                                    variant="secondary"
                                >
                                    {cancelText}
                                </RippleButton>
                            )}

                            {onConfirm && (
                                <RippleButton
                                    onClick={onConfirm}
                                    variant="primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : confirmText}
                                </RippleButton>
                            )}
                        </div>
                    )}
                </div>

                {/* Close X top right */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 transition-colors"
                    style={{
                        color: 'var(--label-tertiary)',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--label-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--label-tertiary)'}
                >
                    <X size={20} />
                </button>
            </LiquidGlass>
        </div>
    );
};
