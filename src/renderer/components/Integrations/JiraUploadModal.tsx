import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureItem } from '../../../shared/types';
import { JiraConfig, JiraIssue } from '../../../shared/integrations/jira';
import { toast } from '../../utils/toast';
import { CheckCircle2, AlertCircle, RefreshCw, Send, Search, Settings2, Key, Globe, Mail, FolderKanban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JiraUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    capture: CaptureItem | null;
}

const STORAGE_KEY = 'snapproof_jira_config';

export const JiraUploadModal: React.FC<JiraUploadModalProps> = ({
    isOpen,
    onClose,
    capture
}) => {
    const [tab, setTab] = useState<'upload' | 'config'>('upload');
    const [config, setConfig] = useState<JiraConfig>({
        host: '',
        email: '',
        apiToken: '',
        projectKey: ''
    });

    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    const [selectedIssueKey, setSelectedIssueKey] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isLoadingIssues, setIsLoadingIssues] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Load saved Jira configuration
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig(parsed);
                if (parsed.host && parsed.email && parsed.apiToken) {
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

    // Fetch issues when opening in upload tab or changing search
    useEffect(() => {
        if (isOpen && tab === 'upload' && config.host && config.email && config.apiToken) {
            fetchIssues();
        }
    }, [isOpen, tab]);

    const handleSaveConfig = () => {
        if (!config.host || !config.email || !config.apiToken) {
            toast.error('Por favor completa los campos requeridos de Jira');
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        toast.success('Configuración de Jira guardada');
        setTab('upload');
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            if (window.electron?.jiraTestConnection) {
                const result = await window.electron.jiraTestConnection(config);
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
            toast.error(err.message || 'Error al conectar');
        } finally {
            setIsTesting(false);
        }
    };

    const fetchIssues = async (query?: string) => {
        setIsLoadingIssues(true);
        try {
            if (window.electron?.jiraGetIssues) {
                const results = await window.electron.jiraGetIssues(config, query);
                setIssues(results || []);
                if (results && results.length > 0 && !selectedIssueKey) {
                    setSelectedIssueKey(results[0].key);
                }
            }
        } catch (err: any) {
            toast.error('Error al cargar issues de Jira');
        } finally {
            setIsLoadingIssues(false);
        }
    };

    const handleUpload = async () => {
        if (!capture) return;
        if (!selectedIssueKey) {
            toast.error('Selecciona un ticket de Jira');
            return;
        }

        setIsUploading(true);
        try {
            const fileName = `Evidence_${capture.title?.replace(/[^a-z0-9]/gi, '_') || capture.id}_${Date.now()}.png`;
            if (window.electron?.jiraUploadAttachment) {
                await window.electron.jiraUploadAttachment({
                    config,
                    issueKey: selectedIssueKey,
                    fileName,
                    imageSrc: capture.thumbnail
                });
                toast.success(`Evidencia adjuntada exitosamente a ${selectedIssueKey}`);
                onClose();
            }
        } catch (err: any) {
            toast.error(`Error al subir: ${err.message || 'Fallo de conexión'}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onCancel={onClose}
            title="Integración B2B — Atlassian Jira"
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
                        Adjuntar a Ticket
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
                        Configuración Jira API
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
                                            {capture.description || 'Evidencia visual para adjuntar'}
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
                                        onKeyDown={(e) => e.key === 'Enter' && fetchIssues(searchQuery)}
                                        placeholder="Buscar tickets por clave o texto (ej. PROJ-101)..."
                                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => fetchIssues(searchQuery)}
                                    disabled={isLoadingIssues}
                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={13} className={isLoadingIssues ? 'animate-spin' : ''} />
                                    Buscar
                                </button>
                            </div>

                            {/* Issues List */}
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {isLoadingIssues ? (
                                    <div className="text-center py-8 text-xs text-gray-400">
                                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-500" />
                                        Cargando tickets de Jira...
                                    </div>
                                ) : issues.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-gray-400 border border-dashed rounded-xl">
                                        No se encontraron tickets. Verifica la configuración o prueba con otra búsqueda.
                                    </div>
                                ) : (
                                    issues.map((issue) => (
                                        <div
                                            key={issue.id}
                                            onClick={() => setSelectedIssueKey(issue.key)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                                selectedIssueKey === issue.key
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40">
                                                    {issue.key}
                                                </span>
                                                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                    {issue.summary}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 uppercase font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                                {issue.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800">
                                <span className="text-xs text-gray-400">
                                    Ticket destino: <strong className="text-gray-700 dark:text-gray-300">{selectedIssueKey || 'Ninguno'}</strong>
                                </span>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedIssueKey || isUploading}
                                    className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={14} />
                                    {isUploading ? 'Adjuntando...' : `Adjuntar a ${selectedIssueKey || 'Jira'}`}
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
                                    <Globe size={13} /> URL del Dominio Jira (Host)
                                </label>
                                <input
                                    type="text"
                                    value={config.host}
                                    onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                                    placeholder="https://su-empresa.atlassian.net"
                                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <Mail size={13} /> Email de Cuenta Atlassian
                                </label>
                                <input
                                    type="email"
                                    value={config.email}
                                    onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="desarrollador@empresa.com"
                                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <Key size={13} /> API Token de Jira
                                </label>
                                <input
                                    type="password"
                                    value={config.apiToken}
                                    onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                                    placeholder="Generado desde id.atlassian.com/manage-profile/security/api-tokens"
                                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <FolderKanban size={13} /> Clave del Proyecto (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={config.projectKey || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, projectKey: e.target.value.toUpperCase() }))}
                                    placeholder="Ej. QA, PROJ, DEV"
                                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Test & Save buttons */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={isTesting || !config.host || !config.email || !config.apiToken}
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
