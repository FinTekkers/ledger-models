/**
 * Finds the address of a FinTekkers service from the environment, the same
 * way as Java `ServiceAddress` and Rust `service_address.rs` (LM-278). Every
 * default client resolves through here, in this order:
 *
 *  1. `BROKER_HOST` (`host[:port]`, port defaults to {@link BROKER_PORT}):
 *     all calls go through the broker.
 *  2. Only if that is unset, `<SERVICE>_SERVICE_HOST` with
 *     `<SERVICE>_SERVICE_PORT` (or the service's standard port). `_PORT`
 *     without `_HOST` is ignored.
 *  3. `API_URL`, with the service's standard port unless it carries one.
 *  4. `localhost` on the service's standard port.
 *
 * An empty value counts as unset. A leading `http://` or `https://` is
 * ignored. Loopback hosts (`localhost`, `127.0.0.1`) are plaintext; any other
 * host uses TLS. A port that is not a number throws an Error naming the
 * variable.
 *
 * The same cases are checked in every language against
 * `test-fixtures/service-address-cases.json`.
 */
export declare const BROKER_PORT = 8085;
export declare const LEDGER_PORT = 8082;
export declare const VALUATION_PORT = 8080;
export declare const PRICE_PORT = 8083;
export declare enum Service {
    BROKER = "BROKER",
    SECURITY = "SECURITY",
    TRANSACTION = "TRANSACTION",
    PORTFOLIO = "PORTFOLIO",
    VALUATION = "VALUATION",
    PRICE = "PRICE",
    /** JS only: the position client talks to ledger-service. */
    POSITION = "POSITION"
}
export interface Endpoint {
    host: string;
    port: number;
    plaintext: boolean;
}
export type Env = Record<string, string | undefined>;
export declare function envPrefix(service: Service): string;
export declare function standardPort(service: Service): number;
/** Resolves `service` against `env` (defaults to `process.env`). */
export declare function resolve(service: Service, env?: Env): Endpoint;
/** The `host:port` string a gRPC client connects to. */
export declare function target(endpoint: Endpoint): string;
