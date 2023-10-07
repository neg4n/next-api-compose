/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/*'],
  coverageReporters: ['html', 'json', 'lcov'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  coverageProvider: 'v8'
}
