"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = exports.pack = void 0;
var any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
var wrappers_pb_1 = require("google-protobuf/google/protobuf/wrappers_pb");
var serialization_1 = require("./serialization");
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
var datetime_1 = require("./datetime");
var local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
var uuid_1 = require("./uuid");
var uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
function pack(value) {
    if (typeof value === 'string') {
        return packStringIntoAny(value);
    }
    else if (value instanceof Date) {
        var localDateProto = serialization_1.ProtoSerializationUtil.serialize(value);
        return packDateIntoAny(localDateProto);
    }
    else if (value instanceof datetime_1.ZonedDateTime) {
        var localDateProto = serialization_1.ProtoSerializationUtil.serialize(value);
        return packTimestampIntoAny(localDateProto);
    }
    else if (value instanceof uuid_1.UUID) {
        // const uuid: UUIDProto = ProtoSerializationUtil.serialize(value);
        return packIDIntoAny(value.toUUIDProto());
    }
    else {
        throw new Error("Unrecognized type cannot be packed: " + typeof value);
    }
}
exports.pack = pack;
function unpack(value) {
    var typeUrl = value.getTypeUrl();
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
    else {
        console.log(value);
        throw new Error("Unrecognized Any type cannot be unpacked: " + typeUrl);
    }
}
exports.unpack = unpack;
function packIDIntoAny(uuid) {
    var anyMessage = new any_pb_1.Any();
    anyMessage.pack(uuid.serializeBinary(), 'fintekkers.models.util.UUIDProto');
    return anyMessage;
}
function unpackIDIntoAny(anyMessage) {
    var typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.UUIDProto') {
        throw new Error('Unexpected type URL for a date: ' + typeUrl);
    }
    var uuidProto = uuid_pb_1.UUIDProto.deserializeBinary(anyMessage.getValue_asU8());
    return serialization_1.ProtoSerializationUtil.deserialize(uuidProto);
}
function packTimestampIntoAny(inputDate) {
    var anyMessage = new any_pb_1.Any();
    anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalTimestampProto');
    return anyMessage;
}
function unpackTimestampFromAny(anyMessage) {
    var typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalTimestampProto') {
        throw new Error('Unexpected type URL for a timestamp: ' + typeUrl);
    }
    var dateProto = local_timestamp_pb_1.LocalTimestampProto.deserializeBinary(anyMessage.getValue_asU8());
    return serialization_1.ProtoSerializationUtil.deserialize(dateProto);
}
function packDateIntoAny(inputDate) {
    var anyMessage = new any_pb_1.Any();
    anyMessage.pack(inputDate.serializeBinary(), 'fintekkers.models.util.LocalDateProto');
    return anyMessage;
}
function unpackDateFromAny(anyMessage) {
    var typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/fintekkers.models.util.LocalDateProto') {
        throw new Error('Unexpected type URL for a date: ' + typeUrl);
    }
    var dateProto = local_date_pb_1.LocalDateProto.deserializeBinary(anyMessage.getValue_asU8());
    return serialization_1.ProtoSerializationUtil.deserialize(dateProto);
}
function packStringIntoAny(inputString) {
    var stringValue = new wrappers_pb_1.StringValue();
    stringValue.setValue(inputString);
    var anyMessage = new any_pb_1.Any();
    anyMessage.pack(stringValue.serializeBinary(), 'google.protobuf.StringValue');
    return anyMessage;
}
function unpackStringFromAny(anyMessage) {
    var typeUrl = anyMessage.getTypeUrl();
    if (typeUrl !== 'type.googleapis.com/google.protobuf.StringValue') {
        throw new Error('Unexpected type URL: ' + typeUrl);
    }
    var packedData = wrappers_pb_1.StringValue.deserializeBinary(anyMessage.getValue_asU8());
    var stringValue = packedData.getValue();
    return stringValue;
}
//# sourceMappingURL=serialization.util.js.map