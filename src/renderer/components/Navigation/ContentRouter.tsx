
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUI } from '../../contexts/UIContext';
import { useCaptureStore } from '../../stores/captureStore';
import { useFlowStore } from '../../stores/flowStore';
import { HomePage } from '../../pages/HomePage';
import { RecentsView } from '../Views/RecentsView';
import { FlowsView } from '../Views/FlowsView';
import { ReportsHistoryView } from '../Views/ReportsHistoryView';
import { ReportDraftsView } from '../Views/ReportDraftsView';
import { SmartFoldersList } from '../Views/SmartFoldersList';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { Trash2 } from 'lucide-react';
import { confirm, toast } from '../../utils/toast';

export const ContentRouter: React.FC = () => {
    const { contentView } = useUI();
    const { captures, clearAllCaptures } = useCaptureStore();
    const { flows } = useFlowStore();
    const { openReportWizard } = useGlobalModal();

    const handleClearAll = async () => {
        const confirmed = await confirm({
            title: '¿Limpiar toda la evidencia?',
            text: '¿Estás seguro de que deseas eliminar todas las capturas? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar Todo',
            cancelText: 'Cancelar',
            type: 'danger'
        });
        if (confirmed) {
            await clearAllCaptures();
            toast.success('Evidencia limpiada exitosamente');
        }
    };

    return (
        <>
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

                        {contentView === 'recents' && <RecentsView />}
                        {contentView === 'flows' && <FlowsView />}

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
                                        openReportWizard(undefined, draft);
                                    }}
                                />
                            </motion.div>
                        )}

                        {/* Smart Folders - check if contentView is a folder ID */}
                        {!['home', 'recents', 'flows', 'history', 'drafts'].includes(contentView) && (
                            <motion.div
                                key={contentView}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 overflow-hidden"
                            >
                                <SmartFoldersList folderId={contentView} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Footer with Counter and Clear All */}
            <footer className="mt-4 flex items-center justify-between px-1">
                {(contentView === 'recents' || contentView === 'flows') && (
                    <motion.span
                        key={contentView === 'recents' ? 'captures' : 'flows'}
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
    );
};
