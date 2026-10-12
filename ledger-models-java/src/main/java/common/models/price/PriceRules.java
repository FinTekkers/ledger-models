package common.models.price;

import common.models.errors.ModelValidationException;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static common.models.errors.ModelValidationException.violation;

/**
 * The one shared rule set for price input (LM-289). Services call
 * {@link #validate} / {@link #requireValid} instead of copying the rules.
 *
 * <p>Three rules, checked in this order: {@code security} has a non-empty
 * UUID, {@code price} has a non-empty arbitrary_precision_value (zero is
 * valid, see the PriceProto comment), and {@code price_type} is not
 * UNKNOWN_PRICE_TYPE. The price value is not parsed.
 *
 * <p>Pure: proto in, violations out. Never throws on bad or unset input; a
 * null proto is checked as an empty one. Unlike {@link common.models.security.SecurityRules},
 * a link price is not skipped: hydrate it first. See docs/adr/typed-input-errors.md.
 */
public final class PriceRules {
    public static final String SECURITY = "security";
    public static final String PRICE = "price";
    public static final String PRICE_TYPE = "price_type";

    private PriceRules() {}

    /** Returns every field-level violation on this price, or an empty list when it is valid. */
    public static List<FieldViolationProto> validate(PriceProto proto) {
        PriceProto p = proto == null ? PriceProto.getDefaultInstance() : proto;
        UUID id = objectIdOf(p);
        List<FieldViolationProto> out = new ArrayList<>();
        if (!p.hasSecurity() || !p.getSecurity().hasUuid() || p.getSecurity().getUuid().getRawUuid().isEmpty()) {
            out.add(violation(SECURITY, id, "security with a non-empty uuid is required"));
        }
        if (!p.hasPrice() || ProtoSerializationUtil.isUnsetDecimal(p.getPrice())) {
            out.add(violation(PRICE, id, "price is required"));
        }
        // Raw number, so an unrecognised value (Java's UNRECOGNIZED) is not rejected.
        if (p.getPriceTypeValue() == PriceTypeProto.UNKNOWN_PRICE_TYPE_VALUE) {
            out.add(violation(PRICE_TYPE, id, "price_type must not be UNKNOWN_PRICE_TYPE"));
        }
        return out;
    }

    /** Throws {@link ModelValidationException} carrying every violation if {@link #validate} finds any. */
    public static void requireValid(PriceProto proto) {
        List<FieldViolationProto> violations = validate(proto);
        if (!violations.isEmpty()) throw new ModelValidationException(violations);
    }

    /** The price's UUID, or null when it has none or it is not 16 bytes. */
    private static UUID objectIdOf(PriceProto proto) {
        if (!proto.hasUuid() || proto.getUuid().getRawUuid().size() != 16) return null;
        return ProtoSerializationUtil.deserializeUUID(proto.getUuid());
    }
}
