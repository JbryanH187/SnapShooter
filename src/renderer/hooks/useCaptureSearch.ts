
import { useMemo } from 'react';
import { CaptureItem } from '../stores/captureStore';
import { logger } from '../services/Logger';

export type DateFilter = 'all' | 'today' | 'week' | 'month';
export type StatusFilter = 'all' | 'success' | 'failure' | 'pending';

export interface SearchFilters {
    dateRange?: DateFilter;
    status?: StatusFilter;
    query?: string;
    selectedTag?: string;
}

interface SearchResult {
    captures: CaptureItem[];
    count: number;
    hasActiveFilters: boolean;
}

/**
 * Advanced search and filtering for captures
 * Supports: text search, date filtering, status filtering, tag filtering
 */
export const useCaptureSearch = (
    captures: CaptureItem[],
    query: string = '',
    filters: SearchFilters = {}
): SearchResult => {
    const result = useMemo(() => {
        let filtered = [...captures];
        const hasQuery = Boolean(query && query.trim() !== '');
        const hasDateFilter = Boolean(filters.dateRange && filters.dateRange !== 'all');
        const hasStatusFilter = Boolean(filters.status && filters.status !== 'all');
        const hasTagFilter = Boolean(filters.selectedTag && filters.selectedTag !== 'all');
        const hasActiveFilters: boolean = hasQuery || hasDateFilter || hasStatusFilter || hasTagFilter;

        // 1. Tag Filter
        if (hasTagFilter && filters.selectedTag) {
            filtered = filtered.filter(capture => (capture.tags || []).includes(filters.selectedTag!));
        }

        // 2. Date Range Filter
        if (hasDateFilter) {
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            let cutoffTime = 0;

            switch (filters.dateRange) {
                case 'today':
                    // Start of today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    cutoffTime = today.getTime();
                    break;
                case 'week':
                    cutoffTime = now - (7 * oneDayMs);
                    break;
                case 'month':
                    cutoffTime = now - (30 * oneDayMs);
                    break;
            }

            filtered = filtered.filter(capture => capture.timestamp >= cutoffTime);
            logger.debug('CAPTURE', `Date filter applied: ${filters.dateRange}`, {
                originalCount: captures.length,
                filteredCount: filtered.length
            });
        }

        // 3. Status Filter
        if (hasStatusFilter) {
            filtered = filtered.filter(capture => capture.status === filters.status);
            logger.debug('CAPTURE', `Status filter applied: ${filters.status}`, {
                filteredCount: filtered.length
            });
        }

        // 4. Text Search
        if (hasQuery) {
            const lowerQuery = query.toLowerCase().trim();
            const queryWords = lowerQuery.split(/\s+/);

            filtered = filtered.filter((capture) => {
                // Search in multiple fields
                const searchableText = [
                    capture.title || '',
                    capture.description || '',
                    capture.status,
                    (capture.tags || []).join(' '),
                    JSON.stringify(capture.metadata || {})
                ].join(' ').toLowerCase();

                // Check if ALL query words are present (AND logic)
                return queryWords.every(word => searchableText.includes(word));
            });

            logger.debug('CAPTURE', `Text search applied: "${query}"`, {
                filteredCount: filtered.length
            });
        }

        return {
            captures: filtered,
            count: filtered.length,
            hasActiveFilters
        };
    }, [captures, query, filters.dateRange, filters.status, filters.selectedTag]);

    return result;
};

/**
 * Simple hook that only does text search (backward compatibility)
 */
export const useCaptureSearchSimple = (captures: CaptureItem[], query: string) => {
    return useCaptureSearch(captures, query, {}).captures;
};
