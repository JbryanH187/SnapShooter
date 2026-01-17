import { logger } from '../services/Logger';

export interface RetryOptions {
    maxAttempts?: number;
    backoff?: 'exponential' | 'linear' | 'fixed';
    baseDelay?: number; // milliseconds
    maxDelay?: number; // milliseconds
    onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    backoff: 'exponential',
    baseDelay: 1000,
    maxDelay: 10000,
    onRetry: () => { }
};

/**
 * Calculate delay based on backoff strategy
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay: number;

    switch (options.backoff) {
        case 'exponential':
            delay = options.baseDelay * Math.pow(2, attempt - 1);
            break;
        case 'linear':
            delay = options.baseDelay * attempt;
            break;
        case 'fixed':
        default:
            delay = options.baseDelay;
            break;
    }

    return Math.min(delay, options.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with configurable backoff strategy
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => window.electron.getCaptures(),
 *   { maxAttempts: 3, backoff: 'exponential' }
 * );
 * ```
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            logger.debug('IPC', `Attempting operation (${attempt}/${opts.maxAttempts})`);
            const result = await operation();

            if (attempt > 1) {
                logger.info('IPC', `Operation succeeded after ${attempt} attempts`);
            }

            return result;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            logger.warn('IPC', `Operation failed (attempt ${attempt}/${opts.maxAttempts})`, {
                error: lastError.message,
                attempt
            });

            // Don't retry if we've exhausted attempts
            if (attempt >= opts.maxAttempts) {
                logger.error('IPC', 'Operation failed after all retry attempts', {
                    error: lastError.message,
                    attempts: opts.maxAttempts
                });
                break;
            }

            // Calculate delay and wait before next attempt
            const delay = calculateDelay(attempt, opts);
            logger.debug('IPC', `Retrying in ${delay}ms...`);

            opts.onRetry(attempt, lastError);
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Create a retry wrapper with preset options
 * 
 * @example
 * ```typescript
 * const retryIPC = createRetryWrapper({ maxAttempts: 5 });
 * const data = await retryIPC(() => window.electron.getCaptures());
 * ```
 */
export function createRetryWrapper(options: RetryOptions) {
    return async <T>(operation: () => Promise<T>): Promise<T> => {
        return withRetry(operation, options);
    };
}

/**
 * Retry with manual intervention option
 * Returns { success: boolean, data?: T, error?: Error }
 */
export async function withManualRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<{ success: boolean; data?: T; error?: Error }> {
    try {
        const data = await withRetry(operation, options);
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error))
        };
    }
}

/**
 * Type guard to check if window.electron is available
 */
export function isElectronAvailable(): boolean {
    return typeof window !== 'undefined' && window.electron !== undefined;
}

/**
 * Safe IPC wrapper that checks electron availability
 */
export async function safeIPC<T>(
    operation: () => Promise<T>,
    fallback?: T
): Promise<T> {
    if (!isElectronAvailable()) {
        logger.warn('IPC', 'Electron API not available');
        if (fallback !== undefined) {
            return fallback;
        }
        throw new Error('Electron API not available and no fallback provided');
    }

    return withRetry(operation);
}
