/**
 * Step 3 tests — FrnInput / ProductInput proto round-trips.
 *
 * For each new message type: construct → serializeBinary() → deserializeBinary() → verify all fields match.
 */

import { ProductInput, FrnInput, YieldCurveInput, CurvePoint } from './product_inputs_pb';
import { ValuationRequestProto } from './valuation_request_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';

function decimal(value: string): DecimalValueProto {
    const d = new DecimalValueProto();
    d.setArbitraryPrecisionValue(value);
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

        expect(parsed.getTenor()!.getArbitraryPrecisionValue()).toBe('2.0');
        expect(parsed.getRate()!.getArbitraryPrecisionValue()).toBe('0.0470');
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
            expect(pt.getTenor()!.getArbitraryPrecisionValue()).toBe(expectedTenors[i]);
        });
    });

    test('first and last point rates survive', () => {
        const parsed = YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        expect(parsed.getPointsList()[0].getRate()!.getArbitraryPrecisionValue()).toBe('0.0530');
        expect(parsed.getPointsList()[4].getRate()!.getArbitraryPrecisionValue()).toBe('0.0430');
    });
});

describe('FrnInput round-trip', () => {
    test('clean price and curve survive', () => {
        const original = new FrnInput();
        original.setCleanPrice(decimal('99.75'));
        original.setCurve(sofrCurve());

        const parsed = FrnInput.deserializeBinary(original.serializeBinary());

        expect(parsed.getCleanPrice()!.getArbitraryPrecisionValue()).toBe('99.75');
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
        expect(parsed.getFrn()!.getCleanPrice()!.getArbitraryPrecisionValue()).toBe('99.875');
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
        original.setObjectClass('ValuationRequest');
        original.setVersion('0.0.1');
        original.setProductInput(pi);

        const parsed = ValuationRequestProto.deserializeBinary(original.serializeBinary());

        expect(parsed.getObjectClass()).toBe('ValuationRequest');
        expect(parsed.hasProductInput()).toBe(true);
        expect(parsed.getProductInput()!.getInputCase()).toBe(ProductInput.InputCase.FRN);
        expect(parsed.getProductInput()!.getFrn()!.getCleanPrice()!.getArbitraryPrecisionValue()).toBe('100.25');
    });

    test('request without product_input is unaffected', () => {
        const original = new ValuationRequestProto();
        original.setObjectClass('ValuationRequest');
        original.setVersion('0.0.1');

        const parsed = ValuationRequestProto.deserializeBinary(original.serializeBinary());

        expect(parsed.getObjectClass()).toBe('ValuationRequest');
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
