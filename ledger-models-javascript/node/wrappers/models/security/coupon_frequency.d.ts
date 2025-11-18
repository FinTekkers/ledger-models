import { CouponFrequencyProto } from "../../../fintekkers/models/security/coupon_frequency_pb";
export declare class CouponFrequency {
    proto: CouponFrequencyProto;
    constructor(proto: CouponFrequencyProto);
    static cfEnumMap: Map<number, string>;
    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a
     * reverse map with the enum ID as the key and the enum descriptor as the value. There is
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than SEMIANNUALLY, you could return Semiannually.
     *
     * @returns CouponFrequency as a string
     */
    toString(): string;
}
