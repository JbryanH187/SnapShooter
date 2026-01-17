import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RippleButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    className?: string;
    disabled?: boolean;
}

/**
 * RippleButton - Material Design ripple effect with Liquid Glass aesthetics
 * iOS 26 compliant with haptic feedback simulation
 */
export const RippleButton: React.FC<RippleButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    disabled = false
}) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;

        // Get click position relative to button
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add ripple
        const newRipple = { x, y, id: Date.now() };
        setRipples([...ripples, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples(current => current.filter(r => r.id !== newRipple.id));
        }, 600);

        // Call onClick handler
        onClick?.();
    };

    const variantStyles = {
        primary: {
            background: 'var(--system-blue)',
            color: 'white',
            border: 'none'
        },
        secondary: {
            background: 'var(--fill-primary)',
            color: 'var(--label-primary)',
            border: '1px solid var(--separator-opaque)'
        },
        ghost: {
            background: 'transparent',
            color: 'var(--system-blue)',
            border: 'none'
        }
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={handleClick}
            disabled={disabled}
            className={`relative overflow-hidden px-6 py-3 rounded-full font-semibold transition-all ${className}`}
            style={{
                ...variantStyles[variant],
                borderRadius: 'var(--radius-base)',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer'
            }}
        >
            {/* Ripple Effects */}
            {ripples.map(ripple => (
                <motion.span
                    key={ripple.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: 0,
                        height: 0,
                        background: 'rgba(255, 255, 255, 0.5)',
                        transform: 'translate(-50%, -50%)'
                    }}
                    initial={{ width: 0, height: 0, opacity: 0.5 }}
                    animate={{
                        width: 300,
                        height: 300,
                        opacity: 0
                    }}
                    transition={{
                        duration: 0.6,
                        ease: 'easeOut'
                    }}
                />
            ))}

            {/* Button Content */}
            <span className="relative z-10">
                {children}
            </span>
        </motion.button>
    );
};

/**
 * AnimatedIcon - Smooth hover and tap animations
 */
interface AnimatedIconProps {
    icon: React.ReactNode;
    onClick?: () => void;
    hoverScale?: number;
    tapScale?: number;
    className?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
    icon,
    onClick,
    hoverScale = 1.1,
    tapScale = 0.9,
    className = ''
}) => {
    return (
        <motion.div
            whileHover={{ scale: hoverScale, rotate: 5 }}
            whileTap={{ scale: tapScale }}
            onClick={onClick}
            className={`cursor-pointer ${className}`}
            style={{
                display: 'inline-flex',
                color: 'var(--label-secondary)'
            }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17
            }}
        >
            {icon}
        </motion.div>
    );
};

/**
 * LiftCard - Card that lifts on hover with shadow
 */
interface LiftCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const LiftCard: React.FC<LiftCardProps> = ({
    children,
    onClick,
    className = ''
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={onClick}
            className={`rounded-lg p-4 cursor-pointer ${className}`}
            style={{
                background: 'var(--system-background-secondary)',
                border: '1px solid var(--separator-non-opaque)',
                borderRadius: 'var(--radius-card)'
            }}
            animate={{
                y: isHovered ? -4 : 0,
                boxShadow: isHovered
                    ? '0 12px 32px rgba(0, 0, 0, 0.12)'
                    : '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20
            }}
        >
            {children}
        </motion.div>
    );
};

/**
 * SkeletonLoader - Loading state with shimmer effect
 */
interface SkeletonLoaderProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 20,
    className = '',
    variant = 'rectangular'
}) => {
    const shapes = {
        text: 'var(--radius-base)',
        circular: '50%',
        rectangular: 'var(--radius-card)'
    };

    return (
        <div
            className={`skeleton-loader ${className}`}
            style={{
                width,
                height,
                background: 'var(--fill-secondary)',
                borderRadius: shapes[variant],
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Shimmer Effect */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                }}
                animate={{
                    x: ['-100%', '200%']
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
        </div>
    );
};

/**
 * SpringProgress - Progress bar with spring physics
 */
interface SpringProgressProps {
    value: number; // 0-100
    className?: string;
    showLabel?: boolean;
}

export const SpringProgress: React.FC<SpringProgressProps> = ({
    value,
    className = '',
    showLabel = true
}) => {
    const clampedValue = Math.min(Math.max(value, 0), 100);

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between mb-2">
                    <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--label-secondary)' }}
                    >
                        Progress
                    </span>
                    <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--system-blue)' }}
                    >
                        {Math.round(clampedValue)}%
                    </span>
                </div>
            )}

            <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--fill-tertiary)' }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, var(--system-blue), var(--system-purple))'
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${clampedValue}%` }}
                    transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 15,
                        mass: 0.5
                    }}
                />
            </div>
        </div>
    );
};
