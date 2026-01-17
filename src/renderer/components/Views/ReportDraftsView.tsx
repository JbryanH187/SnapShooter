import React, { useEffect, useState } from 'react';
import { toast, confirm } from '../../utils/toast';
import { FileText, Trash2, Edit3, Calendar, Clock, User, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { SectionErrorBoundary } from '../ErrorBoundaries/SectionErrorBoundary';
import { logger } from '../../services/Logger';

export interface ReportDraft {
    id: string;
    title: string;
    subtitle: string;
    projectName?: string;
    author: string;
    captureIds: string[]; // IDs of captures included in this draft
    config: any; // Full config object
    createdAt: number;
    updatedAt: number;
}

interface ReportDraftsViewProps {
    onLoadDraft: (draft: ReportDraft) => void;
}

export const ReportDraftsView: React.FC<ReportDraftsViewProps> = ({ onLoadDraft }) => {
    const [drafts, setDrafts] = useState<ReportDraft[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDrafts();
    }, []);

    const loadDrafts = async () => {
        setLoading(true);
        try {
            if (window.electron?.getReportDrafts) {
                const result = await window.electron.getReportDrafts();
                // Sort by updatedAt desc
                setDrafts((result || []).sort((a: ReportDraft, b: ReportDraft) => b.updatedAt - a.updatedAt));
            }
        } catch (error) {
            logger.error("Failed to load drafts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const confirmed = await confirm({
            title: '¿Eliminar borrador?',
            text: '¿Estás seguro de que deseas eliminar este borrador? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            try {
                await window.electron?.deleteReportDraft?.(id);
                setDrafts(prev => prev.filter(d => d.id !== id));
                toast.success('Borrador eliminado exitosamente');
            } catch (error) {
                logger.error("Failed to delete draft:", error);
                toast.error('Error al eliminar el borrador');
            }
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header / Title */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                        <PenTool size={24} />
                    </div>
                    Borradores de Reportes
                </h2>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {drafts.length} borradores
                </div>
            </div>

            {/* List */}
            <SectionErrorBoundary title="Error al cargar borradores">
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                <span>Cargando borradores...</span>
                            </div>
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
                                <Edit3 size={32} className="opacity-40" />
                            </div>
                            <p>No hay borradores guardados</p>
                            <p className="text-xs text-gray-500">Usa "Guardar Borrador" en el wizard de reportes</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    className="p-4 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center gap-4 cursor-pointer group"
                                    onClick={() => onLoadDraft(draft)}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 shadow-sm">
                                        <Edit3 size={24} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">{draft.title || 'Sin título'}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                                            <span className="flex items-center gap-1.5">
                                                <User size={13} />
                                                {draft.author || 'Sin autor'}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={13} />
                                                {format(new Date(draft.updatedAt), 'PP p')}
                                            </span>
                                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                                {draft.captureIds?.length || 0} items
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                            title="Eliminar borrador"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SectionErrorBoundary>
        </div>
    );
};
