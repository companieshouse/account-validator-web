module.exports = {
    roots: ["<rootDir>"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    collectCoverageFrom: ["./src/**/*.ts"],
    coveragePathIgnorePatterns: ["/src/bin/"],
    testEnvironment: "node",
    verbose: true,
    testMatch: ["**/test/**/*.unit.[jt]s"],
    // Babel replaces ts-jest
    transform: {
        "^.+\\.[tj]s$": "babel-jest",
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(uuid)/)",
    ],
    globalSetup: "./test/global.setup.ts",
    testTimeout: 10000, // Set the timeout to 10 seconds (or any other appropriate value)
};
