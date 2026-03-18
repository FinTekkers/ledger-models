import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { StrategyAllocationProto } from '../../../fintekkers/models/strategy/strategy_allocation_pb';
import { ProtoSerializationUtil } from './serialization';
import { UUID } from './uuid';

import assert = require('assert');
test('test serialization of key types', () => {
    testSerialization();
});

test('test deserialize StrategyAllocationProto', () => {
    checkStrategyAllocationProtoDeserialize();
});

function testSerialization(): void {
    checkUUID();

    const march2023 = new Date(2023, 2, 5); //Month is zero-indexed, so 2 == March.
    const serializedDate: any = ProtoSerializationUtil.serialize(march2023);
    assert(serializedDate.toString().indexOf('2023,3,5') > -1);

    const deserializedDate: any = ProtoSerializationUtil.deserialize(serializedDate);
    assert(deserializedDate.toString().indexOf('Mar 05 2023') > -1);

    const serializedTimestamp: any = ProtoSerializationUtil.serialize(march2023);
    assert(serializedTimestamp.toString().indexOf('2023,3,5') > -1);

    const deserializedTimestamp: any = ProtoSerializationUtil.deserialize(serializedTimestamp);
    assert(deserializedTimestamp.toString().indexOf('Mar 05 2023') > -1);
}

function checkUUID() {
    const uuid: UUID = UUID.random();
    const serializedUUID: UUIDProto = ProtoSerializationUtil.serialize(uuid) as UUIDProto;
    const uuidCopy: UUID = ProtoSerializationUtil.deserialize(serializedUUID) as UUID;

    const uuidString: string = uuid.toString();
    const uuidCopyString: string = uuidCopy.toString();

    assert.equal(uuidString, uuidCopyString);
    assert.deepEqual(uuid.toBytes(), uuidCopy.toBytes());
}

function checkStrategyAllocationProtoDeserialize(): void {
    const proto = new StrategyAllocationProto();
    proto.setObjectClass('StrategyAllocation');
    proto.setVersion('0.0.1');
    proto.setIsLink(false);

    const deserialized = ProtoSerializationUtil.deserialize(proto) as StrategyAllocationProto;

    assert.strictEqual(deserialized, proto, 'deserialize returns same StrategyAllocationProto instance');
    assert.equal(deserialized.getObjectClass(), 'StrategyAllocation');
    assert.equal(deserialized.getVersion(), '0.0.1');
    assert.equal(deserialized.getIsLink(), false);
}

