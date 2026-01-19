import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLiquidTheme } from '../../contexts/LiquidThemeContext';

export const DarkModeToggle: React.FC = () => {
    const { themeId, setTheme, isDark } = useLiquidTheme();

    const toggleTheme = () => {
        setTheme(isDark ? 'liquid-light' : 'liquid-dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
                background: isDark ? 'var(--fill-secondary)' : 'var(--fill-tertiary)',
                color: isDark ? 'var(--system-orange)' : 'var(--label-secondary)'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};
