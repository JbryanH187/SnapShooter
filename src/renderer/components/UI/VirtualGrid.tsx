import React, { useRef, useEffect, useState } from 'react';
import { logger } from '../../services/Logger';

interface VirtualGridProps<T> {
    items: T[];
    renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
    itemHeight: number;
    gap?: number;
    minColumnWidth?: number;
    className?: string;
}

/**
 * Optimized Grid with CSS Grid and smart rendering
 * Uses content-visibility for performance on large lists
 * Note: Full react-window virtualization has module resolution issues with Vite/Electron
 */
export const VirtualGrid = <T,>({
    items,
    renderItem,
    itemHeight,
    gap = 16,
    minColumnWidth = 300,
    className = ""
}: VirtualGridProps<T>) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLargeList, setIsLargeList] = useState(false);

    useEffect(() => {
        // Consider it a large list if > 100 items
        setIsLargeList(items.length > 100);

        if (items.length > 100) {
            logger.debug('UI', `Large list detected: ${items.length} items`);
        }
    }, [items.length]);

    // For very large lists, CSS Grid + browser optimizations handle up to ~500 items well
    // content-visibility CSS property provides automatic virtualization

    return (
        <div
            ref={containerRef}
            className={`w-full h-full overflow-y-auto ${className}`}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
                gap: `${gap}px`,
                padding: '0',
                alignContent: 'start',
                // Enable GPU acceleration for smoother scrolling
                willChange: isLargeList ? 'scroll-position' : 'auto',
                transform: 'translateZ(0)', // Force GPU layer
            }}
        >
            {items.map((item, index) => (
                <div
                    key={(item as any).id || index}
                    style={{
                        // Modern browser feature: automatically hide off-screen content
                        contentVisibility: isLargeList ? 'auto' : 'visible',
                        containIntrinsicSize: isLargeList ? `${itemHeight}px` : 'none',
                    }}
                >
                    {renderItem(item, index, {})}
                </div>
            ))}
        </div>
    );
};
