
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../contexts/UIContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCaptureStore } from '../../stores/captureStore';
import { Settings } from '../../pages/Settings';
import LogoSnapProof from '../../../assets/LogoSnapProof.jpg';
import { Menu, FileText, Sun, Moon, Layers, Search } from 'lucide-react';
import Avatar from 'boring-avatars';
import { HamburgerMenu } from './HamburgerMenu';
import { useFlowStore } from '../../stores/flowStore';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { toast, input } from '../../utils/toast';
import { logger } from '../../services/Logger';
import { RecoveryBanner } from '../UI/RecoveryBanner';
import { OnboardingOverlay } from '../UI/OnboardingOverlay';
import { CapturePreview } from '../Overlay/CapturePreview';
import { Toaster } from 'react-hot-toast';
import { Breadcrumb } from '../Navigation/Breadcrumb';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const {
        view,
        setView,
        contentView,
        setContentView,
        menuOpen,
        setMenuOpen,
        navigateToHome
    } = useUI();

    const { theme, toggleTheme } = useTheme();
    const { captures, userProfile, loadCaptures, setCurrentCapture, tutorial, startTutorial, setTutorialState } = useCaptureStore();
    const { flows, loadFlows, quickFlowActive, setQuickFlowActive } = useFlowStore();
    const { openFlowEditor, closeReportWizard } = useGlobalModal();

    // -- Event Listeners --

    // -- Event Listeners --

    // 1. Capture Complete Listener
    React.useEffect(() => {
        if (window.electron?.onCaptureComplete) {
            // Note: We might want to move this to the store entirely, but for now 
            // we rely on the store's addCapture logic usually. 
            // However, this listener comes from Main process shortcuts.
            // If we want non-blocking, we should use setPreviewCapture or addCapture.

            const removeListener = window.electron.onCaptureComplete((data: { id: string, thumbnail: string, metadata: any }) => {
                logger.info("Capture received via Shortcut:", data.id);

                const newCapture = {
                    id: data.id,
                    thumbnail: data.thumbnail,
                    timestamp: Date.now(),
                    title: '',
                    description: '',
                    status: 'pending' as const,
                    metadata: data.metadata
                };

                // Use the store action which now properly handles preview vs current
                useCaptureStore.getState().addCapture(newCapture);
            });
            return () => removeListener();
        }
    }, []);

    // 2. Load Flows on Mount
    React.useEffect(() => {
        loadFlows();
    }, [loadFlows]);

    // 3. Quick Flow Listeners
    React.useEffect(() => {
        const electron = window.electron;
        if (!electron) return;

        // Listen for mode changes
        const removeModeListener = electron.onQuickFlowModeChange?.((active: boolean) => {
            setQuickFlowActive(active);
        });

        // Listen for flow complete event
        const removeCompleteListener = electron.onQuickFlowComplete?.((data: { id: string; captures: any[] }) => {
            if (data.captures.length > 0) {
                const newFlow = {
                    id: data.id,
                    name: '',
                    captures: data.captures,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                openFlowEditor(newFlow);
            }
        });

        return () => {
            removeModeListener?.();
            removeCompleteListener?.();
        };
    }, [setQuickFlowActive, openFlowEditor]);

    // 4. Auto-start Tutorial
    React.useEffect(() => {
        // Delay slightly to ensure UI is ready
        const timer = setTimeout(() => {
            if (!tutorial.hasSeenOnboarding && !tutorial.isActive) {
                startTutorial();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [tutorial.hasSeenOnboarding, tutorial.isActive, startTutorial]);

    return (
        <div
            className="min-h-screen p-8 font-sans transition-colors duration-200"
            style={{
                background: 'var(--system-background)',
                color: 'var(--label-primary)'
            }}
        >
            {/* Window Drag Handle */}
            <div className="fixed top-0 left-0 right-0 h-8 z-50 app-drag" />

            <RecoveryBanner />
            <OnboardingOverlay />
            <CapturePreview />
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: 'var(--system-background-secondary)',
                        color: 'var(--label-primary)',
                        border: '1px solid var(--separator-non-opaque)'
                    },
                }}
            />

            <AppHeader />

            {/* Hamburger Menu */}
            <HamburgerMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                currentView={contentView}
                onViewChange={(newView) => {
                    setContentView(newView);
                    setView('dashboard');
                }}
                captureCount={captures.length}
                flowCount={flows.length}
                onSettingsClick={() => setView('settings')}
            />

            <AnimatePresence mode="wait">
                <motion.main
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-[calc(100vh-200px)] flex flex-col"
                >
                    {view === 'settings' ? (
                        <section className="col-span-2 h-full">
                            <Settings onClose={() => setView('dashboard')} />
                        </section>
                    ) : (
                        children
                    )}
                </motion.main>
            </AnimatePresence>

            {/* Quick Flow Mode Indicator */}

            {quickFlowActive && (
                <div
                    data-tour="quick-flow-indicator"
                    className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-pulse"
                >
                    <Layers size={20} />
                    <span className="font-semibold">Quick Flow Mode</span>
                </div>
            )}
        </div>
    );
};

// Extracted Header Component
const AppHeader: React.FC = () => {
    const { setMenuOpen, contentView, setView, setContentView, searchQuery, setSearchQuery } = useUI();
    const { theme, toggleTheme } = useTheme();
    const { userProfile, loadCaptures, captures } = useCaptureStore();
    const { openReportWizard } = useGlobalModal();

    const handleNameChange = async () => {
        const newName = await input({
            title: 'Cambiar tu nombre',
            text: 'Ingresa tu nuevo nombre',
            inputValue: userProfile.name,
            inputPlaceholder: 'Tu nombre',
            confirmText: 'Guardar',
            cancelText: 'Cancelar'
        });

        if (newName && window.electron.saveUserProfile) {
            window.electron.saveUserProfile(newName.trim());
            loadCaptures();
            toast.success('Nombre actualizado exitosamente');
        }
    };

    const handleGenerateReport = () => {
        if (captures.length === 0) {
            toast.warning('¡Captura algo de evidencia primero!', 'Sin Evidencia');
            return;
        }
        openReportWizard(undefined);
    };

    return (
        <header
            className="mb-8 border-b pb-4 flex justify-between items-center relative z-40"
            style={{ borderColor: 'var(--separator-non-opaque)' }}
        >
            <div className="flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMenuOpen(true)}
                    className="p-2.5 rounded-xl transition-colors border app-no-drag"
                    style={{
                        background: 'var(--fill-secondary)',
                        borderColor: 'var(--separator-opaque)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                    data-tour="menu-btn"
                >
                    <Menu size={20} style={{ color: 'var(--label-secondary)' }} />
                </motion.button>

                <motion.button
                    onClick={() => {
                        setContentView('home');
                        setView('dashboard');
                    }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all group app-no-drag hover:shadow-lg hover:bg-gradient-to-r from-primary-50 to-transparent dark:from-gray-800 dark:to-transparent"
                >
                    <motion.img
                        src={LogoSnapProof}
                        alt="SnapProof"
                        className="w-8 h-8 rounded-lg shadow-md object-cover group-hover:shadow-xl transition-shadow"
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                    />
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{
                            fontFamily: "'Orbitron', sans-serif",
                            color: 'var(--label-primary)'
                        }}
                    >
                        SnapProof
                    </h1>
                </motion.button>
            </div>

            {/* Breadcrumb - shown when not on home */}
            {contentView !== 'home' && (
                <div className="hidden sm:flex items-center ml-4 app-no-drag">
                    <Breadcrumb />
                </div>
            )}

            {/* Search Bar - Center */}
            {contentView !== 'home' && (
                <div className="flex-1 max-w-md mx-4 hidden md:block app-no-drag">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search captures..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none transition-all shadow-sm group-hover:shadow-md"
                            style={{
                                background: 'var(--system-background-secondary)',
                                border: '1px solid var(--separator-opaque)',
                                color: 'var(--label-primary)',
                                borderRadius: 'var(--radius-base)'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'var(--system-blue)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'var(--separator-opaque)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                {contentView === 'recents' && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateReport}

                        data-tour="export-btn"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium text-sm transition-colors shadow-sm app-no-drag"
                    >
                        <FileText size={16} />
                        Export Report
                    </motion.button>
                )}

                <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${theme === 'dark'
                        ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } app-no-drag`}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                    onClick={handleNameChange}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer app-no-drag"
                >
                    <Avatar
                        size={28}
                        name={userProfile.name}
                        variant="beam"
                        colors={["#6366f1", "#818cf8", "#c7d2fe", "#e0e7ff", "#f5f3ff"]}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 pr-1">{userProfile.name}</span>
                </button>
            </div>
        </header>
    );
};
