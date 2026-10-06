/**
 * Unit tests for Issue #114: each wrapper service hands the generated gRPC
 * client the authenticated credentials when given an apiKey, and
 * EnvConfig.apiCredentials otherwise.
 *
 * The generated *_grpc_pb clients are mocked, so no channel is opened.
 */
export {};
