import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
/**
 * Security input rules: JS counterpart of Java's SecurityRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Holds the TBILL coupon rule (LM-258, docs/adr/tbill_coupon_validation.md);
 * LM-255c adds the bond rules Java already has. The Security wrapper does not
 * call these rules, so stored rows that break them still load; writers call
 * `validate` / `requireValid` before saving.
 */
export declare const COUPON_RATE = "bond_details.coupon_rate";
/**
 * Returns every field-level violation on this security, or an empty array
 * when it is valid. A link security returns an empty array: hydrate it first.
 */
export declare function validate(proto: SecurityProto): FieldViolationProto[];
/** Throws ModelValidationError carrying every violation if `validate` finds any. */
export declare function requireValid(proto: SecurityProto): void;
