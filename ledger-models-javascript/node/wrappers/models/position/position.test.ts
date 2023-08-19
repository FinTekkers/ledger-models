import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { ProtoSerializationUtil } from '../utils/serialization';
import { UUID } from '../utils/uuid';

import assert = require('assert');
import Transaction from '../transaction/transaction';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';

import { Timestamp } from '@grpc/grpc-js/build/src/generated/google/protobuf/Timestamp';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PositionProto } from '../../../fintekkers/models/position/position_pb';
import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';



test('test the position wrapper', () => {
    testSerialization();
  });

function testSerialization(): void {
    const transaction = dummyPosition();

    // assert(transaction.getTransactionType().toString() === 'BUY');
    // assert(transaction.getDirectedQuantity().toNumber() > 0);
}

function pack() {
    const message = new PositionProto();

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
    let field = new FieldMapEntry()
        .setField(FieldProto.TRANSACTION_TYPE);
        // .setFieldValuePacked

    return new PositionProto();

    // new TransactionProto()
    // .setObjectClass('Transaction').setVersion('0.0.1').setUuid(UUID.random().toUUIDProto())
    // .setTradeDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1))
    // .setTransactionType(TransactionTypeProto.BUY)
    // .setQuantity(new DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
    // .setSettlementDate(new LocalDateProto().setYear(2021).setMonth(1).setDay(1)));
}

