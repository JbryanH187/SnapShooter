export class PerformanceTracker {
    private metrics: Map<string, number[]> = new Map();

    // PATRÓN: Automated performance monitoring
    async trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
        const start = performance.now();

        try {
            const result = await operation();
            this.recordMetric(name, performance.now() - start);
            return result;
        } catch (error) {
            this.recordMetric(`${name}_error`, performance.now() - start);
            throw error;
        }
    }

    private recordMetric(name: string, value: number) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const values = this.metrics.get(name)!;
        values.push(value);

        // Keep only last 100 measurements
        if (values.length > 100) {
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

        return {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            // Simple p95 approximation
            p95: values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)]
        };
    }
}

export const performanceTracker = new PerformanceTracker();
