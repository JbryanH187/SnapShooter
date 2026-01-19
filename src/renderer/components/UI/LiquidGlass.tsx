import React from 'react';
import { MaterialType } from '../../themes/themeConfig';

interface LiquidGlassProps {
    children: React.ReactNode;
    material?: MaterialType;
    className?: string;
    tint?: string;
    style?: React.CSSProperties;
}

/**
 * LiquidGlass Component - iOS 26 Material Wrapper
 * Implements dynamic backdrop-filter with material properties
 * 
 * Usage:
 * <LiquidGlass material="regular">
 *   <Text>Content with glass background</Text>
 * </LiquidGlass>
 */
export const LiquidGlass: React.FC<LiquidGlassProps> = ({
    children,
    material = 'regular',
    className = '',
    tint,
    style = {}
}) => {
    // Material blur intensity mapping
    const blurIntensity: Record<MaterialType, number> = {
        ultraThin: 10,
        thin: 20,
        regular: 30,
        thick: 50,
        ultraThick: 80
    };

    // Material background opacity
    const backgroundOpacity: Record<MaterialType, number> = {
        ultraThin: 0.5,
        thin: 0.6,
        regular: 0.7,
        thick: 0.8,
        ultraThick: 0.9
    };

    const blur = blurIntensity[material];
    const opacity = backgroundOpacity[material];

    const glassStyle: React.CSSProperties = {
        backdropFilter: `blur(${blur}px) saturate(calc(var(--material-saturation, 1.2)))`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(calc(var(--material-saturation, 1.2)))`,
        backgroundColor: tint
            ? `${tint}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
            : `color-mix(in srgb, var(--system-background) ${Math.round(opacity * 100)}%, transparent)`,
        border: '1px solid var(--separator-non-opaque)',
        ...style
    };

    return (
        <div
            className={`liquid-glass ${className}`}
            style={glassStyle}
        >
            {children}
        </div>
    );
};

/**
 * LiquidCard Component - Glass card with squircle corners
 */
interface LiquidCardProps extends LiquidGlassProps {
    elevated?: boolean;
    interactive?: boolean;
}

export const LiquidCard: React.FC<LiquidCardProps> = ({
    children,
    material = 'thin',
    className = '',
    elevated = false,
    interactive = false,
    style = {}
}) => {
    const cardStyle: React.CSSProperties = {
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        transition: 'all var(--timing-normal) cubic-bezier(0.4, 0, 0.2, 1)',
        transform: elevated ? 'translateY(-2px)' : 'none',
        boxShadow: elevated
            ? '0 8px 24px rgba(0, 0, 0, 0.12)'
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
        cursor: interactive ? 'pointer' : 'default',
        ...style
    };

    return (
        <LiquidGlass
            material={material}
            className={`liquid-card ${className}`}
            style={cardStyle}
        >
            {children}
        </LiquidGlass>
    );
};

/**
 * LiquidModal Component - Full modal with sheet geometry
 */
interface LiquidModalProps {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export const LiquidModal: React.FC<LiquidModalProps> = ({
    children,
    isOpen,
    onClose,
    className = ''
}) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                }}
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <LiquidGlass
                    material="thick"
                    className={`max-w-2xl w-full max-h-[90vh] overflow-hidden ${className}`}
                    style={{
                        borderRadius: 'var(--radius-sheet)',
                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    {children}
                </LiquidGlass>
            </div>
        </>
    );
};
