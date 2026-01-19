import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Camera, FileText, Layers, Keyboard as KeyboardIcon, ArrowLeft, Zap } from 'lucide-react';
import { logger } from '../../services/Logger';

interface Shortcut {
    keys: string[];
    description: string;
    category: 'capture' | 'navigation' | 'editing' | 'general';
}

const SHORTCUTS: Shortcut[] = [
    // Capture shortcuts
    { keys: ['Ctrl', 'Shift', '1'], description: 'Take single screenshot', category: 'capture' },
    { keys: ['Ctrl', 'Shift', '2'], description: 'Start Quick Flow mode (series)', category: 'capture' },

    // Navigation shortcuts
    { keys: ['Ctrl', 'K'], description: 'Focus search bar', category: 'navigation' },
    { keys: ['Ctrl', '1'], description: 'Go to Recents', category: 'navigation' },
    { keys: ['Ctrl', '2'], description: 'Go to Flows', category: 'navigation' },
    { keys: ['Ctrl', ','], description: 'Open Settings', category: 'navigation' },

    // Editing shortcuts
    { keys: ['Ctrl', 'Z'], description: 'Undo last action', category: 'editing' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo action', category: 'editing' },
    { keys: ['Ctrl', 'Y'], description: 'Redo action (alternative)', category: 'editing' },
    { keys: ['Delete'], description: 'Delete selected capture', category: 'editing' },

    // General shortcuts
    { keys: ['Ctrl', '?'], description: 'Show keyboard shortcuts', category: 'general' },
    { keys: ['Ctrl', 'R'], description: 'Generate report', category: 'general' },
    { keys: ['Esc'], description: 'Close modal/dialog', category: 'general' },
];

const CATEGORY_INFO = {
    capture: { name: 'Capture', icon: Camera, color: 'text-primary-500' },
    navigation: { name: 'Navigation', icon: ArrowLeft, color: 'text-blue-500' },
    editing: { name: 'Editing', icon: FileText, color: 'text-green-500' },
    general: { name: 'General', icon: Zap, color: 'text-amber-500' },
};

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Filter shortcuts based on search and category
    const filteredShortcuts = SHORTCUTS.filter(shortcut => {
        const matchesSearch = searchQuery === '' ||
            shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shortcut.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = !selectedCategory || shortcut.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Group shortcuts by category
    const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
        if (!acc[shortcut.category]) {
            acc[shortcut.category] = [];
        }
        acc[shortcut.category].push(shortcut);
        return acc;
    }, {} as Record<string, Shortcut[]>);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            logger.info('UI', 'Keyboard shortcuts modal opened');
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden border"
                            style={{ background: 'var(--system-background)', borderColor: 'var(--separator-opaque)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--separator-opaque)' }}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)' }}
                                    >
                                        <KeyboardIcon size={24} style={{ color: 'var(--system-blue)' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold" style={{ color: 'var(--label-primary)' }}>
                                            Keyboard Shortcuts
                                        </h2>
                                        <p className="text-sm" style={{ color: 'var(--label-secondary)' }}>
                                            Master SnapProof with these shortcuts
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: 'var(--label-secondary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search & Filters */}
                            <div className="p-6 space-y-4 border-b" style={{ borderColor: 'var(--separator-opaque)' }}>
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search shortcuts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                                    />
                                </div>

                                {/* Category Filters */}
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                        style={selectedCategory === null ? {
                                            background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                            color: 'var(--system-blue)'
                                        } : {
                                            background: 'var(--fill-secondary)',
                                            color: 'var(--label-secondary)'
                                        }}
                                        onMouseEnter={(e) => { if (selectedCategory !== null) e.currentTarget.style.background = 'var(--fill-tertiary)'; }}
                                        onMouseLeave={(e) => { if (selectedCategory !== null) e.currentTarget.style.background = 'var(--fill-secondary)'; }}
                                    >
                                        All
                                    </button>
                                    {Object.entries(CATEGORY_INFO).map(([key, { name, icon: Icon, color }]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCategory(key)}
                                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            style={selectedCategory === key ? {
                                                background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                                color: 'var(--system-blue)'
                                            } : {
                                                background: 'var(--fill-secondary)',
                                                color: 'var(--label-secondary)'
                                            }}
                                            onMouseEnter={(e) => { if (selectedCategory !== key) e.currentTarget.style.background = 'var(--fill-tertiary)'; }}
                                            onMouseLeave={(e) => { if (selectedCategory !== key) e.currentTarget.style.background = 'var(--fill-secondary)'; }}
                                        >
                                            <Icon size={14} className={selectedCategory === key ? color : ''} />
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Shortcuts List */}
                            <div className="p-6 overflow-y-auto max-h-[50vh]">
                                {Object.keys(groupedShortcuts).length === 0 ? (
                                    <div className="text-center py-12" style={{ color: 'var(--label-tertiary)' }}>
                                        <KeyboardIcon size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No shortcuts found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => {
                                            const { name, icon: Icon, color } = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                                            return (
                                                <div key={category}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Icon size={16} className={color} />
                                                        <h3 className="font-semibold" style={{ color: 'var(--label-primary)' }}>
                                                            {name}
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {shortcuts.map((shortcut, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors"
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-quaternary)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <span className="text-sm" style={{ color: 'var(--label-secondary)' }}>
                                                                    {shortcut.description}
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    {shortcut.keys.map((key, keyIndex) => (
                                                                        <React.Fragment key={keyIndex}>
                                                                            <kbd className="px-2 py-1 border rounded text-xs font-mono font-semibold shadow-sm" style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}>
                                                                                {key}
                                                                            </kbd>
                                                                            {keyIndex < shortcut.keys.length - 1 && (
                                                                                <span className="text-gray-400 text-xs mx-0.5">+</span>
                                                                            )}
                                                                        </React.Fragment>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t flex justify-between items-center" style={{ background: 'var(--fill-quaternary)', borderColor: 'var(--separator-opaque)' }}>
                                <div className="text-xs" style={{ color: 'var(--label-secondary)' }}>
                                    Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--fill-secondary)' }}>Esc</kbd> to close
                                </div>
                                <div className="text-xs" style={{ color: 'var(--label-secondary)' }}>
                                    {filteredShortcuts.length} shortcut{filteredShortcuts.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
