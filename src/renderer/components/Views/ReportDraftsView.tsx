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
            logger.error('REPORT', 'Failed to load drafts', { error });
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
                logger.error('REPORT', 'Failed to delete draft', { error });
                toast.error('Error al eliminar el borrador');
            }
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--label-primary)' }}>
                    <div
                        className="p-2 rounded-lg"
                        style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                    >
                        <PenTool size={24} />
                    </div>
                    Borradores de Reportes
                </h2>

                <div className="text-sm" style={{ color: 'var(--label-secondary)' }}>
                    {drafts.length} borradores
                </div>
            </div>

            <SectionErrorBoundary title="Error al cargar borradores">
                <div className="flex-1 overflow-y-auto border rounded-xl shadow-sm" style={{ borderColor: 'var(--separator-opaque)', background: 'var(--system-background)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center h-64" style={{ color: 'var(--label-tertiary)' }}>
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                                <span>Cargando borradores...</span>
                            </div>
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--label-tertiary)' }}>
                            <div className="p-4 rounded-full" style={{ background: 'var(--fill-secondary)' }}>
                                <Edit3 size={32} className="opacity-40" />
                            </div>
                            <p>No hay borradores guardados</p>
                            <p className="text-xs" style={{ color: 'var(--label-quaternary)' }}>Usa "Guardar Borrador" en el wizard de reportes</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--separator-non-opaque)' }}>
                            {drafts.map((draft) => (
                                <div
                                    key={draft.id}
                                    className="p-4 transition-colors flex items-center gap-4 cursor-pointer group"
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-quaternary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => onLoadDraft(draft)}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                        style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                                    >
                                        <Edit3 size={24} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate text-base" style={{ color: 'var(--label-primary)' }}>{draft.title || 'Sin título'}</h4>
                                        <div className="flex items-center gap-3 text-xs mt-1.5" style={{ color: 'var(--label-secondary)' }}>
                                            <span className="flex items-center gap-1.5">
                                                <User size={13} />
                                                {draft.author || 'Sin autor'}
                                            </span>
                                            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--separator-opaque)' }}></span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={13} />
                                                {format(new Date(draft.updatedAt), 'PP p')}
                                            </span>
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider"
                                                style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                                            >
                                                {draft.captureIds?.length || 0} items
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                                            className="p-2 rounded-lg transition-colors shadow-sm border"
                                            style={{ color: 'var(--label-tertiary)', borderColor: 'transparent' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'var(--system-background)'; e.currentTarget.style.borderColor = 'var(--separator-opaque)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
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
