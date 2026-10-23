"use strict";
/**
 * LM-364 — a TipsInput with cost_basis (20): non-default elections and two
 * TaxLotProto lots round-trip unchanged.
 *
 * LM-378 — a TIPS ADJUSTED_COST_BASIS request: two lots plus the valuation
 * date's m-3 and m-2 CPI readings round-trip unchanged.
 *
 * The enum values are all non-zero: value 0 is not written on the wire.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const product_inputs_pb_1 = require("./product_inputs_pb");
const valuation_request_pb_1 = require("./valuation_request_pb");
const amortisation_elections_pb_1 = require("../../../fintekkers/models/portfolio/amortisation_elections_pb");
const tax_lot_pb_1 = require("../../../fintekkers/models/position/tax_lot_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const decimal_1 = require("../../../wrappers/models/utils/decimal");
function decimal(value) {
    return (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(value));
}
function date(year, month, day) {
    const d = new local_date_pb_1.LocalDateProto();
    d.setYear(year);
    d.setMonth(month);
    d.setDay(day);
    return d;
}
function lot(openDate, openQuantity, price) {
    const l = new tax_lot_pb_1.TaxLotProto();
    l.setOpenDate(openDate);
    l.setOpenQuantity(decimal(openQuantity));
    l.setPrice(decimal(price));
    return l;
}
function reading(year, month, value) {
    const r = new product_inputs_pb_1.MonthlyIndexReading();
    r.setYear(year);
    r.setMonth(month);
    r.setValue(decimal(value));
    return r;
}
describe('TipsInput cost_basis (20)', () => {
    test('non-default elections and two lots round-trip unchanged', () => {
        const elections = new amortisation_elections_pb_1.AmortisationElectionsProto();
        elections.setBondPremium(amortisation_elections_pb_1.PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
        elections.setMarketDiscountInclusion(amortisation_elections_pb_1.MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
        elections.setMarketDiscountAccrual(amortisation_elections_pb_1.MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
        const costBasis = new product_inputs_pb_1.CostBasisInput();
        costBasis.setElections(elections);
        costBasis.addLots(lot(date(2024, 1, 15), '10000', '98.25'));
        costBasis.addLots(lot(date(2025, 6, 2), '5000', '101.50'));
        const tips = new product_inputs_pb_1.TipsInput();
        tips.setCleanPrice(decimal('97.50'));
        tips.setCostBasis(costBasis);
        const productInput = new product_inputs_pb_1.ProductInput();
        productInput.setTips(tips);
        const request = new valuation_request_pb_1.ValuationRequestProto();
        request.setProductInput(productInput);
        const decoded = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(request.serializeBinary()).getProductInput().getTips();
        expect(decoded.toObject()).toEqual(tips.toObject());
        expect(decoded.hasCostBasis()).toBe(true);
        const parsed = decoded.getCostBasis();
        expect(parsed.hasElections()).toBe(true);
        const e = parsed.getElections();
        expect(e.getBondPremium()).toBe(amortisation_elections_pb_1.PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
        expect(e.getMarketDiscountInclusion()).toBe(amortisation_elections_pb_1.MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
        expect(e.getMarketDiscountAccrual()).toBe(amortisation_elections_pb_1.MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
        const lots = parsed.getLotsList().map(l => [
            l.getOpenDate().toObject(),
            (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(l.getOpenQuantity())),
            (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(l.getPrice())),
        ]);
        expect(lots).toEqual([
            [{ year: 2024, month: 1, day: 15 }, '10000', '98.25'],
            [{ year: 2025, month: 6, day: 2 }, '5000', '101.50'],
        ]);
    });
    test('TIPS ADJUSTED_COST_BASIS request with two lots and the m-3 and m-2 CPI readings round-trips unchanged', () => {
        // 2026-10-23T14:30:00Z: settlement month 2026-10, so m-3 and m-2 are 2026-07 and 2026-08.
        const timestamp = new timestamp_pb_1.Timestamp();
        timestamp.setSeconds(1792765800);
        const asof = new local_timestamp_pb_1.LocalTimestampProto();
        asof.setTimestamp(timestamp);
        const readings = new product_inputs_pb_1.MonthlyIndexReadings();
        readings.addReadings(reading(2026, 7, '322.100'));
        readings.addReadings(reading(2026, 8, '322.900'));
        const cpi = new product_inputs_pb_1.InflationIndexInput();
        cpi.setReadings(readings);
        const costBasis = new product_inputs_pb_1.CostBasisInput();
        costBasis.addLots(lot(date(2024, 1, 15), '10000', '98.25'));
        costBasis.addLots(lot(date(2025, 6, 2), '5000', '101.50'));
        const tips = new product_inputs_pb_1.TipsInput();
        tips.setCleanPrice(decimal('97.50'));
        tips.setCpi(cpi);
        tips.setCostBasis(costBasis);
        const productInput = new product_inputs_pb_1.ProductInput();
        productInput.setTips(tips);
        const request = new valuation_request_pb_1.ValuationRequestProto();
        request.setAsofDatetime(asof);
        request.setProductInput(productInput);
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.getAsofDatetime().toObject()).toEqual(asof.toObject());
        expect(parsed.getAsofDatetime().getTimestamp().toDate().toISOString()).toBe('2026-10-23T14:30:00.000Z');
        const decoded = parsed.getProductInput().getTips();
        expect(decoded.toObject()).toEqual(tips.toObject());
        expect(decoded.getCpi().hasReadings()).toBe(true);
        const got = decoded.getCpi().getReadings().getReadingsList().map(r => [
            r.getYear(), r.getMonth(), (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(r.getValue())),
        ]);
        expect(got).toEqual([[2026, 7, '322.100'], [2026, 8, '322.900']]);
        const lots = decoded.getCostBasis().getLotsList().map(l => [
            l.getOpenDate().toObject(),
            (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(l.getOpenQuantity())),
            (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(l.getPrice())),
        ]);
        expect(lots).toEqual([
            [{ year: 2024, month: 1, day: 15 }, '10000', '98.25'],
            [{ year: 2025, month: 6, day: 2 }, '5000', '101.50'],
        ]);
    });
});
//# sourceMappingURL=cost_basis_input.test.js.map