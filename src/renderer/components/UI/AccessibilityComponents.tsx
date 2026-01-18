import React from 'react';

interface SkipNavProps {
    targetId: string;
    label?: string;
}

/**
 * SkipNav - Skip to main content link
 * WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */
export const SkipNav: React.FC<SkipNavProps> = ({
    targetId,
    label = 'Skip to main content'
}) => {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            className="skip-nav"
            style={{
                position: 'absolute',
                left: '-10000px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                background: 'var(--system-blue)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 'var(--radius-base)',
                fontWeight: 600,
                zIndex: 9999,
                transition: 'all 0.2s'
            }}
            onFocus={(e) => {
                e.currentTarget.style.position = 'fixed';
                e.currentTarget.style.left = '8px';
                e.currentTarget.style.top = '8px';
                e.currentTarget.style.width = 'auto';
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.overflow = 'visible';
            }}
            onBlur={(e) => {
                e.currentTarget.style.position = 'absolute';
                e.currentTarget.style.left = '-10000px';
                e.currentTarget.style.top = 'auto';
                e.currentTarget.style.width = '1px';
                e.currentTarget.style.height = '1px';
                e.currentTarget.style.overflow = 'hidden';
            }}
        >
            {label}
        </a>
    );
};

/**
 * VisuallyHidden - Hide content visually but keep for screen readers
 */
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <span
            style={{
                position: 'absolute',
                left: '-10000px',
                width: '1px',
                height: '1px',
                overflow: 'hidden'
            }}
        >
            {children}
        </span>
    );
};

/**
 * FocusRing - Visible focus indicator
 * WCAG 2.1 Success Criterion 2.4.7 (Focus Visible)
 */
export const FocusRing: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <div
            className={`focus-ring-container ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
                position: 'relative',
                outline: isFocused ? '3px solid var(--ui-focus)' : 'none',
                outlineOffset: '2px',
                borderRadius: 'var(--radius-base)',
                transition: 'outline 0.15s ease-in-out'
            }}
        >
            {children}
        </div>
    );
};
