import React, { useEffect, useState } from 'react';
import { toast, confirm } from '../../utils/toast';
import { FileText, Trash2, ExternalLink, Calendar, Search, File } from 'lucide-react';
import { format } from 'date-fns';
import { SectionErrorBoundary } from '../ErrorBoundaries/SectionErrorBoundary';
import { logger } from '../../services/Logger';

export interface ReportHistoryItem {
    id: string;
    title: string;
    filePath: string;
    date: number; // timestamp
    author: string;
    format: 'pdf' | 'docx';
}

export const ReportsHistoryView: React.FC = () => {
    const [reports, setReports] = useState<ReportHistoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

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
            toast.info('Este reporte fue descargado a tu carpeta de Descargas. No tenemos la ubicación exacta guardada.', 'Información');
            return;
        }
        window.electron?.openPath?.(filePath);
    };

    const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const confirmed = await confirm({
            title: '¿Eliminar registro?',
            text: '¿Estás seguro de que deseas eliminar este registro de reporte? El archivo puede permanecer en el disco.',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            try {
                await window.electron?.deleteReportFromHistory?.(id);
                setReports(prev => prev.filter(r => r.id !== id));
                toast.success('Registro eliminado del historial');
            } catch (error) {
                logger.error('REPORT', 'Failed to delete report', { error });
                toast.error('Error al eliminar el registro');
            }
        }
    };

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--label-primary)' }}>
                    <div
                        className="p-2 rounded-lg"
                        style={{ background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)', color: 'var(--system-blue)' }}
                    >
                        <Calendar size={24} />
                    </div>
                    Historial de Reportes
                </h2>

                {/* Statistics or Actions could go here */}
                <div className="text-sm" style={{ color: 'var(--label-secondary)' }}>
                    {filteredReports.length} documentos
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} style={{ color: 'var(--label-tertiary)' }} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar reportes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
                    style={{
                        background: 'var(--system-background)',
                        borderColor: 'var(--separator-opaque)',
                        color: 'var(--label-primary)'
                    }}
                />
            </div>

            {/* List */}
            <SectionErrorBoundary title="Error al cargar historial">
                <div
                    className="flex-1 overflow-y-auto border rounded-xl shadow-sm"
                    style={{
                        borderColor: 'var(--separator-opaque)',
                        background: 'var(--system-background)'
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-64" style={{ color: 'var(--label-tertiary)' }}>
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                                <span>Cargando historial...</span>
                            </div>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--label-tertiary)' }}>
                            <div className="p-4 rounded-full" style={{ background: 'var(--fill-secondary)' }}>
                                <FileText size={32} className="opacity-40" />
                            </div>
                            <p>No se encontraron reportes</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--separator-non-opaque)' }}>
                            {filteredReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-4 transition-colors flex items-center gap-4 cursor-pointer group"
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-quaternary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => handleOpenReport(report.filePath)}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                        style={{ background: 'color-mix(in srgb, var(--system-blue) 12%, transparent)', color: 'var(--system-blue)' }}
                                    >
                                        <FileText size={24} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate text-base" style={{ color: 'var(--label-primary)' }}>{report.title}</h4>
                                        <div className="flex items-center gap-3 text-xs mt-1.5" style={{ color: 'var(--label-secondary)' }}>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={13} />
                                                {format(new Date(report.date), 'PPPP p')}
                                            </span>
                                            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--separator-opaque)' }}></span>
                                            <span className="flex items-center gap-1.5">
                                                <File size={13} />
                                                {report.author}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                                            style={report.format === 'pdf' ? {
                                                background: 'color-mix(in srgb, var(--system-red) 15%, transparent)',
                                                color: 'var(--system-red)'
                                            } : {
                                                background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                                color: 'var(--system-blue)'
                                            }}
                                        >
                                            {report.format}
                                        </span>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenReport(report.filePath); }}
                                                className="p-2 rounded-lg transition-colors shadow-sm border"
                                                style={{ color: 'var(--label-tertiary)', borderColor: 'transparent' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-blue)'; e.currentTarget.style.background = 'var(--system-background)'; e.currentTarget.style.borderColor = 'var(--separator-opaque)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                title="Abrir ubicación"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteReport(report.id, e)}
                                                className="p-2 rounded-lg transition-colors shadow-sm border"
                                                style={{ color: 'var(--label-tertiary)', borderColor: 'transparent' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'var(--system-background)'; e.currentTarget.style.borderColor = 'var(--separator-opaque)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                title="Eliminar registro"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
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
