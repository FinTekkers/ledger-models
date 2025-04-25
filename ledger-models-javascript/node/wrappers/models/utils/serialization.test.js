"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serialization_1 = require("./serialization");
const uuid_1 = require("./uuid");
const assert = require("assert");
test('test serialization of key types', () => {
    testSerialization();
});
function testSerialization() {
    checkUUID();
    const march2023 = new Date(2023, 2, 5); //Month is zero-indexed, so 2 == March.
    const serializedDate = serialization_1.ProtoSerializationUtil.serialize(march2023);
    assert(serializedDate.toString().indexOf('2023,3,5') > -1);
    const deserializedDate = serialization_1.ProtoSerializationUtil.deserialize(serializedDate);
    assert(deserializedDate.toString().indexOf('Mar 05 2023') > -1);
    const serializedTimestamp = serialization_1.ProtoSerializationUtil.serialize(march2023);
    assert(serializedTimestamp.toString().indexOf('2023,3,5') > -1);
    const deserializedTimestamp = serialization_1.ProtoSerializationUtil.deserialize(serializedTimestamp);
    assert(deserializedTimestamp.toString().indexOf('Mar 05 2023') > -1);
}
function checkUUID() {
    const uuid = uuid_1.UUID.random();
    const serializedUUID = serialization_1.ProtoSerializationUtil.serialize(uuid);
    const uuidCopy = serialization_1.ProtoSerializationUtil.deserialize(serializedUUID);
    const uuidString = uuid.toString();
    const uuidCopyString = uuidCopy.toString();
    assert.equal(uuidString, uuidCopyString);
    assert.deepEqual(uuid.toBytes(), uuidCopy.toBytes());
}
//# sourceMappingURL=serialization.test.js.map