import { UUID } from '../utils/uuid';
import { Any } from 'google-protobuf/google/protobuf/any_pb';

import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { PositionProto } from '../../../fintekkers/models/position/position_pb';
import { FieldMapEntry, MeasureMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { Position } from './position';
import { LocalDate } from '../utils/date';
import { PositionStatusProto } from '../../../fintekkers/models/position/position_status_pb';
import { ProtoEnum } from '../utils/protoEnum';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';

test('test the position wrapper', async () => {
    let isTrue = await testEnumSerialization();
    expect(isTrue).toBe(true);

    isTrue = await testSerialization();
    expect(isTrue).toBe(true);

    isTrue = await testJsonSerialization();
    expect(isTrue).toBe(true);

    isTrue = await testDeSerializationWithUnknownProto();
    expect(isTrue).toBe(true);

});

async function testEnumSerialization(): Promise<boolean> {
    let positionProto = new PositionProto();
    positionProto.setFieldsList([
        new FieldMapEntry().setField(FieldProto.POSITION_STATUS).setEnumValue(PositionStatusProto.EXECUTED)
    ]);

    let measureValue = new DecimalValueProto().setArbitraryPrecisionValue("1.55");
    positionProto.setMeasuresList([
        new MeasureMapEntry().setMeasure(MeasureProto.DIRECTED_QUANTITY).setMeasureDecimalValue(measureValue)
    ]);

    let position = new Position(positionProto);

    let status: ProtoEnum = position.getFieldValue(FieldProto.POSITION_STATUS);
    expect(status.getEnumValueName()).toBe("EXECUTED");
    expect(status.getEnumValue()).toBe(PositionStatusProto.EXECUTED);
    expect(status.getEnumDescriptor()).toBe(PositionStatusProto);

    position.getMeasures().forEach(measureMapEntry => {
        measureMapEntry.getMeasure().toString();
    });
    expect(position.getMeasureValue(MeasureProto.DIRECTED_QUANTITY)).toBe(1.55);

    return true;
}


async function testJsonSerialization(): Promise<boolean> {
    let security = new SecurityProto().setAssetClass("Test");
    let portfolio = new PortfolioProto().setPortfolioName("Test portfolio");
    let tradeDate = LocalDate.today().toDate();
    let productType = "Test product type";
    let id = new UUID(UUID.random().toBytes());

    const tradeDatePacked = new Any();
    tradeDatePacked.setTypeUrl(`Doesn't matter`);
    tradeDatePacked.setValue(LocalDate.from(tradeDate).toProto().serializeBinary());

    const idPacked = new Any();
    idPacked.setTypeUrl(`Doesn't matter`);
    idPacked.setValue(id.toUUIDProto().serializeBinary());

    let positionProto = new PositionProto();
    positionProto.setFieldsList([
        // new FieldMapEntry().setField(FieldProto.SECURITY).setFieldValuePacked(security),
        new FieldMapEntry().setField(FieldProto.TRADE_DATE).setFieldValuePacked(tradeDatePacked),
        new FieldMapEntry().setField(FieldProto.POSITION_STATUS).setEnumValue(PositionStatusProto.EXECUTED),
        new FieldMapEntry().setField(FieldProto.PRODUCT_TYPE).setStringValue(productType),
        new FieldMapEntry().setField(FieldProto.ID).setFieldValuePacked(idPacked),
    ]);
    let position = new Position(positionProto);

    let position2 = Position.fromJSON(position.toJSON());


    let tradeDatePosition = position2.getFieldValue(FieldProto.TRADE_DATE);
    expect(tradeDate.getFullYear()).toBe(tradeDatePosition.getFullYear());
    expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
    expect(tradeDate.getDay()).toBe(tradeDatePosition.getDay());
    expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());

    return true;
}


async function testSerialization(): Promise<boolean> {
    let { position, tradeDate, security, portfolio, productType, id } = getPosition(false);

    let tradeDatePosition = position.getFieldValue(FieldProto.TRADE_DATE);
    expect(tradeDate.getFullYear()).toBe(tradeDatePosition.getFullYear());
    expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
    expect(tradeDate.getDay()).toBe(tradeDatePosition.getDay());

    let securityPosition: SecurityProto = position.getFieldValue(FieldProto.SECURITY);
    expect(securityPosition.getAssetClass()).toBe(security.getAssetClass());

    let portfolioPosition: PortfolioProto = position.getFieldValue(FieldProto.PORTFOLIO);
    expect(portfolioPosition.getPortfolioName()).toBe(portfolio.getPortfolioName());

    expect(position.getFieldValue(FieldProto.PRODUCT_TYPE)).toBe(productType);

    let positionID = position.getFieldValue(FieldProto.ID);
    expect(positionID.toString()).toBe(id.toString());

    expect(position.getFieldValue(FieldProto.POSITION_STATUS).toString()).toBe("EXECUTED");

    expect(position.getMeasureValue(MeasureProto.DIRECTED_QUANTITY)).toBe(1);

    return true;
}

async function testDeSerializationWithUnknownProto(): Promise<boolean> {
    let { position } = getPosition(true);

    expect(position.getFieldValue(FieldProto.POSITION_STATUS).toString()).toBe("UNKNOWN");
    return true;
}

function getPosition(includeUnknownEnumValue: boolean) {
    let security = new SecurityProto().setAssetClass("Test");
    let portfolio = new PortfolioProto().setPortfolioName("Test portfolio");
    let tradeDate = LocalDate.today().toDate();
    let productType = "Test product type";
    let id = new UUID(UUID.random().toBytes());

    let measure = MeasureProto.DIRECTED_QUANTITY;
    let measureValue = new DecimalValueProto().setArbitraryPrecisionValue("1.0");

    const tradeDatePacked = new Any();
    tradeDatePacked.setTypeUrl(`Doesn't matter`);
    tradeDatePacked.setValue(LocalDate.from(tradeDate).toProto().serializeBinary());

    const idPacked = new Any();
    idPacked.setTypeUrl(`Doesn't matter`);
    idPacked.setValue(id.toUUIDProto().serializeBinary());

    let positionStatus = includeUnknownEnumValue ?
        new FieldMapEntry().setField(FieldProto.POSITION_STATUS).setEnumValue(PositionStatusProto.UNKNOWN) :
        new FieldMapEntry().setField(FieldProto.POSITION_STATUS).setEnumValue(PositionStatusProto.EXECUTED);

    let positionProto = new PositionProto();
    positionProto.setFieldsList([
        new FieldMapEntry().setField(FieldProto.SECURITY).setFieldValuePacked(security),
        new FieldMapEntry().setField(FieldProto.PORTFOLIO).setFieldValuePacked(portfolio),
        new FieldMapEntry().setField(FieldProto.TRADE_DATE).setFieldValuePacked(tradeDatePacked),
        positionStatus,
        new FieldMapEntry().setField(FieldProto.TRANSACTION_TYPE).setEnumValue(TransactionTypeProto.BUY),
        new FieldMapEntry().setField(FieldProto.PRODUCT_TYPE).setStringValue(productType),
        new FieldMapEntry().setField(FieldProto.ID).setFieldValuePacked(idPacked),
    ]);

    positionProto.setMeasuresList([
        new MeasureMapEntry().setMeasure(measure).setMeasureDecimalValue(measureValue)
    ]);

    let position = new Position(positionProto);
    return { position, tradeDate, security, portfolio, productType, id };
}
