import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiquidTheme } from '../../hooks/useTheme';
import { Sun, Moon, Contrast, Check } from 'lucide-react';
import { LiquidGlass } from './LiquidGlass';

interface ThemeSwitcherProps {
    className?: string;
}

/**
 * ThemeSwitcher - Liquid Glass theme selector (2026)
 * Updated for semantic token system
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '' }) => {
    const { theme, themeId, setTheme, availableThemes, highContrast } = useLiquidTheme();
    const [isOpen, setIsOpen] = React.useState(false);

    const themeIcons: Record<string, React.ReactNode> = {
        'liquid-light': <Sun size={18} />,
        'liquid-dark': <Moon size={18} />,
        'accessible-contrast': <Contrast size={18} />
    };

    const handleThemeSelect = (id: string) => {
        setTheme(id);
        setIsOpen(false);
    };

    // Spring physics from theme config
    const springTransition = {
        type: 'spring',
        damping: theme.physics.spring.damping,
        stiffness: theme.physics.spring.stiffness,
        mass: theme.physics.spring.mass
    };

    return (
        <div className={`relative ${className}`}>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 transition-all"
                style={{
                    background: 'var(--fill-secondary)',
                    border: '1px solid var(--separator-non-opaque)',
                    borderRadius: 'var(--radius-base)',
                    color: 'var(--label-primary)'
                }}
            >
                <span style={{ color: 'var(--label-secondary)' }}>
                    {themeIcons[themeId]}
                </span>
                <span className="text-sm font-medium">
                    {theme.name}
                </span>
                {highContrast && (
                    <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                            background: 'var(--system-orange)',
                            color: 'white'
                        }}
                    >
                        HC
                    </span>
                )}
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={springTransition}
                            className="absolute top-full mt-2 right-0 z-50 min-w-[280px] overflow-hidden"
                        >
                            <LiquidGlass
                                material="thick"
                                style={{
                                    borderRadius: 'var(--radius-modal)',
                                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.16)'
                                }}
                            >
                                {/* Header */}
                                <div
                                    className="px-4 py-3 border-b"
                                    style={{ borderColor: 'var(--separator-non-opaque)' }}
                                >
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: 'var(--label-primary)' }}
                                    >
                                        Appearance
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: 'var(--label-tertiary)' }}
                                    >
                                        Liquid Glass - iOS 26
                                    </p>
                                </div>

                                {/* Theme Options */}
                                <div className="py-2">
                                    {availableThemes.map((t) => (
                                        <motion.button
                                            key={t.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => handleThemeSelect(t.id)}
                                            className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                                            style={{
                                                background: themeId === t.id
                                                    ? 'var(--fill-tertiary)'
                                                    : 'transparent'
                                            }}
                                        >
                                            {/* Icon */}
                                            <span style={{ color: 'var(--label-secondary)' }}>
                                                {themeIcons[t.id]}
                                            </span>

                                            {/* Name & Description */}
                                            <div className="flex-1 text-left">
                                                <div
                                                    className="text-sm font-medium"
                                                    style={{ color: 'var(--label-primary)' }}
                                                >
                                                    {t.name}
                                                </div>
                                                <div
                                                    className="text-xs"
                                                    style={{ color: 'var(--label-tertiary)' }}
                                                >
                                                    {t.description}
                                                </div>
                                            </div>

                                            {/* Check Mark */}
                                            {themeId === t.id && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={springTransition}
                                                >
                                                    <Check
                                                        size={16}
                                                        style={{ color: 'var(--system-blue)' }}
                                                    />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div
                                    className="px-4 py-2 border-t"
                                    style={{ borderColor: 'var(--separator-non-opaque)' }}
                                >
                                    <p
                                        className="text-xs text-center"
                                        style={{ color: 'var(--label-quaternary)' }}
                                    >
                                        Automatically adapts to system preferences
                                    </p>
                                </div>
                            </LiquidGlass>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
