import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../../contexts/UIContext';
import { useSmartFolders } from '../../hooks/useSmartFolders';
import { CaptureItem } from '../../../shared/types';
import { Camera, FolderOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { logger } from '../../services/Logger';

interface SmartFoldersListProps {
    folderId?: string;
    compact?: boolean;
    onFolderSelect?: (folderId: string) => void;
}

export const SmartFoldersList: React.FC<SmartFoldersListProps> = ({
    folderId,
    compact = false,
    onFolderSelect
}) => {
    const { getSmartFolderCaptures, getFolder, smartFolders, folderCounts } = useSmartFolders();
    const { openImageEditor } = useGlobalModal();
    const { setContentView, setView } = useUI();

    // Compact mode: show folder list
    if (compact) {
        return (
            <div className="space-y-1">
                {smartFolders.map(folder => {
                    const Icon = (Icons as any)[folder.icon] || FolderOpen;
                    const count = folderCounts[folder.id] || 0;

                    if (count === 0) return null; // Only show non-empty folders in compact mode

                    return (
                        <button
                            key={folder.id}
                            onClick={() => {
                                setView('smartFolder');
                                setContentView(folder.id);
                                logger.info('UI', `Navigated to smart folder: ${folder.name}`);
                                onFolderSelect?.(folder.id);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <Icon size={14} className={folder.color || 'text-gray-500'} />
                                <span className="text-sm">{folder.name}</span>
                            </div>
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // Full mode: show captures grid
    if (!folderId) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No folder selected</p>
            </div>
        );
    }

    const folder = getFolder(folderId);
    const captures = getSmartFolderCaptures(folderId);

    if (!folder) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>Folder not found</p>
            </div>
        );
    }

    const Icon = (Icons as any)[folder.icon] || FolderOpen;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-gray-100 dark:bg-gray-800 rounded-lg`}>
                        <Icon size={20} className={folder.color || 'text-gray-600'} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            {folder.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Smart Folder
                        </p>
                    </div>
                </div>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {captures.length}
                </span>
            </div>

            {/* Captures Grid */}
            <div className="flex-1 overflow-y-auto px-6">
                {captures.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 text-center"
                    >
                        <Icon size={64} className="mb-4 opacity-30" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No captures yet
                        </h3>
                        <p className="text-sm max-w-xs">
                            Captures matching this criteria will appear here automatically
                        </p>
                    </motion.div>
                ) : (
                    <div
                        className="grid gap-4 pb-6"
                        style={{
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {captures.map((capture, index) => (
                                <CaptureCard
                                    key={capture.id}
                                    capture={capture}
                                    index={index}
                                    onEdit={() => openImageEditor(capture)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Capture Card Component
const CaptureCard: React.FC<{
    capture: CaptureItem;
    index: number;
    onEdit: () => void;
}> = ({ capture, index, onEdit }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            whileHover={{ scale: 1.02 }}
            onClick={onEdit}
            className={`flex flex-col p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 transition-all cursor-pointer group relative h-full
                ${capture.status === 'success' ? 'border-l-4 border-l-success-500' : ''}
                ${capture.status === 'failure' ? 'border-l-4 border-l-error-500' : ''}
            `}
        >
            {/* Status Badge */}
            <div className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10 border-2 border-white
                ${capture.status === 'success' ? 'bg-success-500 text-white' :
                    capture.status === 'failure' ? 'bg-error-500 text-white' : 'bg-gray-800 text-white'
                }`}>
                {index + 1}
            </div>

            {/* Thumbnail */}
            <div className="relative mb-3 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {capture.path ? (
                    <img
                        src={`file://${capture.path}`}
                        alt={capture.title || 'Capture'}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Camera size={48} className="text-gray-400 dark:text-gray-600" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                    {capture.title || 'Untitled Capture'}
                </h3>
                {capture.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                        {capture.description}
                    </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(capture.timestamp).toLocaleDateString()}</span>
                    {capture.flowId && (
                        <span className="text-primary-500 dark:text-primary-400 font-medium">
                            In Flow
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
