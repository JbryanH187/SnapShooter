import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { ReportConfig } from '../../../../shared/reporting/ReportThemes';

interface WizardLogoCustomizerProps {
    config: ReportConfig;
    updateConfig: (key: keyof ReportConfig, value: any) => void;
}

export const WizardLogoCustomizer: React.FC<WizardLogoCustomizerProps> = ({
    config,
    updateConfig
}) => {
    const fileInputSymbolRef = useRef<HTMLInputElement>(null);
    const fileInputTextRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'customLogoSymbol' | 'customLogoText') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                updateConfig(key, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Logotipos y Marca</label>

            <div className="border rounded-lg p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {/* Symbol Logo */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Logo / Ícono</span>
                    <input
                        type="checkbox"
                        checked={config.showLogoSymbol}
                        onChange={(e) => updateConfig('showLogoSymbol', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                    />
                </div>
                {config.showLogoSymbol && (
                    <div className="mt-2">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputSymbolRef}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'customLogoSymbol')}
                        />
                        {config.customLogoSymbol ? (
                            <div className="flex items-center gap-2">
                                <img src={config.customLogoSymbol} alt="Symbol Logo" className="w-8 h-8 object-contain rounded border border-gray-200" />
                                <button
                                    onClick={() => updateConfig('customLogoSymbol', null)}
                                    className="p-1 rounded text-red-500 hover:bg-red-50"
                                    title="Quitar"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputSymbolRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-dashed rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <Upload size={14} /> Subir ícono
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="border rounded-lg p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {/* Text Logo */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Logo de Texto</span>
                    <input
                        type="checkbox"
                        checked={config.showLogoText}
                        onChange={(e) => updateConfig('showLogoText', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                    />
                </div>
                {config.showLogoText && (
                    <div className="mt-2">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputTextRef}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'customLogoText')}
                        />
                        {config.customLogoText ? (
                            <div className="flex items-center gap-2">
                                <img src={config.customLogoText} alt="Text Logo" className="h-6 object-contain rounded border border-gray-200" />
                                <button
                                    onClick={() => updateConfig('customLogoText', null)}
                                    className="p-1 rounded text-red-500 hover:bg-red-50"
                                    title="Quitar"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputTextRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-dashed rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <Upload size={14} /> Subir logo de texto
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
