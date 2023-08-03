import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { StringValue } from 'google-protobuf/google/protobuf/wrappers_pb';
function packStringIntoAny(inputString) {
    // First, create a StringValue wrapper around the string
    var stringValue = new StringValue();
    stringValue.setValue(inputString);
    // Next, create an Any message and pack the StringValue into it
    var anyMessage = new Any();
    anyMessage.pack(stringValue.serializeBinary(), 'type.googleapis.com/google.protobuf.StringValue');
    return anyMessage;
}
/**
 * @param {*} field FieldProto.ASSET_CLASS, as an example
 * @param {*} fieldValue The appropriate value for the FieldProto, e.g. FieldProto.ASSET_CLASS would have a string fieldValue
 */
function createFieldMapEntry(field, fieldValue) {
    var fieldMapEntry = new FieldMapEntry();
    fieldMapEntry.setField(field); //FieldProto.ASSET_CLASS);
    fieldMapEntry.setFieldValuePacked(packStringIntoAny(fieldValue)); //"Cash"));
    return fieldMapEntry;
}
export { packStringIntoAny, createFieldMapEntry };
//# sourceMappingURL=util.js.map