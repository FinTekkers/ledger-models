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
const link_cache_1 = require("./link-cache");
const datetime_1 = require("../models/utils/datetime");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_pb_1 = require("../../fintekkers/models/security/security_pb");
function makeAsOf(epochSecondsOffset = 0) {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(1700000000 + epochSecondsOffset);
    ts.setNanos(0);
    const proto = new local_timestamp_pb_1.LocalTimestampProto();
    proto.setTimestamp(ts);
    proto.setTimeZone('UTC');
    return new datetime_1.ZonedDateTime(proto);
}
function makeSecurityProto(name) {
    const p = new security_pb_1.SecurityProto();
    p.setIssuerName(name);
    return p;
}
describe('LinkCache', () => {
    beforeEach(() => {
        link_cache_1.SECURITY.clear();
        link_cache_1.PORTFOLIO.clear();
        link_cache_1.PRICE.clear();
        link_cache_1.TRANSACTION.clear();
    });
    // ---- A. Basic get/put ----
    test('get on empty cache returns undefined', () => {
        expect(link_cache_1.SECURITY.get('uuid-1', makeAsOf())).toBeUndefined();
    });
    test('put then get with matching asOf returns value', () => {
        const asOf = makeAsOf();
        const val = makeSecurityProto('ACME');
        link_cache_1.SECURITY.put('uuid-1', val, asOf);
        expect(link_cache_1.SECURITY.get('uuid-1', asOf)).toBe(val);
    });
    test('get with different asOf returns undefined', () => {
        link_cache_1.SECURITY.put('uuid-1', makeSecurityProto('v1'), makeAsOf(0));
        expect(link_cache_1.SECURITY.get('uuid-1', makeAsOf(10))).toBeUndefined();
    });
    // ---- B. Null asOf semantics ----
    test('null asOf within TTL returns value', () => {
        const cache = new link_cache_1.LinkCache(60000);
        cache.put('uuid-1', makeSecurityProto('v1'), makeAsOf());
        expect(cache.get('uuid-1', null)).toBeDefined();
    });
    test('null asOf past TTL returns undefined', () => __awaiter(void 0, void 0, void 0, function* () {
        const cache = new link_cache_1.LinkCache(50);
        cache.put('uuid-1', makeSecurityProto('v1'), makeAsOf());
        yield new Promise((resolve) => setTimeout(resolve, 100));
        expect(cache.get('uuid-1', null)).toBeUndefined();
    }));
    test('non-null asOf is not subject to TTL', () => __awaiter(void 0, void 0, void 0, function* () {
        const cache = new link_cache_1.LinkCache(50);
        const asOf = makeAsOf();
        const val = makeSecurityProto('v1');
        cache.put('uuid-1', val, asOf);
        yield new Promise((resolve) => setTimeout(resolve, 100));
        // Bitemporal: history doesn't change, exact-asOf reads never expire.
        expect(cache.get('uuid-1', asOf)).toBe(val);
    }));
    // ---- C. Newest-wins merge ----
    test('put with older asOf does not overwrite newer', () => {
        var _a;
        link_cache_1.SECURITY.put('uuid-1', makeSecurityProto('newer'), makeAsOf(100));
        link_cache_1.SECURITY.put('uuid-1', makeSecurityProto('older'), makeAsOf(50));
        expect((_a = link_cache_1.SECURITY.get('uuid-1', makeAsOf(100))) === null || _a === void 0 ? void 0 : _a.getIssuerName()).toBe('newer');
        expect(link_cache_1.SECURITY.get('uuid-1', makeAsOf(50))).toBeUndefined();
    });
    test('put with newer asOf replaces older', () => {
        var _a;
        link_cache_1.SECURITY.put('uuid-1', makeSecurityProto('older'), makeAsOf(50));
        link_cache_1.SECURITY.put('uuid-1', makeSecurityProto('newer'), makeAsOf(100));
        expect((_a = link_cache_1.SECURITY.get('uuid-1', makeAsOf(100))) === null || _a === void 0 ? void 0 : _a.getIssuerName()).toBe('newer');
    });
    // ---- D. Evict & clear ----
    test('evict removes entry', () => {
        link_cache_1.SECURITY.put('uuid-1', makeSecurityProto('v1'), makeAsOf());
        link_cache_1.SECURITY.evict('uuid-1');
        expect(link_cache_1.SECURITY.get('uuid-1', makeAsOf())).toBeUndefined();
    });
    test('clear empties cache', () => {
        link_cache_1.SECURITY.put('a', makeSecurityProto('a'), makeAsOf());
        link_cache_1.SECURITY.put('b', makeSecurityProto('b'), makeAsOf());
        link_cache_1.SECURITY.clear();
        expect(link_cache_1.SECURITY.size()).toBe(0);
    });
    // ---- E. Singleton isolation ----
    test('singletons have independent state', () => {
        link_cache_1.SECURITY.put('uuid-1', makeSecurityProto('sec'), makeAsOf());
        expect(link_cache_1.PORTFOLIO.get('uuid-1', makeAsOf())).toBeUndefined();
        expect(link_cache_1.PRICE.get('uuid-1', makeAsOf())).toBeUndefined();
        expect(link_cache_1.TRANSACTION.get('uuid-1', makeAsOf())).toBeUndefined();
    });
});
//# sourceMappingURL=link-cache.test.js.map