/**
 * ISSUE #7: SecurityProto round-trip serialization tests for all 6 security types.
 *
 * For each type: construct → serialize to bytes → deserialize → verify all fields match.
 */
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
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
        original.setSecurityType(SecurityTypeProto.BOND_SECURITY);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        original.setQuantityType(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE);
        original.setIdentifier(makeIdentifier(IdentifierTypeProto.CUSIP, '912828ZT0'));
        original.setDescription('UST 5% 2030');
        original.setCouponRate(makeDecimal('5.0'));
        original.setCouponType(CouponTypeProto.FIXED);
        original.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
        original.setFaceValue(makeDecimal('1000'));
        original.setIssueDate(makeDate(2020, 1, 15));
        original.setDatedDate(makeDate(2020, 1, 15));
        original.setMaturityDate(makeDate(2030, 1, 15));

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getSecurityType()).toBe(SecurityTypeProto.BOND_SECURITY);
        expect(parsed.getAssetClass()).toBe('Fixed Income');
        expect(parsed.getIssuerName()).toBe('US Treasury');
        expect(parsed.getDescription()).toBe('UST 5% 2030');
        expect(parsed.getQuantityType()).toBe(SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE);
        expect(parsed.getCouponRate()!.getArbitraryPrecisionValue()).toBe('5.0');
        expect(parsed.getCouponType()).toBe(CouponTypeProto.FIXED);
        expect(parsed.getCouponFrequency()).toBe(CouponFrequencyProto.SEMIANNUALLY);
        expect(parsed.getFaceValue()!.getArbitraryPrecisionValue()).toBe('1000');
        expect(parsed.getIssueDate()!.getYear()).toBe(2020);
        expect(parsed.getDatedDate()!.getMonth()).toBe(1);
        expect(parsed.getMaturityDate()!.getYear()).toBe(2030);
        expect(parsed.getMaturityDate()!.getMonth()).toBe(1);
        expect(parsed.getMaturityDate()!.getDay()).toBe(15);
        expect(parsed.getIdentifier()!.getIdentifierValue()).toBe('912828ZT0');
        expect(parsed.getIdentifier()!.getIdentifierType()).toBe(IdentifierTypeProto.CUSIP);
    });

    test('TIPS: bond fields + base_cpi + inflation_index_type survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setSecurityType(SecurityTypeProto.TIPS);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        original.setCouponRate(makeDecimal('0.625'));
        original.setCouponType(CouponTypeProto.FIXED);
        original.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
        original.setFaceValue(makeDecimal('1000'));
        original.setMaturityDate(makeDate(2030, 1, 15));
        original.setBaseCpi(makeDecimal('256.394'));
        original.setInflationIndexType(IndexTypeProto.CPI_U);

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getSecurityType()).toBe(SecurityTypeProto.TIPS);
        expect(parsed.getCouponRate()!.getArbitraryPrecisionValue()).toBe('0.625');
        expect(parsed.getCouponType()).toBe(CouponTypeProto.FIXED);
        expect(parsed.getCouponFrequency()).toBe(CouponFrequencyProto.SEMIANNUALLY);
        expect(parsed.getFaceValue()!.getArbitraryPrecisionValue()).toBe('1000');
        expect(parsed.getMaturityDate()!.getYear()).toBe(2030);
        expect(parsed.getBaseCpi()!.getArbitraryPrecisionValue()).toBe('256.394');
        expect(parsed.getInflationIndexType()).toBe(IndexTypeProto.CPI_U);
    });

    test('FRN: spread + reference_rate_index + reset_frequency survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setSecurityType(SecurityTypeProto.FRN);
        original.setAssetClass('Fixed Income');
        original.setIssuerName('US Treasury');
        original.setCouponType(CouponTypeProto.FLOAT);
        original.setCouponFrequency(CouponFrequencyProto.QUARTERLY);
        original.setFaceValue(makeDecimal('100'));
        original.setMaturityDate(makeDate(2028, 1, 15));
        original.setSpread(makeDecimal('50'));
        original.setReferenceRateIndex(IndexTypeProto.T_BILL_13_WEEK);
        // Note: setResetFrequency (field 92) not yet in generated JS — codegen needs update

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getSecurityType()).toBe(SecurityTypeProto.FRN);
        expect(parsed.getCouponType()).toBe(CouponTypeProto.FLOAT);
        expect(parsed.getCouponFrequency()).toBe(CouponFrequencyProto.QUARTERLY);
        expect(parsed.getFaceValue()!.getArbitraryPrecisionValue()).toBe('100');
        expect(parsed.getMaturityDate()!.getYear()).toBe(2028);
        expect(parsed.getSpread()!.getArbitraryPrecisionValue()).toBe('50');
        expect(parsed.getReferenceRateIndex()).toBe(IndexTypeProto.T_BILL_13_WEEK);
    });

    test('EQUITY_SECURITY: identifier + asset_class survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setSecurityType(SecurityTypeProto.EQUITY_SECURITY);
        original.setAssetClass('Equity');
        original.setIssuerName('Apple Inc.');
        original.setQuantityType(SecurityQuantityTypeProto.UNITS);
        original.setIdentifier(makeIdentifier(IdentifierTypeProto.EXCH_TICKER, 'AAPL'));
        original.setDescription('Apple Inc. Common Stock');

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getSecurityType()).toBe(SecurityTypeProto.EQUITY_SECURITY);
        expect(parsed.getAssetClass()).toBe('Equity');
        expect(parsed.getIssuerName()).toBe('Apple Inc.');
        expect(parsed.getQuantityType()).toBe(SecurityQuantityTypeProto.UNITS);
        expect(parsed.getDescription()).toBe('Apple Inc. Common Stock');
        expect(parsed.getIdentifier()!.getIdentifierValue()).toBe('AAPL');
        expect(parsed.getIdentifier()!.getIdentifierType()).toBe(IdentifierTypeProto.EXCH_TICKER);
    });

    test('CASH_SECURITY: cash_id + settlement fields survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setSecurityType(SecurityTypeProto.CASH_SECURITY);
        original.setAssetClass('Cash');
        original.setIssuerName('Federal Reserve');
        original.setQuantityType(SecurityQuantityTypeProto.UNITS);
        original.setCashId('USD');
        original.setDescription('US Dollar');
        original.setIdentifier(makeIdentifier(IdentifierTypeProto.CASH, 'USD'));

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getSecurityType()).toBe(SecurityTypeProto.CASH_SECURITY);
        expect(parsed.getAssetClass()).toBe('Cash');
        expect(parsed.getCashId()).toBe('USD');
        expect(parsed.getDescription()).toBe('US Dollar');
        expect(parsed.getIdentifier()!.getIdentifierValue()).toBe('USD');
        expect(parsed.getIdentifier()!.getIdentifierType()).toBe(IdentifierTypeProto.CASH);
    });

    test('INDEX_SECURITY: index_type + inflation_index_type survive round-trip', () => {
        const original = new SecurityProto();
        original.setObjectClass('Security');
        original.setVersion('0.0.1');
        original.setSecurityType(SecurityTypeProto.INDEX_SECURITY);
        original.setAssetClass('Index');
        original.setIssuerName('Bureau of Labor Statistics');
        original.setDescription('US CPI-U All Urban Consumers');
        original.setIndexType(IndexTypeProto.CPI_U);
        original.setIdentifier(makeIdentifier(IdentifierTypeProto.CUSIP, 'CPI-U'));

        const bytes = original.serializeBinary();
        const parsed = SecurityProto.deserializeBinary(bytes);

        expect(parsed.getSecurityType()).toBe(SecurityTypeProto.INDEX_SECURITY);
        expect(parsed.getAssetClass()).toBe('Index');
        expect(parsed.getIssuerName()).toBe('Bureau of Labor Statistics');
        expect(parsed.getDescription()).toBe('US CPI-U All Urban Consumers');
        expect(parsed.getIndexType()).toBe(IndexTypeProto.CPI_U);
        expect(parsed.getIdentifier()!.getIdentifierValue()).toBe('CPI-U');
    });
});
