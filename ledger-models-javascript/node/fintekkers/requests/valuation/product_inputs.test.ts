/**
 * Step 3 tests — FrnInput / ProductInput proto round-trips.
 *
 * For each new message type: construct → serializeBinary() → deserializeBinary() → verify all fields match.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    ProductInput, FrnInput, YieldCurveInput, CurvePoint,
    TipsInput, InflationIndexInput, MonthlyIndexReadings, MonthlyIndexReading,
} from './product_inputs_pb';
import { ValuationRequestProto } from './valuation_request_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { IndexDetailsProto, SecurityProto, TipsExtensionProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../../../wrappers/models/utils/decimal';

function decimal(value: string): DecimalValueProto {
    const d = encodeDecimal(parseDecimalString(value));
    return d;
}

function date(year: number, month: number, day: number): LocalDateProto {
    const d = new LocalDateProto();
    d.setYear(year);
    d.setMonth(month);
    d.setDay(day);
    return d;
}

function sofrCurve(): YieldCurveInput {
    const curve = new YieldCurveInput();
    curve.setIndex(IndexTypeProto.SOFR);
    curve.setReferenceDate(date(2025, 1, 31));

    const points: [string, string][] = [
        ['0.25', '0.0530'],
        ['0.5',  '0.0520'],
        ['1.0',  '0.0500'],
        ['2.0',  '0.0470'],
        ['5.0',  '0.0430'],
    ];
    for (const [tenor, rate] of points) {
        const p = new CurvePoint();
        p.setTenor(decimal(tenor));
        p.setRate(decimal(rate));
        curve.addPoints(p);
    }
    return curve;
}

describe('CurvePoint round-trip', () => {
    test('all fields survive serialize/deserialize', () => {
        const original = new CurvePoint();
        original.setTenor(decimal('2.0'));
        original.setRate(decimal('0.0470'));

        const parsed = CurvePoint.deserializeBinary(original.serializeBinary());

        expect(toCanonicalString(decodeDecimal(parsed.getTenor()!))).toBe('2.0');
        expect(toCanonicalString(decodeDecimal(parsed.getRate()!))).toBe('0.0470');
    });
});

describe('YieldCurveInput round-trip', () => {
    test('index and reference date survive', () => {
        const parsed = YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        expect(parsed.getIndex()).toBe(IndexTypeProto.SOFR);
        expect(parsed.getReferenceDate()!.getYear()).toBe(2025);
        expect(parsed.getReferenceDate()!.getMonth()).toBe(1);
        expect(parsed.getReferenceDate()!.getDay()).toBe(31);
    });

    test('all five points survive', () => {
        const parsed = YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        expect(parsed.getPointsList()).toHaveLength(5);
    });

    test('point order is preserved', () => {
        const expectedTenors = ['0.25', '0.5', '1.0', '2.0', '5.0'];
        const parsed = YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        parsed.getPointsList().forEach((pt, i) => {
            expect(toCanonicalString(decodeDecimal(pt.getTenor()!))).toBe(expectedTenors[i]);
        });
    });

    test('first and last point rates survive', () => {
        const parsed = YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        expect(toCanonicalString(decodeDecimal(parsed.getPointsList()[0].getRate()!))).toBe('0.0530');
        expect(toCanonicalString(decodeDecimal(parsed.getPointsList()[4].getRate()!))).toBe('0.0430');
    });
});

describe('FrnInput round-trip', () => {
    test('clean price and curve survive', () => {
        const original = new FrnInput();
        original.setCleanPrice(decimal('99.75'));
        original.setCurve(sofrCurve());

        const parsed = FrnInput.deserializeBinary(original.serializeBinary());

        expect(toCanonicalString(decodeDecimal(parsed.getCleanPrice()!))).toBe('99.75');
        expect(parsed.getCurve()!.getIndex()).toBe(IndexTypeProto.SOFR);
        expect(parsed.getCurve()!.getPointsList()).toHaveLength(5);
    });
});

describe('ProductInput round-trip', () => {
    test('frn variant survives', () => {
        const frn = new FrnInput();
        frn.setCleanPrice(decimal('99.875'));
        frn.setCurve(sofrCurve());

        const original = new ProductInput();
        original.setFrn(frn);

        const parsed = ProductInput.deserializeBinary(original.serializeBinary());

        expect(parsed.getInputCase()).toBe(ProductInput.InputCase.FRN);
        expect(toCanonicalString(decodeDecimal(parsed.getFrn()!.getCleanPrice()!))).toBe('99.875');
        expect(parsed.getFrn()!.getCurve()!.getIndex()).toBe(IndexTypeProto.SOFR);
    });
});

describe('ValuationRequestProto backward compatibility', () => {
    test('product_input field survives on existing request message', () => {
        const frn = new FrnInput();
        frn.setCleanPrice(decimal('100.25'));
        frn.setCurve(sofrCurve());

        const pi = new ProductInput();
        pi.setFrn(frn);

        const original = new ValuationRequestProto();
        original.setProductInput(pi);

        const parsed = ValuationRequestProto.deserializeBinary(original.serializeBinary());

        expect(parsed.hasProductInput()).toBe(true);
        expect(parsed.getProductInput()!.getInputCase()).toBe(ProductInput.InputCase.FRN);
        expect(toCanonicalString(decodeDecimal(parsed.getProductInput()!.getFrn()!.getCleanPrice()!))).toBe('100.25');
    });

    test('request without product_input is unaffected', () => {
        const original = new ValuationRequestProto();

        const parsed = ValuationRequestProto.deserializeBinary(original.serializeBinary());

        expect(parsed.hasProductInput()).toBe(false);
    });
});

describe('New RFR index types round-trip', () => {
    test.each([
        [IndexTypeProto.SONIA, 'SONIA'],
        [IndexTypeProto.ESTR,  'ESTR'],
        [IndexTypeProto.TONA,  'TONA'],
    ])('%s survives round-trip', (index, label) => {
        const curve = new YieldCurveInput();
        curve.setIndex(index);
        curve.setReferenceDate(date(2025, 1, 31));
        const p = new CurvePoint();
        p.setTenor(decimal('1.0'));
        p.setRate(decimal('0.04'));
        curve.addPoints(p);

        const parsed = YieldCurveInput.deserializeBinary(curve.serializeBinary());
        expect(parsed.getIndex()).toBe(index);
    });
});

describe('TipsInput.cpi round-trip through ValuationRequestProto (LM-343)', () => {
    function text(d: DecimalValueProto | undefined): string {
        return toCanonicalString(decodeDecimal(d!));
    }

    function cpiIndex(): SecurityProto {
        const details = new IndexDetailsProto();
        details.setIndexType(IndexTypeProto.CPI_U);
        const index = new SecurityProto();
        index.setIssuerName('CPI-U NSA');
        index.setIndexDetails(details);
        return index;
    }

    function tipsSecurity(): SecurityProto {
        const ext = new TipsExtensionProto();
        ext.setBaseCpi(decimal('260.47400'));
        ext.setInflationIndexType(IndexTypeProto.CPI_U);
        const security = new SecurityProto();
        security.setProductType(ProductTypeProto.TIPS);
        security.setTipsExtension(ext);
        return security;
    }

    function reading(year: number, month: number, value: string): MonthlyIndexReading {
        const r = new MonthlyIndexReading();
        r.setYear(year);
        r.setMonth(month);
        r.setValue(decimal(value));
        return r;
    }

    function request(tips: TipsInput): ValuationRequestProto {
        const pi = new ProductInput();
        pi.setTips(tips);
        const req = new ValuationRequestProto();
        req.setProductInput(pi);
        return req;
    }

    function roundtripTips(original: ValuationRequestProto): TipsInput {
        const parsed = ValuationRequestProto.deserializeBinary(original.serializeBinary());
        expect(parsed.getProductInput()!.getInputCase()).toBe(ProductInput.InputCase.TIPS);
        return parsed.getProductInput()!.getTips()!;
    }

    function expectCpiIndex(index: SecurityProto | undefined): void {
        expect(index!.getIssuerName()).toBe('CPI-U NSA');
        expect(index!.getIndexDetails()!.getIndexType()).toBe(IndexTypeProto.CPI_U);
    }

    test('readings case survives', () => {
        const readings = new MonthlyIndexReadings();
        readings.addReadings(reading(2026, 4, '320.000'));
        readings.addReadings(reading(2026, 5, '321.500'));
        const cpi = new InflationIndexInput();
        cpi.setIndex(cpiIndex());
        cpi.setReadings(readings);
        const tips = new TipsInput();
        tips.setSecurity(tipsSecurity());
        tips.setCleanPrice(decimal('97.50'));
        tips.setCpi(cpi);

        const parsed = roundtripTips(request(tips));

        expect(parsed.hasCpi()).toBe(true);
        const parsedCpi = parsed.getCpi()!;
        expect(parsedCpi.getCpiCase()).toBe(InflationIndexInput.CpiCase.READINGS);
        expectCpiIndex(parsedCpi.getIndex());
        const got = parsedCpi.getReadings()!.getReadingsList()
            .map(r => [r.getYear(), r.getMonth(), text(r.getValue())]);
        expect(got).toEqual([[2026, 4, '320.000'], [2026, 5, '321.500']]);
        expect(text(parsed.getCleanPrice())).toBe('97.50');
    });

    test('reference_cpi case survives', () => {
        const cpi = new InflationIndexInput();
        cpi.setIndex(cpiIndex());
        cpi.setReferenceCpi(decimal('310.32600'));
        const tips = new TipsInput();
        tips.setSecurity(tipsSecurity());
        tips.setCleanPrice(decimal('97.50'));
        tips.setCpi(cpi);

        const parsed = roundtripTips(request(tips));

        const parsedCpi = parsed.getCpi()!;
        expect(parsedCpi.getCpiCase()).toBe(InflationIndexInput.CpiCase.REFERENCE_CPI);
        expect(parsedCpi.hasReadings()).toBe(false);
        expectCpiIndex(parsedCpi.getIndex());
        expect(text(parsedCpi.getReferenceCpi())).toBe('310.32600');
    });
});

// ── Fields removed in 0.5 (LM-344) ─────────────────────────────────────────
// google-protobuf JS keeps no reserved metadata; Java, Python and Rust check
// the reserved numbers and names. The names come from the shared fixture.

interface RemovedField { message: string; number: number; name: string; }

const removedFieldsPath = path.resolve(__dirname, '../../../../../test-fixtures/removed-fields/lm-344.json');
const removedFields: RemovedField[] = JSON.parse(fs.readFileSync(removedFieldsPath, 'utf8')).fields;

const removedFieldMessages: Record<string, { prototype: object; new (): { toObject(): object } }> = {
    '.fintekkers.requests.valuation.ValuationRequestProto': ValuationRequestProto,
    '.fintekkers.requests.valuation.TipsInput': TipsInput,
};

function removedFieldMessage(message: string) {
    if (!Object.prototype.hasOwnProperty.call(removedFieldMessages, message)) {
        throw new Error(`fixture names an unknown message: ${message}`);
    }
    return removedFieldMessages[message];
}

describe('fields removed in 0.5 (LM-344)', () => {
    test('the fixture lists three fields', () => {
        expect(removedFields).toHaveLength(3);
    });

    test.each(removedFields.map((f): [string, RemovedField] => [`${f.message}.${f.name}`, f]))(
        '%s has no accessors and no toObject key', (_label, field) => {
            const message = removedFieldMessage(field.message);
            const camel = field.name.split('_').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
            for (const verb of ['get', 'set', 'has', 'clear']) {
                expect(`${verb}${camel}` in message.prototype).toBe(false);
            }
            const lowerCamel = camel[0].toLowerCase() + camel.slice(1);
            expect(Object.keys(new message().toObject())).not.toContain(lowerCamel);
        });
});
