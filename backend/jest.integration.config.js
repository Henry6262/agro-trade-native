const { testRegex: _testRegex, ...e2eConfig } = require('./jest.e2e.config');

// These pre-harness scenario suites were added in 2025 but were never run by
// `test:integration` (the script previously aliased the `.e2e-spec.ts` suite).
// They target removed APIs/schema and are tracked individually so a new
// integration spec is never excluded by a directory-wide ignore. See
// tests/LEGACY_INTEGRATION_QUARANTINE.md for evidence and re-entry criteria.
const quarantinedLegacySuites = [
  '<rootDir>/tests/integration/counter-offer-scenarios.spec.ts',
  '<rootDir>/tests/integration/expiration-handling.spec.ts',
  '<rootDir>/tests/integration/multi-seller-coordination.spec.ts',
  '<rootDir>/tests/integration/multi-seller-negotiation.spec.ts',
  '<rootDir>/tests/integration/negotiation-flow-complete.spec.ts',
  '<rootDir>/tests/integration/price-scenarios.spec.ts',
  '<rootDir>/tests/integration/profit-calculation-flow.spec.ts',
  '<rootDir>/tests/integration/trade-flow-complete.spec.ts',
  '<rootDir>/tests/integration/transport-optimization.spec.ts',
  '<rootDir>/tests/integration/withdrawal-rejection-flows.spec.ts',
  '<rootDir>/tests/contract/trade-scenarios.spec.ts',
];

module.exports = {
  ...e2eConfig,
  testMatch: [
    '<rootDir>/tests/integration/**/*.spec.ts',
    '<rootDir>/tests/contract/**/*.spec.ts',
    '<rootDir>/src/trade-operations/controllers/trade-operation.controller.spec.ts',
    '<rootDir>/src/trade-operations/controllers/profit.controller.spec.ts',
  ],
  testPathIgnorePatterns: quarantinedLegacySuites,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  coverageDirectory: './coverage/integration',
};
