import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
import { ModelValidationError, violation } from '../errors';
import { UUID } from '../utils/uuid';
import { isUnsetDecimal } from '../utils/decimal';

/**
 * Price input rules (LM-289): JS counterpart of Java's PriceRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Three rules, checked in this order: `security` has a non-empty UUID,
 * `price` has either decimal form set (zero is valid, see the PriceProto
 * comment), and `price_type` is not UNKNOWN_PRICE_TYPE. The price
 * value is not parsed. Never throws on bad or unset input; null or undefined
 * is checked as an empty PriceProto. Unlike security_rules, a link price is
 * not skipped: hydrate it first. The Price wrapper does not call these rules.
 */

export const SECURITY = 'security';
export const PRICE = 'price';
export const PRICE_TYPE = 'price_type';

/** Returns every field-level violation on this price, or an empty array when it is valid. */
export function validate(proto: PriceProto | null | undefined): FieldViolationProto[] {
    const p = proto ?? new PriceProto();
    const id = objectIdOf(p);
    const out: FieldViolationProto[] = [];
    if (!p.getSecurity()?.getUuid()?.getRawUuid_asU8().length) {
        out.push(violation(SECURITY, id, 'security with a non-empty uuid is required'));
    }
    const price = p.getPrice();
    if (!price || isUnsetDecimal(price)) {
        out.push(violation(PRICE, id, 'price is required'));
    }
    if (p.getPriceType() === PriceTypeProto.UNKNOWN_PRICE_TYPE) {
        out.push(violation(PRICE_TYPE, id, 'price_type must not be UNKNOWN_PRICE_TYPE'));
    }
    return out;
}

/** Throws ModelValidationError carrying every violation if `validate` finds any. */
export function requireValid(proto: PriceProto | null | undefined): void {
    const violations = validate(proto);
    if (violations.length > 0) throw new ModelValidationError(violations);
}

/** The price's UUID, or undefined when it has none or it is not 16 bytes. */
function objectIdOf(proto: PriceProto): UUID | undefined {
    const raw = proto.getUuid()?.getRawUuid_asU8();
    return raw && raw.length === 16 ? UUID.fromU8Array(raw) : undefined;
}
