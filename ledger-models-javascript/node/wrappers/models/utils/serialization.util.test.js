"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serialization_util_1 = require("./serialization.util");
const datetime_1 = require("./datetime");
const assert = require("assert");
test('test packing/unpacking string', () => {
    testString();
});
test('test packing/unpacking date', () => {
    testDate();
});
test('test packing/unpacking timestamp', () => {
    testTimestamp();
});
function testTimestamp() {
    const now = datetime_1.ZonedDateTime.now();
    const packedNow = (0, serialization_util_1.pack)(now);
    const unpackedNow = (0, serialization_util_1.unpack)(packedNow);
    assert.equal(now.getTimezone(), unpackedNow.getTimezone(), "Timezone doesn't match");
    assert.equal(now.getSeconds(), unpackedNow.getSeconds(), "Seconds do not match");
    assert.equal(now.getNanoSeconds(), unpackedNow.getNanoSeconds(), "Nanoseconds do not match");
}
function testDate() {
    const testDate = new Date();
    testDate.setHours(0, 0, 0, 0);
    const packedDate = (0, serialization_util_1.pack)(testDate);
    const unpackedDate = (0, serialization_util_1.unpack)(packedDate);
    assert.equal(unpackedDate.getTime(), testDate.getTime(), "Date packing/unpacking failed");
}
function testString() {
    const testString = "Hello";
    const packedString = (0, serialization_util_1.pack)(testString);
    const unpackedString = (0, serialization_util_1.unpack)(packedString);
    assert.equal(unpackedString, testString, "String packing/unpacking failed");
}
//# sourceMappingURL=serialization.util.test.js.map