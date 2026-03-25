import Price from './Price';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { Decimal } from 'decimal.js';

const TEST_UUID = '18e8c4e6-3da0-47c9-b26d-c5ea8b8dce95';

test('Price.fromSimple creates a Price with correct values', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const price = Price.fromSimple(TEST_UUID, 99.5, date);

    expect(price.getPrice().equals(new Decimal('99.5'))).toBe(true);
    expect(price.getSecurityID().toString()).toBe(TEST_UUID);
    expect(price.getAsOf()).toBeTruthy();
    expect(price.getID()).toBeTruthy();
    expect(price.getPriceType()).toBe(PriceTypeProto.PERCENTAGE);
});

test('Price.fromSimple accepts a custom price type', () => {
    const date = new Date();
    const price = Price.fromSimple(TEST_UUID, 250, date, PriceTypeProto.INDEX_LEVEL);

    expect(price.getPriceType()).toBe(PriceTypeProto.INDEX_LEVEL);
    expect(price.getPrice().equals(new Decimal('250'))).toBe(true);
});

test('Price.fromSimple sets security as link reference', () => {
    const date = new Date();
    const price = Price.fromSimple(TEST_UUID, 100.25, date);

    expect(price.proto.getSecurity()?.getIsLink()).toBe(true);
});

test('Price.toString returns a readable string', () => {
    const date = new Date();
    const price = Price.fromSimple(TEST_UUID, 99.875, date);

    const str = price.toString();
    expect(str).toContain('99.875');
    expect(str).toContain(TEST_UUID);
});

test('Price.getID returns a valid UUID', () => {
    const date = new Date();
    const price = Price.fromSimple(TEST_UUID, 99.5, date);

    const id = price.getID();
    // UUID toString should return a valid UUID string (8-4-4-4-12 format)
    expect(id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
});

test('Price proto has all required fields set', () => {
    const date = new Date();
    const price = Price.fromSimple(TEST_UUID, 50.0, date);

    expect(price.proto.getObjectClass()).toBe('Price');
    expect(price.proto.getVersion()).toBe('0.0.1');
    expect(price.proto.getUuid()).toBeTruthy();
    expect(price.proto.getAsOf()).toBeTruthy();
    expect(price.proto.getPrice()).toBeTruthy();
    expect(price.proto.getSecurity()).toBeTruthy();
});
