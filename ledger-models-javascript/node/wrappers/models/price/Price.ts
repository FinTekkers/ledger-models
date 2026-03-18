import { PriceProto } from "../../../fintekkers/models/price/price_pb";
import { DecimalValueProto } from "../../../fintekkers/models/util/decimal_value_pb";
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
     * Factory method to create a Price from a Decimal value, Security, and ZonedDateTime
     * @param price - The price as a Decimal value
     * @param security - The Security wrapper object
     * @param asOf - The ZonedDateTime for when this price is effective
     * @returns A new Price instance with a fully constructed PriceProto
     */
    static create(price: Decimal, security: Security, asOf: ZonedDateTime): Price {
        // Convert Decimal to DecimalValueProto
        const decimalValueProto = new DecimalValueProto();
        decimalValueProto.setArbitraryPrecisionValue(price.toString());

        // Create PriceProto with all required fields
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
     * @param cashSecurity - The cash security (e.g., USD)
     * @param asOf - The ZonedDateTime for when this price is effective
     * @returns A new Price instance with value 1.0
     */
    static getCashPrice(cashSecurity: Security, asOf: ZonedDateTime): Price {
        return Price.create(new Decimal('1.0'), cashSecurity, asOf);
    }
}

export default Price;
