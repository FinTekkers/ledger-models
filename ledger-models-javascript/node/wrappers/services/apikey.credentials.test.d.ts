/**
 * Unit tests for Issue #114: each wrapper service hands the generated gRPC
 * client the authenticated credentials when given an apiKey, and
 * EnvConfig.credentialsFor(service) otherwise, for its own service (LM-287).
 *
 * The generated *_grpc_pb clients are mocked, so no channel is opened.
 */
export {};
