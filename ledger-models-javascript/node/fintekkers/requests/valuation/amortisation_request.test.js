"use strict";
/**
 * LM-364 — AmortisationElectionsProto on PortfolioProto (11) and
 * ValuationRequestProto (26), and the typed lots (27), round-trip.
 *
 * Every test sets non-zero enum values: value 0 is not written on the wire.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const product_inputs_pb_1 = require("./product_inputs_pb");
const valuation_request_pb_1 = require("./valuation_request_pb");
const amortisation_elections_pb_1 = require("../../../fintekkers/models/portfolio/amortisation_elections_pb");
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
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
function elections() {
    const e = new amortisation_elections_pb_1.AmortisationElectionsProto();
    e.setBondPremium(amortisation_elections_pb_1.PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
    e.setMarketDiscountInclusion(amortisation_elections_pb_1.MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
    e.setMarketDiscountAccrual(amortisation_elections_pb_1.MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
    e.setEffectiveFrom(date(2026, 1, 1));
    return e;
}
function lot(trade, settle, quantity, price) {
    const l = new product_inputs_pb_1.TaxLotInputProto();
    l.setTradeDate(trade);
    l.setSettlementDate(settle);
    l.setQuantity(decimal(quantity));
    l.setPrice(decimal(price));
    return l;
}
describe('ValuationRequestProto amortisation_elections (26) and tax_lots (27)', () => {
    test('round-trip', () => {
        const request = new valuation_request_pb_1.ValuationRequestProto();
        request.setAmortisationElections(elections());
        request.addTaxLots(lot(date(2025, 3, 3), date(2025, 3, 4), '1000000', '101.25'));
        request.addTaxLots(lot(date(2026, 2, 2), date(2026, 2, 3), '500000', '98.50'));
        const decoded = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(decoded.toObject()).toEqual(request.toObject());
        const e = decoded.getAmortisationElections();
        expect(e.getBondPremium()).toBe(amortisation_elections_pb_1.PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
        expect(e.getMarketDiscountInclusion()).toBe(amortisation_elections_pb_1.MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
        expect(e.getMarketDiscountAccrual()).toBe(amortisation_elections_pb_1.MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
        expect(e.getEffectiveFrom().toObject()).toEqual({ year: 2026, month: 1, day: 1 });
        const lots = decoded.getTaxLotsList();
        expect(lots).toHaveLength(2);
        expect(lots[1].getTradeDate().toObject()).toEqual({ year: 2026, month: 2, day: 2 });
        expect(lots[1].getSettlementDate().toObject()).toEqual({ year: 2026, month: 2, day: 3 });
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(lots[1].getQuantity()))).toBe('500000');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(lots[1].getPrice()))).toBe('98.50');
    });
});
describe('PortfolioProto amortisation_elections (11)', () => {
    test('round-trip', () => {
        const portfolio = new portfolio_pb_1.PortfolioProto();
        portfolio.setPortfolioName('Tax lots');
        portfolio.setAmortisationElections(elections());
        const decoded = portfolio_pb_1.PortfolioProto.deserializeBinary(portfolio.serializeBinary());
        expect(decoded.hasAmortisationElections()).toBe(true);
        expect(decoded.getAmortisationElections().toObject()).toEqual(elections().toObject());
    });
    test('unset elections read back every default', () => {
        const decoded = amortisation_elections_pb_1.AmortisationElectionsProto.deserializeBinary(new amortisation_elections_pb_1.AmortisationElectionsProto().serializeBinary());
        expect(decoded.getBondPremium()).toBe(amortisation_elections_pb_1.PremiumAmortisationElectionProto.UNSPECIFIED_PREMIUM_ELECTION);
        expect(decoded.getMarketDiscountInclusion()).toBe(amortisation_elections_pb_1.MarketDiscountInclusionProto.UNSPECIFIED_MARKET_DISCOUNT_INCLUSION);
        expect(decoded.getMarketDiscountAccrual()).toBe(amortisation_elections_pb_1.MarketDiscountAccrualMethodProto.UNSPECIFIED_ACCRUAL_METHOD);
        expect(decoded.hasEffectiveFrom()).toBe(false);
    });
});
//# sourceMappingURL=amortisation_request.test.js.map