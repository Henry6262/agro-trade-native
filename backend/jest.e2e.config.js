/**
 * backend/jest.e2e.config.js
 * E2E coverage gating – intentionally lower thresholds than unit.
 * E2E tests cover critical flows & integration behaviour, not every branch.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@faker-js)/)'],
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/seed/**',
    '!src/**/scripts/**',
    '!src/**/data/**',
  ],
  coverageDirectory: './coverage/e2e',
  coverageReporters: ['text', 'lcov', 'html'],

  // ─── E2E GLOBAL FLOOR (lower than unit – by design) ──────────────────────
  coverageThreshold: {
    global: {
      branches:   30,
      functions:  40,
      lines:      40,
      statements: 40,
    },
    // Critical-path modules must reach a meaningful bar even in e2e.
    './src/auth/': {
      branches:   40,
      functions:  50,
      lines:      50,
      statements: 50,
    },
    './src/orders/': {
      branches:   40,
      functions:  50,
      lines:      50,
      statements: 50,
    },
  },

  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
