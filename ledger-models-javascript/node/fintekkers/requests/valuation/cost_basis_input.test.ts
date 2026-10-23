/**
 * LM-364 — a TipsInput with cost_basis (20): non-default elections and two
 * TaxLotProto lots round-trip unchanged.
 *
 * LM-378 — a TIPS ADJUSTED_COST_BASIS request: two lots plus the valuation
 * date's m-3 and m-2 CPI readings round-trip unchanged.
 *
 * The enum values are all non-zero: value 0 is not written on the wire.
 */

import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import {
    CostBasisInput, InflationIndexInput, MonthlyIndexReading, MonthlyIndexReadings, ProductInput, TipsInput,
} from './product_inputs_pb';
import { ValuationRequestProto } from './valuation_request_pb';
import {
    AmortisationElectionsProto, MarketDiscountAccrualMethodProto, MarketDiscountInclusionProto,
    PremiumAmortisationElectionProto,
} from '../../../fintekkers/models/portfolio/amortisation_elections_pb';
import { TaxLotProto } from '../../../fintekkers/models/position/tax_lot_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
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

function reading(year: number, month: number, value: string): MonthlyIndexReading {
    const r = new MonthlyIndexReading();
    r.setYear(year);
    r.setMonth(month);
    r.setValue(decimal(value));
    return r;
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

    test('TIPS ADJUSTED_COST_BASIS request with two lots and the m-3 and m-2 CPI readings round-trips unchanged', () => {
        // 2026-10-23T14:30:00Z: settlement month 2026-10, so m-3 and m-2 are 2026-07 and 2026-08.
        const timestamp = new Timestamp();
        timestamp.setSeconds(1792765800);
        const asof = new LocalTimestampProto();
        asof.setTimestamp(timestamp);
        const readings = new MonthlyIndexReadings();
        readings.addReadings(reading(2026, 7, '322.100'));
        readings.addReadings(reading(2026, 8, '322.900'));
        const cpi = new InflationIndexInput();
        cpi.setReadings(readings);
        const costBasis = new CostBasisInput();
        costBasis.addLots(lot(date(2024, 1, 15), '10000', '98.25'));
        costBasis.addLots(lot(date(2025, 6, 2), '5000', '101.50'));
        const tips = new TipsInput();
        tips.setCleanPrice(decimal('97.50'));
        tips.setCpi(cpi);
        tips.setCostBasis(costBasis);
        const productInput = new ProductInput();
        productInput.setTips(tips);
        const request = new ValuationRequestProto();
        request.setAsofDatetime(asof);
        request.setProductInput(productInput);

        const parsed = ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.getAsofDatetime()!.toObject()).toEqual(asof.toObject());
        expect(parsed.getAsofDatetime()!.getTimestamp()!.toDate().toISOString()).toBe('2026-10-23T14:30:00.000Z');
        const decoded = parsed.getProductInput()!.getTips()!;
        expect(decoded.toObject()).toEqual(tips.toObject());

        expect(decoded.getCpi()!.hasReadings()).toBe(true);
        const got = decoded.getCpi()!.getReadings()!.getReadingsList().map(r => [
            r.getYear(), r.getMonth(), toCanonicalString(decodeDecimal(r.getValue()!)),
        ]);
        expect(got).toEqual([[2026, 7, '322.100'], [2026, 8, '322.900']]);

        const lots = decoded.getCostBasis()!.getLotsList().map(l => [
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
