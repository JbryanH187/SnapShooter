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
    Home,
    FolderKanban,
    LayoutTemplate
} from 'lucide-react';
import { SmartFoldersList } from '../Views/SmartFoldersList';
import { LiquidGlass } from '../UI/LiquidGlass';

export type ViewType = 'home' | 'recents' | 'flows' | 'history' | 'drafts' | 'builder';

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
            label: 'Storage',
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
        },
        {
            id: 'builder' as ViewType,
            label: 'Report Builder',
            icon: LayoutTemplate,
            count: null,
            onClick: () => onViewChange('builder')
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
                        className="fixed inset-0 z-40"
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)'
                        }}
                        onClick={onClose}
                    />

                    {/* Menu Panel - Slides from LEFT with LiquidGlass */}
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-0 top-0 bottom-0 w-[280px] shadow-2xl z-50 flex flex-col"
                    >
                        <LiquidGlass
                            material="thick"
                            className="h-full flex flex-col"
                            style={{
                                borderRight: '1px solid var(--separator-non-opaque)'
                            }}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between p-5 border-b"
                                style={{ borderColor: 'var(--separator-non-opaque)' }}
                            >
                                <h2
                                    className="text-lg font-bold flex items-center gap-2"
                                    style={{ color: 'var(--label-primary)' }}
                                >
                                    <Camera style={{ color: 'var(--system-blue)' }} size={22} />
                                    SnapProof
                                </h2>
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

                            {/* Navigation Items */}
                            <nav className="flex-1 overflow-y-auto">
                                <div className="p-4 space-y-2">
                                    {menuItems.map((item) => (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                item.onClick();
                                                onClose();
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                                            style={{
                                                background: currentView === item.id ? 'var(--system-blue)' : 'transparent',
                                                color: currentView === item.id ? 'white' : 'var(--label-primary)',
                                                border: currentView === item.id ? '1px solid var(--system-blue)' : '1px solid transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (currentView !== item.id) {
                                                    e.currentTarget.style.background = 'var(--fill-secondary)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (currentView !== item.id) {
                                                    e.currentTarget.style.background = 'transparent';
                                                }
                                            }}
                                            data-tour={item.id === 'flows' ? 'flows-tab' : undefined}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="p-2 rounded-lg"
                                                    style={{
                                                        background: currentView === item.id
                                                            ? 'rgba(255, 255, 255, 0.2)'
                                                            : 'var(--fill-secondary)'
                                                    }}
                                                >
                                                    <item.icon size={18} />
                                                </div>
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.count !== null && (
                                                    <span
                                                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                                        style={{
                                                            background: currentView === item.id
                                                                ? 'rgba(255, 255, 255, 0.3)'
                                                                : 'var(--fill-primary)',
                                                            color: currentView === item.id
                                                                ? 'white'
                                                                : 'var(--label-secondary)'
                                                        }}
                                                    >
                                                        {item.count}
                                                    </span>
                                                )}
                                                <ChevronRight size={16} className="opacity-50" />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Smart Folders Section */}
                                <div className="px-4 pb-4">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <FolderKanban size={14} style={{ color: 'var(--label-tertiary)' }} />
                                        <span
                                            className="text-xs font-semibold uppercase tracking-wider"
                                            style={{ color: 'var(--label-tertiary)' }}
                                        >
                                            Carpetas Inteligentes
                                        </span>
                                    </div>
                                    <SmartFoldersList
                                        compact
                                        onFolderSelect={() => onClose()}
                                    />
                                </div>
                            </nav>

                            {/* Settings at Bottom */}
                            <div
                                className="p-4 border-t"
                                style={{ borderColor: 'var(--separator-non-opaque)' }}
                            >
                                <motion.button
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        onSettingsClick();
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                                    style={{ color: 'var(--label-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ background: 'var(--fill-secondary)' }}
                                    >
                                        <Settings size={18} />
                                    </div>
                                    <span className="font-medium">Settings</span>
                                </motion.button>
                            </div>
                        </LiquidGlass>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};
