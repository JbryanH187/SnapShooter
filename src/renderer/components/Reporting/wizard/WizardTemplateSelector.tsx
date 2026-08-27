import React from 'react';
import { ReportConfig } from '../../../../shared/reporting/ReportThemes';
import { ReportTemplate } from '../../../../shared/types';

interface WizardTemplateSelectorProps {
    config: ReportConfig;
    updateConfig: (key: keyof ReportConfig, value: any) => void;
    templates: ReportTemplate[];
}

export const WizardTemplateSelector: React.FC<WizardTemplateSelectorProps> = ({
    config,
    updateConfig,
    templates
}) => {
    return (
        <div>
            <label className="block text-xs font-bold mb-2 uppercase text-gray-500 dark:text-gray-400">Diseño / Formato de Reporte</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                    { id: 'slides', name: 'PPTX', badge: '16:9 Panorámico' },
                    { id: 'classic', name: 'Classic Corporate', badge: 'Doc A4' },
                    { id: 'modern', name: 'Modern Sidebar', badge: 'Doc A4' },
                    { id: 'bubble', name: 'Bubbles', badge: 'Doc A4' },
                    { id: 'japanese', name: 'Japanese Book', badge: 'Doc A4' },
                    { id: 'custom', name: 'Plantilla Personalizada', badge: 'Custom' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => updateConfig('templateId', item.id as any)}
                        className={`p-2 lg:p-2.5 border-2 rounded-xl transition-all text-xs flex flex-col items-start gap-0.5 ${
                            config.templateId === item.id
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        <span className="truncate w-full text-left font-semibold">{item.name}</span>
                        <span className="text-[10px] opacity-70 font-normal">{item.badge}</span>
                    </button>
                ))}
            </div>

            {/* Slide Layout Mode Selector (Hero vs Dual) */}
            {config.templateId === 'slides' && (
                <div className="mt-3 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/40 rounded-xl">
                    <label className="block text-[11px] font-semibold mb-1.5 text-blue-900 dark:text-blue-200">
                        Disposición de Diapositivas (PPTX)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => updateConfig('slideLayout', 'hero')}
                            className={`p-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-0.5 ${
                                (!config.slideLayout || config.slideLayout === 'hero')
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                        >
                            <span>1 Captura (Hero)</span>
                            <span className="text-[10px] opacity-80 font-normal">Foco y detalle amplio</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => updateConfig('slideLayout', 'dual')}
                            className={`p-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-0.5 ${
                                config.slideLayout === 'dual'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                        >
                            <span>2 Capturas (Dual)</span>
                            <span className="text-[10px] opacity-80 font-normal">Comparativa lado a lado</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Template Dropdown */}
            {config.templateId === 'custom' && (
                <div className="mt-2">
                    <label className="block text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">Seleccionar Plantilla Guardada</label>
                    <select
                        value={config.customTemplate?.id || ''}
                        onChange={(e) => {
                            const selected = templates.find(t => t.id === e.target.value);
                            updateConfig('customTemplate', selected);
                        }}
                        className="w-full border rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                    >
                        <option value="">-- Seleccionar Plantilla --</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};
