"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const uuid_1 = require("./uuid");
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
//# sourceMappingURL=uuid.test.js.map