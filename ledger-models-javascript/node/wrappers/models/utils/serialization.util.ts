import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
import { ProtoSerializationUtil } from './serialization';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { ZonedDateTime } from './datetime';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { UUID } from './uuid';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { Identifier } from '../security/identifier';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';

function pack(value: Date | ZonedDateTime | UUID | Identifier | string | number) {
  if (typeof value === 'string') {
    return packStringIntoAny(value);
  } else if (value instanceof Date) {
    const localDateProto: LocalDateProto = ProtoSerializationUtil.serialize(value) as LocalDateProto;
    return packDateIntoAny(localDateProto);
  } else if (value instanceof ZonedDateTime) {
    const localDateProto: LocalTimestampProto = ProtoSerializationUtil.serialize(value) as LocalTimestampProto;
    return packTimestampIntoAny(localDateProto);
  } else if (value instanceof UUID) {
    return packIDIntoAny(value.toUUIDProto());
  } else if (value instanceof Identifier) {
    return packIdentifierProtoIntoAny(value.proto as IdentifierProto);
  } else if (value && typeof value === 'object' && 'proto' in value && (value as any).proto instanceof IdentifierProto) {
    return packIdentifierProtoIntoAny((value as any).proto as IdentifierProto);
  }
  else {
    throw new Error("Unrecognized type cannot be packed: " + typeof value);
  }
}

function unpack(value: Any): Date | ZonedDateTime | UUID | Identifier | string | number {
  const typeUrl = value.getTypeUrl();
  if (typeUrl === 'type.googleapis.com/google.protobuf.StringValue') {
    return unpackStringFromAny(value) as string;
  } else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.LocalDateProto') {
    return unpackDateFromAny(value) as Date;
  } else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.LocalTimestampProto') {
    return unpackTimestampFromAny(value);
  } else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.UUIDProto') {
    return unpackIDIntoAny(value) as UUID;
  } else if (typeUrl === 'type.googleapis.com/fintekkers.models.security.identifier.IdentifierProto') {
    return unpackIdentifierProtoFromAny(value) as Identifier;
  }
  else {
    console.log(value);
    throw new Error("Unrecognized Any type cannot be unpacked: " + typeUrl);
  }
}

function unpackIdentifierProtoFromAny(anyMessage: Any): Identifier {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/fintekkers.models.security.identifier.IdentifierProto') {
    throw new Error('Unexpected type URL for an identifier: ' + typeUrl);
  }
  const identifierProto: IdentifierProto = IdentifierProto.deserializeBinary(anyMessage.getValue_asU8());
  return ProtoSerializationUtil.deserialize(identifierProto) as unknown as Identifier;
}

function packIdentifierProtoIntoAny(input: IdentifierProto): Any {
  const anyMessage = new Any();

  anyMessage.pack(input.serializeBinary(), 'fintekkers.models.security.identifier.IdentifierProto');
  return anyMessage;
}

function packIDIntoAny(uuid: UUIDProto): Any {
  const anyMessage = new Any();

  anyMessage.pack(uuid.serializeBinary(), 'fintekkers.models.util.UUIDProto');
  return anyMessage;
}

function unpackIDIntoAny(anyMessage: Any): UUID {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.UUIDProto') {
    throw new Error('Unexpected type URL for a date: ' + typeUrl);
  }

  const uuidProto: UUIDProto = UUIDProto.deserializeBinary(anyMessage.getValue_asU8());
  return ProtoSerializationUtil.deserialize(uuidProto) as unknown as UUID;
}

function packTimestampIntoAny(inputDate: LocalTimestampProto): Any {
  const anyMessage = new Any();

  anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalTimestampProto');
  return anyMessage;
}

function unpackTimestampFromAny(anyMessage: Any): ZonedDateTime {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalTimestampProto') {
    throw new Error('Unexpected type URL for a timestamp: ' + typeUrl);
  }

  const dateProto: LocalTimestampProto = LocalTimestampProto.deserializeBinary(anyMessage.getValue_asU8());
  return ProtoSerializationUtil.deserialize(dateProto) as unknown as ZonedDateTime;
}

function packDateIntoAny(inputDate: LocalDateProto): Any {
  const anyMessage = new Any();

  anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalDateProto');
  return anyMessage;
}

function unpackDateFromAny(anyMessage: Any): Date {
  const typeUrl = anyMessage.getTypeUrl();

  if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalDateProto') {
    throw new Error('Unexpected type URL for a date: ' + typeUrl);
  }

  const dateProto: LocalDateProto = LocalDateProto.deserializeBinary(anyMessage.getValue_asU8());
  return ProtoSerializationUtil.deserialize(dateProto) as unknown as Date;
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
