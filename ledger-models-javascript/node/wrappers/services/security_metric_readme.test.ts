/**
 * LM-485: the "Security metrics" example in ledger-models-javascript/README.md
 * runs here, against the in-memory SecurityMetric server. The code between
 * the README:start and README:end markers must equal the README's example
 * block (after removing common indentation and trailing whitespace).
 */
import * as fs from 'fs';
import * as path from 'path';
import { SecurityMetricTypeProto } from '../../fintekkers/models/security/security_metric_type_pb';
import Security from '../models/security/security';
import { isoDate } from '../models/security/security_metric';
import { UUID } from '../models/utils/uuid';
import {
  SecurityMetricService,
  getSecurityMetricService,
  resetSecurityMetricServiceForTests,
  setSecurityMetricService,
} from './security-metric-service/SecurityMetricService';
import { FakeSecurityMetricServer, SPY_UUID } from './security_metric_fake_server';

const README = path.resolve(__dirname, '../../../README.md');
const EXAMPLE_MARKER = '<!-- tested by node/wrappers/services/security_metric_readme.test.ts -->';

function normalise(code: string): string {
  const lines = code.split('\n').map(l => l.replace(/\s+$/, ''));
  while (lines.length && lines[0] === '') lines.shift();
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  const indents = lines.filter(l => l !== '').map(l => l.length - l.trimStart().length);
  const common = indents.length ? Math.min(...indents) : 0;
  return lines.map(l => l.slice(common)).join('\n');
}

function readmeExample(): string {
  const text = fs.readFileSync(README, 'utf8');
  const at = text.indexOf(EXAMPLE_MARKER);
  expect(at).toBeGreaterThanOrEqual(0);
  const block = /```(?:ts|typescript)\n([\s\S]*?)```/.exec(text.slice(at));
  expect(block).not.toBeNull();
  return normalise(block![1]);
}

function testedExample(): string {
  const source = fs.readFileSync(path.resolve(__dirname, 'security_metric_readme.test.ts'), 'utf8');
  // The markers are comment lines of their own.
  const marked = /^[ \t]*\/\/ README:start\n([\s\S]*?)^[ \t]*\/\/ README:end$/m.exec(source);
  expect(marked).not.toBeNull();
  return normalise(marked![1]);
}

let fake: FakeSecurityMetricServer;

beforeAll(async () => {
  fake = await FakeSecurityMetricServer.start();
  fake.seed(SPY_UUID, SecurityMetricTypeProto.NAV_PER_SHARE, [['2026-11-20', '512.34']]);
});

afterAll(async () => {
  await fake.stop();
});

beforeEach(() => {
  setSecurityMetricService(SecurityMetricService.fromEnv({
    PRICE_SERVICE_HOST: '127.0.0.1',
    PRICE_SERVICE_PORT: String(fake.port),
  }));
});

afterEach(() => {
  resetSecurityMetricServiceForTests();
});

test('the README example is the code tested here', () => {
  expect(readmeExample()).toBe(testedExample());
});

test('the README example runs', async () => {
  const spyUuid = SPY_UUID;
  const qqqUuid = '00000000-0000-4000-8000-000000000999';

  // README:start
  const spy = new Security(Security.linkOfLatest(new UUID(UUID.fromString(spyUuid))));

  // The latest value on or before a date: undefined when there is none, never 0.
  const shares = await spy.getMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, '2026-11-23');
  // shares.value: Decimal 15210000000, isoDate(shares.date): '2026-11-20', shares.ageDays: 3

  // Shortcuts; `on` defaults to today.
  const nav = await spy.navPerShare('2026-11-23');

  // Many securities in one call: every UUID is a key, undefined when it has no value.
  const service = getSecurityMetricService();
  const latest = await service.get('SHARES_OUTSTANDING', [spyUuid, qqqUuid], '2026-11-23');

  // History in date order, gaps kept; `to` defaults to today.
  const history = await spy.sharesOutstandingHistory('2026-11-01', '2026-11-23');
  const byDate = history.asDict(); // Map { '2026-11-19' => 15204137000, '2026-11-20' => 15210000000 }

  // Record: points are checked first, then sent; returns the as_of the service stamped.
  const asOf = await service.record('NAV_PER_SHARE', spyUuid, { '2026-11-23': '513.02' });
  // README:end

  expect(shares!.value.toFixed()).toBe('15210000000');
  expect(isoDate(shares!.date)).toBe('2026-11-20');
  expect(shares!.ageDays).toBe(3);
  expect(nav!.value.toFixed()).toBe('512.34');
  expect([...latest.keys()]).toEqual([spyUuid, qqqUuid]);
  expect(latest.get(spyUuid)!.value.toFixed()).toBe('15210000000');
  expect(latest.get(qqqUuid)).toBeUndefined();
  expect([...byDate.entries()].map(([d, v]) => [d, v.toFixed()])).toEqual([
    ['2026-11-19', '15204137000'],
    ['2026-11-20', '15210000000'],
  ]);
  expect(asOf.getTimezone()).toBe('UTC');
  expect((await spy.navPerShare('2026-11-23'))!.value.toFixed()).toBe('513.02');
});
