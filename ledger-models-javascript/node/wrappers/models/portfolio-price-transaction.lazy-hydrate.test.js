"use strict";
// Lazy-hydrate tests for Portfolio / Price / Transaction wrappers.
// Mirror of security.lazy-hydrate.test.ts — cache-only design, throws on miss.
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
const portfolio_1 = __importDefault(require("./portfolio/portfolio"));
const Price_1 = __importDefault(require("./price/Price"));
const transaction_1 = __importDefault(require("./transaction/transaction"));
const uuid_1 = require("./utils/uuid");
const datetime_1 = require("./utils/datetime");
const portfolio_pb_1 = require("../../fintekkers/models/portfolio/portfolio_pb");
const price_pb_1 = require("../../fintekkers/models/price/price_pb");
const transaction_pb_1 = require("../../fintekkers/models/transaction/transaction_pb");
const decimal_value_pb_1 = require("../../fintekkers/models/util/decimal_value_pb");
const local_timestamp_pb_1 = require("../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const LinkCache = __importStar(require("../util/link-cache"));
function makeAsOf(epochSeconds = 1700000000) {
    const ts = new timestamp_pb_1.Timestamp();
    ts.setSeconds(epochSeconds);
    ts.setNanos(0);
    const proto = new local_timestamp_pb_1.LocalTimestampProto();
    proto.setTimestamp(ts);
    proto.setTimeZone('UTC');
    return new datetime_1.ZonedDateTime(proto);
}
function linkPortfolio(uuid, asOf) {
    const p = new portfolio_pb_1.PortfolioProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf.toProto());
    p.setIsLink(true);
    return p;
}
function fullPortfolio(uuid, asOf, name) {
    const p = new portfolio_pb_1.PortfolioProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf.toProto());
    p.setIsLink(false);
    p.setPortfolioName(name);
    return p;
}
function linkPriceProto(uuid, asOf) {
    const p = new price_pb_1.PriceProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf.toProto());
    p.setIsLink(true);
    return p;
}
function fullPriceProto(uuid, asOf, value) {
    const p = new price_pb_1.PriceProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf.toProto());
    p.setIsLink(false);
    const dv = new decimal_value_pb_1.DecimalValueProto();
    dv.setArbitraryPrecisionValue(value);
    p.setPrice(dv);
    return p;
}
function linkTxnProto(uuid, asOf) {
    const p = new transaction_pb_1.TransactionProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf.toProto());
    p.setIsLink(true);
    return p;
}
function fullTxnProto(uuid, asOf) {
    const p = new transaction_pb_1.TransactionProto();
    p.setUuid(uuid.toUUIDProto());
    p.setAsOf(asOf.toProto());
    p.setIsLink(false);
    p.setTradeName('TXN');
    return p;
}
beforeEach(() => {
    LinkCache.PORTFOLIO.clear();
    LinkCache.PRICE.clear();
    LinkCache.TRANSACTION.clear();
});
// ---- Portfolio ----
test('Portfolio getPortfolioName on link wrapper hydrates from cache', () => {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(1);
    LinkCache.PORTFOLIO.put(uuid.toString(), fullPortfolio(uuid, asOf, 'Strategy Z'), asOf);
    const p = new portfolio_1.default(linkPortfolio(uuid, asOf));
    expect(p.isLink()).toBe(true);
    expect(p.getPortfolioName()).toBe('Strategy Z');
    expect(p.proto.getIsLink()).toBe(false);
});
test('Portfolio cache miss throws with uuid in message', () => {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(2);
    const p = new portfolio_1.default(linkPortfolio(uuid, asOf));
    expect(() => p.getPortfolioName()).toThrow(new RegExp(uuid.toString()));
});
// ---- Price ----
test('Price getPrice on link wrapper hydrates from cache', () => {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(3);
    LinkCache.PRICE.put(uuid.toString(), fullPriceProto(uuid, asOf, '123.45'), asOf);
    const pr = new Price_1.default(linkPriceProto(uuid, asOf));
    expect(pr.isLink()).toBe(true);
    expect(pr.getPrice().toString()).toBe('123.45');
});
test('Price cache miss throws with uuid in message', () => {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(4);
    const pr = new Price_1.default(linkPriceProto(uuid, asOf));
    expect(() => pr.getPrice()).toThrow(new RegExp(uuid.toString()));
});
// ---- Transaction ----
test('Transaction getTradeName on link wrapper hydrates from cache', () => {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(5);
    LinkCache.TRANSACTION.put(uuid.toString(), fullTxnProto(uuid, asOf), asOf);
    const t = new transaction_1.default(linkTxnProto(uuid, asOf));
    expect(t.isLink()).toBe(true);
    expect(t.getTradeName()).toBe('TXN');
});
test('Transaction cache miss throws with uuid in message', () => {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(6);
    const t = new transaction_1.default(linkTxnProto(uuid, asOf));
    expect(() => t.getTradeName()).toThrow(new RegExp(uuid.toString()));
});
test('Transaction link-safe accessors do not hydrate', () => {
    const uuid = uuid_1.UUID.random();
    const asOf = makeAsOf(7);
    // No cache entry, no fetcher — link-safe accessors must still work.
    const t = new transaction_1.default(linkTxnProto(uuid, asOf));
    expect(t.isLink()).toBe(true);
    expect(t.getID().toString()).toBe(uuid.toString());
});
//# sourceMappingURL=portfolio-price-transaction.lazy-hydrate.test.js.map