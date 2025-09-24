// jest.config.js
module.exports = {
  // Use the ts-jest preset to automatically configure Jest for TypeScript
  preset: 'ts-jest',

  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  // Specify the test environment
  testEnvironment: 'node',

  // Specify which files to test (both .ts)
  testMatch: ['<rootDir>/src/**/*.test.ts'],

  // Collect coverage from both  .ts files
  collectCoverageFrom: ['src/**/*.ts', '!src/zone.js'],

  // You can also add more configurations like this to work around issues
  // with modules that don't export in CommonJS
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
