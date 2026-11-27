import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PriceTypeProto } from '../../../fintekkers/models/price/price_type_pb';
import type { FieldViolationProto } from '../../../fintekkers/requests/util/errors/field_violation_pb';
import { ModelValidationError, violation } from '../errors';
import { UUID } from '../utils/uuid';
import { decodeDecimal, isUnsetDecimal } from '../utils/decimal';
import type { CompactDecimal } from '../utils/decimal';
import type { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';

/**
 * Price input rules (LM-289): JS counterpart of Java's PriceRules
 * (docs/adr/typed-input-errors.md). Pure: proto in, violations out.
 *
 * Rules, checked in this order: `security` has a non-empty UUID; at least
 * one of mid, bid and ask has a non-empty unscaled_value (zero is valid, see
 * the PriceProto comment), else a violation on `mid`; when bid and ask are
 * both set, ask >= bid, else a violation on `ask` (LM-508); and `price_type`
 * is not UNKNOWN_PRICE_TYPE. Only bid and ask are parsed, for the
 * comparison; an unreadable one skips it. Never throws on bad or unset
 * input; null or undefined is checked as an empty PriceProto. Unlike
 * security_rules, a link price is not skipped: hydrate it first. The Price
 * wrapper does not call these rules.
 */

export const SECURITY = 'security';
/** LM-508: field 10, named `price` before. */
export const MID = 'mid';
export const BID = 'bid';
export const ASK = 'ask';
/** @deprecated LM-508 renamed field 10 to `mid`; use MID. */
export const PRICE = MID;
export const PRICE_TYPE = 'price_type';

/** Returns every field-level violation on this price, or an empty array when it is valid. */
export function validate(proto: PriceProto | null | undefined): FieldViolationProto[] {
    const p = proto ?? new PriceProto();
    const id = objectIdOf(p);
    const out: FieldViolationProto[] = [];
    if (!p.getSecurity()?.getUuid()?.getRawUuid_asU8().length) {
        out.push(violation(SECURITY, id, 'security with a non-empty uuid is required'));
    }
    const mid = setOrUndefined(p.getMid());
    const bid = setOrUndefined(p.getBid());
    const ask = setOrUndefined(p.getAsk());
    if (!mid && !bid && !ask) {
        out.push(violation(MID, id, 'one of mid, bid or ask is required'));
    }
    if (bid && ask && isBelow(ask, bid)) {
        out.push(violation(ASK, id, 'ask must not be less than bid'));
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

function setOrUndefined(p: DecimalValueProto | undefined): DecimalValueProto | undefined {
    return p && !isUnsetDecimal(p) ? p : undefined;
}

/** True when ask < bid; false when either is unreadable, so validate never throws. */
function isBelow(ask: DecimalValueProto, bid: DecimalValueProto): boolean {
    let a: CompactDecimal;
    let b: CompactDecimal;
    try {
        a = decodeDecimal(ask);
        b = decodeDecimal(bid);
    } catch (e) {
        if (e instanceof ModelValidationError) return false;
        throw e;
    }
    const scale = Math.max(a.scale, b.scale);
    const TEN = BigInt(10);
    return a.unscaled * TEN ** BigInt(scale - a.scale) < b.unscaled * TEN ** BigInt(scale - b.scale);
}

/** The price's UUID, or undefined when it has none or it is not 16 bytes. */
function objectIdOf(proto: PriceProto): UUID | undefined {
    const raw = proto.getUuid()?.getRawUuid_asU8();
    return raw && raw.length === 16 ? UUID.fromU8Array(raw) : undefined;
}
