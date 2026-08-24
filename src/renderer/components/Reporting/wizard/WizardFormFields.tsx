import React from 'react';
import { ReportConfig } from '../../../../shared/reporting/ReportThemes';
import { DatePicker } from '../../UI/DatePicker';

interface WizardFormFieldsProps {
    config: ReportConfig;
    updateConfig: (key: keyof ReportConfig, value: any) => void;
}

export const WizardFormFields: React.FC<WizardFormFieldsProps> = ({
    config,
    updateConfig
}) => {
    return (
        <div className="space-y-3">
            {/* Title */}
            <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">Título del Reporte</label>
                <input
                    value={config.title}
                    onChange={(e) => updateConfig('title', e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="REPORTE DE EVIDENCIA"
                />
            </div>

            {/* Subtitle */}
            <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">Subtítulo</label>
                <input
                    value={config.subtitle}
                    onChange={(e) => updateConfig('subtitle', e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="PRUEBAS UNITARIAS"
                />
            </div>

            {/* Author */}
            <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">Autor</label>
                <input
                    value={config.author}
                    onChange={(e) => updateConfig('author', e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="QA Engineer"
                />
            </div>

            {/* Project Name */}
            <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">Nombre del Proyecto</label>
                <input
                    value={config.projectName || ''}
                    onChange={(e) => updateConfig('projectName', e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Ej. SnapProof v1.0"
                />
            </div>

            {/* Report Date */}
            <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">Fecha del Reporte</label>
                <DatePicker
                    value={config.reportDate || new Date().toISOString().slice(0, 10)}
                    onChange={(dateStr: string) => updateConfig('reportDate', dateStr)}
                />
            </div>
        </div>
    );
};
