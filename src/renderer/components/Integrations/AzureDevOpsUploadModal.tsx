import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureItem } from '../../../shared/types';
import { AzureDevOpsConfig, ADOWorkItem } from '../../../shared/integrations/azureDevOps';
import { toast } from '../../utils/toast';
import { CheckCircle2, AlertCircle, RefreshCw, Send, Search, Settings2, Key, Building2, FolderGit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AzureDevOpsUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    capture: CaptureItem | null;
}

const STORAGE_KEY = 'snapproof_ado_config';

export const AzureDevOpsUploadModal: React.FC<AzureDevOpsUploadModalProps> = ({
    isOpen,
    onClose,
    capture
}) => {
    const [tab, setTab] = useState<'upload' | 'config'>('upload');
    const [config, setConfig] = useState<AzureDevOpsConfig>({
        organization: '',
        project: '',
        pat: ''
    });

    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [workItems, setWorkItems] = useState<ADOWorkItem[]>([]);
    const [selectedWorkItemId, setSelectedWorkItemId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig(parsed);
                if (parsed.organization && parsed.project && parsed.pat) {
                    setIsConnected(true);
                } else {
                    setTab('config');
                }
            } catch {
                setTab('config');
            }
        } else {
            setTab('config');
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && tab === 'upload' && config.organization && config.project && config.pat) {
            fetchWorkItems();
        }
    }, [isOpen, tab]);

    const handleSaveConfig = () => {
        if (!config.organization || !config.project || !config.pat) {
            toast.error('Por favor completa los campos de Azure DevOps');
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        toast.success('Configuración de Azure DevOps guardada');
        setTab('upload');
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            if (window.electron?.adoTestConnection) {
                const result = await window.electron.adoTestConnection(config);
                if (result.success) {
                    setIsConnected(true);
                    toast.success(result.message);
                } else {
                    setIsConnected(false);
                    toast.error(result.message);
                }
            }
        } catch (err: any) {
            setIsConnected(false);
            toast.error(err.message || 'Error de conexión');
        } finally {
            setIsTesting(false);
        }
    };

    const fetchWorkItems = async (query?: string) => {
        setIsLoadingItems(true);
        try {
            if (window.electron?.adoGetWorkItems) {
                const results = await window.electron.adoGetWorkItems(config, query);
                setWorkItems(results || []);
                if (results && results.length > 0 && !selectedWorkItemId) {
                    setSelectedWorkItemId(results[0].id);
                }
            }
        } catch (err: any) {
            toast.error('Error al cargar Work Items de Azure DevOps');
        } finally {
            setIsLoadingItems(false);
        }
    };

    const handleUpload = async () => {
        if (!capture) return;
        if (!selectedWorkItemId) {
            toast.error('Selecciona un Work Item de Azure DevOps');
            return;
        }

        setIsUploading(true);
        try {
            const fileName = `Evidence_${capture.title?.replace(/[^a-z0-9]/gi, '_') || capture.id}_${Date.now()}.png`;
            if (window.electron?.adoUploadAttachment) {
                await window.electron.adoUploadAttachment({
                    config,
                    workItemId: selectedWorkItemId,
                    fileName,
                    imageSrc: capture.thumbnail
                });
                toast.success(`Evidencia vinculada al Work Item #${selectedWorkItemId}`);
                onClose();
            }
        } catch (err: any) {
            toast.error(`Error al subir a Azure DevOps: ${err.message || 'Fallo de conexión'}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onCancel={onClose}
            title="Integración B2B — Microsoft Azure DevOps"
            description={null}
            showFooter={false}
            maxWidth="2xl"
        >
            <div className="flex flex-col gap-4">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setTab('upload')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            tab === 'upload'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Send size={15} />
                        Adjuntar a Work Item
                    </button>
                    <button
                        onClick={() => setTab('config')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                            tab === 'config'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Settings2 size={15} />
                        Configuración Azure DevOps PAT
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {tab === 'upload' ? (
                        <motion.div
                            key="upload-tab"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="space-y-4"
                        >
                            {/* Selected Capture Summary */}
                            {capture && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <img
                                        src={capture.thumbnail}
                                        alt="Thumbnail"
                                        className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {capture.title || 'Captura sin título'}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate">
                                            {capture.description || 'Evidencia para adjuntar a Work Item'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Search bar */}
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && fetchWorkItems(searchQuery)}
                                        placeholder="Buscar Work Items por título o palabra clave..."
                                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => fetchWorkItems(searchQuery)}
                                    disabled={isLoadingItems}
                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={13} className={isLoadingItems ? 'animate-spin' : ''} />
                                    Buscar
                                </button>
                            </div>

                            {/* Work Items List */}
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {isLoadingItems ? (
                                    <div className="text-center py-8 text-xs text-gray-400">
                                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
                                        Cargando Work Items de Azure DevOps...
                                    </div>
                                ) : workItems.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-gray-400 border border-dashed rounded-xl">
                                        No se encontraron Work Items. Verifica los datos de tu organización/proyecto.
                                    </div>
                                ) : (
                                    workItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedWorkItemId(item.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                                selectedWorkItemId === item.id
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40">
                                                    #{item.id}
                                                </span>
                                                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                    {item.title}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 uppercase font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                                {item.type} • {item.state}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800">
                                <span className="text-xs text-gray-400">
                                    Work Item seleccionado: <strong className="text-gray-700 dark:text-gray-300">{selectedWorkItemId ? `#${selectedWorkItemId}` : 'Ninguno'}</strong>
                                </span>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedWorkItemId || isUploading}
                                    className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={14} />
                                    {isUploading ? 'Adjuntando...' : `Adjuntar a #${selectedWorkItemId || 'DevOps'}`}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="config-tab"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="space-y-3"
                        >
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <Building2 size={13} /> Organización de Azure DevOps
                                </label>
                                <input
                                    type="text"
                                    value={config.organization}
                                    onChange={(e) => setConfig(prev => ({ ...prev, organization: e.target.value }))}
                                    placeholder="Nombre de la organización (ej. mi-empresa)"
                                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <FolderGit2 size={13} /> Nombre del Proyecto
                                </label>
                                <input
                                    type="text"
                                    value={config.project}
                                    onChange={(e) => setConfig(prev => ({ ...prev, project: e.target.value }))}
                                    placeholder="Nombre del proyecto en Azure DevOps"
                                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <Key size={13} /> Personal Access Token (PAT)
                                </label>
                                <input
                                    type="password"
                                    value={config.pat}
                                    onChange={(e) => setConfig(prev => ({ ...prev, pat: e.target.value }))}
                                    placeholder="Token con permisos de lectura y escritura en Work Items"
                                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Test & Save buttons */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={isTesting || !config.organization || !config.project || !config.pat}
                                    className="px-4 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                                    {isTesting ? 'Probando...' : 'Probar Conexión'}
                                </button>
                                <button
                                    onClick={handleSaveConfig}
                                    className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
                                >
                                    Guardar y Continuar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Modal>
    );
};
