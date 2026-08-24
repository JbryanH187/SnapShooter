import React from 'react';
import { REPORT_THEMES, ReportConfig } from '../../../../shared/reporting/ReportThemes';
import { Check } from 'lucide-react';

interface WizardThemeSelectorProps {
    config: ReportConfig;
    updateConfig: (key: keyof ReportConfig, value: any) => void;
}

export const WizardThemeSelector: React.FC<WizardThemeSelectorProps> = ({
    config,
    updateConfig
}) => {
    return (
        <div>
            <label className="block text-xs font-bold mb-2 uppercase text-gray-500 dark:text-gray-400">Paleta de Colores</label>
            <div className="grid grid-cols-3 gap-2">
                {Object.keys(REPORT_THEMES).map((themeKey) => {
                    const theme = REPORT_THEMES[themeKey];
                    const isSelected = config.theme === themeKey;

                    return (
                        <button
                            key={themeKey}
                            onClick={() => updateConfig('theme', themeKey)}
                            className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all relative ${
                                isSelected
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex gap-1 mb-1.5">
                                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
                            </div>
                            <span className="text-[11px] font-medium capitalize text-gray-700 dark:text-gray-300">
                                {themeKey}
                            </span>
                            {isSelected && (
                                <span className="absolute top-1 right-1 text-blue-500">
                                    <Check size={10} />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
