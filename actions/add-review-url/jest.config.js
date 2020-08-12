module.exports = {
    clearMocks: true,
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    testMatch: ['**/*.test.ts'],
    testRunner: 'jest-circus/runner',    
    moduleFileExtensions: ['ts', 'js'],
    verbose: true
  }