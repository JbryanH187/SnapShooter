import { useEffect, useRef } from 'react';

/**
 * useFocusTrap - Trap focus within a modal/dialog
 * WCAG 2.1 Success Criterion 2.1.2 (No Keyboard Trap)
 */
export const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLElement>(null);
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive) return;

        // Store currently focused element
        previouslyFocusedElement.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        if (!container) return;

        // Get all focusable elements
        const getFocusableElements = (): HTMLElement[] => {
            const selector = [
                'a[href]',
                'button:not([disabled])',
                'textarea:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ].join(', ');

            return Array.from(container.querySelectorAll<HTMLElement>(selector));
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Shift + Tab
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            }
            // Tab
            else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        // Focus first element
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            // Restore focus to previously focused element
            if (previouslyFocusedElement.current) {
                previouslyFocusedElement.current.focus();
            }
        };
    }, [isActive]);

    return containerRef;
};

/**
 * useAnnouncer - Screen reader announcements
 * Creates a live region for dynamic content updates
 */
export const useAnnouncer = () => {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        // Create or get existing announcer
        let announcer = document.getElementById('sr-announcer');

        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', priority);
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.left = '-10000px';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.overflow = 'hidden';
            document.body.appendChild(announcer);
        }

        // Update aria-live if priority changed
        announcer.setAttribute('aria-live', priority);

        // Clear and set new message
        announcer.textContent = '';
        setTimeout(() => {
            announcer!.textContent = message;
        }, 100);
    };

    return { announce };
};

/**
 * useKeyboardShortcut - Register keyboard shortcuts
 */
interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    callback: () => void;
    description: string;
}

export const useKeyboardShortcut = (shortcuts: ShortcutConfig[]) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
                const altMatch = shortcut.alt ? e.altKey : !e.altKey;
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    e.preventDefault();
                    shortcut.callback();
                    break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
};

/**
 * useArrowNavigation - Arrow key navigation for lists
 */
export const useArrowNavigation = (itemCount: number, onSelect: (index: number) => void) => {
    const selectedIndexRef = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            let newIndex = selectedIndexRef.current;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    newIndex = Math.min(newIndex + 1, itemCount - 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    newIndex = Math.max(newIndex - 1, 0);
                    break;
                case 'Home':
                    e.preventDefault();
                    newIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    newIndex = itemCount - 1;
                    break;
                case 'Enter':
                case ' ': // Space
                    e.preventDefault();
                    onSelect(selectedIndexRef.current);
                    return;
                default:
                    return;
            }

            selectedIndexRef.current = newIndex;
            onSelect(newIndex);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [itemCount, onSelect]);

    return selectedIndexRef;
};
