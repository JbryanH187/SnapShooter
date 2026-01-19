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
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/**/__mocks__/**',
        '!src/main/**',
        '!src/preload/**'
    ],
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
