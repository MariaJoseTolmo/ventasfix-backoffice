'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Ensures the test database exists and its schema is up to date before
  // any test file runs. See tests/jest.global-setup.js.
  globalSetup: '<rootDir>/tests/jest.global-setup.js',
  // Removes the temp upload directory created by globalSetup.
  globalTeardown: '<rootDir>/tests/jest.global-teardown.js',
  verbose: true,
};
