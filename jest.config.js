export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
  }
};
