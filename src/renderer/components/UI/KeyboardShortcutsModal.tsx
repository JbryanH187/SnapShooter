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
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <KeyboardIcon size={24} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            Keyboard Shortcuts
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Master SnapProof with these shortcuts
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Search & Filters */}
                            <div className="p-6 space-y-4 border-b border-gray-200 dark:border-gray-700">
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search shortcuts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>

                                {/* Category Filters */}
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === null
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {Object.entries(CATEGORY_INFO).map(([key, { name, icon: Icon, color }]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCategory(key)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${selectedCategory === key
                                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
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
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {name}
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {shortcuts.map((shortcut, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                                            >
                                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {shortcut.description}
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    {shortcut.keys.map((key, keyIndex) => (
                                                                        <React.Fragment key={keyIndex}>
                                                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
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
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> to close
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
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
