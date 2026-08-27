
import React from 'react';
import { CheckCircle, XCircle, Trash2, Copy, Send, Building2, Hand, Target, Circle, MousePointer2, MousePointerClick } from 'lucide-react';
import { CaptureItem } from '../../../shared/types';
import { toast } from '../../utils/toast';

interface CaptureCardProps {
    capture: CaptureItem;
    index: number;
    onEdit: (c: CaptureItem) => void;
    onUpdateStatus: (id: string, status: 'success' | 'failure') => void;
    onDelete: (id: string) => void;
    onUploadJira?: (c: CaptureItem) => void;
    onUploadADO?: (c: CaptureItem) => void;
    onToggleClickIndicator?: (id: string) => void;
}

export const CaptureCard: React.FC<CaptureCardProps> = ({
    capture: c,
    index,
    onEdit,
    onUpdateStatus,
    onDelete,
    onUploadJira,
    onUploadADO,
    onToggleClickIndicator
}) => {
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (window.electron?.copyImageToClipboard) {
                await window.electron.copyImageToClipboard(c.thumbnail);
                toast.success('Imagen copiada al portapapeles');
            }
        } catch (err) {
            console.error('[CaptureCard] Copy failed:', err);
            toast.error('Error al copiar imagen');
        }
    };

    const renderClickIcon = (style?: string) => {
        const s = style || 'hand';
        if (s === 'target') {
            return (
                <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-lg animate-pulse">
                    <Target size={16} className="text-red-500 stroke-[2.5]" />
                </div>
            );
        }
        if (s === 'dot') {
            return (
                <div className="w-6 h-6 rounded-full bg-red-500/30 border-2 border-white flex items-center justify-center shadow-lg">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
            );
        }
        if (s === 'mouse') {
            return (
                <div className="p-1 rounded-full bg-amber-500/30 border border-white flex items-center justify-center shadow-lg">
                    <MousePointer2 size={16} className="text-amber-500 stroke-[2.5] fill-white" />
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-full bg-amber-500/30 border-2 border-white flex items-center justify-center shadow-lg">
                <Hand size={16} className="text-amber-500 stroke-[2.5] fill-white/80" />
            </div>
        );
    };

    return (
        <div
            className={`flex flex-col p-4 border rounded-xl shadow-sm hover:shadow-md transition-all group relative h-full bg-white dark:bg-gray-800
                ${c.status === 'success' ? 'border-l-4 border-l-success-500' : ''}
                ${c.status === 'failure' ? 'border-l-4 border-l-error-500' : ''}
            `}
            style={{
                background: 'var(--system-background-secondary)',
                borderColor: 'var(--separator-non-opaque)',
                borderRadius: 'var(--radius-card)',
                height: '300px' // Fixed height for grid
            }}
        >
            {/* Step Badge */}
            <div className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10 border-2 border-white
                ${c.status === 'success' ? 'bg-success-500 text-white' :
                    c.status === 'failure' ? 'bg-error-500 text-white' : 'bg-gray-800 text-white'
                }
            `}>
                {index + 1}
            </div>

            {/* Thumbnail */}
            <div
                className="relative cursor-pointer mb-3 overflow-hidden rounded-lg"
                onClick={() => onEdit(c)}
            >
                <img src={c.thumbnail} className="w-full h-32 object-cover rounded-lg bg-gray-100 border border-gray-200" draggable={false} alt="capture thumbnail" />

                {/* Click / Cursor indicator overlay */}
                {c.clickPosition && c.showClickIndicator !== false && (
                    <div
                        className="absolute pointer-events-none z-10"
                        style={{
                            left: `${c.clickPosition.x}%`,
                            top: `${c.clickPosition.y}%`,
                            transform: 'translate(-50%, -50%) scale(0.75)'
                        }}
                    >
                        {renderClickIcon(c.clickStyle)}
                    </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                    <span className="bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm">Edit</span>
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 truncate text-sm" style={{ color: 'var(--label-primary)' }}>{c.title || 'Untitled Capture'}</h3>
                <p className="text-xs line-clamp-2 mb-1.5" style={{ color: 'var(--label-secondary)' }}>{c.description || 'No description.'}</p>
                
                {/* Tags & Timestamp */}
                <div className="flex items-center gap-1 flex-wrap mb-1">
                    <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                            background: 'var(--fill-secondary)',
                            color: 'var(--label-secondary)'
                        }}
                    >
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {(c.tags || []).map((tag, i) => (
                        <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1 border"
                            style={{
                                background: 'color-mix(in srgb, var(--system-blue) 10%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--system-blue) 25%, transparent)',
                                color: 'var(--system-blue)'
                            }}
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Status Toggles & Copy */}
            <div
                className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg shadow-sm border"
                style={{
                    background: 'var(--system-background-secondary)',
                    borderColor: 'var(--separator-opaque)'
                }}
            >
                {onUploadJira && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onUploadJira(c); }}
                        className="p-1 rounded-md transition-colors"
                        style={{ color: 'var(--label-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-blue)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-blue) 10%, transparent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Adjuntar a Jira"
                    >
                        <Send size={14} />
                    </button>
                )}
                {onUploadADO && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onUploadADO(c); }}
                        className="p-1 rounded-md transition-colors"
                        style={{ color: 'var(--label-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-cyan, #06b6d4)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-cyan, #06b6d4) 10%, transparent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Adjuntar a Azure DevOps"
                    >
                        <Building2 size={14} />
                    </button>
                )}
                {c.clickPosition && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleClickIndicator?.(c.id);
                        }}
                        className="p-1 rounded-md transition-colors"
                        style={c.showClickIndicator !== false ? {
                            color: 'var(--system-orange, #f59e0b)',
                            background: 'color-mix(in srgb, var(--system-orange, #f59e0b) 15%, transparent)'
                        } : {
                            color: 'var(--label-quaternary)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-orange, #f59e0b)'; }}
                        onMouseLeave={(e) => { if (c.showClickIndicator === false) e.currentTarget.style.color = 'var(--label-quaternary)'; }}
                        title={c.showClickIndicator !== false ? 'Ocultar puntero de click' : 'Mostrar puntero de click'}
                    >
                        <MousePointerClick size={14} />
                    </button>
                )}
                <button
                    onClick={handleCopy}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: 'var(--label-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-blue)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-blue) 10%, transparent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    title="Copiar imagen al portapapeles"
                >
                    <Copy size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(c.id, 'success'); }}
                    className="p-1 rounded-md transition-colors"
                    style={c.status === 'success' ? {
                        color: 'var(--system-green)',
                        background: 'color-mix(in srgb, var(--system-green) 15%, transparent)'
                    } : {
                        color: 'var(--label-quaternary)'
                    }}
                    onMouseEnter={(e) => { if (c.status !== 'success') { e.currentTarget.style.color = 'var(--system-green)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-green) 10%, transparent)'; } }}
                    onMouseLeave={(e) => { if (c.status !== 'success') { e.currentTarget.style.color = 'var(--label-quaternary)'; e.currentTarget.style.background = 'transparent'; } }}
                    title="Mark as Success"
                >
                    <CheckCircle size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(c.id, 'failure'); }}
                    className="p-1 rounded-md transition-colors"
                    style={c.status === 'failure' ? {
                        color: 'var(--system-red)',
                        background: 'color-mix(in srgb, var(--system-red) 15%, transparent)'
                    } : {
                        color: 'var(--label-quaternary)'
                    }}
                    onMouseEnter={(e) => { if (c.status !== 'failure') { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 10%, transparent)'; } }}
                    onMouseLeave={(e) => { if (c.status !== 'failure') { e.currentTarget.style.color = 'var(--label-quaternary)'; e.currentTarget.style.background = 'transparent'; } }}
                    title="Mark as Failure"
                >
                    <XCircle size={14} />
                </button>
            </div>

            <button
                onClick={async (e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--system-red)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = 'var(--system-red)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Delete Capture"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};
