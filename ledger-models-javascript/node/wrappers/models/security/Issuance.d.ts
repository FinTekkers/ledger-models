import { IssuanceProto } from "../../../fintekkers/models/security/bond/issuance_pb";
import { AuctionTypeProto } from "../../../fintekkers/models/security/bond/auction_type_pb";
import Decimal from "decimal.js";
/**
 * Typed wrapper around a single IssuanceProto. Returns null for unset
 * sub-messages and Decimal/Date for populated ones — callers no longer
 * have to spell out the proto / Decimal coercions at every call site.
 *
 * Note: IssuanceProto has no `dated_date` or `auction_date` field on the
 * proto today, so those accessors are intentionally absent.
 */
declare class Issuance {
    proto: IssuanceProto;
    constructor(proto: IssuanceProto);
    private static _toDecimal;
    /** Auction issue (settlement) date. Null if unset. */
    getIssueDate(): Date | null;
    /** Auction announcement date. Null if unset. */
    getAnnouncementDate(): Date | null;
    /** Auction offering amount (original face value offered). Null if unset. */
    getOriginalFaceValue(): Decimal | null;
    /** Total quantity accepted at auction. Null if unset. */
    getTotalAccepted(): Decimal | null;
    /** Outstanding quantity after auction settles. Null if unset. */
    getPostAuctionOutstandingQuantity(): Decimal | null;
    /** Quantity of the mature security used in reopenings. Null if unset. */
    getMatureSecurityAmount(): Decimal | null;
    /** Single-price auction clearing price. Null if unset (e.g., multi-price). */
    getPriceForSinglePriceAuction(): Decimal | null;
    /** Auction type enum (defaults to UNKNOWN_AUCTION_TYPE if unset). */
    getAuctionType(): AuctionTypeProto;
}
export default Issuance;
