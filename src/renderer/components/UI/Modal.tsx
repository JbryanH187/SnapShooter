import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, Trash2, X } from 'lucide-react';
import clsx from 'clsx';

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

const icons = {
    success: <CheckCircle className="text-green-500 dark:text-green-400" size={32} />,
    danger: <Trash2 className="text-red-500 dark:text-red-400" size={32} />,
    warning: <AlertTriangle className="text-amber-500 dark:text-amber-400" size={32} />,
    info: <Info className="text-blue-500 dark:text-blue-400" size={32} />
};

const colors = {
    success: 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800',
    danger: 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800',
    warning: 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800',
    info: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
};

const buttonColors = {
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 dark:bg-amber-600 dark:hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700'
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur - enhanced for dark mode */}
            <div
                className="absolute inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-[4px] transition-opacity"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-full ${maxWidth} overflow-hidden transform transition-all scale-100`}>

                {/* Header Pattern / Decoration */}
                <div className={clsx("h-2 w-full", buttonColors[type].replace('hover:', '').split(' ')[0])} />

                <div className="p-6">
                    {/* Icon Container */}
                    <div className={clsx(
                        "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 border",
                        colors[type]
                    )}>
                        {icons[type]}
                    </div>

                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-display">
                            {title}
                        </h3>
                        <div className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            {description}
                        </div>
                    </div>

                    {children}

                    {showFooter && (onCancel || onConfirm) && (
                        <div className="flex gap-3 justify-center mt-6">
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-500 transition-colors"
                                >
                                    {cancelText}
                                </button>
                            )}

                            {onConfirm && (
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={clsx(
                                        "px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all flex items-center gap-2",
                                        buttonColors[type],
                                        isLoading && "opacity-75 cursor-not-allowed"
                                    )}
                                >
                                    {isLoading ? 'Processing...' : confirmText}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Close X top right */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
