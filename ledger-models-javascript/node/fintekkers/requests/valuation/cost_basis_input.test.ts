/**
 * LM-364 — a TipsInput with cost_basis (20): non-default elections and two
 * TaxLotProto lots round-trip unchanged.
 *
 * The enum values are all non-zero: value 0 is not written on the wire.
 */

import { CostBasisInput, ProductInput, TipsInput } from './product_inputs_pb';
import { ValuationRequestProto } from './valuation_request_pb';
import {
    AmortisationElectionsProto, MarketDiscountAccrualMethodProto, MarketDiscountInclusionProto,
    PremiumAmortisationElectionProto,
} from '../../../fintekkers/models/portfolio/amortisation_elections_pb';
import { TaxLotProto } from '../../../fintekkers/models/position/tax_lot_pb';
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

function lot(openDate: LocalDateProto, openQuantity: string, price: string): TaxLotProto {
    const l = new TaxLotProto();
    l.setOpenDate(openDate);
    l.setOpenQuantity(decimal(openQuantity));
    l.setPrice(decimal(price));
    return l;
}

describe('TipsInput cost_basis (20)', () => {
    test('non-default elections and two lots round-trip unchanged', () => {
        const elections = new AmortisationElectionsProto();
        elections.setBondPremium(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
        elections.setMarketDiscountInclusion(MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
        elections.setMarketDiscountAccrual(MarketDiscountAccrualMethodProto.CONSTANT_YIELD);
        const costBasis = new CostBasisInput();
        costBasis.setElections(elections);
        costBasis.addLots(lot(date(2024, 1, 15), '10000', '98.25'));
        costBasis.addLots(lot(date(2025, 6, 2), '5000', '101.50'));
        const tips = new TipsInput();
        tips.setCleanPrice(decimal('97.50'));
        tips.setCostBasis(costBasis);
        const productInput = new ProductInput();
        productInput.setTips(tips);
        const request = new ValuationRequestProto();
        request.setProductInput(productInput);

        const decoded = ValuationRequestProto.deserializeBinary(request.serializeBinary()).getProductInput()!.getTips()!;
        expect(decoded.toObject()).toEqual(tips.toObject());

        expect(decoded.hasCostBasis()).toBe(true);
        const parsed = decoded.getCostBasis()!;
        expect(parsed.hasElections()).toBe(true);
        const e = parsed.getElections()!;
        expect(e.getBondPremium()).toBe(PremiumAmortisationElectionProto.PREMIUM_NOT_ELECTED);
        expect(e.getMarketDiscountInclusion()).toBe(MarketDiscountInclusionProto.INCLUDE_CURRENTLY);
        expect(e.getMarketDiscountAccrual()).toBe(MarketDiscountAccrualMethodProto.CONSTANT_YIELD);

        const lots = parsed.getLotsList().map(l => [
            l.getOpenDate()!.toObject(),
            toCanonicalString(decodeDecimal(l.getOpenQuantity()!)),
            toCanonicalString(decodeDecimal(l.getPrice()!)),
        ]);
        expect(lots).toEqual([
            [{ year: 2024, month: 1, day: 15 }, '10000', '98.25'],
            [{ year: 2025, month: 6, day: 2 }, '5000', '101.50'],
        ]);
    });
});
