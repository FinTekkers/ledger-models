"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var position_pb_1 = require("../../../fintekkers/models/position/position_pb");
var position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
test('test the position wrapper', function () {
    testSerialization();
});
function testSerialization() {
    var transaction = dummyPosition();
    // assert(transaction.getTransactionType().toString() === 'BUY');
    // assert(transaction.getDirectedQuantity().toNumber() > 0);
}
function pack() {
    var message = new position_pb_1.PositionProto();
    // Create a value of any type (in this case, a string)
    // const stringValue = "Hello, Any!";
    // const anyValue = new Any();
    // anyValue.pack(stringValue, "type.googleapis.com/google.protobuf.StringValue");
    // message.setValue(anyValue);
    // // Serialize the message to a binary buffer
    // const serialized = message.serializeBinary();
    // // Deserialize the binary buffer
    // const deserializedMessage = PositionProto.deserializeBinary(serialized);
    // const deserializedValue = deserializedMessage.getFieldsList()[0];
    // if (deserializedValue.is(string)) {
    // const unpackedValue = deserializedValue.unpack(StringValue.deserializeBinary);
    // console.log(unpackedValue.getValue()); // Output: Hello, Any!
    // }
}
function dummyPosition() {
    var field = new position_util_pb_1.FieldMapEntry()
        .setField(field_pb_1.FieldProto.TRANSACTION_TYPE);
    // .setFieldValuePacked
    return new position_pb_1.PositionProto();
    // new TransactionProto()
    // .setObjectClass('Transaction').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
    // .setTradeDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1))
    // .setTransactionType(TransactionTypeProto.BUY)
    // .setQuantity(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
    // .setSettlementDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1)));
}
//# sourceMappingURL=position.test.js.map