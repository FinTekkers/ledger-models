import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
/**
 * Price input rules (LM-289): JS counterpart of Java's PriceRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Three rules, checked in this order: `security` has a non-empty UUID,
 * `price` has a non-empty arbitrary_precision_value (zero is valid, see the
 * PriceProto comment), and `price_type` is not UNKNOWN_PRICE_TYPE. The price
 * value is not parsed. Never throws on bad or unset input; null or undefined
 * is checked as an empty PriceProto. Unlike security_rules, a link price is
 * not skipped: hydrate it first. The Price wrapper does not call these rules.
 */
export declare const SECURITY = "security";
export declare const PRICE = "price";
export declare const PRICE_TYPE = "price_type";
/** Returns every field-level violation on this price, or an empty array when it is valid. */
export declare function validate(proto: PriceProto | null | undefined): FieldViolationProto[];
/** Throws ModelValidationError carrying every violation if `validate` finds any. */
export declare function requireValid(proto: PriceProto | null | undefined): void;
