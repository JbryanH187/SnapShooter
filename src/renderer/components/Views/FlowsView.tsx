
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
                    logger.error("Failed to load flow image:", e);
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
