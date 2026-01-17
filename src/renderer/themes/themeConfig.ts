/**
 * Liquid Glass Theme System (2026)
 * iOS 26 / macOS Tahoe Compliant
 * 
 * Architectural Philosophy:
 * - Semantic Tokens over Hardcoded Hex
 * - Dynamic Materials with Refraction
 * - Squircle Geometry with Concentric Radii
 * - Vibrancy-Aware Color System
 * - Physics-Based Animations
 */

// ============================================
// MATERIAL TYPES (Liquid Glass)
// ============================================
export type MaterialType = 'ultraThin' | 'thin' | 'regular' | 'thick' | 'ultraThick';
export type CornerCurve = 'continuous' | 'circular'; // Squircle vs Circle
export type VibrancyStyle = 'label' | 'secondaryLabel' | 'tertiaryLabel' | 'fill';

// ============================================
// SEMANTIC COLOR TOKEN
// ============================================
export interface SemanticToken {
    light: string;
    dark: string;
    highContrast?: string;  // WCAG AAA fallback
    p3?: string;            // Wide color gamut for OLED
}

// ============================================
// MATERIAL DEFINITION (Physics-Based)
// ============================================
export interface Material {
    type: MaterialType;
    tint?: string;           // Color tint applied to blur
    saturation: number;      // 0-2 (1 = normal, >1 = vibrant)
    refractiveIndex: number; // 1-2 (simulates light bending)
    thickness: number;       // Visual thickness in logical pixels
}

// ============================================
// ADVANCED THEME CONFIG
// ============================================
export interface ThemeColors {
    // System Backgrounds (Semantic Layers)
    system: {
        background: SemanticToken;           // systemBackground
        secondaryBackground: SemanticToken;  // Elevated surfaces
        tertiaryBackground: SemanticToken;   // Grouped content
        groupedBackground: SemanticToken;    // Settings-style lists
    };

    // Labels (Vibrancy-Aware)
    label: {
        primary: SemanticToken;    // Main text (100% opacity)
        secondary: SemanticToken;  // Supporting (60% opacity)
        tertiary: SemanticToken;   // Disabled (30% opacity)
        quaternary: SemanticToken; // Placeholder (18% opacity)
    };

    // Fills (Solid UI Elements)
    fill: {
        primary: SemanticToken;    // Buttons, switches
        secondary: SemanticToken;
        tertiary: SemanticToken;
        quaternary: SemanticToken;
    };

    // Semantic Colors (iOS System Colors)
    semantic: {
        blue: SemanticToken;       // systemBlue
        green: SemanticToken;
        orange: SemanticToken;
        red: SemanticToken;
        yellow: SemanticToken;
        purple: SemanticToken;
        pink: SemanticToken;
        teal: SemanticToken;
    };

    // Separators (Borders & Dividers)
    separator: {
        opaque: SemanticToken;     // Solid line
        nonOpaque: SemanticToken;  // Subtle line
    };
}

// ============================================
// PHYSICS CONFIG (Animation & Motion)
// ============================================
export interface PhysicsConfig {
    spring: {
        damping: number;      // 0-1 (1 = no bounce)
        stiffness: number;    // Higher = faster
        mass: number;         // Higher = slower
    };
    timing: {
        fast: number;         // 150ms
        normal: number;       // 300ms
        slow: number;         // 500ms
        glacial: number;      // 1000ms (dramatic reveals)
    };
}

// ============================================
// GEOMETRY CONFIG (Squircle Math)
// ============================================
export interface GeometryConfig {
    cornerCurve: CornerCurve;
    // Concentric radius formula: R = r + padding
    radius: {
        base: number;        // 10px  (inner content)
        card: number;        // 12px  (base + 2px margin)
        modal: number;       // 20px  (card + 8px padding)
        sheet: number;       // 28px  (modal + 8px padding)
    };
    // Elevation (Z-axis depth)
    elevation: {
        base: number;        // 0dp
        raised: number;      // 2dp
        overlay: number;     // 8dp
        modal: number;       // 16dp
    };
}

// ============================================
// COMPLETE THEME CONFIG
// ============================================
export interface LiquidGlassThemeConfig {
    id: string;
    name: string;
    description: string;
    isDark: boolean;

    // Core Systems
    colors: ThemeColors;
    materials: Record<MaterialType, Material>;
    geometry: GeometryConfig;
    physics: PhysicsConfig;

    // Platform-Specific
    supportsP3: boolean;         // Wide color gamut
    supportsHaptics: boolean;    // Tactile feedback
    supportsVibrancy: boolean;   // Compositing mode
}

// ============================================
// 🍎 LIQUID LIGHT THEME (iOS 26)
// ============================================
export const LIQUID_LIGHT: LiquidGlassThemeConfig = {
    id: 'liquid-light',
    name: 'Liquid Light',
    description: 'iOS 26 dynamic light mode with refractive materials',
    isDark: false,
    supportsP3: true,
    supportsHaptics: true,
    supportsVibrancy: true,

    colors: {
        system: {
            background: {
                light: '#ffffff',
                dark: '#000000',
                highContrast: '#ffffff'
            },
            secondaryBackground: {
                light: '#f2f2f7',  // systemGray6
                dark: '#1c1c1e',
                highContrast: '#f9f9f9'
            },
            tertiaryBackground: {
                light: '#ffffff',
                dark: '#2c2c2e',
                highContrast: '#ffffff'
            },
            groupedBackground: {
                light: '#f2f2f7',
                dark: '#000000',
                highContrast: '#ececec'
            }
        },
        label: {
            primary: {
                light: '#000000',
                dark: '#ffffff',
                highContrast: '#000000'
            },
            secondary: {
                light: 'rgba(60, 60, 67, 0.6)',  // 60% opacity
                dark: 'rgba(235, 235, 245, 0.6)',
                highContrast: 'rgba(0, 0, 0, 0.8)'
            },
            tertiary: {
                light: 'rgba(60, 60, 67, 0.3)',
                dark: 'rgba(235, 235, 245, 0.3)',
                highContrast: 'rgba(0, 0, 0, 0.5)'
            },
            quaternary: {
                light: 'rgba(60, 60, 67, 0.18)',
                dark: 'rgba(235, 235, 245, 0.18)',
                highContrast: 'rgba(0, 0, 0, 0.3)'
            }
        },
        fill: {
            primary: {
                light: 'rgba(120, 120, 128, 0.2)',
                dark: 'rgba(120, 120, 128, 0.36)',
                highContrast: 'rgba(90, 90, 90, 0.4)'
            },
            secondary: {
                light: 'rgba(120, 120, 128, 0.16)',
                dark: 'rgba(120, 120, 128, 0.32)',
                highContrast: 'rgba(90, 90, 90, 0.3)'
            },
            tertiary: {
                light: 'rgba(118, 118, 128, 0.12)',
                dark: 'rgba(118, 118, 128, 0.24)',
                highContrast: 'rgba(90, 90, 90, 0.2)'
            },
            quaternary: {
                light: 'rgba(116, 116, 128, 0.08)',
                dark: 'rgba(116, 116, 128, 0.18)',
                highContrast: 'rgba(90, 90, 90, 0.1)'
            }
        },
        semantic: {
            blue: {
                light: '#007aff',      // systemBlue
                dark: '#0a84ff',       // Brighter in dark mode
                highContrast: '#0040dd',
                p3: 'color(display-p3 0 0.478 1)'
            },
            green: {
                light: '#34c759',
                dark: '#30d158',
                highContrast: '#248a3d',  // Darker to avoid halation
            },
            orange: {
                light: '#ff9500',
                dark: '#ff9f0a',
                highContrast: '#c93400'
            },
            red: {
                light: '#ff3b30',
                dark: '#ff453a',
                highContrast: '#d70015'
            },
            yellow: {
                light: '#ffcc00',
                dark: '#ffd60a',
                highContrast: '#978100'
            },
            purple: {
                light: '#af52de',
                dark: '#bf5af2',
                highContrast: '#8944ab'
            },
            pink: {
                light: '#ff2d55',
                dark: '#ff375f',
                highContrast: '#d30f45'
            },
            teal: {
                light: '#5ac8fa',
                dark: '#64d2ff',
                highContrast: '#0071a4'
            }
        },
        separator: {
            opaque: {
                light: '#c6c6c8',
                dark: '#38383a',
                highContrast: '#8c8c8e'
            },
            nonOpaque: {
                light: 'rgba(60, 60, 67, 0.29)',
                dark: 'rgba(84, 84, 88, 0.65)',
                highContrast: 'rgba(60, 60, 67, 0.5)'
            }
        }
    },

    materials: {
        ultraThin: {
            type: 'ultraThin',
            saturation: 1.8,
            refractiveIndex: 1.1,
            thickness: 0.5
        },
        thin: {
            type: 'thin',
            saturation: 1.5,
            refractiveIndex: 1.2,
            thickness: 1.0
        },
        regular: {
            type: 'regular',
            saturation: 1.2,
            refractiveIndex: 1.35,
            thickness: 1.5
        },
        thick: {
            type: 'thick',
            saturation: 1.0,
            refractiveIndex: 1.5,
            thickness: 2.0
        },
        ultraThick: {
            type: 'ultraThick',
            saturation: 0.8,
            refractiveIndex: 1.7,
            thickness: 3.0
        }
    },

    geometry: {
        cornerCurve: 'continuous', // Squircle!
        radius: {
            base: 10,
            card: 12,   // base + 2px
            modal: 20,  // card + 8px
            sheet: 28   // modal + 8px
        },
        elevation: {
            base: 0,
            raised: 2,
            overlay: 8,
            modal: 16
        }
    },

    physics: {
        spring: {
            damping: 0.825,      // Slightly bouncy
            stiffness: 380,      // Fast response
            mass: 1
        },
        timing: {
            fast: 150,
            normal: 300,
            slow: 500,
            glacial: 1000
        }
    }
};

// ============================================
// 🌙 LIQUID DARK THEME (iOS 26 Dark)
// ============================================
export const LIQUID_DARK: LiquidGlassThemeConfig = {
    ...LIQUID_LIGHT,
    id: 'liquid-dark',
    name: 'Liquid Dark',
    description: 'iOS 26 true black with elevated materials',
    isDark: true,

    // Override only what changes in dark mode
    // Most colors are handled via the SemanticToken.dark properties
};

// ============================================
// ♿ ACCESSIBLE CONTRAST (WCAG AAA)
// ============================================
export const ACCESSIBLE_CONTRAST: LiquidGlassThemeConfig = {
    ...LIQUID_DARK,
    id: 'accessible-contrast',
    name: 'Accessible Contrast',
    description: 'Maximum legibility - WCAG AAA compliant',

    colors: {
        ...LIQUID_DARK.colors,
        system: {
            background: {
                light: '#ffffff',
                dark: '#121212',  // Off-black to reduce halation
                highContrast: '#ffffff'
            },
            secondaryBackground: {
                light: '#f0f0f0',
                dark: '#1e1e1e',
                highContrast: '#f9f9f9'
            },
            tertiaryBackground: {
                light: '#e8e8e8',
                dark: '#2a2a2a',
                highContrast: '#ffffff'
            },
            groupedBackground: {
                light: '#ececec',
                dark: '#121212',
                highContrast: '#ececec'
            }
        },
        label: {
            primary: {
                light: '#000000',
                dark: '#ffffff',
                highContrast: '#000000'
            },
            secondary: {
                light: 'rgba(0, 0, 0, 0.8)',    // Higher opacity for contrast
                dark: 'rgba(255, 255, 255, 0.9)',
                highContrast: 'rgba(0, 0, 0, 1)'
            },
            tertiary: {
                light: 'rgba(0, 0, 0, 0.6)',
                dark: 'rgba(255, 255, 255, 0.7)',
                highContrast: 'rgba(0, 0, 0, 0.8)'
            },
            quaternary: {
                light: 'rgba(0, 0, 0, 0.4)',
                dark: 'rgba(255, 255, 255, 0.5)',
                highContrast: 'rgba(0, 0, 0, 0.6)'
            }
        },
        semantic: {
            ...LIQUID_DARK.colors.semantic,
            green: {
                light: '#248a3d',
                dark: '#28cc2d',   // Reduced brightness to avoid halation
                highContrast: '#1a661f'
            }
        },
        separator: {
            opaque: {
                light: '#8c8c8e',
                dark: '#545458',
                highContrast: '#6c6c6e'
            },
            nonOpaque: {
                light: 'rgba(0, 0, 0, 0.5)',
                dark: 'rgba(255, 255, 255, 0.3)',
                highContrast: 'rgba(0, 0, 0, 0.7)'
            }
        }
    },

    // Thicker materials for better text contrast
    materials: {
        ...LIQUID_DARK.materials,
        regular: {
            type: 'regular',
            saturation: 0.9,      // Less saturation = better legibility
            refractiveIndex: 1.2,  // Less refraction = less distortion
            thickness: 2.5
        }
    }
};

// ============================================
// THEME REGISTRY
// ============================================
export const LIQUID_THEMES: Record<string, LiquidGlassThemeConfig> = {
    'liquid-light': LIQUID_LIGHT,
    'liquid-dark': LIQUID_DARK,
    'accessible-contrast': ACCESSIBLE_CONTRAST
};

export const DEFAULT_THEME = 'liquid-light';
