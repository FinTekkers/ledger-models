// PriceService.searchRange reads every price in a date range in chunks, and
// rejects instead of returning partial data (LM-494).
import { PriceService, PriceSearchError, MAX_SEARCH_RESULTS } from './price-service/PriceService';
import { PositionFilter } from '../models/position/positionfilter';
import { UUID } from '../models/utils/uuid';

import { PriceProto } from '../../fintekkers/models/price/price_pb';
import { LocalTimestampProto } from '../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { QueryPriceResponseProto } from '../../fintekkers/requests/price/query_price_response_pb';
import type { QueryPriceRequestProto } from '../../fintekkers/requests/price/query_price_request_pb';
import { SummaryProto } from '../../fintekkers/requests/util/errors/summary_pb';
import { ErrorProto, WarningProto } from '../../fintekkers/requests/util/errors/error_pb';
import { Message } from '../../fintekkers/requests/util/errors/message_pb';

const NANOS = BigInt(1_000_000_000);
const T0 = BigInt(1_700_000_000) * NANOS;

function ts(nanos: bigint): LocalTimestampProto {
  const t = new Timestamp();
  t.setSeconds(Number(nanos / NANOS));
  t.setNanos(Number(nanos % NANOS));
  return new LocalTimestampProto().setTimestamp(t).setTimeZone('America/New_York');
}

function nanosOf(l: LocalTimestampProto | undefined): bigint {
  const t = l!.getTimestamp()!;
  return BigInt(t.getSeconds()) * NANOS + BigInt(t.getNanos());
}

interface Stored { uuid: string; at: bigint; proto: PriceProto }

function store(times: bigint[]): Stored[] {
  return times.map((at) => {
    const uuid = UUID.random();
    const proto = new PriceProto().setUuid(uuid.toUUIDProto()).setAsOf(ts(at));
    return { uuid: uuid.toString(), at, proto };
  });
}

/** 8,500 prices for one security, one per second. */
const STORE = store(Array.from({ length: 8_500 }, (_, i) => T0 + BigInt(i) * NANOS));
const START = ts(T0);
const END = ts(T0 + BigInt(8_499) * NANOS);

interface Window { start: bigint; end: bigint }

interface Served {
  request: QueryPriceRequestProto;
  rows: Stored[];
  responses: QueryPriceResponseProto[];
}

/**
 * Answers one request: the stub's rows and the response messages to stream.
 * The default honours date_range (inclusive) and limit, newest first, and
 * sets truncated when it cut rows. Rows go out 400 per message.
 */
type Answer = (request: QueryPriceRequestProto, n: number) => { rows: Stored[]; responses: QueryPriceResponseProto[] };

function inRange(rows: Stored[], request: QueryPriceRequestProto): Stored[] {
  const range = request.getDateRange();
  if (!range) return rows;
  const s = nanosOf(range.getStart());
  const e = nanosOf(range.getEnd());
  return rows.filter((r) => r.at >= s && r.at <= e).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

function messages(rows: Stored[], last: (r: QueryPriceResponseProto) => void = () => undefined): QueryPriceResponseProto[] {
  const out: QueryPriceResponseProto[] = [];
  for (let i = 0; i < rows.length; i += 400) {
    out.push(new QueryPriceResponseProto().setPriceResponseList(rows.slice(i, i + 400).map((r) => r.proto)));
  }
  if (out.length === 0) out.push(new QueryPriceResponseProto());
  last(out[out.length - 1]);
  return out;
}

const honest = (rows: Stored[]): Answer => (request) => {
  const matching = inRange(rows, request);
  const limit = request.getLimit() || 1_000;
  const served = matching.slice(0, limit);
  return { rows: served, responses: messages(served, (r) => r.setTruncated(matching.length > limit)) };
};

/** A PriceService whose gRPC client answers from `answer` and records each request. */
function stubbedPriceService(answer: Answer): { service: PriceService; served: Served[] } {
  const served: Served[] = [];
  const search = (request: QueryPriceRequestProto) => {
    const { rows, responses } = answer(request, served.length + 1);
    served.push({ request, rows, responses });
    const handlers: Record<string, (arg?: unknown) => void> = {};
    setImmediate(() => {
      responses.forEach((r) => handlers.data?.(r));
      handlers.end?.();
    });
    return { on(event: string, handler: (arg?: unknown) => void) { handlers[event] = handler; return this; } };
  };
  const service = Object.create(PriceService.prototype) as PriceService;
  (service as unknown as { client: unknown }).client = { search };
  return { service, served };
}

const windowOf = (s: Served): Window => {
  const range = s.request.getDateRange()!;
  return { start: nanosOf(range.getStart()), end: nanosOf(range.getEnd()) };
};

const uuidsOf = (prices: { proto: PriceProto }[]) => prices.map((p) => UUID.fromU8Array(p.proto.getUuid()!.getRawUuid_asU8()).toString());

function expectExactly(prices: { proto: PriceProto }[], rows: Stored[]): void {
  const got = uuidsOf(prices);
  expect(got).toHaveLength(rows.length);
  expect(new Set(got).size).toBe(rows.length);
  expect(new Set(got)).toEqual(new Set(rows.map((r) => r.uuid)));
}

function warning(text: string): SummaryProto {
  return new SummaryProto().setWarningsList([new WarningProto().setDetail(new Message().setMessageForDeveloper(text))]);
}

// ---- metric 1, 2 and guardrail 4 ----

describe('8,500 stored prices at limit 1000', () => {
  let served: Served[];
  let prices: { proto: PriceProto }[];

  beforeAll(async () => {
    const stub = stubbedPriceService(honest(STORE));
    prices = await stub.service.searchRange(new PositionFilter(), { start: START, end: END, limit: 1_000 });
    served = stub.served;
  });

  test('returns all 8,500 stored prices exactly once', () => {
    expect(prices).toHaveLength(8_500);
    expectExactly(prices, STORE);
    expect(served.length).toBeGreaterThan(8); // several splits and boundaries
  });

  test('every request sets limit in 1..MAX_SEARCH_RESULTS and a date_range', () => {
    expect(MAX_SEARCH_RESULTS).toBe(10_000);
    for (const s of served) {
      expect(s.request.getLimit()).toBeGreaterThanOrEqual(1);
      expect(s.request.getLimit()).toBeLessThanOrEqual(MAX_SEARCH_RESULTS);
      expect(s.request.hasDateRange()).toBe(true);
    }
  });

  test('no date window is requested twice', () => {
    const keys = served.map((s) => { const w = windowOf(s); return `${w.start}|${w.end}`; });
    expect(new Set(keys).size).toBe(keys.length);
  });
});

test('rows on chunk boundaries come back once, each from one kept window', async () => {
  // At start, at end, and across a nanos rollover at T0 + 1s.
  const t1 = T0 + NANOS;
  const last = T0 + BigInt(5) * NANOS;
  const rows = store([T0, t1 - BigInt(1), t1, t1 + BigInt(1), last]);
  const { service, served } = stubbedPriceService(honest(rows));

  const prices = await service.searchRange(new PositionFilter(), { start: ts(T0), end: ts(last), limit: 1 });

  expectExactly(prices, rows);
  // A kept window is one searchRange did not split: fewer than `limit` rows,
  // or a single timestamp, and not truncated. Count serves per uuid there,
  // so the result de-dupe cannot hide a double read.
  const kept = served.filter((s) => {
    const w = windowOf(s);
    return (s.rows.length < s.request.getLimit() || w.start === w.end) && !s.responses.some((r) => r.getTruncated());
  });
  const serves = new Map<string, number>();
  kept.forEach((s) => s.rows.forEach((r) => serves.set(r.uuid, (serves.get(r.uuid) ?? 0) + 1)));
  expect(Object.fromEntries(serves)).toEqual(Object.fromEntries(rows.map((r) => [r.uuid, 1])));

  // Kept windows never overlap.
  const windows = kept.map(windowOf).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  for (let i = 1; i < windows.length; i++) {
    expect(windows[i].start > windows[i - 1].end).toBe(true);
  }
});

// ---- the server clamps below the asked limit (architecture note 1) ----

test('a server that clamps to 5,000 and returns next_page_token still yields all 8,500', async () => {
  const { service, served } = stubbedPriceService((request) => {
    const matching = inRange(STORE, request);
    const rows = matching.slice(0, 5_000);
    return { rows, responses: messages(rows, (r) => r.setNextPageToken(matching.length > 5_000 ? 'next' : '')) };
  });

  const prices = await service.searchRange(new PositionFilter(), { start: START, end: END });

  expectExactly(prices, STORE);
  expect(served[0].request.getLimit()).toBe(MAX_SEARCH_RESULTS);
});

test('a server that clamps to 5,000 and reports row_cap still yields all 8,500', async () => {
  const { service } = stubbedPriceService((request) => {
    const matching = inRange(STORE, request);
    const rows = matching.slice(0, 5_000);
    return { rows, responses: messages(rows, (r) => r.setRowCap(matching.length > 5_000 ? 5_000 : 0)) };
  });

  const prices = await service.searchRange(new PositionFilter(), { start: START, end: END });

  expectExactly(prices, STORE);
});

// ---- metric 3 ----

test('a warning on the 3rd request rejects with its message', async () => {
  const base = honest(STORE);
  const { service, served } = stubbedPriceService((request, n) => {
    const answer = base(request, n);
    if (n === 3) answer.responses[answer.responses.length - 1].setErrorsOrWarnings(warning('default cap applied'));
    return answer;
  });

  const call = service.searchRange(new PositionFilter(), { start: START, end: END, limit: 1_000 });

  await expect(call).rejects.toBeInstanceOf(PriceSearchError);
  await expect(call).rejects.toMatchObject({ code: 'SERVER_REPORTED', messages: ['default cap applied'] });
  await expect(call).rejects.toThrow('default cap applied');
  expect(served).toHaveLength(3);
});

test('an entry in the errors list rejects the same way', async () => {
  const base = honest(STORE);
  const { service } = stubbedPriceService((request, n) => {
    const answer = base(request, n);
    answer.responses[0].setErrorsOrWarnings(new SummaryProto().setErrorsList([
      new ErrorProto().setDetail(new Message().setMessageForUser('price store unavailable'))]));
    return answer;
  });

  const call = service.searchRange(new PositionFilter(), { start: START, end: END, limit: 1_000 });

  await expect(call).rejects.toMatchObject({ code: 'SERVER_REPORTED' });
  await expect(call).rejects.toThrow('price store unavailable');
});

// ---- metric 4 ----

test('search() without the option sends no limit and no date_range', async () => {
  const { service, served } = stubbedPriceService(honest(STORE));

  await service.search(START, new PositionFilter());

  expect(served).toHaveLength(1);
  expect(served[0].request.getLimit()).toBe(0);
  expect(served[0].request.hasDateRange()).toBe(false);
});

// ---- guardrail 4: always ends ----

test('an empty range resolves [] after exactly 1 request', async () => {
  const { service, served } = stubbedPriceService(honest(STORE));

  const prices = await service.searchRange(new PositionFilter(), { start: ts(T0 - BigInt(100) * NANOS), end: ts(T0 - NANOS) });

  expect(prices).toEqual([]);
  expect(served).toHaveLength(1);
});

test('a server that ignores date_range rejects UNSPLITTABLE within 130 requests', async () => {
  const { service, served } = stubbedPriceService((request) => {
    const rows = STORE.slice(0, request.getLimit());
    return { rows, responses: messages(rows, (r) => r.setTruncated(true)) };
  });

  const call = service.searchRange(new PositionFilter(), { start: START, end: END, limit: 1_000 });

  await expect(call).rejects.toMatchObject({ code: 'UNSPLITTABLE' });
  expect(served.length).toBeLessThanOrEqual(130);
});

test('a server that ignores date_range without a cap signal rejects OUT_OF_RANGE within 130 requests', async () => {
  const { service, served } = stubbedPriceService((request) => {
    const rows = STORE.slice(0, request.getLimit());
    return { rows, responses: messages(rows) };
  });

  const call = service.searchRange(new PositionFilter(), { start: START, end: END, limit: 1_000 });

  await expect(call).rejects.toMatchObject({ code: 'OUT_OF_RANGE' });
  expect(served.length).toBeLessThanOrEqual(130);
});

// ---- input checks ----

test.each([0, 10_001, 1.5, NaN])('limit %p rejects INVALID_ARGUMENT before any request', async (limit) => {
  const { service, served } = stubbedPriceService(honest(STORE));

  await expect(service.searchRange(new PositionFilter(), { start: START, end: END, limit }))
    .rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  expect(served).toHaveLength(0);
});

test('start after end rejects INVALID_ARGUMENT before any request', async () => {
  const { service, served } = stubbedPriceService(honest(STORE));

  await expect(service.searchRange(new PositionFilter(), { start: END, end: START }))
    .rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  expect(served).toHaveLength(0);
});

test('without asOf every request carries the same as_of', async () => {
  const { service, served } = stubbedPriceService(honest(STORE));

  await service.searchRange(new PositionFilter(), { start: START, end: END, limit: 1_000 });

  const asOfs = new Set(served.map((s) => String(nanosOf(s.request.getAsOf()))));
  expect(asOfs.size).toBe(1);
});
