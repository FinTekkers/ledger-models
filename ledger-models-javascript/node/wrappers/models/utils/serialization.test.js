"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serialization_1 = require("./serialization");
var uuid_1 = require("./uuid");
var assert = require("assert");
test('test creating a security against the api.fintekkers.org portfolio service', function () {
    testSerialization();
});
function testSerialization() {
    checkUUID();
    //TODO: Make these tests more robust
    var serializedDate = serialization_1.ProtoSerializationUtil.serialize(new Date());
    assert(serializedDate.toString().indexOf('2023') > -1);
    var deserializedDate = serialization_1.ProtoSerializationUtil.deserialize(serializedDate);
    assert(deserializedDate.toString().indexOf('2023') > -1);
    var obj = new Date();
    var serializedTimestamp = serialization_1.ProtoSerializationUtil.serialize(obj);
    assert(serializedTimestamp.toString().indexOf('2023') > -1);
    var deserializedTimestamp = serialization_1.ProtoSerializationUtil.deserialize(serializedTimestamp);
    assert(deserializedTimestamp.toString().indexOf('2023') > -1);
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