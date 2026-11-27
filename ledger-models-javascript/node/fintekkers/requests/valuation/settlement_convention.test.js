"use strict";
/**
 * LM-509 — the settlement convention and DV01_PER_MILLION contract.
 *
 * A request with SettlementConventionProto (80) and DV01_PER_MILLION, and a
 * response with settlement_date (60), measure_asof_date (61) and a
 * DV01_PER_MILLION result, round-trip unchanged. Request bytes written by
 * v1.1.62 parse with the convention unset and every existing field as it was.
 * ValuationRequests.settlementConvention checks only the calendar-free rules
 * the proto comment states; it computes no date.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const valuation_request_pb_1 = require("./valuation_request_pb");
const valuation_response_pb_1 = require("./valuation_response_pb");
const measure_pb_1 = require("../../../fintekkers/models/position/measure_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const errors_1 = require("../../../wrappers/models/errors");
const decimal_1 = require("../../../wrappers/models/utils/decimal");
const ValuationRequests_1 = require("../../../wrappers/requests/valuation/ValuationRequests");
const OLD_REQUEST_HEX = path.resolve(__dirname, '../../../../../test-fixtures/wire/lm-509-request-v1.1.62.hex');
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
function fullRequest() {
    return new valuation_request_pb_1.ValuationRequestProto()
        .setMeasuresList([measure_pb_1.MeasureProto.DV01_PER_MILLION, measure_pb_1.MeasureProto.DV01])
        .setSettlementConvention(ValuationRequests_1.ValuationRequests.settlementConvention(date(2026, 11, 25), 1, 'US_SIFMA'));
}
function violationFields(call) {
    try {
        call();
    }
    catch (e) {
        expect(e).toBeInstanceOf(errors_1.ModelValidationError);
        return e.violations.map((v) => v.getField());
    }
    throw new Error('expected a ModelValidationError');
}
describe('LM-509 settlement convention and DV01_PER_MILLION', () => {
    test('DV01_PER_MILLION is 31 and DV01 stays 25', () => {
        expect(measure_pb_1.MeasureProto.DV01_PER_MILLION).toBe(31);
        expect(measure_pb_1.MeasureProto.DV01).toBe(25);
    });
    test('a request round-trips every new field', () => {
        const request = fullRequest();
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.toObject()).toEqual(request.toObject());
        expect(parsed.hasSettlementConvention()).toBe(true);
        const convention = parsed.getSettlementConvention();
        expect(convention.getTradeDate().toObject()).toEqual({ year: 2026, month: 11, day: 25 });
        expect(convention.getSettlementLagBusinessDays()).toBe(1);
        expect(convention.getCalendarId()).toBe('US_SIFMA');
        expect(parsed.getMeasuresList()).toEqual([measure_pb_1.MeasureProto.DV01_PER_MILLION, measure_pb_1.MeasureProto.DV01]);
    });
    test('a response round-trips both dates and a DV01_PER_MILLION result', () => {
        const result = new position_util_pb_1.MeasureMapEntry();
        result.setMeasure(measure_pb_1.MeasureProto.DV01_PER_MILLION);
        result.setMeasureDecimalValue(decimal('502.50'));
        const response = new valuation_response_pb_1.ValuationResponseProto()
            .setValuationRequest(fullRequest())
            .setSettlementDate(date(2026, 11, 27))
            .setMeasureAsofDate(date(2026, 11, 27))
            .setMeasureResultsList([result]);
        const parsed = valuation_response_pb_1.ValuationResponseProto.deserializeBinary(response.serializeBinary());
        expect(parsed.toObject()).toEqual(response.toObject());
        expect(parsed.getSettlementDate().toObject()).toEqual({ year: 2026, month: 11, day: 27 });
        expect(parsed.getMeasureAsofDate().toObject()).toEqual({ year: 2026, month: 11, day: 27 });
        const [entry] = parsed.getMeasureResultsList();
        expect(entry.getMeasure()).toBe(measure_pb_1.MeasureProto.DV01_PER_MILLION);
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(entry.getMeasureDecimalValue()))).toBe('502.50');
    });
    test('a zero-lag convention reports present', () => {
        const request = new valuation_request_pb_1.ValuationRequestProto()
            .setSettlementConvention(ValuationRequests_1.ValuationRequests.settlementConvention(date(2026, 11, 25), 0, 'US_SIFMA'));
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(request.serializeBinary());
        expect(parsed.hasSettlementConvention()).toBe(true);
        expect(parsed.getSettlementConvention().getSettlementLagBusinessDays()).toBe(0);
    });
    test('v1.1.62 request bytes parse with the convention unset', () => {
        const bytes = Uint8Array.from(Buffer.from(fs.readFileSync(OLD_REQUEST_HEX, 'utf8').trim(), 'hex'));
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(bytes);
        expect(parsed.hasSettlementConvention()).toBe(false);
        expect(parsed.getMeasuresList()).toEqual([measure_pb_1.MeasureProto.DV01]);
        expect(parsed.getAsofDatetime().getTimestamp().getSeconds()).toBe(1795813200); // 2026-11-27T21:00:00Z
        expect(parsed.getAsofDatetime().getTimeZone()).toBe('America/New_York');
        expect(parsed.hasPositionInput()).toBe(true);
        const bond = parsed.getProductInput().getBond();
        expect(bond.getSecurity().getIssuerName()).toBe('US Treasury');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(bond.getCleanPrice()))).toBe('99.75');
        // Nothing is dropped on re-encode. google-protobuf writes fields in
        // declaration order, not number order, so compare parsed values.
        expect(valuation_request_pb_1.ValuationRequestProto.deserializeBinary(parsed.serializeBinary()).toObject()).toEqual(parsed.toObject());
    });
    test('a response without a convention leaves both dates unset', () => {
        const parsed = valuation_response_pb_1.ValuationResponseProto.deserializeBinary(new valuation_response_pb_1.ValuationResponseProto().serializeBinary());
        expect(parsed.hasSettlementDate()).toBe(false);
        expect(parsed.hasMeasureAsofDate()).toBe(false);
    });
});
describe('ValuationRequests.settlementConvention (LM-509)', () => {
    test('rejects a blank calendar', () => {
        for (const blank of ['', '   ']) {
            expect(violationFields(() => ValuationRequests_1.ValuationRequests.settlementConvention(date(2026, 11, 25), 1, blank)))
                .toEqual(['settlement_convention.calendar_id']);
        }
    });
    test('rejects an unset trade_date', () => {
        expect(violationFields(() => ValuationRequests_1.ValuationRequests.settlementConvention(undefined, 1, 'US_SIFMA')))
            .toEqual(['settlement_convention.trade_date']);
    });
    test('rejects a negative or fractional lag', () => {
        for (const lag of [-1, 1.5]) {
            expect(violationFields(() => ValuationRequests_1.ValuationRequests.settlementConvention(date(2026, 11, 25), lag, 'US_SIFMA')))
                .toEqual(['settlement_convention.settlement_lag_business_days']);
        }
    });
    test('accepts a zero lag', () => {
        const convention = ValuationRequests_1.ValuationRequests.settlementConvention(date(2026, 11, 25), 0, 'US_SIFMA');
        expect(convention).toBeInstanceOf(valuation_request_pb_1.SettlementConventionProto);
        expect(convention.getSettlementLagBusinessDays()).toBe(0);
        expect(convention.hasTradeDate()).toBe(true);
    });
    test('passes an unknown calendar through', () => {
        // valuation-service owns the calendars and rejects an unknown id.
        expect(ValuationRequests_1.ValuationRequests.settlementConvention(date(2026, 11, 25), 1, 'XX_UNKNOWN').getCalendarId())
            .toBe('XX_UNKNOWN');
    });
});
//# sourceMappingURL=settlement_convention.test.js.map