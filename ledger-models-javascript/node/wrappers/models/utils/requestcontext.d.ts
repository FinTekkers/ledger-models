import * as grpc from '@grpc/grpc-js';
import { Service } from '../../util/serviceaddress';
declare class EnvConfig {
    static get apiKey(): string | undefined;
    /**
     * Returns the `host:port` of the ledger service, found the same way as
     * every other service: `BROKER_HOST`, then `LEDGER_SERVICE_HOST`/`_PORT`,
     * then `API_URL` (with :8082 unless it carries a port), then
     * localhost:8082. Clients should prefer {@link EnvConfig.urlFor}.
     */
    static get apiURL(): string;
    /** Returns the `host:port` a client for `service` connects to. */
    static urlFor(service: Service): string;
    private static isPlaintext;
    /** Channel credentials for {@link EnvConfig.apiURL}. */
    static get apiCredentials(): grpc.ChannelCredentials;
    /** Insecure credentials for a loopback address, SSL otherwise. */
    static credentialsFor(service: Service): grpc.ChannelCredentials;
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
     * @throws {InsecureChannelAuthError} when the address of `service` is
     * localhost / 127.0.0.1.
     */
    static getAuthenticatedCredentials(apiKey: string, service?: Service): grpc.ChannelCredentials;
    /**
     * Returns credentials and interceptors for authenticated calls to `service`.
     * For local (insecure) channels, injects the API key via an interceptor.
     * For remote (SSL) channels, uses {@link EnvConfig.getAuthenticatedCredentials}.
     */
    static getAuthenticatedClientOptions(apiKey: string, service?: Service): {
        credentials: grpc.ChannelCredentials;
        interceptors: grpc.Interceptor[];
    };
}
/**
 * Thrown by EnvConfig.getAuthenticatedCredentials when the service address is
 * an insecure (local) channel. The message never includes the API key.
 */
export declare class InsecureChannelAuthError extends Error {
    constructor();
}
export default EnvConfig;
