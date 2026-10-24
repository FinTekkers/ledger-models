"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.select = exports.standardBillTerm = void 0;
const tenor_type_pb_1 = require("../../../fintekkers/models/security/tenor_type_pb");
const index_type_pb_1 = require("../../../fintekkers/models/security/index/index_type_pb");
const product_inputs_pb_1 = require("../../../fintekkers/requests/valuation/product_inputs_pb");
const date_1 = require("../utils/date");
/**
 * Picks a Treasury FRN's 13-week bill fixing from Treasury bill auctions.
 * The same helpers as Java's `TreasuryFrnFixings`, Python's
 * `treasury_frn_fixings` and Rust's `treasury_frn_fixings`; all are tested
 * against `test-fixtures/treasury-frn-fixings.json`.
 * See `docs/adr/frn_reference_rate_fixings.md` (LM-382, LM-385, LM-386).
 */
/** Treasury's standard bill terms, in weeks. */
const STANDARD_BILL_WEEKS = [4, 6, 8, 13, 17, 26, 52];
/** A tenor snaps to a standard term when its day count is within this many days of it. */
const TOLERANCE_DAYS = 3;
const THIRTEEN_WEEKS = 13;
/**
 * The standard bill term, in weeks, that `tenor` is within 3 days of: 4, 6,
 * 8, 13, 17, 26 or 52. Days are counted from `anchor` to `anchor + tenor`.
 * Null when no term is that close, or when the tenor is null, not a TERM, or
 * the anchor is null.
 */
function standardBillTerm(tenor, anchor) {
    if (!tenor || !anchor || tenor.getType() !== tenor_type_pb_1.TenorTypeProto.TERM)
        return null;
    const period = tenor.getTenor();
    if (!period)
        return null;
    const end = (0, date_1.plusDays)((0, date_1.plusMonthsClamped)(anchor, 12 * period.years + period.months), period.days);
    const days = (0, date_1.daysBetween)(anchor, end);
    for (const weeks of STANDARD_BILL_WEEKS) {
        if (Math.abs(days - 7 * weeks) <= TOLERANCE_DAYS)
            return weeks;
    }
    return null;
}
exports.standardBillTerm = standardBillTerm;
/**
 * The 13-week bill fixing on `date`: of every issuance of every bill that
 * has an auction date, an issue date and a high discount rate, was auctioned
 * on or before `date` and snaps to 13 weeks, the one with the latest auction
 * date. On a tie the first in input order wins.
 *
 * The fixing's `rate` is the issuance's `high_discount_rate` proto
 * unchanged, `fixing_date` its `auction_date`, `bill_maturity_date` the
 * bill's maturity and `bill_issue_date` its `auction_issue_date`, copied as
 * is (LM-389). Null when nothing qualifies.
 */
function select(bills, date) {
    var _a, _b, _c;
    let bestBill = null;
    let best = null;
    let bestAuctionDate = null;
    for (const bill of bills) {
        if (!bill || !bill.getMaturityDate())
            continue;
        for (const issuance of bill.getIssuances()) {
            const auctionDate = issuance.getAuctionDate();
            const issueDate = issuance.getIssueDate();
            if (!auctionDate || !issueDate || issuance.getHighDiscountRate() === null)
                continue;
            if ((0, date_1.daysBetween)(date, auctionDate) > 0)
                continue;
            if (standardBillTerm(bill.getIssuanceTenor(issuance), issueDate) !== THIRTEEN_WEEKS)
                continue;
            if (!bestAuctionDate || (0, date_1.daysBetween)(bestAuctionDate, auctionDate) > 0) {
                bestBill = bill;
                best = issuance;
                bestAuctionDate = auctionDate;
            }
        }
    }
    if (!bestBill || !best)
        return null;
    const maturity = bestBill.getMaturityDate();
    return new product_inputs_pb_1.ReferenceRateFixingProto()
        .setIndex(index_type_pb_1.IndexTypeProto.T_BILL_13_WEEK)
        .setFixingDate((_a = best.proto.getAuctionDate()) === null || _a === void 0 ? void 0 : _a.cloneMessage())
        .setRate((_b = best.proto.getHighDiscountRate()) === null || _b === void 0 ? void 0 : _b.cloneMessage())
        .setBillMaturityDate((0, date_1.dateToLocalDateProto)(maturity))
        .setBillIssueDate((_c = best.proto.getAuctionIssueDate()) === null || _c === void 0 ? void 0 : _c.cloneMessage());
}
exports.select = select;
//# sourceMappingURL=TreasuryFrnFixings.js.map