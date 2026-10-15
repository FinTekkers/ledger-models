"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const uuid_1 = require("./uuid");
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const errors_1 = require("../errors");
test('test packing/unpacking string', () => {
    const test_uuid_bytes = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
    const test_uuid = new uuid_1.UUID(test_uuid_bytes);
    assert(test_uuid.toString() == 'd962fdf0-33e1-4d9d-999b-7ec350f0cb77');
    const test_uuid_bytes_copy = uuid_1.UUID.fromString(test_uuid.toString());
    assert(test_uuid_bytes.length === test_uuid_bytes_copy.length &&
        test_uuid_bytes.every((value, index) => value === test_uuid_bytes_copy[index]));
    assert(uuid_1.UUID.random().toString().length == 36);
});
test('equals returns true for identical UUIDs', () => {
    const bytes = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
    const uuid1 = new uuid_1.UUID(bytes);
    const uuid2 = new uuid_1.UUID([...bytes]);
    assert(uuid1.equals(uuid2));
});
test('equals returns false for different UUIDs', () => {
    const uuid1 = uuid_1.UUID.random();
    const uuid2 = uuid_1.UUID.random();
    assert(!uuid1.equals(uuid2));
});
test('equals works with round-tripped UUIDs', () => {
    const original = uuid_1.UUID.random();
    const proto = original.toUUIDProto();
    const restored = uuid_1.UUID.fromU8Array(proto.getRawUuid_asU8());
    assert(original.equals(restored));
});
test('equals returns true for same instance', () => {
    const uuid = uuid_1.UUID.random();
    assert(uuid.equals(uuid));
});
// LM-334: a raw_uuid that is neither empty nor exactly 16 bytes is a typed
// input error naming raw_uuid.
function rawUuid(length) {
    return Uint8Array.from({ length }, (_, i) => i);
}
function protoOf(raw) {
    const proto = new uuid_pb_1.UUIDProto();
    proto.setRawUuid(raw);
    return proto;
}
function expectRawUuidError(decode, length) {
    let caught;
    try {
        decode();
    }
    catch (e) {
        caught = e;
    }
    expect(caught).toBeInstanceOf(errors_1.ModelValidationError);
    const err = caught;
    expect(err.field).toBe('raw_uuid');
    expect(err.message).toContain('raw_uuid');
    expect(err.message).toContain(`got ${length}`);
}
test.each([15, 17])('fromUUIDProto rejects %i bytes with ModelValidationError naming raw_uuid', (length) => {
    expectRawUuidError(() => uuid_1.UUID.fromUUIDProto(protoOf(rawUuid(length))), length);
});
test('fromUUIDProto decodes 16 bytes in byte order and round-trips', () => {
    expect(uuid_1.UUID.fromUUIDProto(protoOf(rawUuid(16))).toString())
        .toBe('00010203-0405-0607-0809-0a0b0c0d0e0f');
    const original = uuid_1.UUID.random();
    const proto = original.toUUIDProto();
    expect(proto.getRawUuid_asU8().length).toBe(16);
    expect(uuid_1.UUID.fromUUIDProto(proto).equals(original)).toBe(true);
});
test('fromUUIDProto returns undefined for unset or empty', () => {
    expect(uuid_1.UUID.fromUUIDProto(undefined)).toBeUndefined();
    expect(uuid_1.UUID.fromUUIDProto(new uuid_pb_1.UUIDProto())).toBeUndefined();
    expect(uuid_1.UUID.fromUUIDProto(protoOf(new Uint8Array(0)))).toBeUndefined();
});
test('fromU8Array keeps accepting empty and rejects 17 bytes', () => {
    expect(uuid_1.UUID.fromU8Array(new Uint8Array(0)).toBytes()).toEqual([]);
    expect(uuid_1.UUID.fromU8Array(rawUuid(16)).toString()).toBe('00010203-0405-0607-0809-0a0b0c0d0e0f');
    expectRawUuidError(() => uuid_1.UUID.fromU8Array(rawUuid(17)), 17);
});
test('ModelValidationError with a malformed object_id still names its own field', () => {
    const v = (0, errors_1.violation)('price', undefined, 'price is required but unset');
    v.setObjectId(protoOf(rawUuid(17)));
    const err = new errors_1.ModelValidationError([v]);
    expect(err.field).toBe('price');
    expect(err.message).toContain('price: price is required but unset');
    expect(err.objectId).toBeUndefined();
});
//# sourceMappingURL=uuid.test.js.map