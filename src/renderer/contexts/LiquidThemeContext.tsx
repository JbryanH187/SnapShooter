import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LIQUID_THEMES, DEFAULT_THEME, LiquidGlassThemeConfig, SemanticToken } from '../themes/themeConfig';

const THEME_STORAGE_KEY = 'snapproof-liquid-theme';

interface LiquidThemeContextType {
    theme: LiquidGlassThemeConfig;
    themeId: string;
    setTheme: (themeId: string) => void;
    availableThemes: LiquidGlassThemeConfig[];
    isDark: boolean;
    systemPrefersDark: boolean;
    highContrast: boolean;
}

const LiquidThemeContext = createContext<LiquidThemeContextType | undefined>(undefined);

/**
 * Resolve semantic token to actual color based on conditions
 */
const resolveToken = (
    token: SemanticToken,
    isDark: boolean,
    highContrast: boolean,
    supportsP3: boolean
): string => {
    if (highContrast && token.highContrast) {
        return token.highContrast;
    }
    if (supportsP3 && token.p3 && !isDark) {
        return token.p3;
    }
    return isDark ? token.dark : token.light;
};

interface LiquidThemeProviderProps {
    children: ReactNode;
}

/**
 * LiquidThemeProvider - Shared context for Liquid Glass theme system
 * All components using useLiquidTheme will share this state
 */
export const LiquidThemeProvider: React.FC<LiquidThemeProviderProps> = ({ children }) => {
    const [systemPrefersDark, setSystemPrefersDark] = useState(
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    const [highContrast, setHighContrast] = useState(
        window.matchMedia('(prefers-contrast: more)').matches
    );

    const [themeId, setThemeId] = useState<string>(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        return saved || DEFAULT_THEME;
    });

    const theme = LIQUID_THEMES[themeId] || LIQUID_THEMES[DEFAULT_THEME];
    const isDark = theme.isDark;

    // Listen for system theme changes
    useEffect(() => {
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const contrastQuery = window.matchMedia('(prefers-contrast: more)');

        const darkHandler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        const contrastHandler = (e: MediaQueryListEvent) => setHighContrast(e.matches);

        darkQuery.addEventListener('change', darkHandler);
        contrastQuery.addEventListener('change', contrastHandler);

        return () => {
            darkQuery.removeEventListener('change', darkHandler);
            contrastQuery.removeEventListener('change', contrastHandler);
        };
    }, []);

    // Inject CSS variables when theme changes
    useEffect(() => {
        const root = document.documentElement;

        // System Backgrounds
        root.style.setProperty(
            '--system-background',
            resolveToken(theme.colors.system.background, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--system-background-secondary',
            resolveToken(theme.colors.system.secondaryBackground, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--system-background-tertiary',
            resolveToken(theme.colors.system.tertiaryBackground, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--system-background-grouped',
            resolveToken(theme.colors.system.groupedBackground, isDark, highContrast, theme.supportsP3)
        );

        // Labels
        root.style.setProperty(
            '--label-primary',
            resolveToken(theme.colors.label.primary, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--label-secondary',
            resolveToken(theme.colors.label.secondary, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--label-tertiary',
            resolveToken(theme.colors.label.tertiary, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--label-quaternary',
            resolveToken(theme.colors.label.quaternary, isDark, highContrast, theme.supportsP3)
        );

        // Fills
        root.style.setProperty(
            '--fill-primary',
            resolveToken(theme.colors.fill.primary, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--fill-secondary',
            resolveToken(theme.colors.fill.secondary, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--fill-tertiary',
            resolveToken(theme.colors.fill.tertiary, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--fill-quaternary',
            resolveToken(theme.colors.fill.quaternary, isDark, highContrast, theme.supportsP3)
        );

        // Semantic Colors
        root.style.setProperty(
            '--system-blue',
            resolveToken(theme.colors.semantic.blue, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--system-green',
            resolveToken(theme.colors.semantic.green, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--system-orange',
            resolveToken(theme.colors.semantic.orange, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--system-red',
            resolveToken(theme.colors.semantic.red, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--system-purple',
            resolveToken(theme.colors.semantic.purple, isDark, highContrast, theme.supportsP3)
        );

        // Separators
        root.style.setProperty(
            '--separator-opaque',
            resolveToken(theme.colors.separator.opaque, isDark, highContrast, theme.supportsP3)
        );
        root.style.setProperty(
            '--separator-non-opaque',
            resolveToken(theme.colors.separator.nonOpaque, isDark, highContrast, theme.supportsP3)
        );

        // Geometry (Squircle radii)
        root.style.setProperty('--radius-base', `${theme.geometry.radius.base}px`);
        root.style.setProperty('--radius-card', `${theme.geometry.radius.card}px`);
        root.style.setProperty('--radius-modal', `${theme.geometry.radius.modal}px`);
        root.style.setProperty('--radius-sheet', `${theme.geometry.radius.sheet}px`);

        // Physics (Animation timing)
        root.style.setProperty('--timing-fast', `${theme.physics.timing.fast}ms`);
        root.style.setProperty('--timing-normal', `${theme.physics.timing.normal}ms`);
        root.style.setProperty('--timing-slow', `${theme.physics.timing.slow}ms`);

        // Material Properties
        const regularMaterial = theme.materials.regular;
        root.style.setProperty('--material-saturation', `${regularMaterial.saturation}`);
        root.style.setProperty('--material-refractive-index', `${regularMaterial.refractiveIndex}`);
        root.style.setProperty('--material-thickness', `${regularMaterial.thickness}`);

        // Apply dark class for Tailwind compatibility
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Store preference
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }, [theme, themeId, isDark, highContrast]);

    const setThemeById = useCallback((id: string) => {
        if (LIQUID_THEMES[id]) {
            setThemeId(id);
        }
    }, []);

    const value: LiquidThemeContextType = {
        theme,
        themeId,
        setTheme: setThemeById,
        availableThemes: Object.values(LIQUID_THEMES),
        isDark,
        systemPrefersDark,
        highContrast
    };

    return (
        <LiquidThemeContext.Provider value={value}>
            {children}
        </LiquidThemeContext.Provider>
    );
};

/**
 * useLiquidTheme Hook - Access the shared Liquid Glass theme context
 * Must be used within a LiquidThemeProvider
 */
export const useLiquidTheme = (): LiquidThemeContextType => {
    const context = useContext(LiquidThemeContext);
    if (!context) {
        throw new Error('useLiquidTheme must be used within a LiquidThemeProvider');
    }
    return context;
};

// Backward compatibility export
export const useTheme = useLiquidTheme;
