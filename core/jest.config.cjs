// jest.config.js
module.exports = {
  // Use the ts-jest preset to automatically configure Jest for TypeScript
  preset: 'ts-jest',

  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  // Specify the test environment
  testEnvironment: 'node',

  // Specify which files to test (both .js and .ts)
  testMatch: ['<rootDir>/test/**/*.test.js'],

  // Collect coverage from both .js and .ts files
  collectCoverageFrom: ['src/**/*.js', '!src/zone.js'],

  // You can also add more configurations like this to work around issues
  // with modules that don't export in CommonJS
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Ensure ts-jest can find your tsconfig.json
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
