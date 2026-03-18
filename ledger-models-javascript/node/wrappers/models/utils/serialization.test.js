"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strategy_allocation_pb_1 = require("../../../fintekkers/models/strategy/strategy_allocation_pb");
const serialization_1 = require("./serialization");
const uuid_1 = require("./uuid");
const assert = require("assert");
test('test serialization of key types', () => {
    testSerialization();
});
test('test deserialize StrategyAllocationProto', () => {
    checkStrategyAllocationProtoDeserialize();
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
function checkStrategyAllocationProtoDeserialize() {
    const proto = new strategy_allocation_pb_1.StrategyAllocationProto();
    proto.setObjectClass('StrategyAllocation');
    proto.setVersion('0.0.1');
    proto.setIsLink(false);
    const deserialized = serialization_1.ProtoSerializationUtil.deserialize(proto);
    assert.strictEqual(deserialized, proto, 'deserialize returns same StrategyAllocationProto instance');
    assert.equal(deserialized.getObjectClass(), 'StrategyAllocation');
    assert.equal(deserialized.getVersion(), '0.0.1');
    assert.equal(deserialized.getIsLink(), false);
}
//# sourceMappingURL=serialization.test.js.map