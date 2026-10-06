import * as grpc from '@grpc/grpc-js';
declare class EnvConfig {
    private static getEnvVar;
    static get apiKey(): string | undefined;
    /**
     * Returns the URL for the backend GRPC service. It will default to
     * api.fintekkers.org:8082 if the environment variable is not set. If
     * API_URL already includes a port (e.g. localhost:8083), it is used as-is;
     * otherwise :8082 is appended for backward compatibility.
     */
    static get apiURL(): string;
    private static get isLocalURL();
    static get apiCredentials(): grpc.ChannelCredentials;
    private static addApiKey;
    /**
     * Returns SSL channel credentials combined with per-call credentials that
     * inject `x-api-key: <apiKey>` into every call's metadata.
     *
     * Remote (SSL) hosts only: grpc-js cannot compose call credentials with
     * insecure channel credentials. For localhost / 127.0.0.1 use
     * {@link EnvConfig.getAuthenticatedClientOptions}, which sends the key via
     * an interceptor instead.
     *
     * @throws {InsecureChannelAuthError} when apiURL is localhost / 127.0.0.1.
     */
    static getAuthenticatedCredentials(apiKey: string): grpc.ChannelCredentials;
    /**
     * Returns credentials and interceptors for authenticated calls.
     * For local (insecure) channels, injects the API key via an interceptor.
     * For remote (SSL) channels, uses {@link EnvConfig.getAuthenticatedCredentials}.
     */
    static getAuthenticatedClientOptions(apiKey: string): {
        credentials: grpc.ChannelCredentials;
        interceptors: grpc.Interceptor[];
    };
}
/**
 * Thrown by EnvConfig.getAuthenticatedCredentials when API_URL points at an
 * insecure (local) channel. The message never includes the API key.
 */
export declare class InsecureChannelAuthError extends Error {
    constructor();
}
export default EnvConfig;
