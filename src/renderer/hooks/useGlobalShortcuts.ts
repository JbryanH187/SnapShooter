import { useEffect, useState, useCallback } from 'react';
import { useUI } from '../contexts/UIContext';
import { logger } from '../services/Logger';

/**
 * Global keyboard shortcuts manager
 * Handles app-wide shortcuts like Ctrl+K, Ctrl+?, etc.
 */
export const useGlobalShortcuts = () => {
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);
    const { setView, setContentView, setSearchQuery } = useUI();

    const openShortcutsModal = useCallback(() => {
        setShowShortcutsModal(true);
        logger.info('UI', 'Keyboard shortcuts modal opened via Ctrl+?');
    }, []);

    const closeShortcutsModal = useCallback(() => {
        setShowShortcutsModal(false);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+? or Ctrl+/ - Show keyboard shortcuts
            if (e.ctrlKey && (e.key === '?' || e.key === '/')) {
                e.preventDefault();
                openShortcutsModal();
                return;
            }

            // Ctrl+K - Focus search (only if not in input/textarea)
            if (e.ctrlKey && e.key === 'k') {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    // Try to find and focus the search input
                    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.select();
                        logger.debug('UI', 'Search focused via Ctrl+K');
                    }
                }
                return;
            }

            // Ctrl+1 - Go to Recents
            if (e.ctrlKey && e.key === '1') {
                e.preventDefault();
                setContentView('recents');
                setView('dashboard');
                logger.debug('UI', 'Navigated to Recents via Ctrl+1');
                return;
            }

            // Ctrl+2 - Go to Flows
            if (e.ctrlKey && e.key === '2') {
                e.preventDefault();
                setContentView('flows');
                setView('dashboard');
                logger.debug('UI', 'Navigated to Flows via Ctrl+2');
                return;
            }

            // Ctrl+, - Go to Settings
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                setView('settings');
                logger.debug('UI', 'Navigated to Settings via Ctrl+,');
                return;
            }

            // Esc - Clear search if search is focused
            if (e.key === 'Escape') {
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.blur();
                    setSearchQuery('');
                    logger.debug('UI', 'Search cleared via Escape');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setView, setContentView, setSearchQuery, openShortcutsModal]);

    return {
        showShortcutsModal,
        openShortcutsModal,
        closeShortcutsModal
    };
};
