"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("../utils/uuid");
const any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const position_pb_1 = require("../../../fintekkers/models/position/position_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
const position_1 = require("./position");
const date_1 = require("../utils/date");
const position_status_pb_1 = require("../../../fintekkers/models/position/position_status_pb");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const tenor_pb_1 = require("../../../fintekkers/models/security/tenor_pb");
const tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
const term_1 = require("../security/term");
test('test the enum Serialization', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testEnumSerialization();
    expect(isTrue).toBe(true);
}));
test('test the serialization position wrapper', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testSerialization();
    expect(isTrue).toBe(true);
}));
test('test JSON Serialization', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testJsonSerialization();
    expect(isTrue).toBe(true);
}));
test('test deserialization of an unknown enum type', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testDeSerializationWithUnknownProto();
    expect(isTrue).toBe(true);
}));
function testEnumSerialization() {
    return __awaiter(this, void 0, void 0, function* () {
        let positionProto = new position_pb_1.PositionProto();
        positionProto.setFieldsList([
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.EXECUTED)
        ]);
        let measureValue = new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue("1.55");
        positionProto.setMeasuresList([
            new position_util_pb_1.MeasureMapEntry().setMeasure(measure_pb_1.MeasureProto.DIRECTED_QUANTITY).setMeasureDecimalValue(measureValue)
        ]);
        let position = new position_1.Position(positionProto);
        let status = position.getFieldValue(field_pb_1.FieldProto.POSITION_STATUS);
        expect(status.getEnumValueName()).toBe("EXECUTED");
        expect(status.getEnumValue()).toBe(position_status_pb_1.PositionStatusProto.EXECUTED);
        expect(status.getEnumDescriptor()).toBe(position_status_pb_1.PositionStatusProto);
        position.getMeasures().forEach(measureMapEntry => {
            measureMapEntry.getMeasure().toString();
        });
        expect(position.getMeasureValue(measure_pb_1.MeasureProto.DIRECTED_QUANTITY)).toBe(1.55);
        return true;
    });
}
function testJsonSerialization() {
    return __awaiter(this, void 0, void 0, function* () {
        let tradeDate = date_1.LocalDate.today().toDate();
        let productType = "Test product type";
        let id = new uuid_1.UUID(uuid_1.UUID.random().toBytes());
        const tradeDatePacked = new any_pb_1.Any();
        tradeDatePacked.setTypeUrl(`DUMMYTYPE_DATE`);
        tradeDatePacked.setValue(date_1.LocalDate.from(tradeDate).toProto().serializeBinary());
        const idPacked = new any_pb_1.Any();
        idPacked.setTypeUrl(`DUMMYTYPE_ID`);
        idPacked.setValue(id.toUUIDProto().serializeBinary());
        let positionProto = new position_pb_1.PositionProto();
        positionProto.setFieldsList([
            // new FieldMapEntry().setField(FieldProto.SECURITY).setFieldValuePacked(security),
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRADE_DATE).setFieldValuePacked(tradeDatePacked),
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.EXECUTED),
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PRODUCT_TYPE).setStringValue(productType),
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.SECURITY_DESCRIPTION).setStringValue("Dummy"),
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.ID).setFieldValuePacked(idPacked),
        ]);
        let position = new position_1.Position(positionProto);
        let position2 = position_1.Position.fromJSON(position.toJSON());
        let tradeDatePosition = position2.getFieldValue(field_pb_1.FieldProto.TRADE_DATE);
        expect(tradeDate.getFullYear()).toBe(tradeDatePosition.getFullYear());
        expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
        expect(tradeDate.getDay()).toBe(tradeDatePosition.getDay());
        expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
        expect(position2.getFieldValue(field_pb_1.FieldProto.SECURITY_DESCRIPTION)).toBe("Dummy");
        return true;
    });
}
test('test testTenorSerialization', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testTenorSerialization();
    expect(isTrue).toBe(true);
}));
test('test adjusted tenor serialization returns Tenor wrapper', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testAdjustedTenorSerialization();
    expect(isTrue).toBe(true);
}));
function testTenorSerialization() {
    return __awaiter(this, void 0, void 0, function* () {
        let { position, tenor } = getPosition(false);
        console.log("tenor", tenor);
        let tenorPosition = position.getFieldValue(field_pb_1.FieldProto.TENOR);
        // tenorPosition is now a Tenor wrapper, not TenorProto
        expect(tenorPosition.getTenorDescription()).toBe(tenor.getTermValue());
        let tenorFieldDisplay = position.getFieldDisplay(new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TENOR));
        // The field display should be the Tenor wrapper's toString(), which returns something like "TERM: 3M"
        expect(tenorFieldDisplay).toBe(tenorPosition.toString());
        return true;
    });
}
function testAdjustedTenorSerialization() {
    return __awaiter(this, void 0, void 0, function* () {
        const positionProto = new position_pb_1.PositionProto();
        positionProto.setFieldsList([
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.ADJUSTED_TENOR).setStringValue("3M"),
        ]);
        const position = new position_1.Position(positionProto);
        const adjustedTenor = position.getFieldValue(field_pb_1.FieldProto.ADJUSTED_TENOR);
        expect(adjustedTenor instanceof term_1.Tenor).toBe(true);
        expect(adjustedTenor.getTenorDescription()).toBe("3M");
        const display = position.getFieldDisplay(new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.ADJUSTED_TENOR));
        expect(display).toBe(adjustedTenor.toString());
        return true;
    });
}
function testSerialization() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let { position, tradeDate, security, portfolio, productType, id } = getPosition(false);
        let tradeDatePosition = position.getFieldValue(field_pb_1.FieldProto.TRADE_DATE);
        expect(tradeDate.getFullYear()).toBe(tradeDatePosition.getFullYear());
        expect(tradeDate.getMonth()).toBe(tradeDatePosition.getMonth());
        expect(tradeDate.getDate()).toBe(tradeDatePosition.getDate());
        let tradeDateFieldDisplay = position.getFieldDisplay(new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRADE_DATE));
        const year = tradeDate.getFullYear();
        const month = String(tradeDate.getMonth() + 1).padStart(2, '0');
        const day = String(tradeDate.getDate()).padStart(2, '0');
        expect(tradeDateFieldDisplay).toBe(`${year}-${month}-${day}`);
        let securityPosition = position.getFieldValue(field_pb_1.FieldProto.SECURITY);
        expect(securityPosition.getAssetClass()).toBe(security.getAssetClass());
        let portfolioPosition = position.getFieldValue(field_pb_1.FieldProto.PORTFOLIO);
        expect(portfolioPosition.getPortfolioName()).toBe(portfolio.getPortfolioName());
        expect(position.getFieldValue(field_pb_1.FieldProto.PRODUCT_TYPE)).toBe(productType);
        let positionID = position.getFieldValue(field_pb_1.FieldProto.ID);
        expect(positionID.toString()).toBe(id.toString());
        expect(position.getFieldValue(field_pb_1.FieldProto.POSITION_STATUS).toString()).toBe("EXECUTED");
        expect(position.getMeasureValue(measure_pb_1.MeasureProto.DIRECTED_QUANTITY)).toBe(1);
        let price = position.getFieldValue(field_pb_1.FieldProto.PRICE);
        expect((_a = price.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()).toBe("1.0");
        let tenor = position.getFieldValue(field_pb_1.FieldProto.TENOR);
        expect(tenor.getTenorDescription()).toBe("3M");
        return true;
    });
}
function testDeSerializationWithUnknownProto() {
    return __awaiter(this, void 0, void 0, function* () {
        let { position } = getPosition(true);
        expect(position.getFieldValue(field_pb_1.FieldProto.POSITION_STATUS).toString()).toBe("UNKNOWN");
        return true;
    });
}
function getPosition(includeUnknownEnumValue) {
    let security = new security_pb_1.SecurityProto().setAssetClass("Test");
    let portfolio = new portfolio_pb_1.PortfolioProto().setPortfolioName("Test portfolio");
    let tradeDate = date_1.LocalDate.today().toDate();
    let productType = "Test product type";
    let id = new uuid_1.UUID(uuid_1.UUID.random().toBytes());
    let price = new price_pb_1.PriceProto()
        .setPrice(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue("1.0"))
        .setUuid(id.toUUIDProto())
        .setSecurity(security);
    let tenor = new tenor_pb_1.TenorProto()
        .setTenorType(tenor_type_pb_1.TenorTypeProto.TERM)
        .setTermValue("3M");
    ;
    let measure = measure_pb_1.MeasureProto.DIRECTED_QUANTITY;
    let measureValue = new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue("1.0");
    const tradeDatePacked = new any_pb_1.Any();
    tradeDatePacked.setTypeUrl(`DUMMYTYPE_DATE`);
    tradeDatePacked.setValue(date_1.LocalDate.from(tradeDate).toProto().serializeBinary());
    const idPacked = new any_pb_1.Any();
    idPacked.setTypeUrl(`DUMMYTYPE_ID`);
    idPacked.setValue(id.toUUIDProto().serializeBinary());
    const pricePacked = new any_pb_1.Any();
    pricePacked.setTypeUrl(`DUMMYTYPE_PRICE`);
    pricePacked.setValue(price.serializeBinary());
    const tenorPacked = new any_pb_1.Any();
    tenorPacked.setTypeUrl(`DUMMYTYPE_TENOR`);
    tenorPacked.setValue(tenor.serializeBinary());
    const securityPacked = new any_pb_1.Any();
    securityPacked.setTypeUrl(`DUMMYTYPE_SECURITY`);
    securityPacked.setValue(security.serializeBinary());
    const portfolioPacked = new any_pb_1.Any();
    portfolioPacked.setTypeUrl(`DUMMYTYPE_PORTFOLIO`);
    portfolioPacked.setValue(portfolio.serializeBinary());
    let positionStatus = includeUnknownEnumValue ?
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.UNKNOWN) :
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.POSITION_STATUS).setEnumValue(position_status_pb_1.PositionStatusProto.EXECUTED);
    let positionProto = new position_pb_1.PositionProto();
    positionProto.setFieldsList([
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.SECURITY).setFieldValuePacked(securityPacked),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PORTFOLIO).setFieldValuePacked(portfolioPacked),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRADE_DATE).setFieldValuePacked(tradeDatePacked),
        positionStatus,
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TRANSACTION_TYPE).setEnumValue(transaction_type_pb_1.TransactionTypeProto.BUY),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.TENOR).setFieldValuePacked(tenorPacked),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PRODUCT_TYPE).setStringValue(productType),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.ID).setFieldValuePacked(idPacked),
        new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.PRICE).setFieldValuePacked(pricePacked)
    ]);
    positionProto.setMeasuresList([
        new position_util_pb_1.MeasureMapEntry().setMeasure(measure).setMeasureDecimalValue(measureValue)
    ]);
    let position = new position_1.Position(positionProto);
    return { position, tradeDate, security, portfolio, productType, id, tenor };
}
//# sourceMappingURL=position.test.js.map