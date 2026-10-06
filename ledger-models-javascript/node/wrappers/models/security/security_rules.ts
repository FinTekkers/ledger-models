import Decimal from 'decimal.js';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
import { ModelValidationError, violation } from '../errors';
import { UUID } from '../utils/uuid';

/**
 * Security input rules: JS counterpart of Java's SecurityRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Holds the TBILL coupon rule (LM-258, docs/adr/tbill_coupon_validation.md);
 * LM-255c adds the bond rules Java already has. The Security wrapper does not
 * call these rules, so stored rows that break them still load; writers call
 * `validate` / `requireValid` before saving.
 */

export const COUPON_RATE = 'bond_details.coupon_rate';

/**
 * Returns every field-level violation on this security, or an empty array
 * when it is valid. A link security returns an empty array: hydrate it first.
 */
export function validate(proto: SecurityProto): FieldViolationProto[] {
    if (proto.getIsLink()) return [];
    const out: FieldViolationProto[] = [];
    const coupon = tbillCouponViolation(proto, objectIdOf(proto));
    if (coupon) out.push(coupon);
    return out;
}

/** Throws ModelValidationError carrying every violation if `validate` finds any. */
export function requireValid(proto: SecurityProto): void {
    const violations = validate(proto);
    if (violations.length > 0) throw new ModelValidationError(violations);
}

/**
 * A TBILL pays no coupon, so coupon_rate must be unset or 0. Uses the
 * explicit product_type only. Units are not checked. A value that does not
 * parse is skipped.
 */
function tbillCouponViolation(proto: SecurityProto, id: UUID | undefined): FieldViolationProto | undefined {
    if (proto.getProductType() !== ProductTypeProto.TBILL) return undefined;
    const raw = proto.getBondDetails()?.getCouponRate()?.getArbitraryPrecisionValue();
    if (!raw) return undefined;
    let coupon: Decimal;
    try {
        coupon = new Decimal(raw);
    } catch (e) {
        // decimal.js throws "[DecimalError] Invalid argument" on unparseable input.
        return undefined;
    }
    if (!coupon.isFinite() || coupon.isZero()) return undefined;
    return violation(COUPON_RATE, id, `coupon_rate must be null or 0 for a TBILL: coupon_rate=${raw}`);
}

/** The security's UUID, or undefined when it has none or it is not 16 bytes. */
function objectIdOf(proto: SecurityProto): UUID | undefined {
    const raw = proto.getUuid()?.getRawUuid_asU8();
    return raw && raw.length === 16 ? UUID.fromU8Array(raw) : undefined;
}
