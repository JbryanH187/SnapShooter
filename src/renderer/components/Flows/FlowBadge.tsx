import React, { useState } from 'react';
import { Layers, Trash2, Edit3, Hand, Target, Circle, MousePointer2, FileText, FolderOpen, Camera, Play, Clock, Sparkles } from 'lucide-react';
import { useFlowStore } from '../../stores/flowStore';
import { CaptureFlow } from '../../../shared/types/FlowTypes';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FlowBadgeProps {
    flow: CaptureFlow;
    onEdit: (flow: CaptureFlow) => void;
    onDelete: (flowId: string) => void;
    onExport: (flow: CaptureFlow) => void;
    onContinueInRecents?: (flow: CaptureFlow) => void;
}

export const FlowBadge: React.FC<FlowBadgeProps> = ({ flow, onEdit, onDelete, onExport, onContinueInRecents }) => {
    const { openFlowFolder } = useFlowStore();
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);

    const renderClickIcon = (style: string = 'hand') => {
        const commonProps = "drop-shadow-lg filter";
        switch (style) {
            case 'target':
                return <Target size={22} className={`text-red-500 ${commonProps}`} strokeWidth={2.5} />;
            case 'dot':
                return <Circle size={18} className={`fill-red-500 text-white ${commonProps}`} strokeWidth={2} />;
            case 'mouse':
                return <MousePointer2 size={22} className={`text-white fill-black ${commonProps}`} />;
            case 'hand':
            default:
                return <Hand size={22} className={`text-amber-500 fill-white ${commonProps}`} />;
        }
    };

    const hasCaptures = flow.captures && flow.captures.length > 0;
    const currentPreviewCapture = hasCaptures
        ? flow.captures[Math.min(activePreviewIndex, flow.captures.length - 1)]
        : null;

    let timeAgo = '';
    try {
        timeAgo = formatDistanceToNow(new Date(flow.updatedAt || flow.createdAt), { addSuffix: true, locale: es });
    } catch {
        timeAgo = format(new Date(flow.createdAt), 'PP');
    }

    return (
        <div
            className="group relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between border hover:shadow-xl dark:hover:shadow-amber-500/5 hover:-translate-y-1"
            style={{
                background: 'color-mix(in srgb, var(--system-background) 80%, transparent)',
                backdropFilter: 'blur(16px)',
                borderColor: 'color-mix(in srgb, var(--system-orange) 20%, var(--separator-opaque))'
            }}
        >
            {/* Top Glow Accent */}
            <div
                className="absolute -top-px left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                style={{
                    background: 'linear-gradient(90deg, transparent, var(--system-orange), transparent)'
                }}
            />

            {/* Header Info */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm"
                        style={{
                            background: 'linear-gradient(135deg, color-mix(in srgb, var(--system-orange) 25%, transparent), color-mix(in srgb, var(--system-orange) 10%, transparent))',
                            color: 'var(--system-orange)',
                            border: '1px solid color-mix(in srgb, var(--system-orange) 30%, transparent)'
                        }}
                    >
                        <Layers size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm truncate" style={{ color: 'var(--label-primary)' }} title={flow.name}>
                            {flow.name || 'Flujo sin título'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--label-tertiary)' }}>
                            <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {timeAgo}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                {flow.captures.length} {flow.captures.length === 1 ? 'paso' : 'pasos'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
                    <button
                        onClick={() => onExport(flow)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Generar Reporte (PDF / Docx)"
                    >
                        <FileText size={15} />
                    </button>
                    <button
                        onClick={() => openFlowFolder(flow.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                        title="Abrir carpeta en Explorer"
                    >
                        <FolderOpen size={15} />
                    </button>
                    <button
                        onClick={() => onEdit(flow)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                        title="Editar pasos y anotaciones"
                    >
                        <Edit3 size={15} />
                    </button>
                    <button
                        onClick={() => onDelete(flow.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Eliminar flujo"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Visual Step Preview Showcase */}
            {hasCaptures && currentPreviewCapture && (
                <div className="my-3">
                    <div
                        className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border shadow-inner transition-all group/preview bg-black/5 dark:bg-black/40"
                        style={{ borderColor: 'var(--separator-opaque)' }}
                    >
                        <img
                            src={currentPreviewCapture.imagePath}
                            alt={currentPreviewCapture.title || `Paso ${activePreviewIndex + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-105"
                        />

                        {/* Step Marker Overlay */}
                        {currentPreviewCapture.clickPosition && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: `${currentPreviewCapture.clickPosition.x}%`,
                                    top: `${currentPreviewCapture.clickPosition.y}%`,
                                    transform: 'translate(-50%, -50%) scale(0.8)'
                                }}
                            >
                                {renderClickIcon(currentPreviewCapture.clickStyle)}
                            </div>
                        )}

                        {/* Step Badge */}
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center gap-1 shadow-md">
                            <span>Paso {activePreviewIndex + 1} de {flow.captures.length}</span>
                        </div>

                        {currentPreviewCapture.title && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2.5 text-white text-xs truncate font-medium">
                                {currentPreviewCapture.title}
                            </div>
                        )}
                    </div>

                    {/* Step Filmstrip Dots / Mini Thumbs */}
                    {flow.captures.length > 1 && (
                        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
                            {flow.captures.map((cap, idx) => (
                                <button
                                    key={cap.id || idx}
                                    onClick={() => setActivePreviewIndex(idx)}
                                    className={`relative w-9 h-9 rounded-xl overflow-hidden border transition-all flex-shrink-0 shadow-sm ${
                                        activePreviewIndex === idx
                                            ? 'ring-2 ring-amber-500 scale-105 border-amber-500'
                                            : 'opacity-60 hover:opacity-100 border-transparent hover:scale-105'
                                    }`}
                                >
                                    <img src={cap.imagePath} alt={`Step ${idx + 1}`} className="w-full h-full object-cover" />
                                    <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[9px] px-1 font-bold rounded-tl">
                                        {idx + 1}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Footer Actions */}
            <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--separator-opaque)' }}>
                {onContinueInRecents ? (
                    <button
                        onClick={() => onContinueInRecents(flow)}
                        className="flex-1 py-2 px-3.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, var(--system-orange), #f97316)',
                            boxShadow: '0 4px 12px color-mix(in srgb, var(--system-orange) 30%, transparent)'
                        }}
                        title="Cargar evidencias en Recientes para seguir tomando capturas"
                    >
                        <Camera size={14} />
                        <span>Continuar en Recientes</span>
                    </button>
                ) : <div />}

                <button
                    onClick={() => onEdit(flow)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--label-secondary)' }}
                >
                    Ver Detalles
                </button>
            </div>
        </div>
    );
};
