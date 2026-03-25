import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { PriceTypeProto } from "../../../fintekkers/models/price/price_type_pb";
import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
import { SecurityProto } from "../../../fintekkers/models/security/security_pb";
import Security from "../security/security";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
import { Decimal } from "decimal.js";

class Price {
    proto: PriceProto;

    constructor(proto: PriceProto) {
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
    static fromSimple(
        securityId: string,
        price: number,
        date: Date,
        priceType: PriceTypeProto = PriceTypeProto.PERCENTAGE
    ): Price {
        const decimalValueProto = new DecimalValueProto();
        decimalValueProto.setArbitraryPrecisionValue(price.toString());

        const securityProto = new SecurityProto();
        securityProto.setUuid(new UUID(UUID.fromString(securityId)).toUUIDProto());
        securityProto.setIsLink(true);

        const priceProto = new PriceProto();
        priceProto.setObjectClass('Price');
        priceProto.setVersion('0.0.1');
        priceProto.setUuid(UUID.random().toUUIDProto());
        priceProto.setAsOf(ZonedDateTime.from(date).toProto());
        priceProto.setPrice(decimalValueProto);
        priceProto.setSecurity(securityProto);
        priceProto.setPriceType(priceType);

        return new Price(priceProto);
    }

    /**
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime
     */
    static create(price: Decimal, security: Security, asOf: ZonedDateTime): Price {
        const decimalValueProto = new DecimalValueProto();
        decimalValueProto.setArbitraryPrecisionValue(price.toString());

        const priceProto = new PriceProto();
        priceProto.setPrice(decimalValueProto);
        priceProto.setObjectClass('Price');
        priceProto.setVersion('0.0.1');
        priceProto.setAsOf(asOf.toProto());
        priceProto.setUuid(UUID.random().toUUIDProto());
        priceProto.setSecurity(security.proto);

        return new Price(priceProto);
    }

    /**
     * Creates a cash price (always 1.0) for a cash security
     */
    static getCashPrice(cashSecurity: Security, asOf: ZonedDateTime): Price {
        return Price.create(new Decimal('1.0'), cashSecurity, asOf);
    }

    getID(): UUID {
        const uuid = this.proto.getUuid();
        if (!uuid) throw new Error("UUID is required");
        return UUID.fromU8Array(uuid.getRawUuid_asU8());
    }

    getPrice(): Decimal {
        const priceValue = this.proto.getPrice();
        if (!priceValue) throw new Error("Price value is required");
        return new Decimal(priceValue.getArbitraryPrecisionValue());
    }

    getPriceType(): PriceTypeProto {
        return this.proto.getPriceType();
    }

    getSecurity(): Security {
        const securityProto = this.proto.getSecurity();
        if (!securityProto) throw new Error("Security is required");
        return Security.create(securityProto);
    }

    getSecurityID(): UUID {
        const securityProto = this.proto.getSecurity();
        if (!securityProto) throw new Error("Security is required");
        const uuid = securityProto.getUuid();
        if (!uuid) throw new Error("Security UUID is required");
        return UUID.fromU8Array(uuid.getRawUuid_asU8());
    }

    getAsOf(): ZonedDateTime {
        const asOf = this.proto.getAsOf();
        if (!asOf) throw new Error("AsOf is required");
        return new ZonedDateTime(asOf);
    }

    toString(): string {
        const priceStr = this.proto.getPrice()?.getArbitraryPrecisionValue() ?? 'N/A';
        return `Price[${priceStr}, securityId=${this.getSecurityID().toString()}]`;
    }

    equals(other: Price): boolean {
        return this.getID().equals(other.getID());
    }
}

export default Price;
