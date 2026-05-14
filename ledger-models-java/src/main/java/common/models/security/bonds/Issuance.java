package common.models.security.bonds;

import fintekkers.models.security.bond.AuctionTypeProto;
import fintekkers.models.security.bond.IssuanceProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Typed wrapper over {@link IssuanceProto}. Exposes per-auction issuance
 * details (announcement/issue dates, offering amount, total accepted, etc.)
 * as Java domain types. Created when the parent BondSecurity unwraps its
 * stashed {@code SecurityProto.bond_details.issuance_info} list.
 *
 * <p>Accessors return {@code null} when the underlying proto field is unset.
 */
public class Issuance {
    private final IssuanceProto proto;

    public Issuance(IssuanceProto proto) {
        this.proto = proto;
    }

    public LocalDate getIssueDate() {
        if (!proto.hasAuctionIssueDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(proto.getAuctionIssueDate());
    }

    public LocalDate getAnnouncementDate() {
        if (!proto.hasAuctionAnnouncementDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(proto.getAuctionAnnouncementDate());
    }

    public BigDecimal getOriginalFaceValue() {
        if (!proto.hasAuctionOfferingAmount()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(proto.getAuctionOfferingAmount());
    }

    public BigDecimal getTotalAccepted() {
        if (!proto.hasTotalAccepted()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(proto.getTotalAccepted());
    }

    public BigDecimal getPostAuctionOutstandingQuantity() {
        if (!proto.hasPostAuctionOutstandingQuantity()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(proto.getPostAuctionOutstandingQuantity());
    }

    public BigDecimal getMatureSecurityAmount() {
        if (!proto.hasMatureSecurityAmount()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(proto.getMatureSecurityAmount());
    }

    public BigDecimal getPriceForSinglePriceAuction() {
        if (!proto.hasPriceForSinglePriceAuction()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(proto.getPriceForSinglePriceAuction());
    }

    public AuctionTypeProto getAuctionType() {
        return proto.getAuctionType();
    }

    /**
     * Raw escape hatch — primarily for serialization round-trips.
     * Prefer the typed accessors above.
     */
    IssuanceProto getProto() {
        return proto;
    }
}
