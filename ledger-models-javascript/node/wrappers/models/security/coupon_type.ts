import { CouponTypeProto } from "../../../fintekkers/models/security/coupon_type_pb";

export class CouponType {
    proto: CouponTypeProto;

    constructor(proto: CouponTypeProto) {
        this.proto = proto;
    }

    static ctEnumMap: Map<number, string>;

    static {
        CouponType.ctEnumMap = new Map<number, string>();

        Object.keys(CouponTypeProto).forEach(key => {
            CouponType.ctEnumMap.set(CouponTypeProto[key as keyof typeof CouponTypeProto], key);
        });
    }

    /**
     * NOTE that this method is not performant and should only be used for debugging purposes,
     * or infrequently. If this is required for a high performance use case, please create a 
     * reverse map with the enum ID as the key and the enum descriptor as the value. There is 
     * nothing stopping this code from returning a value that does not map exactly to the enum
     * value. E.g. rather than FIXED, you could return Fixed. 
     * 
     * @returns CouponType as a string
     */
    name(): string {
        return CouponType.ctEnumMap.get(this.proto) ?? 'UNKNOWN_COUPON_TYPE';
    }
}

