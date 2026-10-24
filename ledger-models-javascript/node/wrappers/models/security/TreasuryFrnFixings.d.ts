import BondSecurity from './BondSecurity';
import { Tenor } from './term';
import { ReferenceRateFixingProto } from '../../../fintekkers/requests/valuation/product_inputs_pb';
/**
 * The standard bill term, in weeks, that `tenor` is within 3 days of: 4, 6,
 * 8, 13, 17, 26 or 52. Days are counted from `anchor` to `anchor + tenor`.
 * Null when no term is that close, or when the tenor is null, not a TERM, or
 * the anchor is null.
 */
export declare function standardBillTerm(tenor: Tenor | null, anchor: Date | null): number | null;
/**
 * The 13-week bill fixing on `date`: of every issuance of every bill that
 * has an auction date, an issue date and a high discount rate, was auctioned
 * on or before `date` and snaps to 13 weeks, the one with the latest auction
 * date. On a tie the first in input order wins.
 *
 * The fixing's `rate` is the issuance's `high_discount_rate` proto
 * unchanged, `fixing_date` its `auction_date` and `bill_maturity_date` the
 * bill's maturity. Null when nothing qualifies.
 */
export declare function select(bills: BondSecurity[], date: Date): ReferenceRateFixingProto | null;
