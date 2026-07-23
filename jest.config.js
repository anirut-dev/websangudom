// Jest Configuration for Firebase + JavaScript testing

export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/js', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/firebase-config.js', // External config
    '!js/data.js', // Sample data
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^https://www\\.gstatic\\.com/firebasejs/11\\.0\\.0/firebase-firestore\\.js$': '<rootDir>/tests/mocks/firebase-firestore.js',
    '^https://www\\.gstatic\\.com/firebasejs/11\\.0\\.0/firebase-auth\\.js$': '<rootDir>/tests/mocks/firebase-auth.js',
    '^https://www\\.gstatic\\.com/firebasejs/11\\.0\\.0/firebase-app\\.js$': '<rootDir>/tests/mocks/firebase-app.js',
    '^firebase/firestore$': '<rootDir>/tests/mocks/firebase-firestore.js',
    '^firebase/auth$': '<rootDir>/tests/mocks/firebase-auth.js',
    '^firebase/app$': '<rootDir>/tests/mocks/firebase-app.js',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testTimeout: 10000,
};
