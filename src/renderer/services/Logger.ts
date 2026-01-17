
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'IPC' | 'UI' | 'CAPTURE' | 'STORE' | 'REPORT' | 'GENERAL';

interface LogContext {
    [key: string]: any;
}

interface ILogger {
    info(category: LogCategory, message: string, context?: LogContext): void;
    warn(category: LogCategory, message: string, context?: LogContext): void;
    error(category: LogCategory, message: string, context?: LogContext): void;
    debug(category: LogCategory, message: string, context?: LogContext): void;
}

class LoggerService implements ILogger {
    private static instance: LoggerService;
    private isDev: boolean;
    private logBuffer: Array<{ timestamp: string; level: LogLevel; category: LogCategory; message: string; context?: LogContext }> = [];
    private maxBufferSize = 1000; // Prevent memory leaks

    private constructor() {
        // Check for dev mode
        this.isDev = (import.meta as any).env?.DEV || false;
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private formatMessage(level: LogLevel, category: LogCategory, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
    }

    private addToBuffer(level: LogLevel, category: LogCategory, message: string, context?: LogContext): void {
        const timestamp = new Date().toISOString();

        this.logBuffer.push({ timestamp, level, category, message, context });

        // Keep buffer size manageable
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
        }
    }

    private log(level: LogLevel, category: LogCategory, message: string, context?: LogContext): void {
        const formattedMessage = this.formatMessage(level, category, message);

        // Add to buffer for potential file writing later
        this.addToBuffer(level, category, message, context);

        // Console output with context
        const consoleMethod = console[level] || console.log;
        if (context && Object.keys(context).length > 0) {
            consoleMethod(formattedMessage, context);
        } else {
            consoleMethod(formattedMessage);
        }
    }

    public info(category: LogCategory, message: string, context?: LogContext): void {
        this.log('info', category, message, context);
    }

    public warn(category: LogCategory, message: string, context?: LogContext): void {
        this.log('warn', category, message, context);
    }

    public error(category: LogCategory, message: string, context?: LogContext): void {
        this.log('error', category, message, context);

        // In production, could send to error tracking service here
        // Example: Sentry, LogRocket, etc.
    }

    public debug(category: LogCategory, message: string, context?: LogContext): void {
        if (this.isDev) {
            this.log('debug', category, message, context);
        }
    }

    /**
     * Get the current log buffer (useful for error reports or debugging)
     */
    public getLogBuffer(): Array<{ timestamp: string; level: LogLevel; category: LogCategory; message: string; context?: LogContext }> {
        return [...this.logBuffer];
    }

    /**
     * Clear the log buffer
     */
    public clearBuffer(): void {
        this.logBuffer = [];
    }

    /**
     * Export logs as JSON string (for saving to file or copying)
     */
    public exportLogs(): string {
        return JSON.stringify(this.logBuffer, null, 2);
    }
}

export const logger = LoggerService.getInstance();
