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
            <label className="block text-xs font-bold mb-2 uppercase text-gray-500 dark:text-gray-400">Diseño / Plantilla</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
                {['classic', 'modern', 'bubble', 'japanese', 'custom'].map((tId) => (
                    <button
                        key={tId}
                        onClick={() => updateConfig('templateId', tId)}
                        className={`p-2 lg:p-3 border-2 rounded-lg transition-all text-xs capitalize ${
                            config.templateId === tId
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                        }`}
                    >
                        {tId.charAt(0).toUpperCase() + tId.slice(1)}
                    </button>
                ))}
            </div>

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
