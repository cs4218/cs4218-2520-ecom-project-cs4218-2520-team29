export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
  "<rootDir>/controllers/**/*.test.js",
  "<rootDir>/middlewares/**/*.test.js",
  "<rootDir>/helpers/**/*.test.js",
  ],
  passWithNoTests: true,

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**",
    "!controllers/categoryController.js"
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};
