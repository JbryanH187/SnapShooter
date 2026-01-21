import React from 'react';
import { Layers, Trash2, Edit3, Hand, Target, Circle, MousePointer2, FileText, FolderOpen } from 'lucide-react';
import { useFlowStore } from '../../stores/flowStore';
import { CaptureFlow } from '../../../shared/types/FlowTypes';
import { format } from 'date-fns';

interface FlowBadgeProps {
    flow: CaptureFlow;
    onEdit: (flow: CaptureFlow) => void;
    onDelete: (flowId: string) => void;
    onExport: (flow: CaptureFlow) => void;
}

export const FlowBadge: React.FC<FlowBadgeProps> = ({ flow, onEdit, onDelete, onExport }) => {
    const { openFlowFolder } = useFlowStore();

    const renderClickIcon = (style: string = 'hand') => {
        const commonProps = "drop-shadow-lg filter";
        switch (style) {
            case 'target':
                return <Target size={24} className={`text-red-500 ${commonProps}`} strokeWidth={2.5} />;
            case 'dot':
                return <Circle size={20} className={`fill-red-500 text-white ${commonProps}`} strokeWidth={2} />;
            case 'mouse':
                return <MousePointer2 size={24} className={`text-white fill-black ${commonProps}`} />;
            case 'hand':
            default:
                return <Hand size={24} className={`text-amber-500 fill-white ${commonProps}`} />;
        }
    };

    return (
        <div
            className="rounded-xl p-4 hover:shadow-lg transition-all group border"
            style={{
                background: 'color-mix(in srgb, var(--system-orange) 8%, var(--system-background))',
                borderColor: 'color-mix(in srgb, var(--system-orange) 25%, transparent)'
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'color-mix(in srgb, var(--system-orange) 15%, transparent)', color: 'var(--system-orange)' }}
                    >
                        <Layers size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--label-primary)' }}>
                            {flow.name || 'Flujo sin nombre'}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--label-secondary)' }}>
                            {format(new Date(flow.createdAt), 'PP')}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onExport(flow)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--label-tertiary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-blue)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-blue) 15%, transparent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Exportar Reporte"
                    >
                        <FileText size={16} />
                    </button>
                    <button
                        onClick={() => openFlowFolder(flow.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--label-tertiary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-warning)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-warning) 15%, transparent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Abrir en Explorer"
                    >
                        <FolderOpen size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(flow)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--label-tertiary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-orange)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-orange) 15%, transparent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Editar flujo"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(flow.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--label-tertiary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--system-red)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 15%, transparent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Eliminar flujo"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Capture thumbnails */}
            <div className="flex -space-x-2 overflow-hidden">
                {flow.captures.slice(0, 5).map((capture, idx) => (
                    <div
                        key={capture.id}
                        className="w-12 h-12 rounded-lg border-2 overflow-hidden flex-shrink-0 relative"
                        style={{ zIndex: flow.captures.length - idx, borderColor: 'var(--system-background)' }}
                    >
                        <img
                            src={capture.imagePath}
                            alt={`Capture ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {/* Click indicator */}
                        {capture.clickPosition && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: `${capture.clickPosition.x}%`,
                                    top: `${capture.clickPosition.y}%`,
                                    transform: 'translate(-50%, -50%) scale(0.6)'
                                }}
                            >
                                {renderClickIcon(capture.clickStyle)}
                            </div>
                        )}
                        {/* Step number */}
                        <div className="absolute bottom-0 right-0 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-tl">
                            {idx + 1}
                        </div>
                    </div>
                ))}
                {flow.captures.length > 5 && (
                    <div
                        className="w-12 h-12 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-xs font-medium"
                        style={{ borderColor: 'var(--system-background)', background: 'var(--fill-secondary)', color: 'var(--label-secondary)' }}
                    >
                        +{flow.captures.length - 5}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--label-secondary)' }}>
                <span>{flow.captures.length} pasos</span>
                <button
                    onClick={() => onEdit(flow)}
                    className="hover:underline font-medium"
                    style={{ color: 'var(--system-orange)' }}
                >
                    Ver detalles
                </button>
            </div>
        </div>
    );
};
