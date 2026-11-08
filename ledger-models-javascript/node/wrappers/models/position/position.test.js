"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("../utils/uuid");
const any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
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
const decimal_1 = require("../utils/decimal");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_1 = __importDefault(require("../security/security"));
const BondSecurity_1 = __importDefault(require("../security/BondSecurity"));
const datetime_1 = require("../utils/datetime");
const LinkCache = __importStar(require("../../util/link-cache"));
test('test the enum Serialization', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testEnumSerialization();
    expect(isTrue).toBe(true);
}));
test('test the serialization position wrapper', () => __awaiter(void 0, void 0, void 0, function* () {
    let isTrue = yield testSerialization();
    expect(isTrue).toBe(true);
}));
// LM-447: the EFFECTIVE_DATE entries Java packs, from
// ledger-models-protos/fixtures/position_effective_date_cases.json (shared
// with the Java, Python and Rust tests).
describe('EFFECTIVE_DATE shared fixture', () => {
    const PROTOS = path.resolve(__dirname, '../../../../../ledger-models-protos');
    const cases = JSON.parse(fs.readFileSync(path.join(PROTOS, 'fixtures/position_effective_date_cases.json'), 'utf-8')).cases;
    function positionWith(name) {
        const c = cases.find((x) => x.name === name);
        if (!c)
            throw new Error(`fixture case missing: ${name}`);
        const entry = position_util_pb_1.FieldMapEntry.deserializeBinary(Uint8Array.from(Buffer.from(c.entry_hex, 'hex')));
        return new position_1.Position(new position_pb_1.PositionProto().setFieldsList([entry]));
    }
    test('the Java-packed entry decodes to 2024-03-15', () => {
        const value = positionWith('set').getFieldValue(field_pb_1.FieldProto.EFFECTIVE_DATE);
        expect(value).toBeInstanceOf(Date);
        expect([value.getFullYear(), value.getMonth() + 1, value.getDate()]).toEqual([2024, 3, 15]);
    });
    test('the unset entry is null', () => {
        expect(positionWith('unset').getFieldValue(field_pb_1.FieldProto.EFFECTIVE_DATE)).toBeNull();
    });
});
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
        let measureValue = (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)("1.55"));
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
        expect(position.getMeasureValue(measure_pb_1.MeasureProto.DIRECTED_QUANTITY).toString()).toBe("1.55");
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
        expect(position.getMeasureValue(measure_pb_1.MeasureProto.DIRECTED_QUANTITY).toString()).toBe("1");
        let price = position.getFieldValue(field_pb_1.FieldProto.PRICE);
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(price.getPrice()))).toBe("1.0");
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
        .setPrice((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)("1.0")))
        .setUuid(id.toUUIDProto())
        .setSecurity(security);
    let tenor = new tenor_pb_1.TenorProto()
        .setTenorType(tenor_type_pb_1.TenorTypeProto.TERM)
        .setTermValue("3M");
    ;
    let measure = measure_pb_1.MeasureProto.DIRECTED_QUANTITY;
    let measureValue = (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)("1.0"));
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
// LM-442: a position whose security is stored as a link reads as the subclass
// its resolved product type implies. JS has no Security fetcher (resolveLink is
// cache-only, LM-440), so a pre-warmed LinkCache.SECURITY stands in for the
// stub fetcher. Parity with Java PositionLinkSecurityClassTest.
describe('security link resolves before class dispatch', () => {
    afterEach(() => {
        LinkCache.SECURITY.clear();
    });
    test('treasury note link with a warm cache returns a BondSecurity', () => {
        const asOfProto = new local_timestamp_pb_1.LocalTimestampProto()
            .setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(1793908800))
            .setTimeZone('America/New_York');
        const asOf = new datetime_1.ZonedDateTime(asOfProto.clone());
        const id = uuid_1.UUID.random();
        const note = new security_pb_1.SecurityProto()
            .setUuid(id.toUUIDProto())
            .setAsOf(asOfProto.clone())
            .setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE)
            .setIssuerName('US Government')
            .setBondDetails(new security_pb_1.BondDetailsProto()
            .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2024).setMonth(1).setDay(15))
            .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2031).setMonth(5).setDay(15)));
        LinkCache.SECURITY.put(id.toString(), note, asOf);
        const linkPacked = new any_pb_1.Any();
        linkPacked.pack(security_1.default.linkOf(id, asOf).serializeBinary(), 'fintekkers.models.security.SecurityProto');
        const position = new position_1.Position(new position_pb_1.PositionProto().setFieldsList([
            new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.SECURITY).setFieldValuePacked(linkPacked),
        ]));
        const security = position.getFieldValue(field_pb_1.FieldProto.SECURITY);
        expect(security).toBeInstanceOf(BondSecurity_1.default);
        const maturity = security.getField(field_pb_1.FieldProto.MATURITY_DATE);
        expect([maturity.getFullYear(), maturity.getMonth() + 1, maturity.getDate()]).toEqual([2031, 5, 15]);
    });
});
//# sourceMappingURL=position.test.js.map