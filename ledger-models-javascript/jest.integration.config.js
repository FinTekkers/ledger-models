module.exports = {
    preset: 'ts-jest',
    // Only the gRPC-touching service-tier tests. Requires real
    // services running. See processes/test-discipline.md.
    testMatch: ["**/node/wrappers/services/*/*.test.ts"],
  };
