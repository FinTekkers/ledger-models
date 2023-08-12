import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { ProtoSerializationUtil } from './serialization';
import { UUID } from './uuid';

import assert = require('assert');
test('test creating a security against the api.fintekkers.org portfolio service', () => {
    testSerialization();
  });

function testSerialization(): void {
    checkUUID();

    //TODO: Make these tests more robust

    const serializedDate: any = ProtoSerializationUtil.serialize(new Date());
    assert(serializedDate.toString().indexOf('2023') > -1);

    const deserializedDate: any = ProtoSerializationUtil.deserialize(serializedDate);
    assert(deserializedDate.toString().indexOf('2023') > -1);

    const obj = new Date();
    const serializedTimestamp: any = ProtoSerializationUtil.serialize(obj);
    assert(serializedTimestamp.toString().indexOf('2023') > -1);

    const deserializedTimestamp: any = ProtoSerializationUtil.deserialize(serializedTimestamp);
    assert(deserializedTimestamp.toString().indexOf('2023') > -1);
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

