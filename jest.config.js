export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.svg$': 'jest-transformer-svg',
  },
  setupFilesAfterEnv: ['./src/setupTests.ts'],
  modulePathIgnorePatterns: ['<rootDir>/backend/package.json', '<rootDir>/supabase/functions/package.json'],
};
