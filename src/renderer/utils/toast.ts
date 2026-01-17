import Swal from 'sweetalert2';

// App color palette
const colors = {
    primary: '#6366f1',     // Indigo 500
    primaryDark: '#4f46e5', // Indigo 600
    success: '#22c55e',     // Green 500
    error: '#ef4444',       // Red 500
    warning: '#f59e0b',     // Amber 500 (not yellow)
    info: '#3b82f6',        // Blue 500
    gray: '#6b7280',        // Gray 500
    grayDark: '#4b5563'     // Gray 600
};

// Helper to detect dark mode
const isDarkMode = () => document.documentElement.classList.contains('dark');

// Toast configuration factory
const createToastConfig = (icon: 'success' | 'error' | 'warning' | 'info', title?: string, text?: string) => {
    const isDark = isDarkMode();

    return {
        icon,
        title: title || capitalizeFirst(icon),
        text,
        toast: true,
        position: 'top-end' as const,
        showConfirmButton: false,
        timer: icon === 'error' ? 4000 : 3000,
        timerProgressBar: true,
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        iconColor: icon === 'success' ? colors.success :
            icon === 'error' ? colors.error :
                icon === 'warning' ? colors.warning :
                    colors.info,
        customClass: {
            popup: 'rounded-lg shadow-xl',
            title: 'text-sm font-semibold',
            htmlContainer: 'text-xs'
        }
    };
};

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const toast = {
    success: (message: string, title?: string) => {
        return Swal.fire(createToastConfig('success', title, message));
    },

    error: (message: string, title?: string) => {
        return Swal.fire(createToastConfig('error', title, message));
    },

    warning: (message: string, title?: string) => {
        return Swal.fire(createToastConfig('warning', title, message));
    },

    info: (message: string, title?: string) => {
        return Swal.fire(createToastConfig('info', title, message));
    }
};

// Confirmation dialog with dark mode support and app colors
export const confirm = async (options: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
}): Promise<boolean> => {
    const isDark = isDarkMode();
    const iconType = options.type === 'danger' ? 'warning' : (options.type || 'warning');

    // Determine button colors based on type
    const primaryColor = options.type === 'danger' ? colors.error : colors.primary;
    const primaryColorDark = options.type === 'danger' ? '#dc2626' : colors.primaryDark;

    const result = await Swal.fire({
        title: options.title,
        text: options.text,
        icon: iconType,
        showCancelButton: true,
        confirmButtonText: options.confirmText || 'Confirmar',
        cancelButtonText: options.cancelText || 'Cancelar',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        iconColor: options.type === 'danger' ? colors.error : colors.warning,
        customClass: {
            confirmButton: `swal2-confirm-${options.type || 'primary'}`,
            cancelButton: 'swal2-cancel',
            popup: 'swal2-popup-rounded-lg',
            actions: 'swal2-actions-gap'
        },
        buttonsStyling: false,
        reverseButtons: true,
        didOpen: () => {
            // Apply custom styles to buttons
            const confirmBtn = document.querySelector('.swal2-confirm-' + (options.type || 'primary')) as HTMLElement;
            const cancelBtn = document.querySelector('.swal2-cancel') as HTMLElement;
            const actionsContainer = document.querySelector('.swal2-actions-gap') as HTMLElement;

            // Add gap between buttons
            if (actionsContainer) {
                actionsContainer.style.gap = '1rem'; // 16px gap
            }

            if (confirmBtn) {
                confirmBtn.style.cssText = `
                    background-color: ${primaryColor};
                    color: white;
                    padding: 0.875rem 2rem;
                    border-radius: 1.5rem;
                    font-weight: 600;
                    font-size: 0.9375rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 120px;
                `;
                confirmBtn.onmouseenter = () => {
                    confirmBtn.style.backgroundColor = primaryColorDark;
                    confirmBtn.style.transform = 'translateY(-2px)';
                    confirmBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                };
                confirmBtn.onmouseleave = () => {
                    confirmBtn.style.backgroundColor = primaryColor;
                    confirmBtn.style.transform = 'translateY(0)';
                    confirmBtn.style.boxShadow = 'none';
                };
            }

            if (cancelBtn) {
                const cancelBg = isDark ? '#374151' : '#f3f4f6';
                const cancelBgHover = isDark ? '#4b5563' : '#e5e7eb';
                const cancelText = isDark ? '#f3f4f6' : '#374151';

                cancelBtn.style.cssText = `
                    background-color: ${cancelBg};
                    color: ${cancelText};
                    padding: 0.875rem 2rem;
                    border-radius: 1.5rem;
                    font-weight: 600;
                    font-size: 0.9375rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 120px;
                `;
                cancelBtn.onmouseenter = () => {
                    cancelBtn.style.backgroundColor = cancelBgHover;
                    cancelBtn.style.transform = 'translateY(-2px)';
                    cancelBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                };
                cancelBtn.onmouseleave = () => {
                    cancelBtn.style.backgroundColor = cancelBg;
                    cancelBtn.style.transform = 'translateY(0)';
                    cancelBtn.style.boxShadow = 'none';
                };
            }
        }
    });

    return result.isConfirmed;
};

// Input dialog for simple text inputs
export const input = async (options: {
    title: string;
    text?: string;
    inputValue?: string;
    inputPlaceholder?: string;
    confirmText?: string;
    cancelText?: string;
}): Promise<string | null> => {
    const isDark = isDarkMode();

    const result = await Swal.fire({
        title: options.title,
        text: options.text,
        input: 'text',
        inputValue: options.inputValue || '',
        inputPlaceholder: options.inputPlaceholder || '',
        showCancelButton: true,
        confirmButtonText: options.confirmText || 'Guardar',
        cancelButtonText: options.cancelText || 'Cancelar',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
        customClass: {
            confirmButton: 'swal2-confirm-input',
            cancelButton: 'swal2-cancel-input',
            input: `px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none`,
            actions: 'swal2-actions-gap'
        },
        buttonsStyling: false,
        reverseButtons: true,
        inputValidator: (value) => {
            if (!value || !value.trim()) {
                return '¡Este campo es requerido!';
            }
            return null;
        },
        didOpen: () => {
            const confirmBtn = document.querySelector('.swal2-confirm-input') as HTMLElement;
            const cancelBtn = document.querySelector('.swal2-cancel-input') as HTMLElement;
            const actionsContainer = document.querySelector('.swal2-actions-gap') as HTMLElement;

            // Add gap between buttons
            if (actionsContainer) {
                actionsContainer.style.gap = '1rem';
            }

            if (confirmBtn) {
                confirmBtn.style.cssText = `
                    background-color: ${colors.primary};
                    color: white;
                    padding: 0.875rem 2rem;
                    border-radius: 1.5rem;
                    font-weight: 600;
                    font-size: 0.9375rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 120px;
                `;
                confirmBtn.onmouseenter = () => {
                    confirmBtn.style.backgroundColor = colors.primaryDark;
                    confirmBtn.style.transform = 'translateY(-2px)';
                    confirmBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                };
                confirmBtn.onmouseleave = () => {
                    confirmBtn.style.backgroundColor = colors.primary;
                    confirmBtn.style.transform = 'translateY(0)';
                    confirmBtn.style.boxShadow = 'none';
                };
            }

            if (cancelBtn) {
                const cancelBg = isDark ? '#374151' : '#f3f4f6';
                const cancelBgHover = isDark ? '#4b5563' : '#e5e7eb';
                const cancelText = isDark ? '#f3f4f6' : '#374151';

                cancelBtn.style.cssText = `
                    background-color: ${cancelBg};
                    color: ${cancelText};
                    padding: 0.875rem 2rem;
                    border-radius: 1.5rem;
                    font-weight: 600;
                    font-size: 0.9375rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 120px;
                `;
                cancelBtn.onmouseenter = () => {
                    cancelBtn.style.backgroundColor = cancelBgHover;
                    cancelBtn.style.transform = 'translateY(-2px)';
                    cancelBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                };
                cancelBtn.onmouseleave = () => {
                    cancelBtn.style.backgroundColor = cancelBg;
                    cancelBtn.style.transform = 'translateY(0)';
                    cancelBtn.style.boxShadow = 'none';
                };
            }
        }
    });

    return result.isConfirmed ? result.value : null;
};
