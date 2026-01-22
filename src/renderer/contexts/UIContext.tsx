
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { ViewType } from '../components/Layout/HamburgerMenu';

type AppView = 'dashboard' | 'settings';

// View metadata for breadcrumbs
export const VIEW_LABELS: Record<ViewType, string> = {
    home: 'Inicio',
    recents: 'Recientes',
    flows: 'Flujos',
    history: 'Historial',
    drafts: 'Borradores',
    builder: 'Report Builder'
};

interface UIContextType {
    view: AppView;
    contentView: ViewType;
    menuOpen: boolean;
    setView: (view: AppView) => void;
    setContentView: (view: ViewType) => void;
    setMenuOpen: (open: boolean) => void;
    toggleMenu: () => void;
    navigateToHome: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    // Navigation history
    navigationHistory: ViewType[];
    goBack: () => void;
    canGoBack: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [view, setView] = useState<AppView>('dashboard');
    const [contentView, setContentViewState] = useState<ViewType>('home');
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [navigationHistory, setNavigationHistory] = useState<ViewType[]>(['home']);

    const toggleMenu = () => setMenuOpen(prev => !prev);

    // Enhanced setContentView that tracks history
    const setContentView = useCallback((newView: ViewType) => {
        setContentViewState(prev => {
            if (prev !== newView) {
                setNavigationHistory(history => [...history, newView]);
            }
            return newView;
        });
    }, []);

    const navigateToHome = useCallback(() => {
        setContentViewState('home');
        setNavigationHistory(['home']);
        setView('dashboard');
    }, []);

    const goBack = useCallback(() => {
        setNavigationHistory(history => {
            if (history.length <= 1) return history;
            const newHistory = history.slice(0, -1);
            const previousView = newHistory[newHistory.length - 1];
            setContentViewState(previousView);
            return newHistory;
        });
    }, []);

    const canGoBack = navigationHistory.length > 1;

    return (
        <UIContext.Provider value={{
            view,
            contentView,
            menuOpen,
            setView,
            setContentView,
            setMenuOpen,
            toggleMenu,
            navigateToHome,
            searchQuery,
            setSearchQuery,
            navigationHistory,
            goBack,
            canGoBack
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
