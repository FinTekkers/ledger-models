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
    static get apiCredentials(): grpc.ChannelCredentials;
    /**
     * Returns channel credentials that inject `x-api-key: <apiKey>` into every
     * call's metadata. Uses insecure transport for localhost, SSL otherwise.
     */
    /**
     * Returns credentials and interceptors for authenticated calls.
     * For local (insecure) channels, injects the API key via an interceptor.
     * For remote (SSL) channels, uses combined channel + call credentials.
     */
    static getAuthenticatedClientOptions(apiKey: string): {
        credentials: grpc.ChannelCredentials;
        interceptors: grpc.Interceptor[];
    };
}
export default EnvConfig;
