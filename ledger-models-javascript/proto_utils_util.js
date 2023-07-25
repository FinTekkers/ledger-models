const { FieldMapEntry } = require('./node/fintekkers/models/position/position_util_pb');
const { Any } = require("google-protobuf/google/protobuf/any_pb");
const { StringValue } = require("google-protobuf/google/protobuf/wrappers_pb");

function packStringIntoAny(inputString) {
    // First, create a StringValue wrapper around the string
    const stringValue = new StringValue();
    stringValue.setValue(inputString);
    
    // Next, create an Any message and pack the StringValue into it
    const anyMessage = new Any();
    anyMessage.pack(stringValue.serializeBinary(), "type.googleapis.com/google.protobuf.StringValue");
    
    return anyMessage;
}

/**
 * @param {*} field FieldProto.ASSET_CLASS, as an example
 * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
 */
function createFieldMapEntry(field, fieldValue) {
    const fieldMapEntry = new FieldMapEntry();
    fieldMapEntry.setField(field); //FieldProto.ASSET_CLASS);
    fieldMapEntry.setFieldValuePacked(packStringIntoAny(fieldValue));//"Cash"));
    return fieldMapEntry;
}

exports.packStringIntoAny = packStringIntoAny;
exports.createFieldMapEntry = createFieldMapEntry;