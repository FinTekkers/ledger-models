"use strict";
/**
 * Step 3 tests — FrnInput / ProductInput proto round-trips.
 *
 * For each new message type: construct → serializeBinary() → deserializeBinary() → verify all fields match.
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
const jspb = __importStar(require("google-protobuf"));
const product_inputs_pb_1 = require("./product_inputs_pb");
const valuation_request_pb_1 = require("./valuation_request_pb");
const issuance_pb_1 = require("../../../fintekkers/models/security/bond/issuance_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const tax_lot_pb_1 = require("../../../fintekkers/models/position/tax_lot_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
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
    function requestAt(tips, seconds) {
        const timestamp = new timestamp_pb_1.Timestamp();
        timestamp.setSeconds(seconds);
        const asof = new local_timestamp_pb_1.LocalTimestampProto();
        asof.setTimestamp(timestamp);
        const req = request(tips);
        req.setAsofDatetime(asof);
        return req;
    }
    function readingsTips(rows) {
        const readings = new product_inputs_pb_1.MonthlyIndexReadings();
        for (const [year, month, value] of rows) {
            readings.addReadings(reading(year, month, value));
        }
        const cpi = new product_inputs_pb_1.InflationIndexInput();
        cpi.setIndex(cpiIndex());
        cpi.setReadings(readings);
        const tips = new product_inputs_pb_1.TipsInput();
        tips.setSecurity(tipsSecurity());
        tips.setCleanPrice(decimal('97.50'));
        tips.setCpi(cpi);
        return tips;
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
    test('readings with extra lot months survive unchanged (LM-405)', () => {
        // 2026-02-17T14:30:00Z: m-3 and m-2 are 2025-11 and 2025-12. A lot
        // settling in 2025-11 adds 2025-08 and 2025-09. Listed out of order.
        const rows = [
            [2025, 12, '324.05400'],
            [2025, 8, '323.97600'],
            [2025, 11, '324.12200'],
            [2025, 9, '324.80000'],
        ];
        const original = requestAt(readingsTips(rows), 1771338600);
        const parsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(original.serializeBinary());
        expect(parsed.toObject()).toEqual(original.toObject());
        expect(parsed.serializeBinary()).toEqual(original.serializeBinary());
        expect(parsed.getAsofDatetime().getTimestamp().toDate().toISOString()).toBe('2026-02-17T14:30:00.000Z');
        const got = parsed.getProductInput().getTips().getCpi().getReadings().getReadingsList()
            .map(r => [r.getYear(), r.getMonth(), text(r.getValue())]);
        expect(got).toEqual(rows);
    });
    test('backward compat: readings case with only m-3 and m-2 survives unchanged', () => {
        // 2026-07-16T00:00:00Z: m-3 and m-2 are 2026-04 and 2026-05.
        const original = requestAt(readingsTips([[2026, 4, '320.000'], [2026, 5, '321.500']]), 1784160000);
        const reparsed = valuation_request_pb_1.ValuationRequestProto.deserializeBinary(original.serializeBinary());
        expect(reparsed.toObject()).toEqual(original.toObject());
        expect(reparsed.serializeBinary()).toEqual(original.serializeBinary());
        const parsed = roundtripTips(original);
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
});
const removedFieldsPath = path.resolve(__dirname, '../../../../../test-fixtures/removed-fields/lm-344.json');
const removedFields = JSON.parse(fs.readFileSync(removedFieldsPath, 'utf8')).fields;
const removedFieldMessages = {
    '.fintekkers.requests.valuation.ValuationRequestProto': valuation_request_pb_1.ValuationRequestProto,
    '.fintekkers.requests.valuation.TipsInput': product_inputs_pb_1.TipsInput,
};
function removedFieldMessage(message) {
    if (!Object.prototype.hasOwnProperty.call(removedFieldMessages, message)) {
        throw new Error(`fixture names an unknown message: ${message}`);
    }
    return removedFieldMessages[message];
}
describe('fields removed in 0.5 (LM-344)', () => {
    test('the fixture lists three fields', () => {
        expect(removedFields).toHaveLength(3);
    });
    test.each(removedFields.map((f) => [`${f.message}.${f.name}`, f]))('%s has no accessors and no toObject key', (_label, field) => {
        const message = removedFieldMessage(field.message);
        const camel = field.name.split('_').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
        for (const verb of ['get', 'set', 'has', 'clear']) {
            expect(`${verb}${camel}` in message.prototype).toBe(false);
        }
        const lowerCamel = camel[0].toLowerCase() + camel.slice(1);
        expect(Object.keys(new message().toObject())).not.toContain(lowerCamel);
    });
});
// ── Reference-rate fixings on FrnInput (LM-365) ─────────────────────────────
// T_BILL_13_WEEK is a non-default enum value, so it is on the wire.
// google-protobuf JS has no runtime descriptors: the field numbers and types
// are checked on the wire bytes instead.
function canonical(d) {
    return (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(d));
}
function fixing(index, fixingDate, rate) {
    const f = new product_inputs_pb_1.ReferenceRateFixingProto();
    f.setIndex(index);
    f.setFixingDate(fixingDate);
    f.setRate(decimal(rate));
    return f;
}
// Wire types from the protobuf encoding spec. google-protobuf v4 does not
// export BinaryConstants at runtime.
const VARINT = 0;
const DELIMITED = 2;
/** [field number, wire type] of each field in bytes, in order. */
function wireFields(bytes) {
    const reader = new jspb.BinaryReader(bytes);
    const out = [];
    while (reader.nextField() && !reader.isEndGroup()) {
        out.push([reader.getFieldNumber(), reader.getWireType()]);
        reader.skipField();
    }
    return out;
}
/** The payload of the one length-delimited field in bytes, decoded as T. */
function onlyMessage(bytes, number, type) {
    const reader = new jspb.BinaryReader(bytes);
    expect(reader.nextField()).toBe(true);
    expect(reader.getFieldNumber()).toBe(number);
    expect(reader.getWireType()).toBe(DELIMITED);
    const payload = reader.readBytes();
    expect(reader.nextField()).toBe(false);
    return type.deserializeBinary(payload);
}
describe('ReferenceRateFixingProto round-trip (LM-365)', () => {
    test('index, fixing_date and rate survive', () => {
        const original = fixing(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK, date(2026, 10, 19), '0.0432');
        const parsed = product_inputs_pb_1.ReferenceRateFixingProto.deserializeBinary(original.serializeBinary());
        expect(parsed.getIndex()).toBe(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK);
        expect(parsed.getFixingDate().getYear()).toBe(2026);
        expect(parsed.getFixingDate().getMonth()).toBe(10);
        expect(parsed.getFixingDate().getDay()).toBe(19);
        expect(canonical(parsed.getRate())).toBe('0.0432');
    });
    test('two fixings on FrnInput survive in order', () => {
        const original = new product_inputs_pb_1.FrnInput();
        original.setCleanPrice(decimal('99.75'));
        original.addFixings(fixing(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK, date(2026, 10, 19), '0.0432'));
        original.addFixings(fixing(index_type_pb_1.IndexTypeProto.SOFR, date(2026, 10, 26), '4.29'));
        const parsed = product_inputs_pb_1.FrnInput.deserializeBinary(original.serializeBinary());
        const got = parsed.getFixingsList().map(f => [
            f.getIndex(), f.getFixingDate().getYear(), f.getFixingDate().getMonth(),
            f.getFixingDate().getDay(), canonical(f.getRate()),
        ]);
        expect(got).toEqual([
            [index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK, 2026, 10, 19, '0.0432'],
            [index_type_pb_1.IndexTypeProto.SOFR, 2026, 10, 26, '4.29'],
        ]);
        expect(canonical(parsed.getCleanPrice())).toBe('99.75');
    });
});
describe('LM-365 wire field numbers and types', () => {
    test('ReferenceRateFixingProto: index = 1 enum, fixing_date = 2 LocalDateProto, rate = 3 DecimalValueProto', () => {
        const full = fixing(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK, date(2026, 10, 19), '0.0432');
        expect(wireFields(full.serializeBinary())).toEqual([[1, VARINT], [2, DELIMITED], [3, DELIMITED]]);
        const index = new product_inputs_pb_1.ReferenceRateFixingProto();
        index.setIndex(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK);
        const reader = new jspb.BinaryReader(index.serializeBinary());
        expect(reader.nextField()).toBe(true);
        expect(reader.getFieldNumber()).toBe(1);
        expect(reader.getWireType()).toBe(VARINT);
        expect(reader.readEnum()).toBe(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK);
        const onlyDate = new product_inputs_pb_1.ReferenceRateFixingProto();
        onlyDate.setFixingDate(date(2026, 10, 19));
        expect(onlyMessage(onlyDate.serializeBinary(), 2, local_date_pb_1.LocalDateProto).getDay()).toBe(19);
        const onlyRate = new product_inputs_pb_1.ReferenceRateFixingProto();
        onlyRate.setRate(decimal('0.0432'));
        expect(canonical(onlyMessage(onlyRate.serializeBinary(), 3, decimal_value_pb_1.DecimalValueProto))).toBe('0.0432');
    });
    test('FrnInput keeps security = 1, clean_price = 2, curve = 10 and adds repeated fixings = 11', () => {
        const frn = new product_inputs_pb_1.FrnInput();
        frn.setSecurity(new security_pb_1.SecurityProto());
        frn.setCleanPrice(decimal('99.75'));
        frn.setCurve(sofrCurve());
        frn.addFixings(fixing(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK, date(2026, 10, 19), '0.0432'));
        frn.addFixings(fixing(index_type_pb_1.IndexTypeProto.SOFR, date(2026, 10, 26), '4.29'));
        expect(wireFields(frn.serializeBinary())).toEqual([
            [1, DELIMITED], [2, DELIMITED], [10, DELIMITED], [11, DELIMITED], [11, DELIMITED],
        ]);
        const onlyFixing = new product_inputs_pb_1.FrnInput();
        onlyFixing.addFixings(fixing(index_type_pb_1.IndexTypeProto.SOFR, date(2026, 10, 26), '4.29'));
        const parsed = onlyMessage(onlyFixing.serializeBinary(), 11, product_inputs_pb_1.ReferenceRateFixingProto);
        expect(parsed.getIndex()).toBe(index_type_pb_1.IndexTypeProto.SOFR);
        expect(canonical(parsed.getRate())).toBe('4.29');
    });
});
// ── T-bill fixing dates (LM-382) ────────────────────────────────────────────
// The T_BILL_13_WEEK fixing carries its bill's maturity, and the issuance its
// auction date. Each date differs, so a swapped field fails.
describe('LM-382 auction_date and bill_maturity_date round-trip', () => {
    test('bill_maturity_date = 4 survives on the fixing', () => {
        const original = fixing(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK, date(2026, 7, 20), '4.215');
        original.setBillMaturityDate(date(2026, 10, 22));
        expect(wireFields(original.serializeBinary())).toEqual([[1, VARINT], [2, DELIMITED], [3, DELIMITED], [4, DELIMITED]]);
        const parsed = product_inputs_pb_1.ReferenceRateFixingProto.deserializeBinary(original.serializeBinary());
        expect(parsed.getIndex()).toBe(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK);
        expect(parsed.getFixingDate().toObject()).toEqual(date(2026, 7, 20).toObject());
        expect(parsed.hasBillMaturityDate()).toBe(true);
        expect(parsed.getBillMaturityDate().toObject()).toEqual(date(2026, 10, 22).toObject());
        expect(canonical(parsed.getRate())).toBe('4.215');
    });
    test('auction_date = 29 survives on the issuance', () => {
        const original = new issuance_pb_1.IssuanceProto();
        original.setAuctionAnnouncementDate(date(2026, 7, 16));
        original.setAuctionDate(date(2026, 7, 20));
        original.setAuctionIssueDate(date(2026, 7, 23));
        original.setHighDiscountRate(decimal('4.215'));
        const onlyAuctionDate = new issuance_pb_1.IssuanceProto();
        onlyAuctionDate.setAuctionDate(date(2026, 7, 20));
        expect(onlyMessage(onlyAuctionDate.serializeBinary(), 29, local_date_pb_1.LocalDateProto).getDay()).toBe(20);
        const parsed = issuance_pb_1.IssuanceProto.deserializeBinary(original.serializeBinary());
        expect(parsed.hasAuctionDate()).toBe(true);
        expect(parsed.getAuctionDate().toObject()).toEqual(date(2026, 7, 20).toObject());
        expect(parsed.getAuctionIssueDate().toObject()).toEqual(date(2026, 7, 23).toObject());
        expect(parsed.getAuctionAnnouncementDate().toObject()).toEqual(date(2026, 7, 16).toObject());
        expect(canonical(parsed.getHighDiscountRate())).toBe('4.215');
    });
    test('a message without the new fields decodes with them unset', () => {
        const fixingBytes = fixing(index_type_pb_1.IndexTypeProto.SOFR, date(2026, 10, 26), '4.29').serializeBinary();
        const oldIssuance = new issuance_pb_1.IssuanceProto();
        oldIssuance.setAuctionIssueDate(date(2026, 7, 23));
        const parsedFixing = product_inputs_pb_1.ReferenceRateFixingProto.deserializeBinary(fixingBytes);
        const parsedIssuance = issuance_pb_1.IssuanceProto.deserializeBinary(oldIssuance.serializeBinary());
        expect(parsedFixing.hasBillMaturityDate()).toBe(false);
        expect(parsedFixing.getBillMaturityDate()).toBeUndefined();
        expect(parsedFixing.hasBillIssueDate()).toBe(false);
        expect(parsedFixing.getBillIssueDate()).toBeUndefined();
        expect(parsedIssuance.hasAuctionDate()).toBe(false);
        expect(parsedIssuance.getAuctionDate()).toBeUndefined();
        expect(parsedIssuance.getAuctionIssueDate().toObject()).toEqual(date(2026, 7, 23).toObject());
    });
});
// ── T-bill fixing issue date (LM-389) ───────────────────────────────────────
// The T_BILL_13_WEEK fixing carries its auction's issue date. Fixing, issue
// and maturity dates all differ, so a swapped field fails.
describe('LM-389 bill_issue_date round-trip', () => {
    test('bill_issue_date = 5 survives on the fixing', () => {
        const original = fixing(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK, date(2026, 7, 20), '4.215');
        original.setBillMaturityDate(date(2026, 10, 22));
        original.setBillIssueDate(date(2026, 7, 23));
        expect(wireFields(original.serializeBinary())).toEqual([[1, VARINT], [2, DELIMITED], [3, DELIMITED], [4, DELIMITED], [5, DELIMITED]]);
        const parsed = product_inputs_pb_1.ReferenceRateFixingProto.deserializeBinary(original.serializeBinary());
        expect(parsed.hasBillIssueDate()).toBe(true);
        expect(parsed.getBillIssueDate().toObject()).toEqual(date(2026, 7, 23).toObject());
        expect(parsed.getFixingDate().toObject()).toEqual(date(2026, 7, 20).toObject());
        expect(parsed.getBillMaturityDate().toObject()).toEqual(date(2026, 10, 22).toObject());
    });
});
// ── mbs, equity and cash arms (LM-408) ──────────────────────────────────────
// Each new arm round-trips through bytes as the same arm, with the security,
// the price and, for mbs, a non-default cost_basis.
function security(productType, issuerName) {
    const s = new security_pb_1.SecurityProto();
    s.setProductType(productType);
    s.setIssuerName(issuerName);
    return s;
}
describe('LM-408 ProductInput arms round-trip', () => {
    test('mbs = 13 survives with security, clean_price and cost_basis', () => {
        const ext = new security_pb_1.MbsExtensionProto();
        ext.setPoolNumber('FN AS1234');
        ext.setCurrentFactor(decimal('0.8125'));
        const sec = security(product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED, 'FNMA');
        sec.setMbsExtension(ext);
        const lot = new tax_lot_pb_1.TaxLotProto();
        lot.setOpenDate(date(2025, 6, 2));
        lot.setOpenQuantity(decimal('250000'));
        lot.setPrice(decimal('99.50'));
        const costBasis = new product_inputs_pb_1.CostBasisInput();
        costBasis.addLots(lot);
        const mbs = new product_inputs_pb_1.MbsInput();
        mbs.setSecurity(sec);
        mbs.setCleanPrice(decimal('101.5'));
        mbs.setCostBasis(costBasis);
        const original = new product_inputs_pb_1.ProductInput();
        original.setMbs(mbs);
        const parsed = product_inputs_pb_1.ProductInput.deserializeBinary(original.serializeBinary());
        expect(parsed.getInputCase()).toBe(product_inputs_pb_1.ProductInput.InputCase.MBS);
        expect(parsed.toObject()).toEqual(original.toObject());
        const m = parsed.getMbs();
        expect(m.hasSecurity()).toBe(true);
        expect(m.getSecurity().getProductType()).toBe(product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED);
        expect(m.getSecurity().getMbsExtension().getPoolNumber()).toBe('FN AS1234');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(m.getCleanPrice()))).toBe('101.5');
        expect(m.hasCostBasis()).toBe(true);
        const lots = m.getCostBasis().getLotsList();
        expect(lots).toHaveLength(1);
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(lots[0].getOpenQuantity()))).toBe('250000');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(lots[0].getPrice()))).toBe('99.50');
    });
    test('equity = 14 survives with security and unit_price', () => {
        const equity = new product_inputs_pb_1.EquityInput();
        equity.setSecurity(security(product_type_pb_1.ProductTypeProto.COMMON_STOCK, 'equity'));
        equity.setUnitPrice(decimal('187.25'));
        const original = new product_inputs_pb_1.ProductInput();
        original.setEquity(equity);
        const parsed = product_inputs_pb_1.ProductInput.deserializeBinary(original.serializeBinary());
        expect(parsed.getInputCase()).toBe(product_inputs_pb_1.ProductInput.InputCase.EQUITY);
        expect(parsed.toObject()).toEqual(original.toObject());
        const e = parsed.getEquity();
        expect(e.hasSecurity()).toBe(true);
        expect(e.getSecurity().getProductType()).toBe(product_type_pb_1.ProductTypeProto.COMMON_STOCK);
        expect(e.getSecurity().getIssuerName()).toBe('equity');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(e.getUnitPrice()))).toBe('187.25');
    });
    test('cash = 15 survives with security and unit_price', () => {
        const cash = new product_inputs_pb_1.CashInput();
        cash.setSecurity(security(product_type_pb_1.ProductTypeProto.MONEY_MARKET_FUND, 'cash'));
        cash.setUnitPrice(decimal('1.00'));
        const original = new product_inputs_pb_1.ProductInput();
        original.setCash(cash);
        const parsed = product_inputs_pb_1.ProductInput.deserializeBinary(original.serializeBinary());
        expect(parsed.getInputCase()).toBe(product_inputs_pb_1.ProductInput.InputCase.CASH);
        expect(parsed.toObject()).toEqual(original.toObject());
        const c = parsed.getCash();
        expect(c.hasSecurity()).toBe(true);
        expect(c.getSecurity().getProductType()).toBe(product_type_pb_1.ProductTypeProto.MONEY_MARKET_FUND);
        expect(c.getSecurity().getIssuerName()).toBe('cash');
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(c.getUnitPrice()))).toBe('1.00');
    });
});
//# sourceMappingURL=product_inputs.test.js.map