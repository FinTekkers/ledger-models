"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const price_type_pb_1 = require("../../../fintekkers/models/price/price_type_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_1 = __importDefault(require("../security/security"));
const datetime_1 = require("../utils/datetime");
const uuid_1 = require("../utils/uuid");
const decimal_js_1 = require("decimal.js");
class Price {
    constructor(proto) {
        this.proto = proto;
    }
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
    static fromSimple(securityId, price, date, priceType = price_type_pb_1.PriceTypeProto.PERCENTAGE) {
        const decimalValueProto = new decimal_value_pb_1.DecimalValueProto();
        decimalValueProto.setArbitraryPrecisionValue(price.toString());
        const securityProto = new security_pb_1.SecurityProto();
        securityProto.setUuid(new uuid_1.UUID(uuid_1.UUID.fromString(securityId)).toUUIDProto());
        securityProto.setIsLink(true);
        const priceProto = new price_pb_1.PriceProto();
        priceProto.setObjectClass('Price');
        priceProto.setVersion('0.0.1');
        priceProto.setUuid(uuid_1.UUID.random().toUUIDProto());
        priceProto.setAsOf(datetime_1.ZonedDateTime.from(date).toProto());
        priceProto.setPrice(decimalValueProto);
        priceProto.setSecurity(securityProto);
        priceProto.setPriceType(priceType);
        return new Price(priceProto);
    }
    /**
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime
     */
    static create(price, security, asOf) {
        const decimalValueProto = new decimal_value_pb_1.DecimalValueProto();
        decimalValueProto.setArbitraryPrecisionValue(price.toString());
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
     */
    static getCashPrice(cashSecurity, asOf) {
        return Price.create(new decimal_js_1.Decimal('1.0'), cashSecurity, asOf);
    }
    getID() {
        const uuid = this.proto.getUuid();
        if (!uuid)
            throw new Error("UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    getPrice() {
        const priceValue = this.proto.getPrice();
        if (!priceValue)
            throw new Error("Price value is required");
        return new decimal_js_1.Decimal(priceValue.getArbitraryPrecisionValue());
    }
    getPriceType() {
        return this.proto.getPriceType();
    }
    getSecurity() {
        const securityProto = this.proto.getSecurity();
        if (!securityProto)
            throw new Error("Security is required");
        return security_1.default.create(securityProto);
    }
    getSecurityID() {
        const securityProto = this.proto.getSecurity();
        if (!securityProto)
            throw new Error("Security is required");
        const uuid = securityProto.getUuid();
        if (!uuid)
            throw new Error("Security UUID is required");
        return uuid_1.UUID.fromU8Array(uuid.getRawUuid_asU8());
    }
    getAsOf() {
        const asOf = this.proto.getAsOf();
        if (!asOf)
            throw new Error("AsOf is required");
        return new datetime_1.ZonedDateTime(asOf);
    }
    toString() {
        var _a, _b;
        const priceStr = (_b = (_a = this.proto.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue()) !== null && _b !== void 0 ? _b : 'N/A';
        return `Price[${priceStr}, securityId=${this.getSecurityID().toString()}]`;
    }
    equals(other) {
        return this.getID().equals(other.getID());
    }
}
exports.default = Price;
//# sourceMappingURL=Price.js.map