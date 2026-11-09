// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./src/setupTests.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/setupTests.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    '^arcanist-common$': '<rootDir>/../arcanist-common/index.js',
    '^arcanist-common/(.*)$': '<rootDir>/../arcanist-common/$1',
  },
  // arcanist-common lives outside the project root, so when babel-jest
  // transforms its files the inserted `@babel/runtime/...` requires resolve
  // starting from the arcanist-common folder (which has no node_modules).
  // Add the client's node_modules as a fallback resolver path.
  modulePaths: ['<rootDir>/node_modules'],
  testEnvironment: 'jsdom',
};
