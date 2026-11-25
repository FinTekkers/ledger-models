"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// PriceService.searchRange reads every price in a date range in chunks, and
// rejects instead of returning partial data (LM-494).
const PriceService_1 = require("./price-service/PriceService");
const positionfilter_1 = require("../models/position/positionfilter");
const uuid_1 = require("../models/utils/uuid");
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const query_price_response_pb_1 = require("../../fintekkers/requests/price/query_price_response_pb");
const summary_pb_1 = require("../../fintekkers/requests/util/errors/summary_pb");
const error_pb_1 = require("../../fintekkers/requests/util/errors/error_pb");
const message_pb_1 = require("../../fintekkers/requests/util/errors/message_pb");
const NANOS = BigInt(1000000000);
const T0 = BigInt(1700000000) * NANOS;
function ts(nanos) {
    const t = new timestamp_pb_1.Timestamp();
    t.setSeconds(Number(nanos / NANOS));
    t.setNanos(Number(nanos % NANOS));
    return new local_timestamp_pb_1.LocalTimestampProto().setTimestamp(t).setTimeZone('America/New_York');
}
function nanosOf(l) {
    const t = l.getTimestamp();
    return BigInt(t.getSeconds()) * NANOS + BigInt(t.getNanos());
}
function store(times) {
    return times.map((at) => {
        const uuid = uuid_1.UUID.random();
        const proto = new price_pb_1.PriceProto().setUuid(uuid.toUUIDProto()).setAsOf(ts(at));
        return { uuid: uuid.toString(), at, proto };
    });
}
/** 8,500 prices for one security, one per second. */
const STORE = store(Array.from({ length: 8500 }, (_, i) => T0 + BigInt(i) * NANOS));
const START = ts(T0);
const END = ts(T0 + BigInt(8499) * NANOS);
function inRange(rows, request) {
    const range = request.getDateRange();
    if (!range)
        return rows;
    const s = nanosOf(range.getStart());
    const e = nanosOf(range.getEnd());
    return rows.filter((r) => r.at >= s && r.at <= e).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
function messages(rows, last = () => undefined) {
    const out = [];
    for (let i = 0; i < rows.length; i += 400) {
        out.push(new query_price_response_pb_1.QueryPriceResponseProto().setPriceResponseList(rows.slice(i, i + 400).map((r) => r.proto)));
    }
    if (out.length === 0)
        out.push(new query_price_response_pb_1.QueryPriceResponseProto());
    last(out[out.length - 1]);
    return out;
}
const honest = (rows) => (request) => {
    const matching = inRange(rows, request);
    const limit = request.getLimit() || 1000;
    const served = matching.slice(0, limit);
    return { rows: served, responses: messages(served, (r) => r.setTruncated(matching.length > limit)) };
};
/** A PriceService whose gRPC client answers from `answer` and records each request. */
function stubbedPriceService(answer) {
    const served = [];
    const search = (request) => {
        const { rows, responses } = answer(request, served.length + 1);
        served.push({ request, rows, responses });
        const handlers = {};
        setImmediate(() => {
            var _a;
            responses.forEach((r) => { var _a; return (_a = handlers.data) === null || _a === void 0 ? void 0 : _a.call(handlers, r); });
            (_a = handlers.end) === null || _a === void 0 ? void 0 : _a.call(handlers);
        });
        return { on(event, handler) { handlers[event] = handler; return this; } };
    };
    const service = Object.create(PriceService_1.PriceService.prototype);
    service.client = { search };
    return { service, served };
}
const windowOf = (s) => {
    const range = s.request.getDateRange();
    return { start: nanosOf(range.getStart()), end: nanosOf(range.getEnd()) };
};
const uuidsOf = (prices) => prices.map((p) => uuid_1.UUID.fromU8Array(p.proto.getUuid().getRawUuid_asU8()).toString());
function expectExactly(prices, rows) {
    const got = uuidsOf(prices);
    expect(got).toHaveLength(rows.length);
    expect(new Set(got).size).toBe(rows.length);
    expect(new Set(got)).toEqual(new Set(rows.map((r) => r.uuid)));
}
function warning(text) {
    return new summary_pb_1.SummaryProto().setWarningsList([new error_pb_1.WarningProto().setDetail(new message_pb_1.Message().setMessageForDeveloper(text))]);
}
// ---- metric 1, 2 and guardrail 4 ----
describe('8,500 stored prices at limit 1000', () => {
    let served;
    let prices;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const stub = stubbedPriceService(honest(STORE));
        prices = yield stub.service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END, limit: 1000 });
        served = stub.served;
    }));
    test('returns all 8,500 stored prices exactly once', () => {
        expect(prices).toHaveLength(8500);
        expectExactly(prices, STORE);
        expect(served.length).toBeGreaterThan(8); // several splits and boundaries
    });
    test('every request sets limit in 1..MAX_SEARCH_RESULTS and a date_range', () => {
        expect(PriceService_1.MAX_SEARCH_RESULTS).toBe(10000);
        for (const s of served) {
            expect(s.request.getLimit()).toBeGreaterThanOrEqual(1);
            expect(s.request.getLimit()).toBeLessThanOrEqual(PriceService_1.MAX_SEARCH_RESULTS);
            expect(s.request.hasDateRange()).toBe(true);
        }
    });
    test('no date window is requested twice', () => {
        const keys = served.map((s) => { const w = windowOf(s); return `${w.start}|${w.end}`; });
        expect(new Set(keys).size).toBe(keys.length);
    });
});
test('rows on chunk boundaries come back once, each from one kept window', () => __awaiter(void 0, void 0, void 0, function* () {
    // At start, at end, and across a nanos rollover at T0 + 1s.
    const t1 = T0 + NANOS;
    const last = T0 + BigInt(5) * NANOS;
    const rows = store([T0, t1 - BigInt(1), t1, t1 + BigInt(1), last]);
    const { service, served } = stubbedPriceService(honest(rows));
    const prices = yield service.searchRange(new positionfilter_1.PositionFilter(), { start: ts(T0), end: ts(last), limit: 1 });
    expectExactly(prices, rows);
    // A kept window is one searchRange did not split: fewer than `limit` rows,
    // or a single timestamp, and not truncated. Count serves per uuid there,
    // so the result de-dupe cannot hide a double read.
    const kept = served.filter((s) => {
        const w = windowOf(s);
        return (s.rows.length < s.request.getLimit() || w.start === w.end) && !s.responses.some((r) => r.getTruncated());
    });
    const serves = new Map();
    kept.forEach((s) => s.rows.forEach((r) => { var _a; return serves.set(r.uuid, ((_a = serves.get(r.uuid)) !== null && _a !== void 0 ? _a : 0) + 1); }));
    expect(Object.fromEntries(serves)).toEqual(Object.fromEntries(rows.map((r) => [r.uuid, 1])));
    // Kept windows never overlap.
    const windows = kept.map(windowOf).sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    for (let i = 1; i < windows.length; i++) {
        expect(windows[i].start > windows[i - 1].end).toBe(true);
    }
}));
// ---- the server clamps below the asked limit (architecture note 1) ----
test('a server that clamps to 5,000 and returns next_page_token still yields all 8,500', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService((request) => {
        const matching = inRange(STORE, request);
        const rows = matching.slice(0, 5000);
        return { rows, responses: messages(rows, (r) => r.setNextPageToken(matching.length > 5000 ? 'next' : '')) };
    });
    const prices = yield service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END });
    expectExactly(prices, STORE);
    expect(served[0].request.getLimit()).toBe(PriceService_1.MAX_SEARCH_RESULTS);
}));
test('a server that clamps to 5,000 and reports row_cap still yields all 8,500', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service } = stubbedPriceService((request) => {
        const matching = inRange(STORE, request);
        const rows = matching.slice(0, 5000);
        return { rows, responses: messages(rows, (r) => r.setRowCap(matching.length > 5000 ? 5000 : 0)) };
    });
    const prices = yield service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END });
    expectExactly(prices, STORE);
}));
// ---- metric 3 ----
test('a warning on the 3rd request rejects with its message', () => __awaiter(void 0, void 0, void 0, function* () {
    const base = honest(STORE);
    const { service, served } = stubbedPriceService((request, n) => {
        const answer = base(request, n);
        if (n === 3)
            answer.responses[answer.responses.length - 1].setErrorsOrWarnings(warning('default cap applied'));
        return answer;
    });
    const call = service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END, limit: 1000 });
    yield expect(call).rejects.toBeInstanceOf(PriceService_1.PriceSearchError);
    yield expect(call).rejects.toMatchObject({ code: 'SERVER_REPORTED', messages: ['default cap applied'] });
    yield expect(call).rejects.toThrow('default cap applied');
    expect(served).toHaveLength(3);
}));
test('an entry in the errors list rejects the same way', () => __awaiter(void 0, void 0, void 0, function* () {
    const base = honest(STORE);
    const { service } = stubbedPriceService((request, n) => {
        const answer = base(request, n);
        answer.responses[0].setErrorsOrWarnings(new summary_pb_1.SummaryProto().setErrorsList([
            new error_pb_1.ErrorProto().setDetail(new message_pb_1.Message().setMessageForUser('price store unavailable'))
        ]));
        return answer;
    });
    const call = service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END, limit: 1000 });
    yield expect(call).rejects.toMatchObject({ code: 'SERVER_REPORTED' });
    yield expect(call).rejects.toThrow('price store unavailable');
}));
// ---- metric 4 ----
test('search() without the option sends no limit and no date_range', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService(honest(STORE));
    yield service.search(START, new positionfilter_1.PositionFilter());
    expect(served).toHaveLength(1);
    expect(served[0].request.getLimit()).toBe(0);
    expect(served[0].request.hasDateRange()).toBe(false);
}));
// ---- guardrail 4: always ends ----
test('an empty range resolves [] after exactly 1 request', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService(honest(STORE));
    const prices = yield service.searchRange(new positionfilter_1.PositionFilter(), { start: ts(T0 - BigInt(100) * NANOS), end: ts(T0 - NANOS) });
    expect(prices).toEqual([]);
    expect(served).toHaveLength(1);
}));
test('a server that ignores date_range rejects UNSPLITTABLE within 130 requests', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService((request) => {
        const rows = STORE.slice(0, request.getLimit());
        return { rows, responses: messages(rows, (r) => r.setTruncated(true)) };
    });
    const call = service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END, limit: 1000 });
    yield expect(call).rejects.toMatchObject({ code: 'UNSPLITTABLE' });
    expect(served.length).toBeLessThanOrEqual(130);
}));
test('a server that ignores date_range without a cap signal rejects OUT_OF_RANGE within 130 requests', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService((request) => {
        const rows = STORE.slice(0, request.getLimit());
        return { rows, responses: messages(rows) };
    });
    const call = service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END, limit: 1000 });
    yield expect(call).rejects.toMatchObject({ code: 'OUT_OF_RANGE' });
    expect(served.length).toBeLessThanOrEqual(130);
}));
// ---- input checks ----
test.each([0, 10001, 1.5, NaN])('limit %p rejects INVALID_ARGUMENT before any request', (limit) => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService(honest(STORE));
    yield expect(service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END, limit }))
        .rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    expect(served).toHaveLength(0);
}));
test('start after end rejects INVALID_ARGUMENT before any request', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService(honest(STORE));
    yield expect(service.searchRange(new positionfilter_1.PositionFilter(), { start: END, end: START }))
        .rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    expect(served).toHaveLength(0);
}));
test('without asOf every request carries the same as_of', () => __awaiter(void 0, void 0, void 0, function* () {
    const { service, served } = stubbedPriceService(honest(STORE));
    yield service.searchRange(new positionfilter_1.PositionFilter(), { start: START, end: END, limit: 1000 });
    const asOfs = new Set(served.map((s) => String(nanosOf(s.request.getAsOf()))));
    expect(asOfs.size).toBe(1);
}));
//# sourceMappingURL=price.search-range.test.js.map