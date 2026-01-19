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
                            className="w-full flex items-center justify-between p-2 rounded-lg transition-colors group"
                            style={{ color: 'var(--label-primary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div className="flex items-center gap-2">
                                <Icon size={14} style={{ color: folder.color ? undefined : 'var(--label-tertiary)' }} className={folder.color || ''} />
                                <span className="text-sm">{folder.name}</span>
                            </div>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                    background: 'var(--fill-secondary)',
                                    color: 'var(--label-secondary)'
                                }}
                            >
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
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--label-secondary)' }}>
                <p>No folder selected</p>
            </div>
        );
    }

    const folder = getFolder(folderId);
    const captures = getSmartFolderCaptures(folderId);

    if (!folder) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--label-secondary)' }}>
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
                    <div className="p-2 rounded-lg" style={{ background: 'var(--fill-secondary)' }}>
                        <Icon size={20} style={{ color: folder.color ? undefined : 'var(--label-secondary)' }} className={folder.color || ''} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--label-primary)' }}>
                            {folder.name}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--label-secondary)' }}>
                            Smart Folder
                        </p>
                    </div>
                </div>
                <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                        background: 'var(--fill-secondary)',
                        color: 'var(--label-secondary)'
                    }}
                >
                    {captures.length}
                </span>
            </div>

            {/* Captures Grid */}
            <div className="flex-1 overflow-y-auto px-6">
                {captures.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center p-8 text-center"
                        style={{ color: 'var(--label-tertiary)' }}
                    >
                        <Icon size={64} className="mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--label-primary)' }}>
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
            className={`flex flex-col p-4 border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group relative h-full
                ${capture.status === 'success' ? 'border-l-4 border-l-success-500' : ''}
                ${capture.status === 'failure' ? 'border-l-4 border-l-error-500' : ''}
            `}
            style={{
                background: 'var(--system-background-secondary)',
                borderColor: 'var(--separator-non-opaque)',
                borderRadius: 'var(--radius-card)'
            }}
        >
            {/* Status Badge */}
            <div
                className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10 border-2 border-white"
                style={capture.status === 'success' ? {
                    background: 'var(--system-green)',
                    color: 'white'
                } : capture.status === 'failure' ? {
                    background: 'var(--system-red)',
                    color: 'white'
                } : {
                    background: 'var(--fill-primary)',
                    color: 'white'
                }}
            >
                {index + 1}
            </div>

            {/* Thumbnail */}
            <div className="relative mb-3 rounded-lg overflow-hidden aspect-video" style={{ background: 'var(--fill-tertiary)' }}>
                {capture.path ? (
                    <img
                        src={`file://${capture.path}`}
                        alt={capture.title || 'Capture'}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Camera size={48} style={{ color: 'var(--label-quaternary)' }} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: 'var(--label-primary)' }}>
                    {capture.title || 'Untitled Capture'}
                </h3>
                {capture.description && (
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--label-secondary)' }}>
                        {capture.description}
                    </p>
                )}
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--label-secondary)' }}>
                    <span>{new Date(capture.timestamp).toLocaleDateString()}</span>
                    {capture.flowId && (
                        <span style={{ color: 'var(--system-blue)' }} className="font-medium">
                            In Flow
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
