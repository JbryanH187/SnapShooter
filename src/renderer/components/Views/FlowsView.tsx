
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowStore } from '../../stores/flowStore';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { useUI } from '../../contexts/UIContext';
import { FlowBadge } from '../Flows/FlowBadge';
import { Layers, Search, ArrowUpDown, RefreshCw, Sparkles, PlusCircle, Trash2, Camera } from 'lucide-react';
import { CaptureFlow } from '../../../shared/types/FlowTypes';
import { logger } from '../../services/Logger';
import toast from 'react-hot-toast';

export const FlowsView: React.FC = () => {
    const { flows, deleteFlow, loadFlows, continueFlowInRecents } = useFlowStore();
    const { openFlowEditor, openReportWizard } = useGlobalModal();
    const { setContentView } = useUI();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'steps' | 'name'>('recent');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadFlows();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleContinueInRecents = async (flow: CaptureFlow) => {
        try {
            await continueFlowInRecents(flow);
            setContentView('recents');
            toast.success(`Flujo "${flow.name}" cargado en Recientes. Puedes continuar capturando.`);
        } catch (error) {
            toast.error('Error al cargar el flujo en Recientes');
            logger.error('CAPTURE', 'Failed to continue flow in recents', { error });
        }
    };

    const handleExportFlow = async (flow: CaptureFlow) => {
        const flowCapturesPromises = flow.captures.map(async fc => {
            let thumbnail = fc.imagePath;

            if (window.electron?.readImage) {
                try {
                    const base64Image = await window.electron.readImage(thumbnail);
                    if (base64Image) {
                        thumbnail = base64Image;
                    }
                } catch (e) {
                    logger.error('CAPTURE', 'Failed to load flow image', { error: e });
                }
            }

            return {
                id: fc.id,
                thumbnail: thumbnail,
                timestamp: fc.createdAt,
                title: fc.title,
                description: fc.description,
                status: 'success' as const,
                metadata: {}
            };
        });

        const reportCaptures = await Promise.all(flowCapturesPromises);
        openReportWizard(reportCaptures);
    };

    // Delete Confirmation State
    const [flowToDelete, setFlowToDelete] = useState<string | null>(null);

    // Quick Flow State Tracker
    const [quickFlowActive, setQuickFlowActive] = useState(false);

    React.useEffect(() => {
        const electron = window.electron;
        if (!electron) return;
        
        const removeModeListener = electron.onQuickFlowModeChange?.((active: boolean) => {
            setQuickFlowActive(active);
        });
        
        return () => {
            if (removeModeListener) removeModeListener();
        };
    }, []);

    const checkDeleteFlow = (id: string) => {
        setFlowToDelete(id);
    };

    const confirmDeleteFlow = async () => {
        if (flowToDelete) {
            await deleteFlow(flowToDelete);
            toast.success('Flujo eliminado correctamente');
            setFlowToDelete(null);
        }
    };

    // Filter & Sort Flows
    const filteredFlows = useMemo(() => {
        let result = flows.filter(flow =>
            (flow.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
        );

        if (sortBy === 'recent') {
            result = [...result].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        } else if (sortBy === 'steps') {
            result = [...result].sort((a, b) => (b.captures?.length || 0) - (a.captures?.length || 0));
        } else if (sortBy === 'name') {
            result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        return result;
    }, [flows, searchQuery, sortBy]);

    const totalStepsCount = useMemo(() => {
        return flows.reduce((sum, f) => sum + (f.captures?.length || 0), 0);
    }, [flows]);

    return (
        <motion.div
            key="flows"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden p-6"
        >
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {flowToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-black/10 dark:border-white/10"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
                                <Trash2 size={26} />
                            </div>

                            <h3 className="text-lg font-bold text-center mb-1.5" style={{ color: 'var(--label-primary)' }}>
                                ¿Eliminar Flujo?
                            </h3>
                            <p className="text-center text-xs mb-6 opacity-70" style={{ color: 'var(--label-secondary)' }}>
                                Esta acción eliminará permanentemente este flujo y sus capturas guardadas.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFlowToDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold text-xs transition-colors hover:bg-gray-100 dark:hover:bg-white/5 border border-black/5 dark:border-white/10"
                                    style={{ color: 'var(--label-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteFlow}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-red-500 hover:bg-red-600 transition-all shadow-md active:scale-95"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header with Search & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{
                            background: 'linear-gradient(135deg, var(--system-orange), #f97316)',
                            color: '#fff'
                        }}
                    >
                        <Layers size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--label-primary)' }}>
                                Storage
                            </h2>
                            <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                style={{
                                    background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)',
                                    color: 'var(--system-orange)'
                                }}
                            >
                                {flows.length} {flows.length === 1 ? 'flujo' : 'flujos'}
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--label-secondary)' }}>
                            {totalStepsCount} pasos totales almacenados
                        </p>
                    </div>
                </div>

                {/* Right controls: Search, Sort & Refresh */}
                <div className="flex items-center gap-2 flex-wrap">
                    {flows.length > 0 && (
                        <div className="relative flex items-center">
                            <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar flujo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all w-36 sm:w-44"
                                style={{
                                    borderColor: 'var(--separator-opaque)',
                                    color: 'var(--label-primary)'
                                }}
                            />
                        </div>
                    )}

                    {flows.length > 1 && (
                        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border" style={{ borderColor: 'var(--separator-opaque)' }}>
                            <button
                                onClick={() => setSortBy('recent')}
                                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                                    sortBy === 'recent'
                                        ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-600 dark:text-amber-400'
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                                title="Ordenar por más recientes"
                            >
                                Recientes
                            </button>
                            <button
                                onClick={() => setSortBy('steps')}
                                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                                    sortBy === 'steps'
                                        ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-600 dark:text-amber-400'
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                                title="Ordenar por cantidad de pasos"
                            >
                                Pasos
                            </button>
                            <button
                                onClick={() => setSortBy('name')}
                                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                                    sortBy === 'name'
                                        ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-600 dark:text-amber-400'
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                                title="Ordenar alfabéticamente"
                            >
                                A-Z
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleRefresh}
                        className={`p-2 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 ${
                            isRefreshing ? 'animate-spin' : ''
                        }`}
                        style={{
                            borderColor: 'var(--separator-opaque)',
                            color: 'var(--label-secondary)'
                        }}
                        title="Actualizar Storage"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {flows.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-8"
                >
                    {/* Animated Logo with Ambient Glow */}
                    <motion.div
                        className="relative mb-6"
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <div
                            className="absolute inset-0 rounded-full blur-3xl opacity-30"
                            style={{ background: 'var(--system-orange)', transform: 'scale(1.4)' }}
                        />
                        <div
                            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl border relative"
                            style={{
                                background: 'linear-gradient(135deg, color-mix(in srgb, var(--system-orange) 20%, transparent), color-mix(in srgb, var(--system-orange) 5%, transparent))',
                                borderColor: 'color-mix(in srgb, var(--system-orange) 30%, transparent)'
                            }}
                        >
                            <Layers size={48} style={{ color: 'var(--system-orange)' }} />
                        </div>
                    </motion.div>

                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--label-primary)' }}>
                        Tu Storage está vacío
                    </h3>

                    <p className="text-xs mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--label-secondary)' }}>
                        Guarda tus secuencias de evidencias en Storage para organizarlas, crear reportes o continuarlas en cualquier momento.
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl cursor-default border shadow-sm backdrop-blur-md"
                        style={{
                            background: 'color-mix(in srgb, var(--system-orange) 10%, var(--fill-secondary))',
                            borderColor: 'color-mix(in srgb, var(--system-orange) 25%, transparent)'
                        }}
                    >
                        <span className="text-xs" style={{ color: 'var(--label-secondary)' }}>
                            {quickFlowActive ? 'Capturar paso:' : 'Iniciar Quick Flow:'}
                        </span>
                        <kbd
                            className="font-bold px-2 py-0.5 rounded-lg text-xs font-mono shadow-sm"
                            style={{
                                color: 'var(--system-orange)',
                                background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--system-orange) 35%, transparent)'
                            }}
                        >
                            {quickFlowActive ? 'Ctrl+Shift+C' : 'Ctrl+Shift+Q'}
                        </kbd>
                    </motion.div>
                </motion.div>
            ) : filteredFlows.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Search size={36} className="text-gray-400 mb-3 opacity-60" />
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--label-primary)' }}>
                        No se encontraron flujos
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--label-secondary)' }}>
                        No hay resultados para "{searchQuery}". Intenta con otro término.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 overflow-y-auto content-start pr-2 pb-8 flex-1">
                    <AnimatePresence>
                        {filteredFlows.map((flow: CaptureFlow) => (
                            <motion.div
                                key={flow.id}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.94 }}
                                transition={{ duration: 0.2 }}
                            >
                                <FlowBadge
                                    flow={flow}
                                    onEdit={openFlowEditor}
                                    onDelete={checkDeleteFlow}
                                    onExport={handleExportFlow}
                                    onContinueInRecents={handleContinueInRecents}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};
