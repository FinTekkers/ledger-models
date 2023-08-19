"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serialization_1 = require("./serialization");
var uuid_1 = require("./uuid");
var assert = require("assert");
test('test serialization of key types', function () {
    testSerialization();
});
function testSerialization() {
    checkUUID();
    var march2023 = new Date(2023, 2, 5); //Month is zero-indexed, so 2 == March.
    var serializedDate = serialization_1.ProtoSerializationUtil.serialize(march2023);
    assert(serializedDate.toString().indexOf('2023,3,5') > -1);
    var deserializedDate = serialization_1.ProtoSerializationUtil.deserialize(serializedDate);
    assert(deserializedDate.toString().indexOf('Mar 05 2023') > -1);
    var serializedTimestamp = serialization_1.ProtoSerializationUtil.serialize(march2023);
    assert(serializedTimestamp.toString().indexOf('2023,3,5') > -1);
    var deserializedTimestamp = serialization_1.ProtoSerializationUtil.deserialize(serializedTimestamp);
    assert(deserializedTimestamp.toString().indexOf('Mar 05 2023') > -1);
}
function checkUUID() {
    var uuid = uuid_1.UUID.random();
    var serializedUUID = serialization_1.ProtoSerializationUtil.serialize(uuid);
    var uuidCopy = serialization_1.ProtoSerializationUtil.deserialize(serializedUUID);
    var uuidString = uuid.toString();
    var uuidCopyString = uuidCopy.toString();
    assert.equal(uuidString, uuidCopyString);
    assert.deepEqual(uuid.toBytes(), uuidCopy.toBytes());
}
//# sourceMappingURL=serialization.test.js.map