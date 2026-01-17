interface ActionMetric {
    name: string;
    timestamp: number;
    duration: number;
    metadata?: Record<string, any>;
}

interface ErrorMetric {
    category: string;
    message: string;
    timestamp: number;
    stack?: string;
}

export class PerformanceTracker {
    private metrics: Map<string, number[]> = new Map();
    private actions: ActionMetric[] = [];
    private errors: ErrorMetric[] = [];
    private maxHistorySize = 100;

    // PATRÓN: Automated performance monitoring
    async trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
        const start = performance.now();

        try {
            const result = await operation();
            const duration = performance.now() - start;
            this.recordMetric(name, duration);
            this.trackAction(name, duration);
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            this.recordMetric(`${name}_error`, duration);
            throw error;
        }
    }

    /**
     * Track a user action with metadata
     */
    trackAction(name: string, duration: number, metadata?: Record<string, any>) {
        this.actions.push({
            name,
            timestamp: Date.now(),
            duration,
            metadata
        });

        // Keep only last 100 actions
        if (this.actions.length > this.maxHistorySize) {
            this.actions.shift();
        }
    }

    /**
     * Track an error
     */
    trackError(category: string, error: Error | string, metadata?: Record<string, any>) {
        const errorMetric: ErrorMetric = {
            category,
            message: typeof error === 'string' ? error : error.message,
            timestamp: Date.now(),
            stack: typeof error === 'string' ? undefined : error.stack
        };

        this.errors.push(errorMetric);

        // Keep only last 100 errors
        if (this.errors.length > this.maxHistorySize) {
            this.errors.shift();
        }
    }

    private recordMetric(name: string, value: number) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const values = this.metrics.get(name)!;
        values.push(value);

        // Keep only last 100 measurements
        if (values.length > this.maxHistorySize) {
            values.shift();
        }

        // Alert si performance degrada
        if (name === 'capture' && value > 500) {
            console.warn(`[Performance] Slow operation '${name}': ${value.toFixed(2)}ms`);
        }
    }

    getStats(name: string) {
        const values = this.metrics.get(name) || [];
        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        return {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
            count: values.length
        };
    }

    /**
     * Get all metrics for dashboard
     */
    getAllMetrics() {
        const allStats: Record<string, any> = {};

        for (const [name, _] of this.metrics) {
            allStats[name] = this.getStats(name);
        }

        return allStats;
    }

    /**
     * Get actions grouped by name with counts
     */
    getActionStats() {
        const actionCounts: Record<string, number> = {};

        this.actions.forEach(action => {
            actionCounts[action.name] = (actionCounts[action.name] || 0) + 1;
        });

        return actionCounts;
    }

    /**
     * Get errors grouped by category
     */
    getErrorStats() {
        const errorCounts: Record<string, number> = {};

        this.errors.forEach(error => {
            errorCounts[error.category] = (errorCounts[error.category] || 0) + 1;
        });

        return errorCounts;
    }

    /**
     * Get recent actions (last N)
     */
    getRecentActions(count: number = 10) {
        return this.actions.slice(-count).reverse();
    }

    /**
     * Get recent errors (last N)
     */
    getRecentErrors(count: number = 10) {
        return this.errors.slice(-count).reverse();
    }

    /**
     * Get metrics for date range
     */
    getMetricsForRange(startDate: Date, endDate: Date) {
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();

        const rangeActions = this.actions.filter(
            action => action.timestamp >= startTime && action.timestamp <= endTime
        );

        const rangeErrors = this.errors.filter(
            error => error.timestamp >= startTime && error.timestamp <= endTime
        );

        return {
            actions: rangeActions,
            errors: rangeErrors,
            actionCount: rangeActions.length,
            errorCount: rangeErrors.length
        };
    }

    /**
     * Export all metrics as JSON
     */
    exportMetrics() {
        return {
            metrics: this.getAllMetrics(),
            actions: this.actions,
            errors: this.errors,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.metrics.clear();
        this.actions = [];
        this.errors = [];
    }
}

export const performanceTracker = new PerformanceTracker();
