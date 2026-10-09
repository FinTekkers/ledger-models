"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.target = exports.resolve = exports.standardPort = exports.envPrefix = exports.Service = exports.PRICE_PORT = exports.VALUATION_PORT = exports.LEDGER_PORT = exports.BROKER_PORT = void 0;
exports.BROKER_PORT = 8085;
exports.LEDGER_PORT = 8082;
exports.VALUATION_PORT = 8080;
exports.PRICE_PORT = 8083;
var Service;
(function (Service) {
    Service["BROKER"] = "BROKER";
    Service["SECURITY"] = "SECURITY";
    Service["TRANSACTION"] = "TRANSACTION";
    Service["PORTFOLIO"] = "PORTFOLIO";
    Service["VALUATION"] = "VALUATION";
    Service["PRICE"] = "PRICE";
    /** JS only: the position client talks to ledger-service. */
    Service["POSITION"] = "POSITION";
})(Service || (exports.Service = Service = {}));
/** Prefix of each service's `<SERVICE>_SERVICE_HOST/_PORT` variables, and its standard port. */
const SERVICE_ENV = {
    [Service.BROKER]: { envPrefix: 'BROKER', standardPort: exports.BROKER_PORT },
    [Service.SECURITY]: { envPrefix: 'LEDGER', standardPort: exports.LEDGER_PORT },
    [Service.TRANSACTION]: { envPrefix: 'LEDGER', standardPort: exports.LEDGER_PORT },
    [Service.PORTFOLIO]: { envPrefix: 'LEDGER', standardPort: exports.LEDGER_PORT },
    [Service.VALUATION]: { envPrefix: 'VALUATION', standardPort: exports.VALUATION_PORT },
    [Service.PRICE]: { envPrefix: 'PRICE', standardPort: exports.PRICE_PORT },
    [Service.POSITION]: { envPrefix: 'LEDGER', standardPort: exports.LEDGER_PORT },
};
function envPrefix(service) {
    return SERVICE_ENV[service].envPrefix;
}
exports.envPrefix = envPrefix;
function standardPort(service) {
    return SERVICE_ENV[service].standardPort;
}
exports.standardPort = standardPort;
/** Resolves `service` against `env` (defaults to `process.env`). */
function resolve(service, env = process.env) {
    const broker = read(env, 'BROKER_HOST');
    if (broker !== undefined) {
        return parse(broker, 'BROKER_HOST', exports.BROKER_PORT);
    }
    const { envPrefix, standardPort } = SERVICE_ENV[service];
    const hostVar = envPrefix + '_SERVICE_HOST';
    const host = read(env, hostVar);
    if (host !== undefined) {
        const portVar = envPrefix + '_SERVICE_PORT';
        const port = read(env, portVar);
        const endpoint = parse(host, hostVar, standardPort);
        return port === undefined
            ? endpoint
            : makeEndpoint(endpoint.host, parsePort(port, portVar));
    }
    const apiUrl = read(env, 'API_URL');
    if (apiUrl !== undefined) {
        return parse(apiUrl, 'API_URL', standardPort);
    }
    return makeEndpoint('localhost', standardPort);
}
exports.resolve = resolve;
/** The `host:port` string a gRPC client connects to. */
function target(endpoint) {
    return `${endpoint.host}:${endpoint.port}`;
}
exports.target = target;
function read(env, name) {
    if (!Object.prototype.hasOwnProperty.call(env, name))
        return undefined;
    const value = env[name];
    if (value === undefined || value === null)
        return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}
function parse(value, variable, defaultPort) {
    let address = value;
    const scheme = address.indexOf('://');
    if (scheme >= 0)
        address = address.substring(scheme + 3);
    while (address.endsWith('/'))
        address = address.substring(0, address.length - 1);
    let host = address;
    let port = defaultPort;
    const colon = address.lastIndexOf(':');
    if (colon >= 0) {
        host = address.substring(0, colon);
        port = parsePort(address.substring(colon + 1), variable);
    }
    if (host === '') {
        throw new Error(`${variable} has no host: '${value}'`);
    }
    return makeEndpoint(host, port);
}
function parsePort(value, variable) {
    const trimmed = value.trim();
    // Java's Integer.parseInt accepts an optional sign; the range check below rejects negatives.
    if (!/^[+-]?\d+$/.test(trimmed))
        throw invalidPort(value, variable);
    const port = Number(trimmed);
    if (port < 1 || port > 65535)
        throw invalidPort(value, variable);
    return port;
}
function invalidPort(value, variable) {
    return new Error(`${variable} has an invalid port: '${value}'`);
}
function makeEndpoint(host, port) {
    const plaintext = host === 'localhost' || host === '127.0.0.1';
    return { host, port, plaintext };
}
//# sourceMappingURL=serviceaddress.js.map