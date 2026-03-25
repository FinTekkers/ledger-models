"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Price_1 = __importDefault(require("./Price"));
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const decimal_js_1 = require("decimal.js");
const TEST_UUID = '18e8c4e6-3da0-47c9-b26d-c5ea8b8dce95';
test('Price.fromSimple creates a Price with correct values', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const price = Price_1.default.fromSimple(TEST_UUID, 99.5, date);
    expect(price.getPrice().equals(new decimal_js_1.Decimal('99.5'))).toBe(true);
    expect(price.getSecurityID().toString()).toBe(TEST_UUID);
    expect(price.getAsOf()).toBeTruthy();
    expect(price.getID()).toBeTruthy();
    expect(price.getPriceType()).toBe(price_type_pb_1.PriceTypeProto.PERCENTAGE);
});
test('Price.fromSimple accepts a custom price type', () => {
    const date = new Date();
    const price = Price_1.default.fromSimple(TEST_UUID, 250, date, price_type_pb_1.PriceTypeProto.INDEX_LEVEL);
    expect(price.getPriceType()).toBe(price_type_pb_1.PriceTypeProto.INDEX_LEVEL);
    expect(price.getPrice().equals(new decimal_js_1.Decimal('250'))).toBe(true);
});
test('Price.fromSimple sets security as link reference', () => {
    var _a;
    const date = new Date();
    const price = Price_1.default.fromSimple(TEST_UUID, 100.25, date);
    expect((_a = price.proto.getSecurity()) === null || _a === void 0 ? void 0 : _a.getIsLink()).toBe(true);
});
test('Price.toString returns a readable string', () => {
    const date = new Date();
    const price = Price_1.default.fromSimple(TEST_UUID, 99.875, date);
    const str = price.toString();
    expect(str).toContain('99.875');
    expect(str).toContain(TEST_UUID);
});
test('Price.getID returns a valid UUID', () => {
    const date = new Date();
    const price = Price_1.default.fromSimple(TEST_UUID, 99.5, date);
    const id = price.getID();
    // UUID toString should return a valid UUID string (8-4-4-4-12 format)
    expect(id.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});
test('Price proto has all required fields set', () => {
    const date = new Date();
    const price = Price_1.default.fromSimple(TEST_UUID, 50.0, date);
    expect(price.proto.getObjectClass()).toBe('Price');
    expect(price.proto.getVersion()).toBe('0.0.1');
    expect(price.proto.getUuid()).toBeTruthy();
    expect(price.proto.getAsOf()).toBeTruthy();
    expect(price.proto.getPrice()).toBeTruthy();
    expect(price.proto.getSecurity()).toBeTruthy();
});
//# sourceMappingURL=Price.test.js.map