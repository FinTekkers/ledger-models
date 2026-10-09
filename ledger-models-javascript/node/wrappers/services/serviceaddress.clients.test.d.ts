/**
 * LM-287: every JS service client gets its address from the per-service
 * lookup, so with the UI's environment (BROKER_HOST=127.0.0.1:8085,
 * API_URL=localhost) all of them, the price client included, call the broker
 * rather than ledger-service on localhost:8082.
 *
 * The generated *_grpc_pb clients are mocked, so no channel is opened.
 */
export {};
