import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from 'boring-avatars';
import './styles/index.css';
import { CaptureOverlay } from './components/Overlay/CaptureOverlay';
import { useCaptureStore } from './stores/captureStore';
import LogoSnapProof from '../assets/LogoSnapProof.jpg';
import OnlyEyesSnapProof from '../assets/OnlyEyesSnapProof.jpg';
import { toast, confirm, input } from './utils/toast';

// Type definition for window.electron


import { ReportGenerator } from '../shared/reporting/ReportGenerator';
import { ImageEditorModal } from './components/Editor/ImageEditorModal';
import { Settings } from './pages/Settings';
import { ReportWizardModal } from './components/Reporting/ReportWizardModal';
import { ReportsHistoryView } from './components/Views/ReportsHistoryView';
import { ReportDraftsView, ReportDraft } from './components/Views/ReportDraftsView';
import { Onboarding } from './pages/Onboarding';
import { HomePage } from './pages/HomePage';
import { Modal } from './components/UI/Modal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { FlowBadge } from './components/Flows/FlowBadge';
import { FlowEditorModal } from './components/Flows/FlowEditorModal';
import { HamburgerMenu, ViewType } from './components/Layout/HamburgerMenu';
import { CaptureFlow } from '../shared/types/FlowTypes';
import { Trash2, FileText, Settings as SettingsIcon, Camera, LayoutGrid, CheckCircle, XCircle, Search, Moon, Sun, History, Edit3, Layers, Menu } from 'lucide-react';

const App: React.FC = () => {
    // Store
    const {
        captures,
        currentCapture,
        userProfile,
        addCapture,
        updateCapture,
        deleteCapture,
        clearAllCaptures,
        setCurrentCapture,
        loadCaptures
    } = useCaptureStore();

    // Local State
    const [editingCapture, setEditingCapture] = useState<any>(null);
    const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
    const [contentView, setContentView] = useState<ViewType>('home');
    const [menuOpen, setMenuOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState<ReportDraft | null>(null);

    // Flows state
    const [flows, setFlows] = useState<CaptureFlow[]>([]);
    const [flowEditorOpen, setFlowEditorOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<CaptureFlow | null>(null);
    const [quickFlowActive, setQuickFlowActive] = useState(false);
    const [pendingFlow, setPendingFlow] = useState<{ id: string; captures: any[] } | null>(null);
    const [reportCaptures, setReportCaptures] = useState<any[] | null>(null);

    useEffect(() => {
        loadCaptures();

        if ((window as any).electron?.onCaptureComplete) {
            const removeListener = (window as any).electron.onCaptureComplete((data: { id: string, thumbnail: string, metadata: any }) => {
                console.log("Capture received:", data.id);
                setCurrentCapture({
                    id: data.id,
                    thumbnail: data.thumbnail,
                    timestamp: Date.now(),
                    title: '',
                    description: '',
                    status: 'pending',
                    metadata: data.metadata
                });
            });
            return () => removeListener();
        }
    }, [setCurrentCapture, loadCaptures]);

    // Load flows on mount
    useEffect(() => {
        const loadFlows = async () => {
            if ((window as any).electron?.getFlows) {
                const savedFlows = await (window as any).electron.getFlows();
                setFlows(savedFlows || []);
            }
        };
        loadFlows();
    }, []);

    // Quick Flow mode listeners
    useEffect(() => {
        const electron = (window as any).electron;
        if (!electron) return;

        // Listen for mode changes
        const removeModeListener = electron.onQuickFlowModeChange?.((active: boolean) => {
            setQuickFlowActive(active);
        });

        // Listen for flow complete event
        const removeCompleteListener = electron.onQuickFlowComplete?.((data: { id: string; captures: any[] }) => {
            if (data.captures.length > 0) {
                // Create a new flow and open editor
                const newFlow: CaptureFlow = {
                    id: data.id,
                    name: '',
                    captures: data.captures,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                setEditingFlow(newFlow);
                setFlowEditorOpen(true);
            }
        });

        return () => {
            removeModeListener?.();
            removeCompleteListener?.();
        };
    }, []);


    const handleSaveEdit = (id: string, newThumbnail: string) => {
        updateCapture(id, {
            thumbnail: newThumbnail,
            status: 'saved' // Ensure status is valid
        });
        setEditingCapture(null);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: '¿Eliminar captura?',
            text: '¿Estás seguro? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            deleteCapture(id);
            setEditingCapture(null);
            toast.success('Captura eliminada exitosamente');
        }
    };

    const handleGenerateReport = async () => {
        if (captures.length === 0) {
            toast.warning('¡Captura algo de evidencia primero!', 'Sin Evidencia');
            return;
        }
        setReportCaptures(null);
        setReportModalOpen(true);
    };

    const handleExportFlow = async (flow: CaptureFlow) => {
        const flowCapturesPromises = flow.captures.map(async fc => {
            let thumbnail = `media://${fc.imagePath.split(/[\\/]/).pop()}`;

            // Attempt to resolve to Base64 for Report Generation
            if (window.electron?.readImage) {
                try {
                    const base64Image = await window.electron.readImage(thumbnail);
                    if (base64Image) {
                        thumbnail = base64Image;
                    }
                } catch (e) {
                    console.error("Failed to load flow image:", e);
                }
            }

            return {
                id: fc.id,
                thumbnail: thumbnail,
                timestamp: fc.createdAt,
                title: fc.title,
                description: fc.description,
                status: 'success',
                metadata: {}
            };
        });

        const flowCaptures = await Promise.all(flowCapturesPromises);
        setReportCaptures(flowCaptures);
        setReportModalOpen(true);
    };

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

    const handleDeleteCapture = async (captureId: string) => {
        const confirmed = await confirm({
            title: '¿Eliminar captura?',
            text: '¿Estás seguro de que deseas eliminar esta captura? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            try {
                await window.electron.deleteCapture(captureId);
                await loadCaptures(); // Reload captures from storage
                toast.success('Captura eliminada exitosamente');
            } catch (error) {
                console.error('Failed to delete capture:', error);
                toast.error('Error al eliminar la captura');
            }
        }
    };


    // Flow handlers
    const handleSaveFlow = async (flow: CaptureFlow) => {
        if ((window as any).electron?.saveFlow) {
            await (window as any).electron.saveFlow(flow);
            // Update local state
            setFlows(prev => {
                const idx = prev.findIndex(f => f.id === flow.id);
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = flow;
                    return updated;
                } else {
                    return [...prev, flow];
                }
            });
        }
        setFlowEditorOpen(false);
        setEditingFlow(null);
    };

    const handleDeleteFlow = async (flowId: string) => {
        if ((window as any).electron?.deleteFlow) {
            await (window as any).electron.deleteFlow(flowId);
            setFlows(prev => prev.filter(f => f.id !== flowId));
        }
    };

    const handleEditFlow = (flow: CaptureFlow) => {
        setEditingFlow(flow);
        setFlowEditorOpen(true);
    };

    // Rendering
    if (!userProfile.initialized) {
        return <Onboarding />;
    }

    return (
        <ThemeProvider>
            <AppContent
                captures={captures}
                currentCapture={currentCapture}
                userProfile={userProfile}
                view={view}
                setView={setView}
                contentView={contentView}
                setContentView={setContentView}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                editingCapture={editingCapture}
                setEditingCapture={setEditingCapture}
                reportModalOpen={reportModalOpen}
                setReportModalOpen={setReportModalOpen}
                handleDelete={handleDelete}
                handleGenerateReport={handleGenerateReport}
                handleNameChange={handleNameChange}
                updateCapture={updateCapture}
                setCurrentCapture={setCurrentCapture}
                handleSaveEdit={handleSaveEdit}
                clearAllCaptures={clearAllCaptures}
                handleClearAll={async () => {
                    const confirmed = await confirm({
                        title: '¿Limpiar toda la evidencia?',
                        text: '¿Estás seguro de que deseas eliminar todas las capturas? Esta acción no se puede deshacer.',
                        confirmText: 'Sí, Eliminar Todo',
                        cancelText: 'Cancelar',
                        type: 'danger'
                    });
                    if (confirmed) {
                        clearAllCaptures();
                        toast.success('Evidencia limpiada exitosamente');
                    }
                }}
                selectedDraft={selectedDraft}
                setSelectedDraft={setSelectedDraft}
                flows={flows}
                flowEditorOpen={flowEditorOpen}
                setFlowEditorOpen={setFlowEditorOpen}
                editingFlow={editingFlow}
                setEditingFlow={setEditingFlow}
                quickFlowActive={quickFlowActive}
                handleSaveFlow={handleSaveFlow}
                handleDeleteFlow={handleDeleteFlow}
                handleEditFlow={handleEditFlow}
                handleExportFlow={handleExportFlow}
                reportCaptures={reportCaptures}
                setReportCaptures={setReportCaptures}
                handleDeleteCapture={handleDeleteCapture}
            />
        </ThemeProvider>
    );
};

// AppContent component that can use useTheme
const AppContent: React.FC<any> = ({
    handleExportFlow,
    reportCaptures,
    setReportCaptures,
    handleDeleteCapture,
    captures,
    currentCapture,
    userProfile,
    view,
    setView,
    contentView,
    setContentView,
    menuOpen,
    setMenuOpen,
    editingCapture,
    setEditingCapture,
    reportModalOpen,
    setReportModalOpen,
    handleDelete,
    handleGenerateReport,
    handleNameChange,
    updateCapture,
    setCurrentCapture,
    handleSaveEdit,
    clearAllCaptures,
    handleClearAll,
    selectedDraft,
    setSelectedDraft,
    flows,
    flowEditorOpen,
    setFlowEditorOpen,
    editingFlow,
    setEditingFlow,
    quickFlowActive,
    handleSaveFlow,
    handleDeleteFlow,
    handleEditFlow
}) => {
    const { theme, toggleTheme } = useTheme();

    // Update Electron Window Overlay Style when theme changes
    useEffect(() => {
        if (window.electron?.setOverlayStyle) {
            if (theme === 'dark') {
                // Dark Mode: Dark background, White symbols
                window.electron.setOverlayStyle({ color: '#1f2937', symbolColor: '#ffffff' });
            } else {
                // Light Mode: Light background (gray-50), Dark symbols
                // Using #f9fafb (gray-50) to match body background, or #fcfcfd (main background)
                window.electron.setOverlayStyle({ color: '#f9fafb', symbolColor: '#1f2937' });
            }
        }
    }, [theme]);

    return (
        <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-primary-100 selection:text-primary-900 transition-colors duration-200">
            {/* Window Drag Handle - Covers top padding area */}
            <div className="fixed top-0 left-0 right-0 h-8 z-50 app-drag" />

            <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 flex justify-between items-center relative z-40">
                <div className="flex items-center gap-4">
                    {/* Menu Toggle Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMenuOpen(true)}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-200 dark:border-gray-700 app-no-drag"
                    >
                        <Menu size={20} className="text-gray-600 dark:text-gray-400" />
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                            SnapProof
                        </h1>
                    </motion.button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Export Report Button - Only for Recents */}
                    {contentView === 'recents' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGenerateReport}
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
                        onClick={() => setNameModalOpen(true)}
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
                        <>
                            {/* Main Content Area */}
                            <section className="flex-1 flex flex-col overflow-hidden">
                                <div className="card h-full flex flex-col overflow-hidden border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900">
                                    <AnimatePresence mode="wait">
                                        {contentView === 'home' && (
                                            <motion.div
                                                key="home"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="h-full"
                                            >
                                                <HomePage />
                                            </motion.div>
                                        )}

                                        {contentView === 'recents' && (
                                            <motion.div
                                                key="recents"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-1 flex flex-col overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                        <Camera size={20} className="text-primary-500" />
                                                        Recents
                                                    </h2>
                                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        {captures.length} capturas
                                                    </span>
                                                </div>

                                                {captures.length === 0 ? (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-800/30 p-8 text-center"
                                                    >
                                                        <img
                                                            src={OnlyEyesSnapProof}
                                                            alt="No captures"
                                                            className="w-32 h-32 object-contain mb-6 opacity-60 dark:opacity-60 rounded-full"
                                                        />
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No captures yet</h3>
                                                        <p className="text-sm mb-6 max-w-xs mx-auto text-gray-500 dark:text-gray-400">Your captured evidence will appear here properly organized.</p>
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm text-gray-600 dark:text-gray-300">
                                                            <span>Press</span>
                                                            <kbd className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-xs font-mono">Ctrl+Shift+1</kbd>
                                                            <span>to start</span>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto content-start pr-2 pb-4">
                                                        <AnimatePresence>
                                                            {captures.map((c, index) => (
                                                                <motion.div
                                                                    layout
                                                                    key={c.id}
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    className={`flex flex-col p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all group relative
                                                                        ${c.status === 'success' ? 'border-l-4 border-l-success-500' : ''}
                                                                        ${c.status === 'failure' ? 'border-l-4 border-l-error-500' : ''}
                                                                    `}
                                                                >
                                                                    {/* Step Badge */}
                                                                    <div className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10 border-2 border-white
                                                                        ${c.status === 'success' ? 'bg-success-500 text-white' :
                                                                            c.status === 'failure' ? 'bg-error-500 text-white' : 'bg-gray-800 text-white'
                                                                        }
                                                                    `}>
                                                                        {index + 1}
                                                                    </div>

                                                                    {/* Thumbnail */}
                                                                    <div
                                                                        className="relative cursor-pointer mb-3"
                                                                        onClick={() => setEditingCapture(c)}
                                                                    >
                                                                        <img src={c.thumbnail} className="w-full h-32 object-cover rounded-lg bg-gray-100 border border-gray-200" />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                                                                            <span className="bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm">Edit</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate text-sm">{c.title || 'Untitled Capture'}</h3>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{c.description || 'No description.'}</p>
                                                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                                                                            {new Date(c.timestamp).toLocaleTimeString()}
                                                                        </span>
                                                                    </div>

                                                                    {/* Status Toggles */}
                                                                    <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-700 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); updateCapture(c.id, { status: 'success' }); }}
                                                                            className={`p-1 rounded-md hover:bg-success-50 dark:hover:bg-success-900/30 transition-colors ${c.status === 'success' ? 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/30' : 'text-gray-300 dark:text-gray-500 hover:text-success-600 dark:hover:text-success-400'}`}
                                                                            title="Mark as Success"
                                                                        >
                                                                            <CheckCircle size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); updateCapture(c.id, { status: 'failure' }); }}
                                                                            className={`p-1 rounded-md hover:bg-error-50 dark:hover:bg-error-900/30 transition-colors ${c.status === 'failure' ? 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/30' : 'text-gray-300 dark:text-gray-500 hover:text-error-600 dark:hover:text-error-400'}`}
                                                                            title="Mark as Failure"
                                                                        >
                                                                            <XCircle size={14} />
                                                                        </button>
                                                                    </div>

                                                                    {/* Delete Button */}
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            await handleDeleteCapture(c.id);
                                                                        }}
                                                                        className="absolute top-3 right-3 p-1.5 text-gray-300 dark:text-gray-600 hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                                        title="Delete Capture"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </motion.div>
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                        {contentView === 'flows' && (
                                            <motion.div
                                                key="flows"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-1 flex flex-col overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                        <Layers size={20} className="text-amber-500" />
                                                        Flow Badges
                                                    </h2>
                                                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                        {flows.length} flujos
                                                    </span>
                                                </div>

                                                {flows.length === 0 ? (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-800/30 p-8 text-center"
                                                    >
                                                        <Layers size={64} className="mb-6 opacity-40" />
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No flows yet</h3>
                                                        <p className="text-sm mb-6 max-w-xs mx-auto text-gray-500 dark:text-gray-400">Create flows by using Quick Flow mode to capture a sequence of steps.</p>
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm text-gray-600 dark:text-gray-300">
                                                            <span>Press</span>
                                                            <kbd className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-xs font-mono">Ctrl+Shift+Q</kbd>
                                                            <span>for Quick Flow</span>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto content-start pr-2 pb-4">
                                                        <AnimatePresence>
                                                            {flows.map((flow) => (
                                                                <motion.div
                                                                    key={flow.id}
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <FlowBadge
                                                                        flow={flow}
                                                                        onEdit={handleEditFlow}
                                                                        onDelete={handleDeleteFlow}
                                                                        onExport={handleExportFlow}
                                                                    />
                                                                </motion.div>
                                                            ))}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                        {contentView === 'history' && (
                                            <motion.div
                                                key="history"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-1 overflow-hidden p-6"
                                            >
                                                <ReportsHistoryView />
                                            </motion.div>
                                        )}
                                        {contentView === 'drafts' && (
                                            <motion.div
                                                key="drafts"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-1 overflow-hidden p-6"
                                            >
                                                <ReportDraftsView
                                                    onLoadDraft={(draft) => {
                                                        setSelectedDraft(draft);
                                                        setReportModalOpen(true);
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </section>

                            {/* Footer with Counter and Clear All */}
                            <footer className="mt-4 flex items-center justify-between px-1">
                                {(contentView === 'recents' || contentView === 'flows') && (
                                    <motion.span
                                        key={contentView === 'recents' ? captures.length : flows.length}
                                        initial={{ scale: 1.2, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-sm text-gray-500 dark:text-gray-400 font-medium"
                                    >
                                        {contentView === 'recents'
                                            ? `${captures.length} ${captures.length === 1 ? 'captura' : 'capturas'}`
                                            : `${flows.length} ${flows.length === 1 ? 'flujo' : 'flujos'}`
                                        }
                                    </motion.span>
                                )}

                                {contentView === 'recents' && captures.length > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleClearAll}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Clear All Evidence
                                    </motion.button>
                                )}
                            </footer>
                        </>
                    )}
                </motion.main>
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {currentCapture && <CaptureOverlay />}
            </AnimatePresence>

            {
                reportModalOpen && (
                    <ReportWizardModal
                        isOpen={reportModalOpen}
                        onClose={() => {
                            setReportModalOpen(false);
                            setSelectedDraft(null); // Clear selected draft when closing
                            setReportCaptures(null);
                        }}
                        captures={reportCaptures || captures}
                        authorName={userProfile?.name || 'Unknown User'}
                        initialDraft={selectedDraft}
                    />
                )
            }




            {
                editingCapture && (
                    <ImageEditorModal
                        capture={editingCapture}
                        onClose={() => setEditingCapture(null)}
                        onSave={handleSaveEdit}
                        onDelete={handleDelete}
                    />
                )
            }





            {/* Flow Editor Modal */}
            <FlowEditorModal
                isOpen={flowEditorOpen}
                flow={editingFlow}
                onClose={() => {
                    setFlowEditorOpen(false);
                    setEditingFlow(null);
                }}
                onSave={handleSaveFlow}
            />

            {/* Quick Flow Mode Indicator */}
            {
                quickFlowActive && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-pulse">
                        <Layers size={20} />
                        <span className="font-semibold">Quick Flow Mode</span>
                        <span className="text-sm opacity-80">Ctrl+Shift+C para capturar</span>
                    </div>
                )
            }
        </div >
    );
};

export default App;
