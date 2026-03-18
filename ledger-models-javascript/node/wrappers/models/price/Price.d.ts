import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import Security from "../security/security";
import { ZonedDateTime } from "../utils/datetime";
import { Decimal } from "decimal.js";
declare class Price {
    proto: PriceProto;
    constructor(proto: PriceProto);
    /**
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime
     * @param price - The price as a Decimal value
     * @param security - The Security wrapper object
     * @param asOf - The ZonedDateTime for when this price is effective
     * @returns A new Price instance with a fully constructed PriceProto
     */
    static create(price: Decimal, security: Security, asOf: ZonedDateTime): Price;
    /**
     * Creates a cash price (always 1.0) for a cash security
     * @param cashSecurity - The cash security (e.g., USD)
     * @param asOf - The ZonedDateTime for when this price is effective
     * @returns A new Price instance with value 1.0
     */
    static getCashPrice(cashSecurity: Security, asOf: ZonedDateTime): Price;
}
export default Price;
