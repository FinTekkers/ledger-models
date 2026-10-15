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
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
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
describe('TipsInput.cpi round-trip through ValuationRequestProto (LM-343)', () => {
    function text(d) {
        return (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(d));
    }
    function cpiIndex() {
        const details = new security_pb_1.IndexDetailsProto();
        details.setIndexType(index_type_pb_1.IndexTypeProto.CPI_U);
        const index = new security_pb_1.SecurityProto();
        index.setIssuerName('CPI-U NSA');
        index.setIndexDetails(details);
        return index;
    }
    function tipsSecurity() {
        const ext = new security_pb_1.TipsExtensionProto();
        ext.setBaseCpi(decimal('260.47400'));
        ext.setInflationIndexType(index_type_pb_1.IndexTypeProto.CPI_U);
        const security = new security_pb_1.SecurityProto();
        security.setProductType(product_type_pb_1.ProductTypeProto.TIPS);
        security.setTipsExtension(ext);
        return security;
    }
    function reading(year, month, value) {
        const r = new product_inputs_pb_1.MonthlyIndexReading();
        r.setYear(year);
        r.setMonth(month);
        r.setValue(decimal(value));
        return r;
    }
    function request(tips) {
        const pi = new product_inputs_pb_1.ProductInput();
        pi.setTips(tips);
        const req = new valuation_request_pb_1.ValuationRequestProto();
        req.setProductInput(pi);
        return req;
    }
    function roundtripTips(original) {
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(original.serializeBinary());
        expect(parsed.getProductInput().getInputCase()).toBe(product_inputs_pb_1.ProductInput.InputCase.TIPS);
        return parsed.getProductInput().getTips();
    }
    function expectCpiIndex(index) {
        expect(index.getIssuerName()).toBe('CPI-U NSA');
        expect(index.getIndexDetails().getIndexType()).toBe(index_type_pb_1.IndexTypeProto.CPI_U);
    }
    test('readings case survives', () => {
        const readings = new product_inputs_pb_1.MonthlyIndexReadings();
        readings.addReadings(reading(2026, 4, '320.000'));
        readings.addReadings(reading(2026, 5, '321.500'));
        const cpi = new product_inputs_pb_1.InflationIndexInput();
        cpi.setIndex(cpiIndex());
        cpi.setReadings(readings);
        const tips = new product_inputs_pb_1.TipsInput();
        tips.setSecurity(tipsSecurity());
        tips.setCleanPrice(decimal('97.50'));
        tips.setCpi(cpi);
        const parsed = roundtripTips(request(tips));
        expect(parsed.hasCpi()).toBe(true);
        const parsedCpi = parsed.getCpi();
        expect(parsedCpi.getCpiCase()).toBe(product_inputs_pb_1.InflationIndexInput.CpiCase.READINGS);
        expectCpiIndex(parsedCpi.getIndex());
        const got = parsedCpi.getReadings().getReadingsList()
            .map(r => [r.getYear(), r.getMonth(), text(r.getValue())]);
        expect(got).toEqual([[2026, 4, '320.000'], [2026, 5, '321.500']]);
        expect(text(parsed.getCleanPrice())).toBe('97.50');
    });
    test('reference_cpi case survives', () => {
        const cpi = new product_inputs_pb_1.InflationIndexInput();
        cpi.setIndex(cpiIndex());
        cpi.setReferenceCpi(decimal('310.32600'));
        const tips = new product_inputs_pb_1.TipsInput();
        tips.setSecurity(tipsSecurity());
        tips.setCleanPrice(decimal('97.50'));
        tips.setCpi(cpi);
        const parsed = roundtripTips(request(tips));
        const parsedCpi = parsed.getCpi();
        expect(parsedCpi.getCpiCase()).toBe(product_inputs_pb_1.InflationIndexInput.CpiCase.REFERENCE_CPI);
        expect(parsedCpi.hasReadings()).toBe(false);
        expectCpiIndex(parsedCpi.getIndex());
        expect(text(parsedCpi.getReferenceCpi())).toBe('310.32600');
    });
    test('deprecated current_cpi, cpi_price_input and reference_rate_input still survive unchanged', () => {
        const tips = new product_inputs_pb_1.TipsInput();
        tips.setSecurity(tipsSecurity());
        tips.setCurrentCpi(decimal('310.32600'));
        const original = request(tips);
        const cpiPrice = new price_pb_1.PriceProto();
        cpiPrice.setPrice(decimal('310.326'));
        cpiPrice.setSecurity(cpiIndex());
        original.setCpiPriceInput(cpiPrice);
        const referenceRate = new price_pb_1.PriceProto();
        referenceRate.setPrice(decimal('5.33'));
        original.setReferenceRateInput(referenceRate);
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(original.serializeBinary());
        expect(parsed.toObject()).toEqual(original.toObject());
        const parsedTips = parsed.getProductInput().getTips();
        expect(text(parsedTips.getCurrentCpi())).toBe('310.32600');
        expect(parsedTips.hasCpi()).toBe(false);
        expect(text(parsed.getCpiPriceInput().getPrice())).toBe('310.326');
        expectCpiIndex(parsed.getCpiPriceInput().getSecurity());
        expect(text(parsed.getReferenceRateInput().getPrice())).toBe('5.33');
    });
});
//# sourceMappingURL=product_inputs.test.js.map