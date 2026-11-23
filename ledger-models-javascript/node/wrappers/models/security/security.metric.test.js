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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-482: Security.getSecurityMetric and getSecurityMetricSeries read only
// from the installed SecurityMetricFetcher, a fake here.
const security_metric_type_pb_1 = require("../../../fintekkers/models/security/security_metric_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const link_resolver_1 = __importDefault(require("../../util/link-resolver"));
const date_1 = require("../utils/date");
const uuid_1 = require("../utils/uuid");
const security_1 = __importDefault(require("./security"));
const security_metric_1 = require("./security_metric");
function day(year, month, d) {
    return new date_1.LocalDate(new local_date_pb_1.LocalDateProto().setYear(year).setMonth(month).setDay(d));
}
function obs(value, date) {
    return { value, observationDate: date };
}
/** Returns canned observations and records each call's arguments. */
class FakeFetcher {
    constructor(latestResult, seriesResult = []) {
        this.latestResult = latestResult;
        this.seriesResult = seriesResult;
        this.calls = [];
    }
    latest(securityId, metric, date) {
        return __awaiter(this, void 0, void 0, function* () {
            this.calls.push(['latest', securityId.toString(), metric, date.toString()]);
            return this.latestResult;
        });
    }
    series(securityId, metric, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            this.calls.push(['series', securityId.toString(), metric, from.toString(), to.toString()]);
            return [...this.seriesResult];
        });
    }
}
const dates = (got) => got.map((o) => [o.value, o.observationDate.toString()]);
describe('Security metric helpers (LM-482)', () => {
    let id;
    let security;
    let linkFetch;
    beforeEach(() => {
        id = uuid_1.UUID.random();
        // A link-only security: uuid set, nothing else.
        security = new security_1.default(security_1.default.linkOfLatest(id));
        // Any link-resolver call fails the test: the helpers must not hydrate.
        linkFetch = jest.spyOn(link_resolver_1.default.prototype, 'getSecurity').mockImplementation(() => {
            throw new Error('the link resolver was called');
        });
        (0, security_metric_1.clearSecurityMetricFetcher)();
    });
    afterEach(() => {
        (0, security_metric_1.clearSecurityMetricFetcher)();
        linkFetch.mockRestore();
    });
    test('a hit returns the fetcher\'s value and observation date', () => __awaiter(void 0, void 0, void 0, function* () {
        const fake = new FakeFetcher(obs('1003282116', day(2024, 5, 31)));
        (0, security_metric_1.setSecurityMetricFetcher)(fake);
        const got = yield security.getSecurityMetric(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3));
        // The observation's own date, not the date asked for.
        expect(got === null || got === void 0 ? void 0 : got.value).toBe('1003282116');
        expect(got === null || got === void 0 ? void 0 : got.observationDate.toString()).toBe(day(2024, 5, 31).toString());
        expect(fake.calls).toEqual([['latest', id.toString(), security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3).toString()]]);
    }));
    test('a miss returns null, never 0', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, security_metric_1.setSecurityMetricFetcher)(new FakeFetcher(null));
        expect(yield security.getSecurityMetric(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 6, 3))).toBeNull();
    }));
    test('a real zero is returned as zero', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, security_metric_1.setSecurityMetricFetcher)(new FakeFetcher(obs('0', day(2024, 5, 31))));
        const got = yield security.getSecurityMetric(security_metric_type_pb_1.SecurityMetricTypeProto.TOTAL_NET_ASSETS, day(2024, 6, 3));
        expect(got === null || got === void 0 ? void 0 : got.value).toBe('0');
    }));
    test('the series comes back in date order from shuffled input', () => __awaiter(void 0, void 0, void 0, function* () {
        const fake = new FakeFetcher(null, [
            obs('3', day(2024, 1, 4)),
            obs('1', day(2024, 1, 2)),
            obs('2', day(2024, 1, 3)),
        ]);
        (0, security_metric_1.setSecurityMetricFetcher)(fake);
        const got = yield security.getSecurityMetricSeries(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 1, 1), day(2024, 1, 31));
        expect(dates(got)).toEqual([['1', '2024-1-2'], ['2', '2024-1-3'], ['3', '2024-1-4']]);
        expect(fake.calls).toEqual([
            ['series', id.toString(), security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 1, 1).toString(), day(2024, 1, 31).toString()],
        ]);
    }));
    function expectNoFetcherError() {
        return __awaiter(this, void 0, void 0, function* () {
            const calls = [
                () => security.getSecurityMetric(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3)),
                () => security.getSecurityMetricSeries(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 1, 1), day(2024, 6, 3)),
            ];
            for (const call of calls) {
                yield expect(call()).rejects.toThrow(security_metric_1.SecurityMetricFetcherMissingError);
                yield expect(call()).rejects.toThrow(/SecurityMetricFetcher.*setSecurityMetricFetcher/);
            }
        });
    }
    test('with no fetcher both helpers name the missing fetcher, and clear restores the error', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expectNoFetcherError();
        (0, security_metric_1.setSecurityMetricFetcher)(new FakeFetcher(null));
        expect(yield security.getSecurityMetric(security_metric_type_pb_1.SecurityMetricTypeProto.SHARES_OUTSTANDING, day(2024, 6, 3))).toBeNull();
        (0, security_metric_1.clearSecurityMetricFetcher)();
        yield expectNoFetcherError();
    }));
    test('a link-only security returns metric data without calling the link resolver', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, security_metric_1.setSecurityMetricFetcher)(new FakeFetcher(obs('512.3456', day(2024, 5, 31)), [obs('1', day(2024, 1, 2))]));
        const latest = yield security.getSecurityMetric(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 6, 3));
        const series = yield security.getSecurityMetricSeries(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 1, 1), day(2024, 6, 3));
        expect(latest === null || latest === void 0 ? void 0 : latest.value).toBe('512.3456');
        expect(dates(series)).toEqual([['1', '2024-1-2']]);
        expect(linkFetch).not.toHaveBeenCalled();
        expect(security.isLink()).toBe(true);
    }));
    test('a series with from after to is rejected before the fetcher', () => __awaiter(void 0, void 0, void 0, function* () {
        const fake = new FakeFetcher(null);
        (0, security_metric_1.setSecurityMetricFetcher)(fake);
        yield expect(security.getSecurityMetricSeries(security_metric_type_pb_1.SecurityMetricTypeProto.NAV_PER_SHARE, day(2024, 2, 1), day(2024, 1, 1))).rejects.toThrow(/after/);
        expect(fake.calls).toEqual([]);
    }));
});
//# sourceMappingURL=security.metric.test.js.map