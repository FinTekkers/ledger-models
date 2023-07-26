"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFieldMapEntry = exports.packStringIntoAny = void 0;
var position_util_pb_1 = require("../fintekkers/models/position/position_util_pb");
var any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
var wrappers_pb_1 = require("google-protobuf/google/protobuf/wrappers_pb");
function packStringIntoAny(inputString) {
    // First, create a StringValue wrapper around the string
    var stringValue = new wrappers_pb_1.StringValue();
    stringValue.setValue(inputString);
    // Next, create an Any message and pack the StringValue into it
    var anyMessage = new any_pb_1.Any();
    anyMessage.pack(stringValue.serializeBinary(), 'type.googleapis.com/google.protobuf.StringValue');
    return anyMessage;
}
exports.packStringIntoAny = packStringIntoAny;
/**
 * @param {*} field FieldProto.ASSET_CLASS, as an example
 * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
 */
function createFieldMapEntry(field, fieldValue) {
    var fieldMapEntry = new position_util_pb_1.FieldMapEntry();
    fieldMapEntry.setField(field); //FieldProto.ASSET_CLASS);
    fieldMapEntry.setFieldValuePacked(packStringIntoAny(fieldValue)); //"Cash"));
    return fieldMapEntry;
}
exports.createFieldMapEntry = createFieldMapEntry;
//# sourceMappingURL=proto_utils_util.js.map