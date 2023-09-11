import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { ProtoSerializationUtil } from './serialization';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { ZonedDateTime } from './datetime';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { UUID } from './uuid';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';

function pack(value: any) {
  if (typeof value === 'string') {
    return packStringIntoAny(value);
  } else if (value instanceof Date) {
    const localDateProto: LocalDateProto = ProtoSerializationUtil.serialize(value);
    return packDateIntoAny(localDateProto);
  } else if (value instanceof ZonedDateTime) {
    const localDateProto: LocalTimestampProto = ProtoSerializationUtil.serialize(value);
    return packTimestampIntoAny(localDateProto);
  } else if (value instanceof UUID) {
    // const uuid: UUIDProto = ProtoSerializationUtil.serialize(value);
    return packIDIntoAny(value.toUUIDProto());
  } else {
    throw new Error("Unrecognized type cannot be packed: " + typeof value);
  }
}

function unpack(value: Any): any {
  const typeUrl = value.getTypeUrl();
  if (typeUrl === 'type.googleapis.com/google.protobuf.StringValue') {
    return unpackStringFromAny(value);
  } else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.LocalDateProto') {
    return unpackDateFromAny(value);
  } else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.LocalTimestampProto') {
    return unpackTimestampFromAny(value);
  } else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.UUIDProto') {
    return unpackIDIntoAny(value);
  } else {
    console.log(value);
    throw new Error("Unrecognized Any type cannot be unpacked: " + typeUrl);
  }
}


function packIDIntoAny(uuid: UUIDProto): Any {
  const anyMessage = new Any();

  anyMessage.pack(uuid.serializeBinary(), 'fintekkers.models.util.UUIDProto');
  return anyMessage;
}

function unpackIDIntoAny(anyMessage: Any): UUIDProto {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.UUIDProto') {
    throw new Error('Unexpected type URL for a date: ' + typeUrl);
  }

  const uuidProto: UUIDProto = UUIDProto.deserializeBinary(anyMessage.getValue_asU8());
  return ProtoSerializationUtil.deserialize(uuidProto);
}

function packTimestampIntoAny(inputDate: LocalTimestampProto): Any {
  const anyMessage = new Any();

  anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalTimestampProto');
  return anyMessage;
}

function unpackTimestampFromAny(anyMessage: Any): LocalTimestampProto {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalTimestampProto') {
    throw new Error('Unexpected type URL for a timestamp: ' + typeUrl);
  }

  const dateProto: LocalTimestampProto = LocalTimestampProto.deserializeBinary(anyMessage.getValue_asU8());
  return ProtoSerializationUtil.deserialize(dateProto);
}

function packDateIntoAny(inputDate: LocalDateProto): Any {
  const anyMessage = new Any();

  anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalDateProto');
  return anyMessage;
}

function unpackDateFromAny(anyMessage: Any): LocalDateProto {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalDateProto') {
    throw new Error('Unexpected type URL for a date: ' + typeUrl);
  }

  const dateProto: LocalDateProto = LocalDateProto.deserializeBinary(anyMessage.getValue_asU8());
  return ProtoSerializationUtil.deserialize(dateProto);
}

function packStringIntoAny(inputString: string): Any {
  const stringValue = new StringValue();
  stringValue.setValue(inputString);

  const anyMessage = new Any();
  anyMessage.pack(stringValue.serializeBinary(), 'google.protobuf.StringValue');

  return anyMessage;
}

function unpackStringFromAny(anyMessage: Any): string | null {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/google.protobuf.StringValue') {
    throw new Error('Unexpected type URL: ' + typeUrl);
  }

  const packedData = StringValue.deserializeBinary(anyMessage.getValue_asU8());
  const stringValue = packedData.getValue();

  return stringValue;
}

export { pack, unpack };
