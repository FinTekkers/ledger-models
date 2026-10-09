/**
 * LM-287: the JS service-address lookup resolves every case in the shared
 * fixture exactly as Java `ServiceAddress` and Rust `service_address.rs` do.
 * No cases are written here; they all come from the fixture.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Service,
  resolve,
  target,
  envPrefix,
  standardPort,
  BROKER_PORT,
  LEDGER_PORT,
  VALUATION_PORT,
  PRICE_PORT,
} from './serviceaddress';

interface FixtureCase {
  name: string;
  step: string;
  env: Record<string, string>;
  services: string[];
  expected?: { host: string; port: number; plaintext: boolean };
  error?: string;
}

interface Fixture {
  standard_ports: Record<string, number>;
  cases: FixtureCase[];
}

const fixturePath = path.resolve(__dirname, '../../../../test-fixtures/service-address-cases.json');
const fixture: Fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const rows: Array<[string, string, FixtureCase]> = fixture.cases.flatMap(
  (c) => c.services.map((s): [string, string, FixtureCase] => [c.name, s, c])
);

function serviceNamed(name: string): Service {
  if (!Object.prototype.hasOwnProperty.call(Service, name)) {
    throw new Error(`fixture names an unknown service: ${name}`);
  }
  return Service[name as keyof typeof Service];
}

describe('service-address-cases.json', () => {
  test('has cases covering every step, so an emptied fixture cannot pass', () => {
    // 30 cases expanding to 55 (case, service) checks.
    expect(fixture.cases.length).toBeGreaterThanOrEqual(30);
    expect(rows.length).toBeGreaterThanOrEqual(55);
    expect(new Set(fixture.cases.map((c) => c.step))).toEqual(new Set(['a', 'b', 'c', 'd']));
    for (const c of fixture.cases) {
      expect(c.services.length).toBeGreaterThan(0);
      expect((c.expected === undefined) !== (c.error === undefined)).toBe(true);
    }
  });

  test('standard_ports match the resolver', () => {
    expect(fixture.standard_ports).toEqual({
      BROKER: BROKER_PORT,
      LEDGER: LEDGER_PORT,
      VALUATION: VALUATION_PORT,
      PRICE: PRICE_PORT,
    });
    for (const s of Object.values(Service)) {
      expect(standardPort(s)).toBe(fixture.standard_ports[envPrefix(s)]);
    }
  });

  test.each(rows)('%s [%s]', (_name, serviceName, c) => {
    const service = serviceNamed(serviceName);
    if (c.error !== undefined) {
      expect(() => resolve(service, c.env)).toThrow(c.error);
      return;
    }
    const endpoint = resolve(service, c.env);
    expect(endpoint).toEqual(c.expected);
    expect(target(endpoint)).toBe(`${c.expected!.host}:${c.expected!.port}`);
  });
});
