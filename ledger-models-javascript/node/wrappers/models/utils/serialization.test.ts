import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { ProtoSerializationUtil } from './serialization';
import { UUID } from './uuid';

import assert = require('assert');

async function testSerialization(): Promise<void> {
    checkUUID();

    const serializedDate: any = ProtoSerializationUtil.serialize(new Date());
    console.log(serializedDate);

    const deserializedDate: any = ProtoSerializationUtil.deserialize(serializedDate);
    console.log(deserializedDate);

    const obj = new Date();
    const serializedTimestamp: any = ProtoSerializationUtil.serialize(obj);
    console.log(serializedTimestamp);

    const deserializedTimestamp: any = ProtoSerializationUtil.deserialize(serializedTimestamp);
    console.log(deserializedTimestamp);
}

export { testSerialization };

function checkUUID() {
    const uuid: UUID = UUID.random();
    const serializedUUID: UUIDProto = ProtoSerializationUtil.serialize(uuid) as UUIDProto;
    const uuidCopy: UUID = ProtoSerializationUtil.deserialize(serializedUUID) as UUID;

    const uuidString: string = uuid.toString();
    const uuidCopyString: string = uuidCopy.toString();

    assert.equal(uuidString, uuidCopyString);
    assert.deepEqual(uuid.toBytes(), uuidCopy.toBytes());
}

