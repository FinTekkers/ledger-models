"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const security_1 = __importDefault(require("./security"));
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const LinkCache = __importStar(require("../../util/link-cache"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
function makeAsOf(epochSecondsOffset = 0) {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(1700000000 + epochSecondsOffset);
    ts.setNanos(0);
    const proto = new local_timestamp_pb_1.LocalTimestampProto();
    proto.setTimestamp(ts);
    proto.setTimeZone('UTC');
    return new datetime_1.ZonedDateTime(proto);
}
function makeFullProto(uuid, asOf, issuer = 'ACME') {
    const p = new security_pb_1.SecurityProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf.toProto());
    p.setIssuerName(issuer);
    p.setAssetClass('Equity');
    return p;
}
describe('Security lazy hydrate', () => {
    beforeEach(() => {
        LinkCache.SECURITY.clear();
    });
    // ---- A. Hydration on accessors ----
    test('A — getAssetClass on link-mode wrapper hydrates from cache', () => {
        const uuid = uuid_1.UUID.fromU8Array(new Uint8Array(16).fill(0x42));
        const asOf = makeAsOf();
        const resolved = makeFullProto(uuid, asOf, 'ACME-resolved');
        LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);
        const wrapper = new security_1.default(security_1.default.linkOf(uuid, asOf));
        expect(wrapper.isLink()).toBe(true);
        expect(wrapper.getAssetClass()).toBe('Equity');
        // After first accessor, wrapper has swapped in the resolved proto.
        expect(wrapper.proto.getIsLink()).toBe(false);
    });
    test('A — link-safe accessors do not require hydration', () => {
        const uuid = uuid_1.UUID.fromU8Array(new Uint8Array(16).fill(0x07));
        const asOf = makeAsOf();
        // Cache is empty — link-safe accessors must still work.
        const wrapper = new security_1.default(security_1.default.linkOf(uuid, asOf));
        expect(wrapper.isLink()).toBe(true);
        expect(wrapper.getID().toString()).toBe(uuid.toString());
        expect(wrapper.getAsOf().getSeconds()).toBe(asOf.getSeconds());
    });
    // ---- B. Cache behavior ----
    test('B.i — first accessor call hydrates from a pre-populated cache', () => {
        const uuid = uuid_1.UUID.fromU8Array(new Uint8Array(16).fill(0x01));
        const asOf = makeAsOf();
        const resolved = makeFullProto(uuid, asOf, 'hydrated');
        LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);
        const wrapper = new security_1.default(security_1.default.linkOf(uuid, asOf));
        expect(wrapper.getIssuerName()).toBe('hydrated');
    });
    test('B.ii — second accessor call hits the swapped proto, not the cache', () => {
        const uuid = uuid_1.UUID.fromU8Array(new Uint8Array(16).fill(0x02));
        const asOf = makeAsOf();
        const resolved = makeFullProto(uuid, asOf, 'firstRead');
        LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);
        const wrapper = new security_1.default(security_1.default.linkOf(uuid, asOf));
        expect(wrapper.getAssetClass()).toBe('Equity');
        // Evict the cache; wrapper has already swapped in the proto so the
        // second read must succeed without touching the cache.
        LinkCache.SECURITY.evict(uuid.toString());
        expect(wrapper.getIssuerName()).toBe('firstRead');
    });
    test('B.iii — fresh wrapper for same (uuid, asOf) reads cache populated by prior wrapper', () => {
        const uuid = uuid_1.UUID.fromU8Array(new Uint8Array(16).fill(0x03));
        const asOf = makeAsOf();
        const resolved = makeFullProto(uuid, asOf, 'shared');
        LinkCache.SECURITY.put(uuid.toString(), resolved, asOf);
        // Two independent wrappers share the cache entry.
        const wrapperA = new security_1.default(security_1.default.linkOf(uuid, asOf));
        const wrapperB = new security_1.default(security_1.default.linkOf(uuid, asOf));
        expect(wrapperA.getIssuerName()).toBe('shared');
        expect(wrapperB.getIssuerName()).toBe('shared');
    });
    // ---- C. asOf semantics ----
    test('C — link asOf differing from cached asOf is a miss', () => {
        const uuid = uuid_1.UUID.fromU8Array(new Uint8Array(16).fill(0x04));
        const asOfT1 = makeAsOf(0);
        const asOfT2 = makeAsOf(86400);
        LinkCache.SECURITY.put(uuid.toString(), makeFullProto(uuid, asOfT2, 'T2'), asOfT2);
        const wrapper = new security_1.default(security_1.default.linkOf(uuid, asOfT1));
        expect(() => wrapper.getIssuerName()).toThrow(/LinkCache miss/);
    });
    // ---- D. Resolve failure ----
    test('D — cache miss throws with uuid in message', () => {
        const uuid = uuid_1.UUID.fromU8Array(new Uint8Array(16).fill(0x05));
        const asOf = makeAsOf();
        const wrapper = new security_1.default(security_1.default.linkOf(uuid, asOf));
        expect(() => wrapper.getAssetClass()).toThrow(new RegExp(uuid.toString()));
    });
});
//# sourceMappingURL=security.lazy-hydrate.test.js.map