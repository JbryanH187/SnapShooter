import '@testing-library/jest-dom';

// Mock electron API
global.window = {
    electron: {
        // Add mock IPC methods as needed
        saveCustomTemplate: jest.fn(),
        deleteCustomTemplate: jest.fn(),
    }
} as any;

// Suppress console errors in tests (optional)
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() { return []; }
    unobserve() { }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
} as any;
