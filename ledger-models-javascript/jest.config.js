module.exports = {
    preset: 'ts-jest',
    testMatch: ["**/*.test.ts"],
    // Exclude service-tier tests that connect to gRPC (price-service,
    // transaction-service, security-service, position-service,
    // portfolio-service). They pass locally where services are up
    // and fail in CI with `UNAVAILABLE: No connection established`.
    // Run via `npm run test:integration` against a separate config.
    // See processes/test-discipline.md.
    testPathIgnorePatterns: [
      "/node_modules/",
      "node/wrappers/services/[^/]+/.+\\.test\\.ts$",
    ],
  };
