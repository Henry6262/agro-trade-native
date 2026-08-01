const { testRegex: _testRegex, ...e2eConfig } = require('./jest.e2e.config');

module.exports = {
  ...e2eConfig,
  testMatch: [
    '<rootDir>/tests/integration/**/*.spec.ts',
    '<rootDir>/tests/contract/**/*.spec.ts',
    '<rootDir>/src/trade-operations/controllers/trade-operation.controller.spec.ts',
    '<rootDir>/src/trade-operations/controllers/profit.controller.spec.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  coverageDirectory: './coverage/integration',
};
