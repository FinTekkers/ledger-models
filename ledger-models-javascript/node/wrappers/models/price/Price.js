"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const uuid_1 = require("../utils/uuid");
const decimal_js_1 = require("decimal.js");
class Price {
    constructor(proto) {
        this.proto = proto;
    }
    /**
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime
     * @param price - The price as a Decimal value
     * @param security - The Security wrapper object
     * @param asOf - The ZonedDateTime for when this price is effective
     * @returns A new Price instance with a fully constructed PriceProto
     */
    static create(price, security, asOf) {
        // Convert Decimal to DecimalValueProto
        const decimalValueProto = new decimal_value_pb_1.DecimalValueProto();
        decimalValueProto.setArbitraryPrecisionValue(price.toString());
        // Create PriceProto with all required fields
        const priceProto = new price_pb_1.PriceProto();
        priceProto.setPrice(decimalValueProto);
        priceProto.setObjectClass('Price');
        priceProto.setVersion('0.0.1');
        priceProto.setAsOf(asOf.toProto());
        priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
        priceProto.setSecurity(security.proto);
        return new Price(priceProto);
    }
    /**
     * Creates a cash price (always 1.0) for a cash security
     * @param cashSecurity - The cash security (e.g., USD)
     * @param asOf - The ZonedDateTime for when this price is effective
     * @returns A new Price instance with value 1.0
     */
    static getCashPrice(cashSecurity, asOf) {
        return Price.create(new decimal_js_1.Decimal('1.0'), cashSecurity, asOf);
    }
}
exports.default = Price;
//# sourceMappingURL=Price.js.map