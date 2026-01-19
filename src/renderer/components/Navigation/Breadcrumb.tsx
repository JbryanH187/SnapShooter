import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { useUI, VIEW_LABELS } from '../../contexts/UIContext';
import { ViewType } from '../Layout/HamburgerMenu';

interface BreadcrumbProps {
    maxItems?: number;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ maxItems = 3 }) => {
    const { navigationHistory, setContentView, goBack, canGoBack } = useUI();

    // Deduplicate consecutive views and limit display
    const uniqueHistory = navigationHistory.reduce<ViewType[]>((acc, view) => {
        if (acc.length === 0 || acc[acc.length - 1] !== view) {
            acc.push(view);
        }
        return acc;
    }, []);

    // Limit to maxItems (keep first and last items, truncate middle)
    const displayHistory = uniqueHistory.length <= maxItems
        ? uniqueHistory
        : [
            uniqueHistory[0],
            ...uniqueHistory.slice(-(maxItems - 1))
        ];

    const isTruncated = uniqueHistory.length > maxItems;

    const handleClick = (view: ViewType, index: number) => {
        if (index === displayHistory.length - 1) return; // Don't navigate to current
        setContentView(view);
    };

    return (
        <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            {/* Back Button */}
            {canGoBack && (
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={goBack}
                    className="p-1.5 rounded-lg transition-colors mr-2"
                    style={{ color: 'var(--label-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Volver"
                >
                    <ArrowLeft size={16} />
                </motion.button>
            )}

            {/* Breadcrumb Items */}
            <ol className="flex items-center gap-1">
                {displayHistory.map((view, index) => {
                    const isLast = index === displayHistory.length - 1;
                    const isFirst = index === 0;
                    const showTruncation = isTruncated && index === 1;

                    return (
                        <li key={`${view}-${index}`} className="flex items-center">
                            {/* Truncation indicator */}
                            {showTruncation && (
                                <>
                                    <span className="mx-1" style={{ color: 'var(--label-tertiary)' }}>...</span>
                                    <ChevronRight size={14} style={{ color: 'var(--label-tertiary)' }} />
                                </>
                            )}

                            {/* Separator */}
                            {index > 0 && !showTruncation && (
                                <ChevronRight size={14} className="mx-0.5" style={{ color: 'var(--label-tertiary)' }} />
                            )}

                            {/* Breadcrumb Item */}
                            <motion.button
                                onClick={() => handleClick(view, index)}
                                disabled={isLast}
                                className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
                                style={isLast ? {
                                    color: 'var(--label-primary)',
                                    fontWeight: 500,
                                    cursor: 'default'
                                } : {
                                    color: 'var(--label-tertiary)'
                                }}
                                onMouseEnter={(e) => { if (!isLast) { e.currentTarget.style.color = 'var(--label-primary)'; e.currentTarget.style.background = 'var(--fill-secondary)'; } }}
                                onMouseLeave={(e) => { if (!isLast) { e.currentTarget.style.color = 'var(--label-tertiary)'; e.currentTarget.style.background = 'transparent'; } }}
                                whileHover={!isLast ? { scale: 1.02 } : undefined}
                                whileTap={!isLast ? { scale: 0.98 } : undefined}
                            >
                                {isFirst && view === 'home' && (
                                    <Home size={14} />
                                )}
                                <span>{VIEW_LABELS[view]}</span>
                            </motion.button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
