import BondSecurity from './BondSecurity';
import Issuance from './Issuance';
import { Tenor } from './term';
import { TenorTypeProto } from '../../../fintekkers/models/security/tenor_type_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { ReferenceRateFixingProto } from '../../../fintekkers/requests/valuation/product_inputs_pb';
import { dateToLocalDateProto, daysBetween, plusDays, plusMonthsClamped } from '../utils/date';

/**
 * Picks a Treasury FRN's 13-week bill fixing from Treasury bill auctions.
 * The same helpers as Java's `TreasuryFrnFixings`, Python's
 * `treasury_frn_fixings` and Rust's `treasury_frn_fixings`; all are tested
 * against `test-fixtures/treasury-frn-fixings.json`.
 * See `docs/adr/frn_reference_rate_fixings.md` (LM-382, LM-385, LM-386).
 *
 * Deprecated (LM-410): FRN fixings now come from price-service (MDI-100) and
 * reach forSecurity ready to use through MarketData; nothing here picks them
 * any more. To be deleted in LM-411, once ledger-service no longer calls the
 * Java copy (LS-202). See docs/adr/product_input_builders.md.
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
export function standardBillTerm(tenor: Tenor | null, anchor: Date | null): number | null {
  if (!tenor || !anchor || tenor.getType() !== TenorTypeProto.TERM) return null;
  const period = tenor.getTenor();
  if (!period) return null;
  const end = plusDays(plusMonthsClamped(anchor, 12 * period.years + period.months), period.days);
  const days = daysBetween(anchor, end);
  for (const weeks of STANDARD_BILL_WEEKS) {
    if (Math.abs(days - 7 * weeks) <= TOLERANCE_DAYS) return weeks;
  }
  return null;
}

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
export function select(bills: BondSecurity[], date: Date): ReferenceRateFixingProto | null {
  let bestBill: BondSecurity | null = null;
  let best: Issuance | null = null;
  let bestAuctionDate: Date | null = null;
  for (const bill of bills) {
    if (!bill || !bill.getMaturityDate()) continue;
    for (const issuance of bill.getIssuances()) {
      const auctionDate = issuance.getAuctionDate();
      const issueDate = issuance.getIssueDate();
      if (!auctionDate || !issueDate || issuance.getHighDiscountRate() === null) continue;
      if (daysBetween(date, auctionDate) > 0) continue;
      if (standardBillTerm(bill.getIssuanceTenor(issuance), issueDate) !== THIRTEEN_WEEKS) continue;
      if (!bestAuctionDate || daysBetween(bestAuctionDate, auctionDate) > 0) {
        bestBill = bill;
        best = issuance;
        bestAuctionDate = auctionDate;
      }
    }
  }
  if (!bestBill || !best) return null;
  const maturity = bestBill.getMaturityDate() as Date;
  return new ReferenceRateFixingProto()
    .setIndex(IndexTypeProto.T_BILL_13_WEEK)
    .setFixingDate(best.proto.getAuctionDate()?.cloneMessage())
    .setRate(best.proto.getHighDiscountRate()?.cloneMessage())
    .setBillMaturityDate(dateToLocalDateProto(maturity))
    .setBillIssueDate(best.proto.getAuctionIssueDate()?.cloneMessage());
}
