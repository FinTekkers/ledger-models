package common.models.price;

import common.models.errors.InvalidDecimalException;
import common.models.errors.ModelValidationException;
import fintekkers.models.price.PriceProto;
import fintekkers.models.price.PriceSourceProto;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.util.DecimalValue.DecimalValueProto;
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
 * <p>Rules, checked in this order: {@code security} has a non-empty UUID;
 * at least one of mid, bid and ask has a non-empty unscaled_value (zero is
 * valid, see the PriceProto comment), else a violation on {@code mid};
 * when bid and ask are both set, ask &gt;= bid, else a violation on
 * {@code ask} (LM-508); and {@code price_type} is not UNKNOWN_PRICE_TYPE.
 * Only bid and ask are parsed, for the comparison; an unreadable one skips it.
 *
 * <p>Pure: proto in, violations out. Never throws on bad or unset input; a
 * null proto is checked as an empty one. Unlike {@link common.models.security.SecurityRules},
 * a link price is not skipped: hydrate it first. See docs/adr/typed-input-errors.md.
 */
public final class PriceRules {
    public static final String SECURITY = "security";
    /** LM-508: field 10, named {@code price} before. */
    public static final String MID = "mid";
    public static final String BID = "bid";
    public static final String ASK = "ask";
    /** @deprecated LM-508 renamed field 10 to {@code mid}; use {@link #MID}. */
    @Deprecated
    public static final String PRICE = MID;
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
        boolean hasMid = !ProtoSerializationUtil.isUnsetDecimal(p.getMid());
        boolean hasBid = !ProtoSerializationUtil.isUnsetDecimal(p.getBid());
        boolean hasAsk = !ProtoSerializationUtil.isUnsetDecimal(p.getAsk());
        if (!hasMid && !hasBid && !hasAsk) {
            out.add(violation(MID, id, "one of mid, bid or ask is required"));
        }
        if (hasBid && hasAsk && isBelow(p.getAsk(), p.getBid())) {
            out.add(violation(ASK, id, "ask must not be less than bid"));
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

    /**
     * True when price_source is unset or MARKET; false for TRADE or an unrecognised value,
     * so a new source is never read as market by accident. Null reads as unset. Not a
     * validation rule: an unset source is valid. See docs/adr/price_source.md.
     */
    public static boolean isMarketPrice(PriceProto proto) {
        // Raw number, like validate's price_type check.
        int v = (proto == null ? PriceProto.getDefaultInstance() : proto).getPriceSourceValue();
        return v == PriceSourceProto.UNKNOWN_PRICE_SOURCE_VALUE || v == PriceSourceProto.MARKET_VALUE;
    }

    /** True when ask &lt; bid; false when either is unreadable, so validate never throws. */
    private static boolean isBelow(DecimalValueProto ask, DecimalValueProto bid) {
        try {
            return ProtoSerializationUtil.deserializeBigDecimal(ask)
                    .compareTo(ProtoSerializationUtil.deserializeBigDecimal(bid)) < 0;
        } catch (InvalidDecimalException e) {
            return false;
        }
    }

    /** The price's UUID, or null when it has none or it is not 16 bytes. */
    private static UUID objectIdOf(PriceProto proto) {
        if (!proto.hasUuid() || proto.getUuid().getRawUuid().size() != 16) return null;
        return ProtoSerializationUtil.deserializeUUID(proto.getUuid());
    }
}
