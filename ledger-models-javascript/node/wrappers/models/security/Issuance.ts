import { IssuanceProto } from "../../../fintekkers/models/security/bond/issuance_pb";
import { AuctionTypeProto } from "../../../fintekkers/models/security/bond/auction_type_pb";
import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { localDateProtoToDate } from "../utils/date";
import Decimal from "decimal.js";
import { decodeDecimal, isUnsetDecimal, toDecimalJs } from "../utils/decimal";

/**
 * Typed wrapper around a single IssuanceProto. Returns null for unset
 * sub-messages and Decimal/Date for populated ones — callers no longer
 * have to spell out the proto / Decimal coercions at every call site.
 *
 * Note: IssuanceProto has no `dated_date` or `auction_date` field on the
 * proto today, so those accessors are intentionally absent.
 */
class Issuance {
  proto: IssuanceProto;

  constructor(proto: IssuanceProto) {
    this.proto = proto;
  }

  private static _toDecimal(value: DecimalValueProto | undefined): Decimal | null {
    if (!value || isUnsetDecimal(value)) return null;
    return toDecimalJs(decodeDecimal(value));
  }

  /** Auction issue (settlement) date. Null if unset. */
  getIssueDate(): Date | null {
    return localDateProtoToDate(this.proto.getAuctionIssueDate());
  }

  /** Auction announcement date. Null if unset. */
  getAnnouncementDate(): Date | null {
    return localDateProtoToDate(this.proto.getAuctionAnnouncementDate());
  }

  /** Auction offering amount (original face value offered). Null if unset. */
  getOriginalFaceValue(): Decimal | null {
    return Issuance._toDecimal(this.proto.getAuctionOfferingAmount());
  }

  /** Total quantity accepted at auction. Null if unset. */
  getTotalAccepted(): Decimal | null {
    return Issuance._toDecimal(this.proto.getTotalAccepted());
  }

  /** Outstanding quantity after auction settles. Null if unset. */
  getPostAuctionOutstandingQuantity(): Decimal | null {
    return Issuance._toDecimal(this.proto.getPostAuctionOutstandingQuantity());
  }

  /** Quantity of the mature security used in reopenings. Null if unset. */
  getMatureSecurityAmount(): Decimal | null {
    return Issuance._toDecimal(this.proto.getMatureSecurityAmount());
  }

  /** Single issue price per 100 par; real (not index-ratio adjusted) for TIPS. Null for multiple-price auctions, reopenings and bills. */
  getPriceForSinglePriceAuction(): Decimal | null {
    return Issuance._toDecimal(this.proto.getPriceForSinglePriceAuction());
  }

  /** Auction type enum (defaults to UNKNOWN_AUCTION_TYPE if unset). */
  getAuctionType(): AuctionTypeProto {
    return this.proto.getAuctionType();
  }
}

export default Issuance;
