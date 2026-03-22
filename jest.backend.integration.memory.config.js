export default {
    // display name
    displayName: "integration-memory",

    // when testing backend
    testEnvironment: "node",

    // which test to run
    testMatch: ["<rootDir>/tests/integration-memory/**/*.test.js"],

    setupFiles: ["<rootDir>/tests/integration-memory/setEnv.js"],

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
