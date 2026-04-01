/**
 * backend/jest.config.js
 * Unit-test coverage gating – per-module thresholds + global iron floor
 *
 * DTOs are EXCLUDED from unit coverage (they are contract-tested separately
 * via DTO snapshot tests – see backend/tests/dto-snapshots/).
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@faker-js)/)'],
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',          // covered by DTO snapshot tests
    '!src/**/*.entity.ts',
    '!src/**/seed/**',
    '!src/**/scripts/**',
    '!src/**/data/**',
  ],
  coverageDirectory: './coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],

  // ─── GLOBAL IRON FLOOR ────────────────────────────────────────────────────
  // CI fails if the entire codebase drops below these numbers.
  coverageThreshold: {
    global: {
      branches:   60,
      functions:  65,
      lines:      65,
      statements: 65,
    },

    // ─── PER-MODULE THRESHOLDS (business-critical) ─────────────────────────
    // Raise these as you add tests. Never lower them.
    './src/auth/': {
      branches:   70,
      functions:  75,
      lines:      75,
      statements: 75,
    },
    './src/orders/': {
      branches:   70,
      functions:  75,
      lines:      75,
      statements: 75,
    },
    './src/negotiations/': {
      branches:   65,
      functions:  70,
      lines:      70,
      statements: 70,
    },
    './src/escrow/': {
      branches:   65,
      functions:  70,
      lines:      70,
      statements: 70,
    },
    './src/pricing/': {
      branches:   65,
      functions:  70,
      lines:      70,
      statements: 70,
    },
    './src/products/': {
      branches:   60,
      functions:  65,
      lines:      65,
      statements: 65,
    },
    './src/transport/': {
      branches:   60,
      functions:  65,
      lines:      65,
      statements: 65,
    },
  },

  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
