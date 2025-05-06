/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  // Coverage configuration
  collectCoverageFrom: [
    'lib/analytics/projected-earnings.ts',
    'lib/analytics/price-recommendations.ts',
  ],
  coverageThreshold: {
    'lib/analytics/projected-earnings.ts': {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95
    },
    'lib/analytics/price-recommendations.ts': {
      branches: 85,
      functions: 94,
      lines: 95,
      statements: 95
    }
  },
  coverageDirectory: 'coverage',
}; 