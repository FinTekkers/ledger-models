"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_1 = require("../utils/date");
const decimal_1 = require("../utils/decimal");
/**
 * Typed wrapper around a single IssuanceProto. Returns null for unset
 * sub-messages and Decimal/Date for populated ones — callers no longer
 * have to spell out the proto / Decimal coercions at every call site.
 *
 * Note: IssuanceProto has no `dated_date` field on the proto today, so that
 * accessor is intentionally absent.
 */
class Issuance {
    constructor(proto) {
        this.proto = proto;
    }
    static _toDecimal(value) {
        if (!value || (0, decimal_1.isUnsetDecimal)(value))
            return null;
        return (0, decimal_1.toDecimalJs)((0, decimal_1.decodeDecimal)(value));
    }
    /** Auction issue (settlement) date. Null if unset. */
    getIssueDate() {
        return (0, date_1.localDateProtoToDate)(this.proto.getAuctionIssueDate());
    }
    /** Auction announcement date. Null if unset. */
    getAnnouncementDate() {
        return (0, date_1.localDateProtoToDate)(this.proto.getAuctionAnnouncementDate());
    }
    /** The date the auction was held, when a bill's high discount rate is set. Null if unset. */
    getAuctionDate() {
        if (!this.proto.hasAuctionDate())
            return null;
        return (0, date_1.localDateProtoToDate)(this.proto.getAuctionDate());
    }
    /**
     * The auction's high discount rate as Treasury publishes it (percent,
     * bank-discount basis). Null when unset or set to an empty decimal.
     */
    getHighDiscountRate() {
        return Issuance._toDecimal(this.proto.getHighDiscountRate());
    }
    /** Auction offering amount (original face value offered). Null if unset. */
    getOriginalFaceValue() {
        return Issuance._toDecimal(this.proto.getAuctionOfferingAmount());
    }
    /** Total quantity accepted at auction. Null if unset. */
    getTotalAccepted() {
        return Issuance._toDecimal(this.proto.getTotalAccepted());
    }
    /** Outstanding quantity after auction settles. Null if unset. */
    getPostAuctionOutstandingQuantity() {
        return Issuance._toDecimal(this.proto.getPostAuctionOutstandingQuantity());
    }
    /** Quantity of the mature security used in reopenings. Null if unset. */
    getMatureSecurityAmount() {
        return Issuance._toDecimal(this.proto.getMatureSecurityAmount());
    }
    /** Single issue price per 100 par; real (not index-ratio adjusted) for TIPS. Null for multiple-price auctions, reopenings and bills. */
    getPriceForSinglePriceAuction() {
        return Issuance._toDecimal(this.proto.getPriceForSinglePriceAuction());
    }
    /** Auction type enum (defaults to UNKNOWN_AUCTION_TYPE if unset). */
    getAuctionType() {
        return this.proto.getAuctionType();
    }
}
exports.default = Issuance;
//# sourceMappingURL=Issuance.js.map