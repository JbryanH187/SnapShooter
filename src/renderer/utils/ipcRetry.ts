
import { logger } from '../services/Logger';

interface RetryOptions {
    retries?: number;
    delay?: number;
    factor?: number;
    onRetry?: (attempt: number, error: any) => void;
}

/**
 * Wraps a promise-returning function with retry logic using exponential backoff.
 * @param fn The async function to execute
 * @param options Retry configuration
 * @deprecated Consider using withRetry from retryStrategy.ts for more features
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        retries = 3,
        delay = 1000,
        factor = 2,
        onRetry
    } = options;

    let attempt = 0;

    while (attempt <= retries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;

            if (attempt > retries) {
                logger.error('IPC', 'Operation failed after all retry attempts', {
                    error: error instanceof Error ? error.message : String(error),
                    attempts: retries
                });
                throw error;
            }

            const backoff = delay * Math.pow(factor, attempt - 1);

            logger.warn('IPC', `Operation failed (Attempt ${attempt}/${retries})`, {
                error: error instanceof Error ? error.message : String(error),
                retryIn: `${backoff}ms`,
                attempt
            });

            if (onRetry) {
                onRetry(attempt, error);
            }

            await new Promise(resolve => setTimeout(resolve, backoff));
        }
    }

    throw new Error('Should not reach here');
}
