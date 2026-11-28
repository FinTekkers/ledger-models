/**
 * LM-509 — the settlement convention contract.
 *
 * A request with SettlementConventionProto (80) and DV01, and a response with
 * settlement_date (60), measure_asof_date (61) and a DV01 result, round-trip
 * unchanged. Measure 31, which LM-509 added, is removed and reserved (LM-514);
 * DV01 stays 25. Request bytes written by
 * v1.1.62 parse with the convention unset and every existing field as it was.
 * ValuationRequests.settlementConvention checks only the calendar-free rules
 * the proto comment states; it computes no date.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SettlementConventionProto, ValuationRequestProto } from './valuation_request_pb';
import { ValuationResponseProto } from './valuation_response_pb';
import { MeasureProto } from '../../../fintekkers/models/position/measure_pb';
import { MeasureMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { ModelValidationError } from '../../../wrappers/models/errors';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../../../wrappers/models/utils/decimal';
import { ValuationRequests } from '../../../wrappers/requests/valuation/ValuationRequests';

const OLD_REQUEST_HEX = path.resolve(__dirname, '../../../../../test-fixtures/wire/lm-509-request-v1.1.62.hex');

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

function fullRequest(): ValuationRequestProto {
    return new ValuationRequestProto()
        .setMeasuresList([MeasureProto.DV01])
        .setSettlementConvention(ValuationRequests.settlementConvention(date(2026, 11, 25), 1, 'US_SIFMA'));
}

function violationFields(call: () => unknown): string[] {
    try {
        call();
    } catch (e) {
        expect(e).toBeInstanceOf(ModelValidationError);
        return (e as ModelValidationError).violations.map((v) => v.getField());
    }
    throw new Error('expected a ModelValidationError');
}

describe('LM-509 settlement convention', () => {
    test('DV01 stays 25 and nothing is 31', () => {
        // The generated measure_pb.js enum object, not a wrapper list.
        expect(MeasureProto.DV01).toBe(25);
        expect(Object.values(MeasureProto)).not.toContain(31);
        // The removed name, split so the LM-514 grep finds it only in measure.proto.
        expect(Object.keys(MeasureProto)).not.toContain('DV01' + '_PER_MILLION');
    });

    test('a request round-trips every new field', () => {
        const request = fullRequest();
        const parsed = ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.toObject()).toEqual(request.toObject());
        expect(parsed.hasSettlementConvention()).toBe(true);
        const convention = parsed.getSettlementConvention()!;
        expect(convention.getTradeDate()!.toObject()).toEqual({ year: 2026, month: 11, day: 25 });
        expect(convention.getSettlementLagBusinessDays()).toBe(1);
        expect(convention.getCalendarId()).toBe('US_SIFMA');
        expect(parsed.getMeasuresList()).toEqual([MeasureProto.DV01]);
    });

    test('a response round-trips both dates and a DV01 result', () => {
        const result = new MeasureMapEntry();
        result.setMeasure(MeasureProto.DV01);
        result.setMeasureDecimalValue(decimal('502.50'));
        const response = new ValuationResponseProto()
            .setValuationRequest(fullRequest())
            .setSettlementDate(date(2026, 11, 27))
            .setMeasureAsofDate(date(2026, 11, 27))
            .setMeasureResultsList([result]);
        const parsed = ValuationResponseProto.deserializeBinary(response.serializeBinary());
        expect(parsed.toObject()).toEqual(response.toObject());
        expect(parsed.getSettlementDate()!.toObject()).toEqual({ year: 2026, month: 11, day: 27 });
        expect(parsed.getMeasureAsofDate()!.toObject()).toEqual({ year: 2026, month: 11, day: 27 });
        const [entry] = parsed.getMeasureResultsList();
        expect(entry.getMeasure()).toBe(MeasureProto.DV01);
        expect(toCanonicalString(decodeDecimal(entry.getMeasureDecimalValue()!))).toBe('502.50');
    });

    test('a zero-lag convention reports present', () => {
        const request = new ValuationRequestProto()
            .setSettlementConvention(ValuationRequests.settlementConvention(date(2026, 11, 25), 0, 'US_SIFMA'));
        const parsed = ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.hasSettlementConvention()).toBe(true);
        expect(parsed.getSettlementConvention()!.getSettlementLagBusinessDays()).toBe(0);
    });

    test('v1.1.62 request bytes parse with the convention unset', () => {
        const bytes = Uint8Array.from(Buffer.from(fs.readFileSync(OLD_REQUEST_HEX, 'utf8').trim(), 'hex'));
        const parsed = ValuationRequestProto.deserializeBinary(bytes);
        expect(parsed.hasSettlementConvention()).toBe(false);
        expect(parsed.getMeasuresList()).toEqual([MeasureProto.DV01]);
        expect(parsed.getAsofDatetime()!.getTimestamp()!.getSeconds()).toBe(1795813200); // 2026-11-27T21:00:00Z
        expect(parsed.getAsofDatetime()!.getTimeZone()).toBe('America/New_York');
        expect(parsed.hasPositionInput()).toBe(true);
        const bond = parsed.getProductInput()!.getBond()!;
        expect(bond.getSecurity()!.getIssuerName()).toBe('US Treasury');
        expect(toCanonicalString(decodeDecimal(bond.getCleanPrice()!))).toBe('99.75');
        // Nothing is dropped on re-encode. google-protobuf writes fields in
        // declaration order, not number order, so compare parsed values.
        expect(ValuationRequestProto.deserializeBinary(parsed.serializeBinary()).toObject()).toEqual(parsed.toObject());
    });

    test('a response without a convention leaves both dates unset', () => {
        const parsed = ValuationResponseProto.deserializeBinary(new ValuationResponseProto().serializeBinary());
        expect(parsed.hasSettlementDate()).toBe(false);
        expect(parsed.hasMeasureAsofDate()).toBe(false);
    });
});

describe('ValuationRequests.settlementConvention (LM-509)', () => {
    test('rejects a blank calendar', () => {
        for (const blank of ['', '   ']) {
            expect(violationFields(() => ValuationRequests.settlementConvention(date(2026, 11, 25), 1, blank)))
                .toEqual(['settlement_convention.calendar_id']);
        }
    });

    test('rejects an unset trade_date', () => {
        expect(violationFields(() => ValuationRequests.settlementConvention(undefined, 1, 'US_SIFMA')))
            .toEqual(['settlement_convention.trade_date']);
    });

    test('rejects a negative or fractional lag', () => {
        for (const lag of [-1, 1.5]) {
            expect(violationFields(() => ValuationRequests.settlementConvention(date(2026, 11, 25), lag, 'US_SIFMA')))
                .toEqual(['settlement_convention.settlement_lag_business_days']);
        }
    });

    test('accepts a zero lag', () => {
        const convention = ValuationRequests.settlementConvention(date(2026, 11, 25), 0, 'US_SIFMA');
        expect(convention).toBeInstanceOf(SettlementConventionProto);
        expect(convention.getSettlementLagBusinessDays()).toBe(0);
        expect(convention.hasTradeDate()).toBe(true);
    });

    test('passes an unknown calendar through', () => {
        // valuation-service owns the calendars and rejects an unknown id.
        expect(ValuationRequests.settlementConvention(date(2026, 11, 25), 1, 'XX_UNKNOWN').getCalendarId())
            .toBe('XX_UNKNOWN');
    });
});
