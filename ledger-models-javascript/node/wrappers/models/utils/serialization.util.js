"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = exports.pack = void 0;
const any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
const wrappers_pb_1 = require("google-protobuf/google/protobuf/wrappers_pb");
const serialization_1 = require("./serialization");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const datetime_1 = require("./datetime");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const uuid_1 = require("./uuid");
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const identifier_1 = require("../security/identifier");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
function pack(value) {
    if (typeof value === 'string') {
        return packStringIntoAny(value);
    }
    else if (value instanceof Date) {
        const localDateProto = serialization_1.ProtoSerializationUtil.serialize(value);
        return packDateIntoAny(localDateProto);
    }
    else if (value instanceof datetime_1.ZonedDateTime) {
        const localDateProto = serialization_1.ProtoSerializationUtil.serialize(value);
        return packTimestampIntoAny(localDateProto);
    }
    else if (value instanceof uuid_1.UUID) {
        return packIDIntoAny(value.toUUIDProto());
    }
    else if (value instanceof identifier_1.Identifier) {
        return packIdentifierProtoIntoAny(value.proto);
    }
    else if (value && typeof value === 'object' && 'proto' in value && value.proto instanceof identifier_pb_1.IdentifierProto) {
        return packIdentifierProtoIntoAny(value.proto);
    }
    else {
        throw new Error("Unrecognized type cannot be packed: " + typeof value);
    }
}
exports.pack = pack;
function unpack(value) {
    const typeUrl = value.getTypeUrl();
    if (typeUrl === 'type.googleapis.com/google.protobuf.StringValue') {
        return unpackStringFromAny(value);
    }
    else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.LocalDateProto') {
        return unpackDateFromAny(value);
    }
    else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.LocalTimestampProto') {
        return unpackTimestampFromAny(value);
    }
    else if (typeUrl === 'type.googleapis.com/fintekkers.models.util.UUIDProto') {
        return unpackIDIntoAny(value);
    }
    else if (typeUrl === 'type.googleapis.com/fintekkers.models.security.identifier.IdentifierProto') {
        return unpackIdentifierProtoFromAny(value);
    }
    else {
        console.log(value);
        throw new Error("Unrecognized Any type cannot be unpacked: " + typeUrl);
    }
}
exports.unpack = unpack;
function unpackIdentifierProtoFromAny(anyMessage) {
    const typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/fintekkers.models.security.identifier.IdentifierProto') {
        throw new Error('Unexpected type URL for an identifier: ' + typeUrl);
    }
    const identifierProto = identifier_pb_1.IdentifierProto.deserializeBinary(anyMessage.getValue_asU8());
    return serialization_1.ProtoSerializationUtil.deserialize(identifierProto);
}
function packIdentifierProtoIntoAny(input) {
    const anyMessage = new any_pb_1.Any();
    anyMessage.pack(input.serializeBinary(), 'fintekkers.models.security.identifier.IdentifierProto');
    return anyMessage;
}
function packIDIntoAny(uuid) {
    const anyMessage = new any_pb_1.Any();
    anyMessage.pack(uuid.serializeBinary(), 'fintekkers.models.util.UUIDProto');
    return anyMessage;
}
function unpackIDIntoAny(anyMessage) {
    const typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.UUIDProto') {
        throw new Error('Unexpected type URL for a date: ' + typeUrl);
    }
    const uuidProto = uuid_pb_1.UUIDProto.deserializeBinary(anyMessage.getValue_asU8());
    return serialization_1.ProtoSerializationUtil.deserialize(uuidProto);
}
function packTimestampIntoAny(inputDate) {
    const anyMessage = new any_pb_1.Any();
    anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalTimestampProto');
    return anyMessage;
}
function unpackTimestampFromAny(anyMessage) {
    const typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalTimestampProto') {
        throw new Error('Unexpected type URL for a timestamp: ' + typeUrl);
    }
    const dateProto = local_timestamp_pb_1.LocalTimestampProto.deserializeBinary(anyMessage.getValue_asU8());
    return serialization_1.ProtoSerializationUtil.deserialize(dateProto);
}
function packDateIntoAny(inputDate) {
    const anyMessage = new any_pb_1.Any();
    anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalDateProto');
    return anyMessage;
}
function unpackDateFromAny(anyMessage) {
    const typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalDateProto') {
        throw new Error('Unexpected type URL for a date: ' + typeUrl);
    }
    const dateProto = local_date_pb_1.LocalDateProto.deserializeBinary(anyMessage.getValue_asU8());
    return serialization_1.ProtoSerializationUtil.deserialize(dateProto);
}
function packStringIntoAny(inputString) {
    const stringValue = new wrappers_pb_1.StringValue();
    stringValue.setValue(inputString);
    const anyMessage = new any_pb_1.Any();
    anyMessage.pack(stringValue.serializeBinary(), 'google.protobuf.StringValue');
    return anyMessage;
}
function unpackStringFromAny(anyMessage) {
    const typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/google.protobuf.StringValue') {
        throw new Error('Unexpected type URL: ' + typeUrl);
    }
    const packedData = wrappers_pb_1.StringValue.deserializeBinary(anyMessage.getValue_asU8());
    const stringValue = packedData.getValue();
    return stringValue;
}
//# sourceMappingURL=serialization.util.js.map