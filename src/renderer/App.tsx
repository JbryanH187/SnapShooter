import React from 'react';
import './styles/index.css';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { UIProvider } from './contexts/UIContext';
import { GlobalModalProvider } from './contexts/GlobalModalContext';

// Components
import { AppShell } from './components/Layout/AppShell';
import { ContentRouter } from './components/Navigation/ContentRouter';
import { ModalManager } from './components/UI/ModalManager';
import { GlobalErrorBoundary } from './components/ErrorBoundaries/GlobalErrorBoundary';
import { Onboarding } from './pages/Onboarding';
import { KeyboardShortcutsModal } from './components/UI/KeyboardShortcutsModal';

// Stores & Hooks
import { useCaptureStore } from './stores/captureStore';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useLiquidTheme } from './hooks/useTheme'; // NEW: Liquid Glass theme system

// App Content - runs inside providers
const AppContent: React.FC = () => {
    // Enable Liquid Glass theme system (injects CSS variables)
    const { theme, isDark } = useLiquidTheme();

    // Enable global undo/redo keyboard shortcuts
    useUndoRedo();

    // Enable global navigation & app shortcuts (needs UIProvider)
    const { showShortcutsModal, closeShortcutsModal } = useGlobalShortcuts();

    return (
        <>
            <AppShell>
                <ContentRouter />
                <ModalManager />
            </AppShell>

            {/* Global Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                isOpen={showShortcutsModal}
                onClose={closeShortcutsModal}
            />
        </>
    );
};

// Main App Component
const App: React.FC = () => {
    // Only access store to check initialization status
    const { userProfile, loadCaptures } = useCaptureStore();

    // Initial Load
    React.useEffect(() => {
        loadCaptures();
    }, []);

    // If no user profile, show Onboarding
    if (!userProfile.initialized) {
        return <Onboarding />;
    }

    return (
        <ThemeProvider>
            <UIProvider>
                <GlobalModalProvider>
                    <GlobalErrorBoundary>
                        <AppContent />
                    </GlobalErrorBoundary>
                </GlobalModalProvider>
            </UIProvider>
        </ThemeProvider>
    );
};

export default App;
