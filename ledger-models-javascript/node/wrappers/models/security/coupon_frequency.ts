import { CouponFrequencyProto } from "../../../fintekkers/models/security/coupon_frequency_pb";

export class CouponFrequency {
    proto: CouponFrequencyProto;

    constructor(proto: CouponFrequencyProto) {
        this.proto = proto;
    }

    static cfEnumMap: Map<number, string>;

    static {
        CouponFrequency.cfEnumMap = new Map<number, string>();

        Object.keys(CouponFrequencyProto).forEach(key => {
            CouponFrequency.cfEnumMap.set(CouponFrequencyProto[key as keyof typeof CouponFrequencyProto], key);
        });
    }

    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a 
     * reverse map with the enum ID as the key and the enum descriptor as the value. There is 
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than SEMIANNUALLY, you could return Semiannually. 
     * 
     * @returns CouponFrequency as a string
     */
    toString(): string {
        return CouponFrequency.cfEnumMap.get(this.proto) ?? 'UNKNOWN_COUPON_FREQUENCY';
    }
}

