import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Layers,
    History,
    Settings,
    X,
    ChevronRight,
    FileEdit,
    Home // Added Home icon
} from 'lucide-react';

export type ViewType = 'home' | 'recents' | 'flows' | 'history' | 'drafts';

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    captureCount: number;
    flowCount: number;
    onSettingsClick: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
    isOpen,
    onClose,
    currentView,
    onViewChange,
    captureCount,
    flowCount,
    onSettingsClick
}) => {
    const menuItems = [
        {
            id: 'recents' as ViewType,
            label: 'Recientes',
            icon: Camera,
            count: captureCount,
            onClick: () => onViewChange('recents')
        },
        {
            id: 'flows' as ViewType,
            label: 'Flujos de Trabajo',
            icon: Layers,
            count: flowCount,
            onClick: () => onViewChange('flows')
        },
        {
            id: 'history' as ViewType,
            label: 'Historial',
            icon: History,
            count: null,
            onClick: () => onViewChange('history')
        },
        {
            id: 'drafts' as ViewType,
            label: 'Borradores',
            icon: FileEdit,
            count: null,
            onClick: () => onViewChange('drafts')
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Menu Panel - Slides from LEFT */}
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-r border-gray-200 dark:border-gray-700"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Camera className="text-primary-500" size={22} />
                                SnapProof
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 p-4 space-y-2">
                            {menuItems.map((item) => (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        item.onClick();
                                        onClose();
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${currentView === item.id
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${currentView === item.id
                                            ? 'bg-primary-100 dark:bg-primary-900/40'
                                            : 'bg-gray-100 dark:bg-gray-800'
                                            }`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.count !== null && (
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${currentView === item.id
                                                ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {item.count}
                                            </span>
                                        )}
                                        <ChevronRight size={16} className="opacity-50" />
                                    </div>
                                </motion.button>
                            ))}
                        </nav>

                        {/* Settings at Bottom */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                            <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    onSettingsClick();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all"
                            >
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <Settings size={18} />
                                </div>
                                <span className="font-medium">Settings</span>
                            </motion.button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};
