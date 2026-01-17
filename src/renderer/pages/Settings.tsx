import React, { useState } from 'react';
import { Trash2, FolderOpen, Keyboard, Info, Moon, Sun } from 'lucide-react';
import { useCaptureStore } from '../stores/captureStore';
import { logger } from '../services/Logger';
import { useTheme } from '../contexts/ThemeContext';
import { toast, confirm } from '../utils/toast';

interface SettingsProps {
    onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const captures = useCaptureStore(state => state.captures);
    const deleteCapture = useCaptureStore(state => state.deleteCapture);
    const { theme, toggleTheme } = useTheme();

    const handleClearHistory = async () => {
        const confirmed = await confirm({
            title: `¿Eliminar ${captures.length} capturas?`,
            text: '¿Estás seguro de que deseas eliminar TODO el historial de capturas? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar Todo',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            captures.forEach(c => deleteCapture(c.id));
            toast.success('Historial de capturas limpiado exitosamente');
        }
    };

    const handleOpenFolder = async () => {
        if (window.electron?.openCapturesFolder) {
            try {
                await window.electron.openCapturesFolder();
                toast.success('Carpeta abierta en explorador de archivos');
            } catch (error) {
                logger.error('Error opening folder:', error);
                toast.error('Error al abrir la carpeta');
            }
        } else {
            toast.warning('Funcionalidad no disponible en esta versión');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full overflow-y-auto transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                    Close
                </button>
            </div>

            <div className="space-y-8">
                {/* General */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <Info size={20} /> General
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                        {/* Dark Mode Toggle */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {theme === 'dark' ? <Moon size={18} className="text-gray-600 dark:text-gray-400" /> : <Sun size={18} className="text-gray-600 dark:text-gray-400" />}
                                <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">App Version</span>
                            <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">v1.0.0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">Captures Stored</span>
                            <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{captures.length}</span>
                        </div>
                    </div>
                </section>

                {/* Shortcuts */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <Keyboard size={20} /> Keyboard Shortcuts
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">Capture Region</span>
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono text-gray-600 dark:text-gray-300">Ctrl+Shift+1</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">Capture Window</span>
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono text-gray-600 dark:text-gray-300">Ctrl+Shift+2</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">Stop Recording</span>
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono text-gray-600 dark:text-gray-300">Ctrl+Shift+S</kbd>
                        </div>
                    </div>
                </section>

                {/* Storage */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <FolderOpen size={20} /> Storage & Data
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">Captures Folder</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Open the local directory where images are saved.</p>
                            </div>
                            <button
                                onClick={handleOpenFolder}
                                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                                <FolderOpen size={16} /> Open Folder
                            </button>
                        </div>

                        <hr className="border-gray-200 dark:border-gray-700" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-red-700 dark:text-red-400">Danger Zone</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete all captured history.</p>
                            </div>
                            <button
                                onClick={handleClearHistory}
                                className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Clear All History
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
