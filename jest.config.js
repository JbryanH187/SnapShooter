module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.ts?(x)',
        '**/?(*.)+(spec|test).ts?(x)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^../../shared/(.*)$': '<rootDir>/src/shared/$1',
        '^../../../shared/(.*)$': '<rootDir>/src/shared/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
    },
    setupFilesAfterEnv': ['<rootDir>/ src / __tests__ / setup.ts'],
collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/main/**', // Exclude main process from coverage
    '!src/preload/**' // Exclude preload from coverage
],
    coverageThresholds: {
    global: {
        branches: 70,
            functions: 70,
                lines: 70,
                    statements: 70
    }
},
coverageDirectory: 'coverage',
    verbose: true,
        testTimeout: 10000,
            transform: {
    '^.+\\.tsx?$': ['ts-jest', {
        tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true
        }
    }]
}
};
