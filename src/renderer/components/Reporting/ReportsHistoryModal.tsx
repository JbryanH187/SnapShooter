import { Modal } from '../UI/Modal';
import React, { useEffect, useState } from 'react';
import { FileText, Trash2, ExternalLink, Calendar, Search, File } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '../../services/Logger';

export interface ReportHistoryItem {
    id: string;
    title: string;
    filePath: string;
    date: number; // timestamp
    author: string;
    format: 'pdf' | 'docx';
}

interface ReportsHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportsHistoryModal: React.FC<ReportsHistoryModalProps> = ({ isOpen, onClose }) => {
    const [reports, setReports] = useState<ReportHistoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [infoModal, setInfoModal] = useState({ isOpen: false, message: '' });
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        if (isOpen) {
            loadReports();
        }
    }, [isOpen]);

    const loadReports = async () => {
        setLoading(true);
        try {
            if (window.electron?.getReportHistory) {
                const history = await window.electron.getReportHistory();
                // Sort by date desc
                setReports((history || []).sort((a: any, b: any) => b.date - a.date));
            }
        } catch (error) {
            logger.error('REPORT', 'Failed to load report history', { error });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReport = (filePath: string | null | undefined) => {
        if (!filePath) {
            setInfoModal({ isOpen: true, message: 'Este reporte fue descargado a tu carpeta de Descargas. No tenemos la ubicación exacta guardada.' });
            return;
        }
        window.electron?.openPath?.(filePath);
    };

    const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.id) {
            try {
                await window.electron?.deleteReportFromHistory?.(deleteConfirm.id);
                setReports(prev => prev.filter(r => r.id !== deleteConfirm.id));
            } catch (error) {
                logger.error('REPORT', 'Failed to delete report', { error });
            }
        }
        setDeleteConfirm({ isOpen: false, id: null });
    };

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onCancel={onClose}
                title="Report History"
                maxWidth="2xl"
                description={null} // Not needed for this custom content modal
                showFooter={false}
            >
                <div className="flex flex-col gap-4 min-h-[400px]">
                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} style={{ color: 'var(--label-tertiary)' }} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input w-full pl-10"
                            style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                        />
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto border rounded-lg" style={{ borderColor: 'var(--separator-opaque)', background: 'var(--fill-quaternary)' }}>
                        {loading ? (
                            <div className="flex items-center justify-center h-40" style={{ color: 'var(--label-tertiary)' }}>
                                Loading history...
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'var(--label-tertiary)' }}>
                                <FileText size={32} className="opacity-20" />
                                <p>No reports found</p>
                            </div>
                        ) : (
                            <div className="divide-y" style={{ borderColor: 'var(--separator-opaque)' }}>
                                {filteredReports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="p-4 transition-colors flex items-center gap-4 cursor-pointer group"
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--system-background)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => handleOpenReport(report.filePath)}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)', color: 'var(--system-blue)' }}
                                        >
                                            <FileText size={20} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate" style={{ color: 'var(--label-primary)' }}>{report.title}</h4>
                                            <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--label-secondary)' }}>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {format(new Date(report.date), 'PP p')}
                                                </span>
                                                <span>•</span>
                                                <span>{report.author}</span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider" style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>{report.format}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenReport(report.filePath); }}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ color: 'var(--label-tertiary)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-blue)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-blue) 10%, transparent)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
                                                title="Open Folder"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteReport(report.id, e)}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ color: 'var(--label-tertiary)' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 10%, transparent)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
                                                title="Delete Record"
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

            {/* Info Modal */}
            <Modal
                isOpen={infoModal.isOpen}
                type="info"
                title="Información"
                description={infoModal.message}
                confirmText="OK"
                onCancel={() => setInfoModal({ isOpen: false, message: '' })}
                onConfirm={() => setInfoModal({ isOpen: false, message: '' })}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirm.isOpen}
                type="danger"
                title="¿Eliminar registro?"
                description="¿Estás seguro de que deseas eliminar este registro de reporte? El archivo puede permanecer en el disco."
                confirmText="Sí, Eliminar"
                cancelText="No, Cancelar"
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
            />
        </>
    );
};
