"use strict";
/**
 * Step 3 tests — FrnInput / ProductInput proto round-trips.
 *
 * For each new message type: construct → serializeBinary() → deserializeBinary() → verify all fields match.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const product_inputs_pb_1 = require("./product_inputs_pb");
const valuation_request_pb_1 = require("./valuation_request_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const decimal_1 = require("../../../wrappers/models/utils/decimal");
function decimal(value) {
    const d = (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(value));
    return d;
}
function date(year, month, day) {
    const d = new local_date_pb_1.LocalDateProto();
    d.setYear(year);
    d.setMonth(month);
    d.setDay(day);
    return d;
}
function sofrCurve() {
    const curve = new product_inputs_pb_1.YieldCurveInput();
    curve.setIndex(index_type_pb_1.IndexTypeProto.SOFR);
    curve.setReferenceDate(date(2025, 1, 31));
    const points = [
        ['0.25', '0.0530'],
        ['0.5', '0.0520'],
        ['1.0', '0.0500'],
        ['2.0', '0.0470'],
        ['5.0', '0.0430'],
    ];
    for (const [tenor, rate] of points) {
        const p = new product_inputs_pb_1.CurvePoint();
        p.setTenor(decimal(tenor));
        p.setRate(decimal(rate));
        curve.addPoints(p);
    }
    return curve;
}
describe('CurvePoint round-trip', () => {
    test('all fields survive serialize/deserialize', () => {
        const original = new product_inputs_pb_1.CurvePoint();
        original.setTenor(decimal('2.0'));
        original.setRate(decimal('0.0470'));
        const parsed = product_inputs_pb_1.CurvePoint.deserializeBinary(original.serializeBinary());
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getTenor()))).toBe('2.0');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getRate()))).toBe('0.0470');
    });
});
describe('YieldCurveInput round-trip', () => {
    test('index and reference date survive', () => {
        const parsed = product_inputs_pb_1.YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        expect(parsed.getIndex()).toBe(index_type_pb_1.IndexTypeProto.SOFR);
        expect(parsed.getReferenceDate().getYear()).toBe(2025);
        expect(parsed.getReferenceDate().getMonth()).toBe(1);
        expect(parsed.getReferenceDate().getDay()).toBe(31);
    });
    test('all five points survive', () => {
        const parsed = product_inputs_pb_1.YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        expect(parsed.getPointsList()).toHaveLength(5);
    });
    test('point order is preserved', () => {
        const expectedTenors = ['0.25', '0.5', '1.0', '2.0', '5.0'];
        const parsed = product_inputs_pb_1.YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        parsed.getPointsList().forEach((pt, i) => {
            expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(pt.getTenor()))).toBe(expectedTenors[i]);
        });
    });
    test('first and last point rates survive', () => {
        const parsed = product_inputs_pb_1.YieldCurveInput.deserializeBinary(sofrCurve().serializeBinary());
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getPointsList()[0].getRate()))).toBe('0.0530');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getPointsList()[4].getRate()))).toBe('0.0430');
    });
});
describe('FrnInput round-trip', () => {
    test('clean price and curve survive', () => {
        const original = new product_inputs_pb_1.FrnInput();
        original.setCleanPrice(decimal('99.75'));
        original.setCurve(sofrCurve());
        const parsed = product_inputs_pb_1.FrnInput.deserializeBinary(original.serializeBinary());
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getCleanPrice()))).toBe('99.75');
        expect(parsed.getCurve().getIndex()).toBe(index_type_pb_1.IndexTypeProto.SOFR);
        expect(parsed.getCurve().getPointsList()).toHaveLength(5);
    });
});
describe('ProductInput round-trip', () => {
    test('frn variant survives', () => {
        const frn = new product_inputs_pb_1.FrnInput();
        frn.setCleanPrice(decimal('99.875'));
        frn.setCurve(sofrCurve());
        const original = new product_inputs_pb_1.ProductInput();
        original.setFrn(frn);
        const parsed = product_inputs_pb_1.ProductInput.deserializeBinary(original.serializeBinary());
        expect(parsed.getInputCase()).toBe(product_inputs_pb_1.ProductInput.InputCase.FRN);
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getFrn().getCleanPrice()))).toBe('99.875');
        expect(parsed.getFrn().getCurve().getIndex()).toBe(index_type_pb_1.IndexTypeProto.SOFR);
    });
});
describe('ValuationRequestProto backward compatibility', () => {
    test('product_input field survives on existing request message', () => {
        const frn = new product_inputs_pb_1.FrnInput();
        frn.setCleanPrice(decimal('100.25'));
        frn.setCurve(sofrCurve());
        const pi = new product_inputs_pb_1.ProductInput();
        pi.setFrn(frn);
        const original = new valuation_request_pb_1.ValuationRequestProto();
        original.setProductInput(pi);
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(original.serializeBinary());
        expect(parsed.hasProductInput()).toBe(true);
        expect(parsed.getProductInput().getInputCase()).toBe(product_inputs_pb_1.ProductInput.InputCase.FRN);
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getProductInput().getFrn().getCleanPrice()))).toBe('100.25');
    });
    test('request without product_input is unaffected', () => {
        const original = new valuation_request_pb_1.ValuationRequestProto();
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(original.serializeBinary());
        expect(parsed.hasProductInput()).toBe(false);
    });
});
describe('New RFR index types round-trip', () => {
    test.each([
        [index_type_pb_1.IndexTypeProto.SONIA, 'SONIA'],
        [index_type_pb_1.IndexTypeProto.ESTR, 'ESTR'],
        [index_type_pb_1.IndexTypeProto.TONA, 'TONA'],
    ])('%s survives round-trip', (index, label) => {
        const curve = new product_inputs_pb_1.YieldCurveInput();
        curve.setIndex(index);
        curve.setReferenceDate(date(2025, 1, 31));
        const p = new product_inputs_pb_1.CurvePoint();
        p.setTenor(decimal('1.0'));
        p.setRate(decimal('0.04'));
        curve.addPoints(p);
        const parsed = product_inputs_pb_1.YieldCurveInput.deserializeBinary(curve.serializeBinary());
        expect(parsed.getIndex()).toBe(index);
    });
});
//# sourceMappingURL=product_inputs.test.js.map