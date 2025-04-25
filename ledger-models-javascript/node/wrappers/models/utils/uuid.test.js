"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const uuid_1 = require("./uuid");
test('test packing/unpacking string', () => {
    testString();
});
function testString() {
    const test_uuid_bytes = [217, 98, 253, 240, 51, 225, 77, 157, 153, 155, 126, 195, 80, 240, 203, 119];
    const test_uuid = new uuid_1.UUID(test_uuid_bytes);
    assert(test_uuid.toString() == 'd962fdf0-33e1-4d9d-999b-7ec350f0cb77');
    const test_uuid_bytes_copy = uuid_1.UUID.fromString(test_uuid.toString());
    assert(test_uuid_bytes.length === test_uuid_bytes_copy.length &&
        test_uuid_bytes.every((value, index) => value === test_uuid_bytes_copy[index]));
    assert(uuid_1.UUID.random().toString().length == 36);
}
//# sourceMappingURL=uuid.test.js.map