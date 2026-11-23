// LM-482: Security.getSecurityMetric and getSecurityMetricSeries read only
// from the installed SecurityMetricFetcher, a fake here.
import { SecurityMetricTypeProto } from '../../../fintekkers/models/security/security_metric_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import LinkResolver from '../../util/link-resolver';
import { LocalDate } from '../utils/date';
import { UUID } from '../utils/uuid';
import Security from './security';
import {
  clearSecurityMetricFetcher,
  setSecurityMetricFetcher,
  SecurityMetricFetcherMissingError,
} from './security_metric';
import type { SecurityMetricFetcher, SecurityMetricObservation } from './security_metric';

function day(year: number, month: number, d: number): LocalDate {
  return new LocalDate(new LocalDateProto().setYear(year).setMonth(month).setDay(d));
}

function obs(value: string, date: LocalDate): SecurityMetricObservation {
  return { value, observationDate: date };
}

/** Returns canned observations and records each call's arguments. */
class FakeFetcher implements SecurityMetricFetcher {
  calls: unknown[][] = [];

  constructor(private readonly latestResult: SecurityMetricObservation | null, private readonly seriesResult: SecurityMetricObservation[] = []) {}

  async latest(securityId: UUID, metric: SecurityMetricTypeProto, date: LocalDate) {
    this.calls.push(['latest', securityId.toString(), metric, date.toString()]);
    return this.latestResult;
  }

  async series(securityId: UUID, metric: SecurityMetricTypeProto, from: LocalDate, to: LocalDate) {
    this.calls.push(['series', securityId.toString(), metric, from.toString(), to.toString()]);
    return [...this.seriesResult];
  }
}

const dates = (got: SecurityMetricObservation[]) => got.map((o) => [o.value, o.observationDate.toString()]);

describe('Security metric helpers (LM-482)', () => {
  let id: UUID;
  let security: Security;
  let linkFetch: jest.SpyInstance;

  beforeEach(() => {
    id = UUID.random();
    // A link-only security: uuid set, nothing else.
    security = new Security(Security.linkOfLatest(id));
    // Any link-resolver call fails the test: the helpers must not hydrate.
    linkFetch = jest.spyOn(LinkResolver.prototype, 'getSecurity').mockImplementation(() => {
      throw new Error('the link resolver was called');
    });
    clearSecurityMetricFetcher();
  });

  afterEach(() => {
    clearSecurityMetricFetcher();
    linkFetch.mockRestore();
  });

  test('a hit returns the fetcher\'s value and observation date', async () => {
    const fake = new FakeFetcher(obs('1003282116', day(2024, 5, 31)));
    setSecurityMetricFetcher(fake);

    const got = await security.getSecurityMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3));

    // The observation's own date, not the date asked for.
    expect(got?.value).toBe('1003282116');
    expect(got?.observationDate.toString()).toBe(day(2024, 5, 31).toString());
    expect(fake.calls).toEqual([['latest', id.toString(), SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3).toString()]]);
  });

  test('a miss returns null, never 0', async () => {
    setSecurityMetricFetcher(new FakeFetcher(null));
    expect(await security.getSecurityMetric(SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 6, 3))).toBeNull();
  });

  test('a real zero is returned as zero', async () => {
    setSecurityMetricFetcher(new FakeFetcher(obs('0', day(2024, 5, 31))));
    const got = await security.getSecurityMetric(SecurityMetricTypeProto.TOTAL_NET_ASSETS, day(2024, 6, 3));
    expect(got?.value).toBe('0');
  });

  test('the series comes back in date order from shuffled input', async () => {
    const fake = new FakeFetcher(null, [
      obs('3', day(2024, 1, 4)),
      obs('1', day(2024, 1, 2)),
      obs('2', day(2024, 1, 3)),
    ]);
    setSecurityMetricFetcher(fake);

    const got = await security.getSecurityMetricSeries(SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 1, 1), day(2024, 1, 31));

    expect(dates(got)).toEqual([['1', '2024-1-2'], ['2', '2024-1-3'], ['3', '2024-1-4']]);
    expect(fake.calls).toEqual([
      ['series', id.toString(), SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 1, 1).toString(), day(2024, 1, 31).toString()],
    ]);
  });

  async function expectNoFetcherError(): Promise<void> {
    const calls = [
      () => security.getSecurityMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3)),
      () => security.getSecurityMetricSeries(SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 1, 1), day(2024, 6, 3)),
    ];
    for (const call of calls) {
      await expect(call()).rejects.toThrow(SecurityMetricFetcherMissingError);
      await expect(call()).rejects.toThrow(/SecurityMetricFetcher.*setSecurityMetricFetcher/);
    }
  }

  test('with no fetcher both helpers name the missing fetcher, and clear restores the error', async () => {
    await expectNoFetcherError();

    setSecurityMetricFetcher(new FakeFetcher(null));
    expect(await security.getSecurityMetric(SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3))).toBeNull();
    clearSecurityMetricFetcher();

    await expectNoFetcherError();
  });

  test('a link-only security returns metric data without calling the link resolver', async () => {
    setSecurityMetricFetcher(new FakeFetcher(obs('512.3456', day(2024, 5, 31)), [obs('1', day(2024, 1, 2))]));

    const latest = await security.getSecurityMetric(SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 6, 3));
    const series = await security.getSecurityMetricSeries(SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 1, 1), day(2024, 6, 3));

    expect(latest?.value).toBe('512.3456');
    expect(dates(series)).toEqual([['1', '2024-1-2']]);
    expect(linkFetch).not.toHaveBeenCalled();
    expect(security.isLink()).toBe(true);
  });

  test('a series with from after to is rejected before the fetcher', async () => {
    const fake = new FakeFetcher(null);
    setSecurityMetricFetcher(fake);
    await expect(
      security.getSecurityMetricSeries(SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 2, 1), day(2024, 1, 1)),
    ).rejects.toThrow(/after/);
    expect(fake.calls).toEqual([]);
  });
});
