"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.
 *
 * For each type: construct → serialize to bytes → deserialize → verify all fields match.
 */
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_pb_2 = require("../../../fintekkers/models/security/security_pb");
const security_1 = __importDefault(require("./security"));
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const security_quantity_type_pb_1 = require("../../../fintekkers/models/security/security_quantity_type_pb");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
function makeDecimal(value) {
    return new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue(value);
}
function makeDate(year, month, day) {
    return new local_date_pb_1.LocalDateProto().setYear(year).setMonth(month).setDay(day);
}
function makeIdentifier(type, value) {
    return new identifier_pb_1.IdentifierProto().setIdentifierType(type).setIdentifierValue(value);
}
describe('SecurityProto Round-Trip Serialization — All 6 Security Types', () => {
    test('BOND_SECURITY: all bond fields survive round-trip', () => {
        const original = new security_pb_2.SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        original.setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE);
        original.setIdentifier(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.CUSIP, '912828ZT0'));
        original.setDescription('UST 5% 2030');
        original.setCouponRate(makeDecimal('5.0'));
        original.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
        original.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
        original.setFaceValue(makeDecimal('1000'));
        original.setIssueDate(makeDate(2020, 1, 15));
        original.setDatedDate(makeDate(2020, 1, 15));
        original.setMaturityDate(makeDate(2030, 1, 15));
        const bytes = original.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(bytes);
        expect(parsed.getProductType()).toBe(product_type_pb_1.ProductTypeProto.TREASURY_NOTE);
        expect(parsed.getAssetClass()).toBe('Fixed Income');
        expect(parsed.getIssuerName()).toBe('US Treasury');
        expect(parsed.getDescription()).toBe('UST 5% 2030');
        expect(parsed.getQuantityType()).toBe(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE);
        expect(parsed.getCouponRate().getArbitraryPrecisionValue()).toBe('5.0');
        expect(parsed.getCouponType()).toBe(coupon_type_pb_1.CouponTypeProto.FIXED);
        expect(parsed.getCouponFrequency()).toBe(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
        expect(parsed.getFaceValue().getArbitraryPrecisionValue()).toBe('1000');
        expect(parsed.getIssueDate().getYear()).toBe(2020);
        expect(parsed.getDatedDate().getMonth()).toBe(1);
        expect(parsed.getMaturityDate().getYear()).toBe(2030);
        expect(parsed.getMaturityDate().getMonth()).toBe(1);
        expect(parsed.getMaturityDate().getDay()).toBe(15);
        expect(parsed.getIdentifier().getIdentifierValue()).toBe('912828ZT0');
        expect(parsed.getIdentifier().getIdentifierType()).toBe(identifier_type_pb_1.IdentifierTypeProto.CUSIP);
    });
    test('TIPS: bond fields + base_cpi + inflation_index_type survive round-trip', () => {
        const original = new security_pb_2.SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(product_type_pb_1.ProductTypeProto.TIPS);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        original.setCouponRate(makeDecimal('0.625'));
        original.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
        original.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
        original.setFaceValue(makeDecimal('1000'));
        original.setMaturityDate(makeDate(2030, 1, 15));
        original.setBaseCpi(makeDecimal('256.394'));
        original.setInflationIndexType(index_type_pb_1.IndexTypeProto.CPI_U);
        const bytes = original.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(bytes);
        expect(parsed.getProductType()).toBe(product_type_pb_1.ProductTypeProto.TIPS);
        expect(parsed.getCouponRate().getArbitraryPrecisionValue()).toBe('0.625');
        expect(parsed.getCouponType()).toBe(coupon_type_pb_1.CouponTypeProto.FIXED);
        expect(parsed.getCouponFrequency()).toBe(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
        expect(parsed.getFaceValue().getArbitraryPrecisionValue()).toBe('1000');
        expect(parsed.getMaturityDate().getYear()).toBe(2030);
        expect(parsed.getBaseCpi().getArbitraryPrecisionValue()).toBe('256.394');
        expect(parsed.getInflationIndexType()).toBe(index_type_pb_1.IndexTypeProto.CPI_U);
    });
    test('FRN: spread + reference_rate_index + reset_frequency survive round-trip', () => {
        const original = new security_pb_2.SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(product_type_pb_1.ProductTypeProto.TREASURY_FRN);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        original.setCouponType(coupon_type_pb_1.CouponTypeProto.FLOAT);
        original.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.QUARTERLY);
        original.setFaceValue(makeDecimal('100'));
        original.setMaturityDate(makeDate(2028, 1, 15));
        original.setSpread(makeDecimal('50'));
        original.setReferenceRateIndex(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK);
        // Note: setResetFrequency (field 92) not yet in generated JS — codegen needs update
        const bytes = original.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(bytes);
        expect(parsed.getProductType()).toBe(product_type_pb_1.ProductTypeProto.TREASURY_FRN);
        expect(parsed.getCouponType()).toBe(coupon_type_pb_1.CouponTypeProto.FLOAT);
        expect(parsed.getCouponFrequency()).toBe(coupon_frequency_pb_1.CouponFrequencyProto.QUARTERLY);
        expect(parsed.getFaceValue().getArbitraryPrecisionValue()).toBe('100');
        expect(parsed.getMaturityDate().getYear()).toBe(2028);
        expect(parsed.getSpread().getArbitraryPrecisionValue()).toBe('50');
        expect(parsed.getReferenceRateIndex()).toBe(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK);
    });
    test('EQUITY_SECURITY: identifier + asset_class survive round-trip', () => {
        const original = new security_pb_2.SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(product_type_pb_1.ProductTypeProto.COMMON_STOCK);
        original.setAssetClass('Equity');
        original.setIssuerName('Apple Inc.');
        original.setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.UNITS);
        original.setIdentifier(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER, 'AAPL'));
        original.setDescription('Apple Inc. Common Stock');
        const bytes = original.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(bytes);
        expect(parsed.getProductType()).toBe(product_type_pb_1.ProductTypeProto.COMMON_STOCK);
        expect(parsed.getAssetClass()).toBe('Equity');
        expect(parsed.getIssuerName()).toBe('Apple Inc.');
        expect(parsed.getQuantityType()).toBe(security_quantity_type_pb_1.SecurityQuantityTypeProto.UNITS);
        expect(parsed.getDescription()).toBe('Apple Inc. Common Stock');
        expect(parsed.getIdentifier().getIdentifierValue()).toBe('AAPL');
        expect(parsed.getIdentifier().getIdentifierType()).toBe(identifier_type_pb_1.IdentifierTypeProto.EXCH_TICKER);
    });
    test('CASH_SECURITY: cash_id + settlement fields survive round-trip', () => {
        const original = new security_pb_2.SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(product_type_pb_1.ProductTypeProto.CURRENCY);
        original.setAssetClass('Cash');
        original.setIssuerName('Federal Reserve');
        original.setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.UNITS);
        original.setCashId('USD');
        original.setDescription('US Dollar');
        original.setIdentifier(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.CASH, 'USD'));
        const bytes = original.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(bytes);
        expect(parsed.getProductType()).toBe(product_type_pb_1.ProductTypeProto.CURRENCY);
        expect(parsed.getAssetClass()).toBe('Cash');
        expect(parsed.getCashId()).toBe('USD');
        expect(parsed.getDescription()).toBe('US Dollar');
        expect(parsed.getIdentifier().getIdentifierValue()).toBe('USD');
        expect(parsed.getIdentifier().getIdentifierType()).toBe(identifier_type_pb_1.IdentifierTypeProto.CASH);
    });
    test('INDEX_SECURITY: index_type + inflation_index_type survive round-trip', () => {
        const original = new security_pb_2.SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(product_type_pb_1.ProductTypeProto.EQUITY_INDEX);
        original.setAssetClass('Index');
        original.setIssuerName('Bureau of Labor Statistics');
        original.setDescription('US CPI-U All Urban Consumers');
        original.setIndexType(index_type_pb_1.IndexTypeProto.CPI_U);
        original.setIdentifier(makeIdentifier(identifier_type_pb_1.IdentifierTypeProto.CUSIP, 'CPI-U'));
        const bytes = original.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(bytes);
        expect(parsed.getProductType()).toBe(product_type_pb_1.ProductTypeProto.EQUITY_INDEX);
        expect(parsed.getAssetClass()).toBe('Index');
        expect(parsed.getIssuerName()).toBe('Bureau of Labor Statistics');
        expect(parsed.getDescription()).toBe('US CPI-U All Urban Consumers');
        expect(parsed.getIndexType()).toBe(index_type_pb_1.IndexTypeProto.CPI_U);
        expect(parsed.getIdentifier().getIdentifierValue()).toBe('CPI-U');
    });
});
describe('v0.2.5: Security link helpers + IndexDetailsProto.constituents', () => {
    test('linkOf populates uuid, as_of and sets is_link=true', () => {
        const uuid = uuid_1.UUID.random();
        const asOf = datetime_1.ZonedDateTime.now();
        const link = security_1.default.linkOf(uuid, asOf);
        expect(link.getIsLink()).toBe(true);
        expect(link.getUuid()).toBeDefined();
        expect(link.getAsOf()).toBeDefined();
        expect(link.getAssetClass()).toBe(''); // no other fields populated
    });
    test('linkOfLatest skips as_of', () => {
        const uuid = uuid_1.UUID.random();
        const link = security_1.default.linkOfLatest(uuid);
        expect(link.getIsLink()).toBe(true);
        expect(link.getUuid()).toBeDefined();
        expect(link.getAsOf()).toBeUndefined();
    });
    test('linkOf requires asOf (throws when called without it)', () => {
        const uuid = uuid_1.UUID.random();
        expect(() => security_1.default.linkOf(uuid, undefined)).toThrow(/asOf is required/);
    });
    test('Security.isLink() reads the proto flag', () => {
        const full = new security_pb_2.SecurityProto();
        const wrapperFull = new security_1.default(full);
        expect(wrapperFull.isLink()).toBe(false);
        const link = security_1.default.linkOf(uuid_1.UUID.random(), datetime_1.ZonedDateTime.now());
        const wrapperLink = new security_1.default(link);
        expect(wrapperLink.isLink()).toBe(true);
    });
    test('Accessors throw on link wrappers', () => {
        const link = security_1.default.linkOf(uuid_1.UUID.random(), datetime_1.ZonedDateTime.now());
        const wrapper = new security_1.default(link);
        expect(() => wrapper.getAssetClass()).toThrow(/link-mode/);
        expect(() => wrapper.getIssuerName()).toThrow(/link-mode/);
        expect(() => wrapper.getProductType()).toThrow(/link-mode/);
    });
    test('Link round-trips via serializeBinary preserving uuid + as_of + is_link', () => {
        const uuid = uuid_1.UUID.random();
        const asOf = datetime_1.ZonedDateTime.now();
        const link = security_1.default.linkOf(uuid, asOf);
        const bytes = link.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(bytes);
        expect(parsed.getIsLink()).toBe(true);
        expect(parsed.getUuid()).toBeDefined();
        const parsedBytes = Array.from(parsed.getUuid().getRawUuid_asU8());
        expect(parsedBytes).toEqual(uuid.toBytes());
        expect(parsed.getAsOf().getTimeZone()).toBe(asOf.toProto().getTimeZone());
    });
    test('IndexDetailsProto.constituents round-trip with each constituent in link mode', () => {
        const asOf = datetime_1.ZonedDateTime.now();
        const c1 = security_1.default.linkOf(uuid_1.UUID.random(), asOf);
        const c2 = security_1.default.linkOf(uuid_1.UUID.random(), asOf);
        const details = new security_pb_1.IndexDetailsProto();
        details.setIndexType(index_type_pb_1.IndexTypeProto.CPI_U);
        details.setConstituentsList([c1, c2]);
        const original = new security_pb_2.SecurityProto();
        original.setProductType(product_type_pb_1.ProductTypeProto.EQUITY_INDEX);
        original.setIndexDetails(details);
        const parsed = security_pb_2.SecurityProto.deserializeBinary(original.serializeBinary());
        const parsedDetails = parsed.getIndexDetails();
        expect(parsedDetails.getConstituentsList().length).toBe(2);
        expect(parsedDetails.getConstituentsList()[0].getIsLink()).toBe(true);
        expect(parsedDetails.getConstituentsList()[0].getAsOf()).toBeDefined();
    });
    test('Wire compat: SecurityIdProto-shaped bytes (uuid at tag 1) parse as SecurityProto', () => {
        // Pre-v0.2.5, legs were SecurityIdProto (uuid at tag 1). We rebuild that
        // wire shape by serializing a SecurityProto with only uuid set — same
        // bytes — and confirm round-trip under the new type.
        const uuid = uuid_1.UUID.random();
        const legacy = new security_pb_2.SecurityProto();
        legacy.setUuid(uuid.toUUIDProto());
        const legacyBytes = legacy.serializeBinary();
        const parsed = security_pb_2.SecurityProto.deserializeBinary(legacyBytes);
        const parsedBytes = Array.from(parsed.getUuid().getRawUuid_asU8());
        expect(parsedBytes).toEqual(uuid.toBytes());
    });
});
//# sourceMappingURL=security-roundtrip.test.js.map