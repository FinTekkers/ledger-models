"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Treasury FRN 13-week fixing helpers (LM-386, part 3 of LM-382): the
// per-issuance tenor, standardBillTerm and select, against the shared fixture
// test-fixtures/treasury-frn-fixings.json that Java and Python also pass,
// plus the skip and tie-break rules.
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const TreasuryFrnFixings_1 = require("./TreasuryFrnFixings");
const term_1 = require("./term");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const issuance_pb_1 = require("../../../fintekkers/models/security/bond/issuance_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const product_inputs_pb_1 = require("../../../fintekkers/requests/valuation/product_inputs_pb");
const decimal_1 = require("../utils/decimal");
const date_1 = require("../utils/date");
const fixturePath = path.resolve(__dirname, '../../../../../test-fixtures/treasury-frn-fixings.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
function dateProto(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new local_date_pb_1.LocalDateProto().setYear(y).setMonth(m).setDay(d);
}
/** A local-midnight Date, as localDateProtoToDate builds one. */
function localDate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function decimal(s) {
    return (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)(s));
}
function canonical(p) {
    if (!p)
        throw new Error('no decimal');
    return (0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(p));
}
/** `P<y>Y<m>M<d>D`, any part optional, as the fixture writes periods. */
function parsePeriod(s) {
    var _a, _b, _c;
    const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/.exec(s);
    if (!m)
        throw new Error(`bad period ${s}`);
    return { years: Number((_a = m[1]) !== null && _a !== void 0 ? _a : 0), months: Number((_b = m[2]) !== null && _b !== void 0 ? _b : 0), days: Number((_c = m[3]) !== null && _c !== void 0 ? _c : 0) };
}
function issuance(auctionDate, issueDate, rate) {
    const p = new issuance_pb_1.IssuanceProto();
    if (auctionDate)
        p.setAuctionDate(dateProto(auctionDate));
    if (issueDate)
        p.setAuctionIssueDate(dateProto(issueDate));
    if (rate)
        p.setHighDiscountRate(rate);
    return p;
}
function bill(maturity, issuances) {
    const bond = new security_pb_1.BondDetailsProto().setMaturityDate(dateProto(maturity)).setIssuanceInfoList(issuances);
    return new BondSecurity_1.default(new security_pb_1.SecurityProto().setProductType(product_type_pb_1.ProductTypeProto.TBILL).setBondDetails(bond));
}
function fixtureBills(block) {
    return block.bills.map(b => bill(b.maturity_date, b.issuances.map(i => {
        var _a, _b;
        return issuance((_a = i.auction_date) !== null && _a !== void 0 ? _a : null, (_b = i.auction_issue_date) !== null && _b !== void 0 ? _b : null, i.high_discount_rate ? decimal(i.high_discount_rate) : null);
    })));
}
function checkIssuanceTenors() {
    for (const row of fixture.issuance_tenors) {
        const b = bill(row.maturity_date, [issuance(null, row.auction_issue_date, null)]);
        const tenor = b.getIssuanceTenor(b.getIssuances()[0]);
        const period = tenor.getTenor();
        expect([row.case, period]).toEqual([row.case, parsePeriod(row.period)]);
        const anchor = localDate(row.auction_issue_date);
        const end = (0, date_1.plusDays)((0, date_1.plusMonthsClamped)(anchor, 12 * period.years + period.months), period.days);
        expect([row.case, (0, date_1.daysBetween)(anchor, end)]).toEqual([row.case, row.days]);
        expect([row.case, (0, TreasuryFrnFixings_1.standardBillTerm)(tenor, anchor)]).toEqual([row.case, row.standard_bill_term_weeks]);
    }
}
function checkSelectBlock(block) {
    const bills = fixtureBills(block);
    for (const c of block.cases) {
        const got = (0, TreasuryFrnFixings_1.select)(bills, localDate(c.date));
        if (c.fixing === null) {
            expect([c.case, got]).toEqual([c.case, null]);
            continue;
        }
        expect(c.fixing.index).toBe('T_BILL_13_WEEK');
        // LM-389: bill_issue_date is the chosen issuance's auction_issue_date.
        expect([c.case, typeof c.fixing.bill_issue_date]).toEqual([c.case, 'string']);
        const want = new product_inputs_pb_1.ReferenceRateFixingProto()
            .setIndex(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK)
            .setFixingDate(dateProto(c.fixing.fixing_date))
            .setRate(decimal(c.fixing.rate))
            .setBillMaturityDate(dateProto(c.fixing.bill_maturity_date))
            .setBillIssueDate(dateProto(c.fixing.bill_issue_date));
        expect([c.case, got === null || got === void 0 ? void 0 : got.toObject()]).toEqual([c.case, want.toObject()]);
        // The published rate comes back unchanged, scale included.
        expect([c.case, canonical(got === null || got === void 0 ? void 0 : got.getRate())]).toEqual([c.case, c.fixing.rate]);
    }
}
// ---------- metric line 1 ----------
test('fixture issuance_tenors: period, days and standard bill term', () => {
    checkIssuanceTenors();
});
test('reopened bill: per-issuance tenors are 26W (original) and 13W (reopening)', () => {
    const b = bill('2026-10-22', [
        issuance('2026-04-20', '2026-04-23', null),
        issuance('2026-07-20', '2026-07-23', null),
    ]);
    const [original, reopening] = b.getIssuances();
    const originalTenor = b.getIssuanceTenor(original);
    const reopeningTenor = b.getIssuanceTenor(reopening);
    expect(originalTenor.getTenor()).toEqual(parsePeriod('P5M29D'));
    expect(reopeningTenor.getTenor()).toEqual(parsePeriod('P2M29D'));
    expect((0, TreasuryFrnFixings_1.standardBillTerm)(originalTenor, original.getIssueDate())).toBe(26);
    expect((0, TreasuryFrnFixings_1.standardBillTerm)(reopeningTenor, reopening.getIssueDate())).toBe(13);
});
// ---------- metric line 2 ----------
test('fixture standard_bill_terms on both anchors', () => {
    for (const row of fixture.standard_bill_terms) {
        const tenor = new term_1.Tenor(tenor_type_pb_1.TenorTypeProto.TERM, parsePeriod(row.period));
        for (const anchor of row.anchors) {
            expect([row.case, anchor, (0, TreasuryFrnFixings_1.standardBillTerm)(tenor, localDate(anchor))])
                .toEqual([row.case, anchor, row.standard_bill_term_weeks]);
        }
    }
});
// ---------- metric line 3 ----------
test('fixture select', () => {
    checkSelectBlock(fixture.select);
});
test('fixture select_skips', () => {
    checkSelectBlock(fixture.select_skips);
});
describe('fixture cases off UTC', () => {
    const originalTz = process.env.TZ;
    afterEach(() => {
        if (originalTz === undefined)
            delete process.env.TZ;
        else
            process.env.TZ = originalTz;
    });
    for (const tz of ['America/New_York', 'Pacific/Auckland']) {
        test(`issuance_tenors and select give the same results in ${tz}`, () => {
            process.env.TZ = tz;
            checkIssuanceTenors();
            checkSelectBlock(fixture.select);
            checkSelectBlock(fixture.select_skips);
        });
    }
});
// ---------- metric line 4 ----------
test('select skips an issuance missing a field or with an empty rate', () => {
    var _a, _b;
    const onDate = '2026-07-20';
    const bills = [
        bill('2026-10-22', [issuance(null, '2026-07-23', decimal('4.900'))]),
        bill('2026-10-22', [issuance(onDate, null, decimal('4.800'))]),
        bill('2026-10-22', [issuance(onDate, '2026-07-23', null)]),
        bill('2026-10-22', [issuance(onDate, '2026-07-23', new decimal_value_pb_1.DecimalValueProto())]),
        bill('2026-10-15', [issuance('2026-07-13', '2026-07-16', decimal('4.190'))]),
    ];
    const got = (0, TreasuryFrnFixings_1.select)(bills, localDate(onDate));
    expect(canonical(got === null || got === void 0 ? void 0 : got.getRate())).toBe('4.190');
    expect((_a = got === null || got === void 0 ? void 0 : got.getFixingDate()) === null || _a === void 0 ? void 0 : _a.toObject()).toEqual(dateProto('2026-07-13').toObject());
    expect((_b = got === null || got === void 0 ? void 0 : got.getBillMaturityDate()) === null || _b === void 0 ? void 0 : _b.toObject()).toEqual(dateProto('2026-10-15').toObject());
});
test('select: a tie on auction date goes to the first in input order', () => {
    var _a, _b;
    // Same auction date; the first has the smaller rate and earlier maturity,
    // so a "max rate" or "max maturity" rule would pick the other one.
    const first = () => bill('2026-10-21', [issuance('2026-07-20', '2026-07-22', decimal('4.100'))]);
    const second = () => bill('2026-10-22', [issuance('2026-07-20', '2026-07-23', decimal('4.215'))]);
    const date = localDate('2026-07-20');
    let got = (0, TreasuryFrnFixings_1.select)([first(), second()], date);
    expect(canonical(got === null || got === void 0 ? void 0 : got.getRate())).toBe('4.100');
    expect((_a = got === null || got === void 0 ? void 0 : got.getBillMaturityDate()) === null || _a === void 0 ? void 0 : _a.toObject()).toEqual(dateProto('2026-10-21').toObject());
    got = (0, TreasuryFrnFixings_1.select)([second(), first()], date);
    expect(canonical(got === null || got === void 0 ? void 0 : got.getRate())).toBe('4.215');
    expect((_b = got === null || got === void 0 ? void 0 : got.getBillMaturityDate()) === null || _b === void 0 ? void 0 : _b.toObject()).toEqual(dateProto('2026-10-22').toObject());
});
// ---------- LM-389: bill_issue_date ----------
test('select: a reopening\'s bill_issue_date is the reopening\'s, not the original\'s', () => {
    var _a, _b;
    const got = (0, TreasuryFrnFixings_1.select)(fixtureBills(fixture.select), localDate('2026-07-20'));
    expect((_a = got === null || got === void 0 ? void 0 : got.getBillIssueDate()) === null || _a === void 0 ? void 0 : _a.toObject()).toEqual(dateProto('2026-07-23').toObject());
    expect((_b = got === null || got === void 0 ? void 0 : got.getBillIssueDate()) === null || _b === void 0 ? void 0 : _b.toObject()).not.toEqual(dateProto('2026-04-23').toObject());
});
test('select: bill_issue_date is copied from the issuance, not derived', () => {
    var _a, _b;
    // Issued four days after the auction (e.g. a holiday), so the issue date
    // is neither maturity - 91 days nor auction + 3 days: 2026-07-23.
    const late = bill('2026-10-22', [issuance('2026-07-20', '2026-07-24', decimal('4.215'))]);
    const got = (0, TreasuryFrnFixings_1.select)([late], localDate('2026-07-20'));
    expect((_a = got === null || got === void 0 ? void 0 : got.getBillIssueDate()) === null || _a === void 0 ? void 0 : _a.toObject()).toEqual(dateProto('2026-07-24').toObject());
    expect((_b = got === null || got === void 0 ? void 0 : got.getBillIssueDate()) === null || _b === void 0 ? void 0 : _b.toObject()).not.toEqual(dateProto('2026-07-23').toObject());
});
//# sourceMappingURL=TreasuryFrnFixings.test.js.map