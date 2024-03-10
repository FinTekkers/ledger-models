import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { ProtoSerializationUtil } from '../utils/serialization';
import { UUID } from '../utils/uuid';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import assert = require('assert');
import Transaction from '../transaction/transaction';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';

import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PositionProto, PositionTypeProto, PositionViewProto } from '../../../fintekkers/models/position/position_pb';
import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { PositionService } from '../../services/position-service/PositionService';
import { PositionFilter } from './positionfilter';
import { QueryPositionRequestProto } from '../../../fintekkers/requests/position/query_position_request_pb';
import { ZonedDateTime } from '../utils/datetime';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { Position } from './hardcoded.position';



test('test the position wrapper', async () => {
    // const isTrue = await testSerialization();
    // expect(isTrue).toBe(true);

});

async function testSerialization(): Promise<boolean> {
    let fields = [FieldProto.ID, FieldProto.TRADE_DATE, FieldProto.PRODUCT_TYPE, FieldProto.PORTFOLIO, FieldProto.SECURITY];

    let security = new SecurityProto().setAssetClass("Test");
    let portfolio = new PortfolioProto().setPortfolioName("Test portfolio");
    let tradeDate = new LocalDateProto().setDay(3).setMonth(1).setYear(2024);
    let productType = "Test product type";
    let id = new UUID(UUID.random().toBytes());

    let measure = MeasureProto.DIRECTED_QUANTITY;
    let measureValue = new DecimalValueProto().setArbitraryPrecisionValue("1.0");


    ProtoSerializationUtil.serialize
    const anyMessage = new Any();
    const typeUrl = `Doesn't matter?`;
    const binaryMessage = security.serializeBinary();
    anyMessage.setTypeUrl(typeUrl);
    anyMessage.setValue(binaryMessage);

    let positionProto = new PositionProto();
    positionProto.addFields(new FieldMapEntry().setField(FieldProto.SECURITY).setFieldValuePacked(anyMessage));

    let position = new Position(positionProto);

    position.getFieldValue(FieldProto.SECURITY);

    return true;
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

