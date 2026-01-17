import React, { useEffect, useState } from 'react';
import { Modal } from '../UI/Modal';
import { FileText, Trash2, Edit3, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

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

interface ReportDraftsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadDraft: (draft: ReportDraft) => void;
}

export const ReportDraftsModal: React.FC<ReportDraftsModalProps> = ({ isOpen, onClose, onLoadDraft }) => {
    const [drafts, setDrafts] = useState<ReportDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        if (isOpen) {
            loadDrafts();
        }
    }, [isOpen]);

    const loadDrafts = async () => {
        setLoading(true);
        try {
            if ((window as any).electron?.getReportDrafts) {
                const result = await (window as any).electron.getReportDrafts();
                // Sort by updatedAt desc
                setDrafts((result || []).sort((a: ReportDraft, b: ReportDraft) => b.updatedAt - a.updatedAt));
            }
        } catch (error) {
            console.error("Failed to load drafts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.id) {
            try {
                await (window as any).electron?.deleteReportDraft?.(deleteConfirm.id);
                setDrafts(prev => prev.filter(d => d.id !== deleteConfirm.id));
            } catch (error) {
                console.error("Failed to delete draft:", error);
            }
        }
        setDeleteConfirm({ isOpen: false, id: null });
    };

    const handleSelectDraft = (draft: ReportDraft) => {
        onLoadDraft(draft);
        onClose();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onCancel={onClose}
                title="Borradores de Reportes"
                maxWidth="2xl"
                description={null}
                showFooter={false}
            >
                <div className="flex flex-col gap-4 min-h-[400px]">
                    {/* List */}
                    <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        {loading ? (
                            <div className="flex items-center justify-center h-40 text-gray-400">
                                Cargando borradores...
                            </div>
                        ) : drafts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                                <FileText size={32} className="opacity-20" />
                                <p>No hay borradores guardados</p>
                                <p className="text-xs text-gray-500">Usa "Guardar Borrador" en el wizard de reportes</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {drafts.map((draft) => (
                                    <div
                                        key={draft.id}
                                        className="p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center gap-4 cursor-pointer group"
                                        onClick={() => handleSelectDraft(draft)}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                                            <Edit3 size={20} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{draft.title || 'Sin título'}</h4>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <User size={12} />
                                                    {draft.author || 'Sin autor'}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {format(new Date(draft.updatedAt), 'PP p')}
                                                </span>
                                                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                    {draft.captureIds?.length || 0} capturas
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDeleteDraft(draft.id, e)}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirm.isOpen}
                type="danger"
                title="¿Eliminar borrador?"
                description="¿Estás seguro de que deseas eliminar este borrador? Esta acción no se puede deshacer."
                confirmText="Sí, Eliminar"
                cancelText="No, Cancelar"
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
            />
        </>
    );
};
