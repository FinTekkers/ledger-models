import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { PriceTypeProto } from "../../../fintekkers/models/price/price_type_pb";
import Security from "../security/security";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { Decimal } from "decimal.js";
declare class Price {
    proto: PriceProto;
    constructor(proto: PriceProto);
    /**
     * Simple factory: create a Price from a security UUID string, a numeric price, and a Date.
     * This is the primary entry point for callers who just want:
     *   new Price(uuid, 99.5, date)
     *
     * @param securityId - UUID string of the security (e.g. "18e8c4e6-3da0-47c9-...")
     * @param price - The price as a number (e.g. 99.5)
     * @param date - A JavaScript Date for when this price is effective
     * @param priceType - Optional price type, defaults to PERCENTAGE
     */
    static fromSimple(securityId: string, price: number, date: Date, priceType?: PriceTypeProto): Price;
    /**
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime
     */
    static create(price: Decimal, security: Security, asOf: ZonedDateTime): Price;
    /**
     * Creates a cash price (always 1.0) for a cash security
     */
    static getCashPrice(cashSecurity: Security, asOf: ZonedDateTime): Price;
    getID(): UUID;
    getPrice(): Decimal;
    getPriceType(): PriceTypeProto;
    getSecurity(): Security;
    getSecurityID(): UUID;
    getAsOf(): ZonedDateTime;
    toString(): string;
    equals(other: Price): boolean;
}
export default Price;
