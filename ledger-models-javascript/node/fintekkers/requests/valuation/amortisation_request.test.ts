/**
 * LM-364 — AmortisationElectionsProto on PortfolioProto (11) and
 * ValuationRequestProto (26), and the typed lots (27), round-trip.
 *
 * Every test sets non-zero enum values: value 0 is not written on the wire.
 */

import { TaxLotInputProto } from './product_inputs_pb';
import { ValuationRequestProto } from './valuation_request_pb';
import {
    AmortisationElectionsProto, MarketDiscountAccrualMethodProto, MarketDiscountInclusionProto,
    PremiumAmortisationElectionProto,
} from '../../../fintekkers/models/portfolio/amortisation_elections_pb';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../../../wrappers/models/utils/decimal';

function decimal(value: string): DecimalValueProto {
    return encodeDecimal(parseDecimalString(value));
}

function date(year: number, month: number, day: number): LocalDateProto {
    const d = new LocalDateProto();
    d.setYear(year);
    d.setMonth(month);
    d.setDay(day);
    return d;
}

function elections(): AmortisationElectionsProto {
    const e = new AmortisationElectionsProto();
    e.setBondPremium(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
    e.setMarketDiscountInclusion(MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
    e.setMarketDiscountAccrual(MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
    e.setEffectiveFrom(date(2026, 1, 1));
    return e;
}

function lot(trade: LocalDateProto, settle: LocalDateProto, quantity: string, price: string): TaxLotInputProto {
    const l = new TaxLotInputProto();
    l.setTradeDate(trade);
    l.setSettlementDate(settle);
    l.setQuantity(decimal(quantity));
    l.setPrice(decimal(price));
    return l;
}

describe('ValuationRequestProto amortisation_elections (26) and tax_lots (27)', () => {
    test('round-trip', () => {
        const request = new ValuationRequestProto();
        request.setAmortisationElections(elections());
        request.addTaxLots(lot(date(2025, 3, 3), date(2025, 3, 4), '1000000', '101.25'));
        request.addTaxLots(lot(date(2026, 2, 2), date(2026, 2, 3), '500000', '98.50'));

        const decoded = ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(decoded.toObject()).toEqual(request.toObject());

        const e = decoded.getAmortisationElections()!;
        expect(e.getBondPremium()).toBe(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
        expect(e.getMarketDiscountInclusion()).toBe(MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
        expect(e.getMarketDiscountAccrual()).toBe(MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
        expect(e.getEffectiveFrom()!.toObject()).toEqual({ year: 2026, month: 1, day: 1 });

        const lots = decoded.getTaxLotsList();
        expect(lots).toHaveLength(2);
        expect(lots[1].getTradeDate()!.toObject()).toEqual({ year: 2026, month: 2, day: 2 });
        expect(lots[1].getSettlementDate()!.toObject()).toEqual({ year: 2026, month: 2, day: 3 });
        expect(toCanonicalString(decodeDecimal(lots[1].getQuantity()!))).toBe('500000');
        expect(toCanonicalString(decodeDecimal(lots[1].getPrice()!))).toBe('98.50');
    });
});

describe('PortfolioProto amortisation_elections (11)', () => {
    test('round-trip', () => {
        const portfolio = new PortfolioProto();
        portfolio.setPortfolioName('Tax lots');
        portfolio.setAmortisationElections(elections());

        const decoded = PortfolioProto.deserializeBinary(portfolio.serializeBinary());
        expect(decoded.hasAmortisationElections()).toBe(true);
        expect(decoded.getAmortisationElections()!.toObject()).toEqual(elections().toObject());
    });

    test('unset elections read back every default', () => {
        const decoded = AmortisationElectionsProto.deserializeBinary(new AmortisationElectionsProto().serializeBinary());
        expect(decoded.getBondPremium()).toBe(PremiumAmortisationElectionProto.UNSPECIFIED_PREMIUM_ELECTION);
        expect(decoded.getMarketDiscountInclusion()).toBe(MarketDiscountInclusionProto.UNSPECIFIED_MARKET_DISCOUNT_INCLUSION);
        expect(decoded.getMarketDiscountAccrual()).toBe(MarketDiscountAccrualMethodProto.UNSPECIFIED_ACCRUAL_METHOD);
        expect(decoded.hasEffectiveFrom()).toBe(false);
    });
});
