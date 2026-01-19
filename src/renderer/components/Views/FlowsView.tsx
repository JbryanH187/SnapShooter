
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowStore } from '../../stores/flowStore';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { FlowBadge } from '../Flows/FlowBadge';
import { Layers } from 'lucide-react';
import { CaptureFlow } from '../../../shared/types/FlowTypes';
import { logger } from '../../services/Logger';

export const FlowsView: React.FC = () => {
    const { flows, deleteFlow } = useFlowStore();
    const { openFlowEditor, openReportWizard } = useGlobalModal();

    const handleExportFlow = async (flow: CaptureFlow) => {
        // Prepare captures with resolved images for report
        // Logic adapted from App.tsx

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

    return (
        <motion.div
            key="flows"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--label-primary)' }}>
                    <Layers size={20} className="text-amber-500" />
                    Flow Badges
                </h2>
                <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                >
                    {flows.length} flujos
                </span>
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
                                    onDelete={deleteFlow}
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
