
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowStore } from '../../stores/flowStore';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { FlowBadge } from '../Flows/FlowBadge';
import { Layers } from 'lucide-react';
import { CaptureFlow } from '../../../shared/types/FlowTypes';
import { logger } from '../../services/Logger';

export const FlowsView: React.FC = () => {
    const { flows, deleteFlow, loadFlows } = useFlowStore();
    const { openFlowEditor, openReportWizard } = useGlobalModal();
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadFlows();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const handleExportFlow = async (flow: CaptureFlow) => {
        // Prepare captures with resolved images for report
        // Logic adapted from App.tsx

        const flowCapturesPromises = flow.captures.map(async fc => {
            let thumbnail = fc.imagePath;

            // Attempt to resolve to Base64 for Report Generation
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
                status: 'success',
                metadata: {}
            };
        });

        const reportCaptures = await Promise.all(flowCapturesPromises);
        openReportWizard(reportCaptures);
    };

    // Delete Confirmation State
    const [flowToDelete, setFlowToDelete] = React.useState<string | null>(null);

    const checkDeleteFlow = (id: string) => {
        setFlowToDelete(id);
    };

    const confirmDeleteFlow = async () => {
        if (flowToDelete) {
            await deleteFlow(flowToDelete);
            setFlowToDelete(null);
        }
    };

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
            {/* Using the standard Modal but we can custom style it if needed, Modal already supports LiquidGlass */}
            <React.Fragment>
                {/* 
                   We need to make sure we import Modal if we use it directly or 
                   use the Confirm Dialog utility. But user asked for a modal with rounded corners.
                   The existing 'confirm' utility might use native dialogs or a simple component.
                   Let's use a custom lightweight modal prompt here or the GlobalModal if available.
                   Actually, let's use the 'Modal' component we have since it has the updated Liquid design.
                 */}
                {flowToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-white/20"
                            style={{
                                boxShadow: '0 20px 60px -10px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </div>

                            <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--label-primary)' }}>¿Eliminar Flujo?</h3>
                            <p className="text-center text-sm mb-6 opacity-70">
                                Esta acción no se puede deshacer. Se eliminarán todas las capturas asociadas.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFlowToDelete(null)}
                                    className="flex-1 py-3 rounded-2xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                                    style={{ color: 'var(--label-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteFlow}
                                    className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </React.Fragment>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--label-primary)' }}>
                    <Layers size={20} className="text-amber-500" />
                    Storage
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className={`p-1.5 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{ color: 'var(--label-secondary)' }}
                        title="Refresh Storage"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                        </svg>
                    </button>
                    <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                    >
                        {flows.length} flujos
                    </span>
                </div>
            </div>

            {flows.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center"
                >
                    {/* Animated Logo with Glow */}
                    <motion.div
                        className="relative mb-8"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {/* Glow Effect */}
                        <div
                            className="absolute inset-0 rounded-full blur-2xl opacity-30"
                            style={{ background: 'var(--system-orange)', transform: 'scale(1.2)' }}
                        />
                        <Layers size={80} style={{ color: 'var(--system-orange)', opacity: 0.8 }} />
                    </motion.div>

                    {/* Title */}
                    <h3
                        className="text-2xl font-bold mb-3"
                        style={{ color: 'var(--label-primary)' }}
                    >
                        No tienes flujos aún
                    </h3>

                    {/* Description */}
                    <p
                        className="text-base mb-8 max-w-sm mx-auto leading-relaxed"
                        style={{ color: 'var(--label-secondary)' }}
                    >
                        Crea flujos capturando secuencias de pasos con el modo Quick Flow.
                    </p>

                    {/* Keyboard Shortcut Pill */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl cursor-default"
                        style={{
                            background: 'color-mix(in srgb, var(--system-orange) 10%, var(--fill-secondary))',
                            border: '1px solid color-mix(in srgb, var(--system-orange) 20%, transparent)'
                        }}
                    >
                        <span style={{ color: 'var(--label-secondary)' }}>Presiona</span>
                        <kbd
                            className="font-bold px-2.5 py-1 rounded-lg text-xs font-mono"
                            style={{
                                color: 'var(--system-orange)',
                                background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--system-orange) 30%, transparent)'
                            }}
                        >Ctrl+Shift+Q</kbd>
                        <span style={{ color: 'var(--label-secondary)' }}>para Quick Flow</span>
                    </motion.div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto content-start pr-2 pb-4">
                    <AnimatePresence>
                        {flows.map((flow: CaptureFlow) => (
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
                                    onEdit={openFlowEditor}
                                    onDelete={checkDeleteFlow}
                                    onExport={handleExportFlow}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};
