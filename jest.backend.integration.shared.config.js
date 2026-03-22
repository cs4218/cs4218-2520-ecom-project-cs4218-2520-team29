export default {
    // display name
    displayName: "integration",

    // when testing backend
    testEnvironment: "node",

    // which test to run
    testMatch: ["<rootDir>/tests/integration/**/*.test.js"],

    // setup file to connect to test database
    setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.js"],

    // jest code coverage
    collectCoverage: true,
    collectCoverageFrom: [
        "controllers/authController.js",
        "models/userModel.js",
        "helpers/authHelper.js"
    ],
    coverageThreshold: {
        global: {
            lines: 0,
            functions: 0,
        },
    },

    testTimeout: 15000,
    passWithNoTests: true,
};