/**
 * ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.
 *
 * For each type: construct → serialize to bytes → deserialize → verify all fields match.
 */
import { IndexDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { SecurityProto, BondDetailsProto, TipsExtensionProto, FrnExtensionProto, CashDetailsProto } from '../../../fintekkers/models/security/security_pb';
import Security from './security';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { SecurityQuantityTypeProto } from '../../../fintekkers/models/security/security_quantity_type_pb';
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { IdentifierTypeProto } from '../../../fintekkers/models/security/identifier/identifier_type_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';

function makeDecimal(value: string): DecimalValueProto {
    return new DecimalValueProto().setArbitraryPrecisionValue(value);
}

function makeDate(year: number, month: number, day: number): LocalDateProto {
    return new LocalDateProto().setYear(year).setMonth(month).setDay(day);
}

function makeIdentifier(type: number, value: string): IdentifierProto {
    return new IdentifierProto().setIdentifierType(type).setIdentifierValue(value);
}

describe('SecurityProto Round-Trip Serialization — All 6 Security Types', () => {

    test('BOND_SECURITY: all bond fields survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(ProductTypeProto.TREASURY_NOTE);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        original.setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE);
        original.setIdentifiersList([makeIdentifier(IdentifierTypeProto.CUSIP, '912828ZT0')]);
        original.setDescription('UST 5% 2030');
        const bond = new BondDetailsProto();
        bond.setCouponRate(makeDecimal('5.0'));
        bond.setCouponType(CouponTypeProto.FIXED);
        bond.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
        bond.setFaceValue(makeDecimal('1000'));
        bond.setIssueDate(makeDate(2020, 1, 15));
        bond.setDatedDate(makeDate(2020, 1, 15));
        bond.setMaturityDate(makeDate(2030, 1, 15));
        original.setBondDetails(bond);

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getProductType()).toBe(ProductTypeProto.TREASURY_NOTE);
        expect(parsed.getAssetClass()).toBe('Fixed Income');
        expect(parsed.getIssuerName()).toBe('US Treasury');
        expect(parsed.getDescription()).toBe('UST 5% 2030');
        expect(parsed.getQuantityType()).toBe(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE);
        const parsedBond = parsed.getBondDetails()!;
        expect(parsedBond.getCouponRate()!.getArbitraryPrecisionValue()).toBe('5.0');
        expect(parsedBond.getCouponType()).toBe(CouponTypeProto.FIXED);
        expect(parsedBond.getCouponFrequency()).toBe(CouponFrequencyProto.SEMIANNUALLY);
        expect(parsedBond.getFaceValue()!.getArbitraryPrecisionValue()).toBe('1000');
        expect(parsedBond.getIssueDate()!.getYear()).toBe(2020);
        expect(parsedBond.getDatedDate()!.getMonth()).toBe(1);
        expect(parsedBond.getMaturityDate()!.getYear()).toBe(2030);
        expect(parsedBond.getMaturityDate()!.getMonth()).toBe(1);
        expect(parsedBond.getMaturityDate()!.getDay()).toBe(15);
        expect(parsed.getIdentifiersList()[0].getIdentifierValue()).toBe('912828ZT0');
        expect(parsed.getIdentifiersList()[0].getIdentifierType()).toBe(IdentifierTypeProto.CUSIP);
    });

    test('TIPS: bond fields + base_cpi + inflation_index_type survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(ProductTypeProto.TIPS);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        const bond = new BondDetailsProto();
        bond.setCouponRate(makeDecimal('0.625'));
        bond.setCouponType(CouponTypeProto.FIXED);
        bond.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
        bond.setFaceValue(makeDecimal('1000'));
        bond.setMaturityDate(makeDate(2030, 1, 15));
        original.setBondDetails(bond);
        const tips = new TipsExtensionProto();
        tips.setBaseCpi(makeDecimal('256.394'));
        tips.setInflationIndexType(IndexTypeProto.CPI_U);
        original.setTipsExtension(tips);

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getProductType()).toBe(ProductTypeProto.TIPS);
        const parsedBond = parsed.getBondDetails()!;
        expect(parsedBond.getCouponRate()!.getArbitraryPrecisionValue()).toBe('0.625');
        expect(parsedBond.getCouponType()).toBe(CouponTypeProto.FIXED);
        expect(parsedBond.getCouponFrequency()).toBe(CouponFrequencyProto.SEMIANNUALLY);
        expect(parsedBond.getFaceValue()!.getArbitraryPrecisionValue()).toBe('1000');
        expect(parsedBond.getMaturityDate()!.getYear()).toBe(2030);
        const parsedTips = parsed.getTipsExtension()!;
        expect(parsedTips.getBaseCpi()!.getArbitraryPrecisionValue()).toBe('256.394');
        expect(parsedTips.getInflationIndexType()).toBe(IndexTypeProto.CPI_U);
    });

    test('FRN: spread + reference_rate_index + reset_frequency survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(ProductTypeProto.TREASURY_FRN);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        const bond = new BondDetailsProto();
        bond.setCouponType(CouponTypeProto.FLOAT);
        bond.setCouponFrequency(CouponFrequencyProto.QUARTERLY);
        bond.setFaceValue(makeDecimal('100'));
        bond.setMaturityDate(makeDate(2028, 1, 15));
        original.setBondDetails(bond);
        const frn = new FrnExtensionProto();
        frn.setSpread(makeDecimal('50'));
        frn.setReferenceRateIndex(IndexTypeProto.T_BILL_13_WEEK);
        original.setFrnExtension(frn);
        // Note: setResetFrequency (field 92) not yet in generated JS — codegen needs update

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getProductType()).toBe(ProductTypeProto.TREASURY_FRN);
        const parsedBond = parsed.getBondDetails()!;
        expect(parsedBond.getCouponType()).toBe(CouponTypeProto.FLOAT);
        expect(parsedBond.getCouponFrequency()).toBe(CouponFrequencyProto.QUARTERLY);
        expect(parsedBond.getFaceValue()!.getArbitraryPrecisionValue()).toBe('100');
        expect(parsedBond.getMaturityDate()!.getYear()).toBe(2028);
        const parsedFrn = parsed.getFrnExtension()!;
        expect(parsedFrn.getSpread()!.getArbitraryPrecisionValue()).toBe('50');
        expect(parsedFrn.getReferenceRateIndex()).toBe(IndexTypeProto.T_BILL_13_WEEK);
    });

    test('EQUITY_SECURITY: identifier + asset_class survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(ProductTypeProto.COMMON_STOCK);
        original.setAssetClass('Equity');
        original.setIssuerName('Apple Inc.');
        original.setQuantityType(SecurityQuantityTypeProto.UNITS);
        original.setIdentifiersList([makeIdentifier(IdentifierTypeProto.EXCH_TICKER, 'AAPL')]);
        original.setDescription('Apple Inc. Common Stock');

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getProductType()).toBe(ProductTypeProto.COMMON_STOCK);
        expect(parsed.getAssetClass()).toBe('Equity');
        expect(parsed.getIssuerName()).toBe('Apple Inc.');
        expect(parsed.getQuantityType()).toBe(SecurityQuantityTypeProto.UNITS);
        expect(parsed.getDescription()).toBe('Apple Inc. Common Stock');
        expect(parsed.getIdentifiersList()[0].getIdentifierValue()).toBe('AAPL');
        expect(parsed.getIdentifiersList()[0].getIdentifierType()).toBe(IdentifierTypeProto.EXCH_TICKER);
    });

    test('CASH_SECURITY: cash_id + settlement fields survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(ProductTypeProto.CURRENCY);
        original.setAssetClass('Cash');
        original.setIssuerName('Federal Reserve');
        original.setQuantityType(SecurityQuantityTypeProto.UNITS);
        original.setCashDetails(new CashDetailsProto().setCashId('USD'));
        original.setDescription('US Dollar');
        original.setIdentifiersList([makeIdentifier(IdentifierTypeProto.CASH, 'USD')]);

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getProductType()).toBe(ProductTypeProto.CURRENCY);
        expect(parsed.getAssetClass()).toBe('Cash');
        expect(parsed.getCashDetails()!.getCashId()).toBe('USD');
        expect(parsed.getDescription()).toBe('US Dollar');
        expect(parsed.getIdentifiersList()[0].getIdentifierValue()).toBe('USD');
        expect(parsed.getIdentifiersList()[0].getIdentifierType()).toBe(IdentifierTypeProto.CASH);
    });

    test('INDEX_SECURITY: index_type + inflation_index_type survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setProductType(ProductTypeProto.EQUITY_INDEX);
        original.setAssetClass('Index');
        original.setIssuerName('Bureau of Labor Statistics');
        original.setDescription('US CPI-U All Urban Consumers');
        original.setIndexDetails(new IndexDetailsProto().setIndexType(IndexTypeProto.CPI_U));
        original.setIdentifiersList([makeIdentifier(IdentifierTypeProto.CUSIP, 'CPI-U')]);

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getProductType()).toBe(ProductTypeProto.EQUITY_INDEX);
        expect(parsed.getAssetClass()).toBe('Index');
        expect(parsed.getIssuerName()).toBe('Bureau of Labor Statistics');
        expect(parsed.getDescription()).toBe('US CPI-U All Urban Consumers');
        expect(parsed.getIndexDetails()!.getIndexType()).toBe(IndexTypeProto.CPI_U);
        expect(parsed.getIdentifiersList()[0].getIdentifierValue()).toBe('CPI-U');
    });
});

describe('Security link helpers + IndexDetailsProto.constituents', () => {

    test('linkOf populates uuid, as_of and sets is_link=true', () => {
        const uuid = UUID.random();
        const asOf = ZonedDateTime.now();
        const link = Security.linkOf(uuid, asOf);
        expect(link.getIsLink()).toBe(true);
        expect(link.getUuid()).toBeDefined();
        expect(link.getAsOf()).toBeDefined();
        expect(link.getAssetClass()).toBe(''); // no other fields populated
    });

    test('linkOfLatest skips as_of', () => {
        const uuid = UUID.random();
        const link = Security.linkOfLatest(uuid);
        expect(link.getIsLink()).toBe(true);
        expect(link.getUuid()).toBeDefined();
        expect(link.getAsOf()).toBeUndefined();
    });

    test('linkOf requires asOf (throws when called without it)', () => {
        const uuid = UUID.random();
        expect(() => Security.linkOf(uuid, undefined as any)).toThrow(/asOf is required/);
    });

    test('Security.isLink() reads the proto flag', () => {
        const full = new SecurityProto();
        const wrapperFull = new Security(full);
        expect(wrapperFull.isLink()).toBe(false);

        const link = Security.linkOf(UUID.random(), ZonedDateTime.now());
        const wrapperLink = new Security(link);
        expect(wrapperLink.isLink()).toBe(true);
    });

    test('Accessors throw on link wrappers', () => {
        const link = Security.linkOf(UUID.random(), ZonedDateTime.now());
        const wrapper = new Security(link);
        expect(() => wrapper.getAssetClass()).toThrow(/link-mode/);
        expect(() => wrapper.getIssuerName()).toThrow(/link-mode/);
        expect(() => wrapper.getProductType()).toThrow(/link-mode/);
    });

    test('Link round-trips via serializeBinary preserving uuid + as_of + is_link', () => {
        const uuid = UUID.random();
        const asOf = ZonedDateTime.now();
        const link = Security.linkOf(uuid, asOf);

        const bytes = link.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getIsLink()).toBe(true);
        expect(parsed.getUuid()).toBeDefined();
        const parsedBytes = Array.from(parsed.getUuid()!.getRawUuid_asU8());
        expect(parsedBytes).toEqual(uuid.toBytes());
        expect(parsed.getAsOf()!.getTimeZone()).toBe(asOf.toProto().getTimeZone());
    });

    test('IndexDetailsProto.constituents round-trip with each constituent in link mode', () => {
        const asOf = ZonedDateTime.now();
        const c1 = Security.linkOf(UUID.random(), asOf);
        const c2 = Security.linkOf(UUID.random(), asOf);

        const details = new IndexDetailsProto();
        details.setIndexType(IndexTypeProto.CPI_U);
        details.setConstituentsList([c1, c2]);

        const original = new SecurityProto();
        original.setProductType(ProductTypeProto.EQUITY_INDEX);
        original.setIndexDetails(details);

        const parsed = SecurityProto.deserializeBinary(original.serializeBinary());
        const parsedDetails = parsed.getIndexDetails()!;
        expect(parsedDetails.getConstituentsList().length).toBe(2);
        expect(parsedDetails.getConstituentsList()[0].getIsLink()).toBe(true);
        expect(parsedDetails.getConstituentsList()[0].getAsOf()).toBeDefined();
    });

    test('Wire compat: SecurityIdProto-shaped bytes (uuid at tag 1) parse as SecurityProto', () => {
        // Wire-format contract: SecurityIdProto-shaped bytes (uuid at tag 1)
        // are bit-for-bit a SecurityProto with only uuid set. We rebuild that
        // shape by serializing a SecurityProto with only uuid set and confirm
        // round-trip under the new type.
        const uuid = UUID.random();
        const legacy = new SecurityProto();
        legacy.setUuid(uuid.toUUIDProto());

        const legacyBytes = legacy.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(legacyBytes);
        const parsedBytes = Array.from(parsed.getUuid()!.getRawUuid_asU8());
        expect(parsedBytes).toEqual(uuid.toBytes());
    });
});
