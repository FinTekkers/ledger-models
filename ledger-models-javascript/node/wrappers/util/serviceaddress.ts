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

export const BROKER_PORT = 8085;
export const LEDGER_PORT = 8082;
export const VALUATION_PORT = 8080;
export const PRICE_PORT = 8083;

export enum Service {
  BROKER = 'BROKER',
  SECURITY = 'SECURITY',
  TRANSACTION = 'TRANSACTION',
  PORTFOLIO = 'PORTFOLIO',
  VALUATION = 'VALUATION',
  PRICE = 'PRICE',
  /** JS only: the position client talks to ledger-service. */
  POSITION = 'POSITION',
}

/** Prefix of each service's `<SERVICE>_SERVICE_HOST/_PORT` variables, and its standard port. */
const SERVICE_ENV: Record<Service, { envPrefix: string; standardPort: number }> = {
  [Service.BROKER]: { envPrefix: 'BROKER', standardPort: BROKER_PORT },
  [Service.SECURITY]: { envPrefix: 'LEDGER', standardPort: LEDGER_PORT },
  [Service.TRANSACTION]: { envPrefix: 'LEDGER', standardPort: LEDGER_PORT },
  [Service.PORTFOLIO]: { envPrefix: 'LEDGER', standardPort: LEDGER_PORT },
  [Service.VALUATION]: { envPrefix: 'VALUATION', standardPort: VALUATION_PORT },
  [Service.PRICE]: { envPrefix: 'PRICE', standardPort: PRICE_PORT },
  [Service.POSITION]: { envPrefix: 'LEDGER', standardPort: LEDGER_PORT },
};

export interface Endpoint {
  host: string;
  port: number;
  plaintext: boolean;
}

export type Env = Record<string, string | undefined>;

export function envPrefix(service: Service): string {
  return SERVICE_ENV[service].envPrefix;
}

export function standardPort(service: Service): number {
  return SERVICE_ENV[service].standardPort;
}

/** Resolves `service` against `env` (defaults to `process.env`). */
export function resolve(service: Service, env: Env = process.env): Endpoint {
  const broker = read(env, 'BROKER_HOST');
  if (broker !== undefined) {
    return parse(broker, 'BROKER_HOST', BROKER_PORT);
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

/** The `host:port` string a gRPC client connects to. */
export function target(endpoint: Endpoint): string {
  return `${endpoint.host}:${endpoint.port}`;
}

function read(env: Env, name: string): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(env, name)) return undefined;
  const value = env[name];
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parse(value: string, variable: string, defaultPort: number): Endpoint {
  let address = value;
  const scheme = address.indexOf('://');
  if (scheme >= 0) address = address.substring(scheme + 3);
  while (address.endsWith('/')) address = address.substring(0, address.length - 1);

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

function parsePort(value: string, variable: string): number {
  const trimmed = value.trim();
  // Java's Integer.parseInt accepts an optional sign; the range check below rejects negatives.
  if (!/^[+-]?\d+$/.test(trimmed)) throw invalidPort(value, variable);
  const port = Number(trimmed);
  if (port < 1 || port > 65535) throw invalidPort(value, variable);
  return port;
}

function invalidPort(value: string, variable: string): Error {
  return new Error(`${variable} has an invalid port: '${value}'`);
}

function makeEndpoint(host: string, port: number): Endpoint {
  const plaintext = host === 'localhost' || host === '127.0.0.1';
  return { host, port, plaintext };
}
