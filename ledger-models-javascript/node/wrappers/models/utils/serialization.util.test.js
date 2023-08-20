"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serialization_util_1 = require("./serialization.util");
var datetime_1 = require("./datetime");
var assert = require("assert");
test('test packing/unpacking string', function () {
    testString();
});
test('test packing/unpacking date', function () {
    testDate();
});
test('test packing/unpacking timestamp', function () {
    testTimestamp();
});
function testTimestamp() {
    var now = datetime_1.ZonedDateTime.now();
    var packedNow = (0, serialization_util_1.pack)(now);
    var unpackedNow = (0, serialization_util_1.unpack)(packedNow);
    assert.equal(now.getTimezone(), unpackedNow.getTimezone(), "Timezone doesn't match");
    assert.equal(now.getSeconds(), unpackedNow.getSeconds(), "Seconds do not match");
    assert.equal(now.getNanoSeconds(), unpackedNow.getNanoSeconds(), "Nanoseconds do not match");
}
function testDate() {
    var testDate = new Date();
    testDate.setHours(0, 0, 0, 0);
    var packedDate = (0, serialization_util_1.pack)(testDate);
    var unpackedDate = (0, serialization_util_1.unpack)(packedDate);
    assert.equal(unpackedDate.getTime(), testDate.getTime(), "Date packing/unpacking failed");
}
function testString() {
    var testString = "Hello";
    var packedString = (0, serialization_util_1.pack)(testString);
    var unpackedString = (0, serialization_util_1.unpack)(packedString);
    assert.equal(unpackedString, testString, "String packing/unpacking failed");
}
//# sourceMappingURL=serialization.util.test.js.map