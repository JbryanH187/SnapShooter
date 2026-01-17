import React from 'react';
import { Layers, Trash2, Edit3, Hand, Target, Circle, MousePointer2, FileText } from 'lucide-react';
import { CaptureFlow } from '../../../shared/types/FlowTypes';
import { format } from 'date-fns';

interface FlowBadgeProps {
    flow: CaptureFlow;
    onEdit: (flow: CaptureFlow) => void;
    onDelete: (flowId: string) => void;
    onExport: (flow: CaptureFlow) => void;
}

export const FlowBadge: React.FC<FlowBadgeProps> = ({ flow, onEdit, onDelete, onExport }) => {

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
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 hover:shadow-lg transition-all group">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Layers size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {flow.name || 'Flujo sin nombre'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(flow.createdAt), 'PP')}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onExport(flow)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                        title="Exportar Reporte"
                    >
                        <FileText size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(flow)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                        title="Editar flujo"
                    >
                        <Edit3 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(flow.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
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
                        className="w-12 h-12 rounded-lg border-2 border-white dark:border-gray-800 overflow-hidden flex-shrink-0 relative"
                        style={{ zIndex: flow.captures.length - idx }}
                    >
                        <img
                            src={`media://${capture.imagePath.split(/[\\/]/).pop()}`}
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
                    <div className="w-12 h-12 rounded-lg border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                        +{flow.captures.length - 5}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{flow.captures.length} pasos</span>
                <button
                    onClick={() => onEdit(flow)}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                    Ver detalles
                </button>
            </div>
        </div>
    );
};
