import React, { useEffect, useState } from 'react';
import { Modal } from '../UI/Modal';
import { FileText, Trash2, Edit3, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
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
            if (window.electron?.getReportDrafts) {
                const result = await window.electron.getReportDrafts();
                // Sort by updatedAt desc
                setDrafts((result || []).sort((a: ReportDraft, b: ReportDraft) => b.updatedAt - a.updatedAt));
            }
        } catch (error) {
            logger.error('REPORT', 'Failed to load drafts', { error });
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
                await window.electron?.deleteReportDraft?.(deleteConfirm.id);
                setDrafts(prev => prev.filter(d => d.id !== deleteConfirm.id));
            } catch (error) {
                logger.error('REPORT', 'Failed to delete draft', { error });
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
                    <div
                        className="flex-1 overflow-y-auto border rounded-lg"
                        style={{
                            borderColor: 'var(--separator-opaque)',
                            background: 'var(--fill-quaternary)'
                        }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-40" style={{ color: 'var(--label-tertiary)' }}>
                                Cargando borradores...
                            </div>
                        ) : drafts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'var(--label-tertiary)' }}>
                                <FileText size={32} className="opacity-20" />
                                <p>No hay borradores guardados</p>
                                <p className="text-xs" style={{ color: 'var(--label-quaternary)' }}>Usa "Guardar Borrador" en el wizard de reportes</p>
                            </div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: 'var(--separator-opaque)' }}>
                                {drafts.map((draft) => (
                                    <div
                                        key={draft.id}
                                        className="p-4 transition-colors flex items-center gap-4 cursor-pointer group"
                                        style={{ color: 'var(--label-primary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--system-background)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => handleSelectDraft(draft)}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                                        >
                                            <Edit3 size={20} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate" style={{ color: 'var(--label-primary)' }}>{draft.title || 'Sin título'}</h4>
                                            <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--label-secondary)' }}>
                                                <span className="flex items-center gap-1">
                                                    <User size={12} />
                                                    {draft.author || 'Sin autor'}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {format(new Date(draft.updatedAt), 'PP p')}
                                                </span>
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                                    style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                                                >
                                                    {draft.captureIds?.length || 0} capturas
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDeleteDraft(draft.id, e)}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ color: 'var(--label-tertiary)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 10%, transparent)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
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
