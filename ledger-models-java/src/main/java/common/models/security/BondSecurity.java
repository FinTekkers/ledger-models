package common.models.security;

import common.models.JSONFieldNames;
import common.models.postion.Field;
import common.models.security.bonds.Issuance;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.CouponFrequencyProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.models.security.bond.IssuanceProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/***
 * Bond security. Generic wrapper for bond-shape product types.
 *
 * <p>Post-#338 refactor: thin proto wrapper. Bond fields (coupon_rate,
 * coupon_type, etc.) read from / write to the {@code bond_details} sub-message
 * via the overlay using an explicit set-build-merge cycle (each setter rebuilds
 * the BondDetailsProto and re-attaches it to the overlay so
 * {@code overlay.hasBondDetails()} reliably reflects mutations — the
 * pre-#338 bug was a {@code getBondDetailsBuilder()}-based pattern where
 * {@code hasBondDetails} could return false after mutations).
 */
public class BondSecurity extends Security {
    public final static String ASSET_CLASS = JSONFieldNames.FIXED_INCOME;

    /** Primary constructor — wraps a SecurityProto. */
    public BondSecurity(SecurityProto proto) {
        super(proto);
    }

    /** @deprecated Field-by-field test helper. */
    @Deprecated
    public BondSecurity(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
    }

    @Override
    public String getAssetClass() {
        return ASSET_CLASS;
    }

    @Override
    public QuantityType getQuantityType() {
        return QuantityType.ORIGINAL_FACE_VALUE;
    }

    public CashSecurity getCouponCurrency() {
        return this.getSettlementCurrency();
    }

    // ---- bond_details overlay-merge helpers ------------------------------
    //
    // The safe pattern: read the existing BondDetailsProto (or empty), mutate
    // a Builder copy, then `setBondDetails(bd.build())` on the overlay. This
    // guarantees `overlay.hasBondDetails() == true` after any mutation — the
    // `getBondDetailsBuilder()` pattern didn't.

    private BondDetailsProto readBondDetails() {
        SecurityProto active = getProto();
        return active.hasBondDetails() ? active.getBondDetails() : null;
    }

    private BondDetailsProto.Builder currentBondDetailsForWrite() {
        SecurityProto.Builder o = ensureOverlay();
        if (o.hasBondDetails()) {
            return o.getBondDetails().toBuilder();
        }
        return BondDetailsProto.newBuilder();
    }

    private void commitBondDetails(BondDetailsProto.Builder bd) {
        ensureOverlay().setBondDetails(bd.build());
    }

    public BigDecimal getCouponRate() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null || !bd.hasCouponRate()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(bd.getCouponRate());
    }

    public void setCouponRate(BigDecimal couponRate) {
        BondDetailsProto.Builder bd = currentBondDetailsForWrite();
        if (couponRate == null) {
            bd.clearCouponRate();
        } else {
            bd.setCouponRate(ProtoSerializationUtil.serializeBigDecimal(couponRate));
        }
        commitBondDetails(bd);
    }

    public CouponType getCouponType() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null) return null;
        CouponTypeProto ct = bd.getCouponType();
        if (ct == CouponTypeProto.UNKNOWN_COUPON_TYPE) return null;
        try {
            return CouponType.valueOf(ct.name());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public void setCouponType(CouponType couponType) {
        BondDetailsProto.Builder bd = currentBondDetailsForWrite();
        if (couponType == null) {
            bd.clearCouponType();
        } else {
            bd.setCouponType(CouponTypeProto.valueOf(couponType.name()));
        }
        commitBondDetails(bd);
    }

    public CouponFrequency getCouponFrequency() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null) return null;
        CouponFrequencyProto cf = bd.getCouponFrequency();
        if (cf == CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY) return null;
        try {
            return CouponFrequency.valueOf(cf.name());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public void setCouponFrequency(CouponFrequency couponFrequency) {
        BondDetailsProto.Builder bd = currentBondDetailsForWrite();
        if (couponFrequency == null) {
            bd.clearCouponFrequency();
        } else {
            bd.setCouponFrequency(CouponFrequencyProto.valueOf(couponFrequency.name()));
        }
        commitBondDetails(bd);
    }

    public LocalDate getDatedDate() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null || !bd.hasDatedDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(bd.getDatedDate());
    }

    public void setDatedDate(LocalDate datedDate) {
        BondDetailsProto.Builder bd = currentBondDetailsForWrite();
        if (datedDate == null) {
            bd.clearDatedDate();
        } else {
            bd.setDatedDate(ProtoSerializationUtil.serializeLocalDate(datedDate));
        }
        commitBondDetails(bd);
    }

    public BigDecimal getFaceValue() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null || !bd.hasFaceValue()) return null;
        return ProtoSerializationUtil.deserializeBigDecimal(bd.getFaceValue());
    }

    public void setFaceValue(BigDecimal faceValue) {
        BondDetailsProto.Builder bd = currentBondDetailsForWrite();
        if (faceValue == null) {
            bd.clearFaceValue();
        } else {
            bd.setFaceValue(ProtoSerializationUtil.serializeBigDecimal(faceValue));
        }
        commitBondDetails(bd);
    }

    public LocalDate getIssueDate() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null || !bd.hasIssueDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(bd.getIssueDate());
    }

    public void setIssueDate(LocalDate issueDate) {
        BondDetailsProto.Builder bd = currentBondDetailsForWrite();
        if (issueDate == null) {
            bd.clearIssueDate();
        } else {
            bd.setIssueDate(ProtoSerializationUtil.serializeLocalDate(issueDate));
        }
        commitBondDetails(bd);
    }

    public LocalDate getMaturityDate() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null || !bd.hasMaturityDate()) return null;
        return ProtoSerializationUtil.deserializeLocalDate(bd.getMaturityDate());
    }

    public void setMaturityDate(LocalDate maturityDate) {
        BondDetailsProto.Builder bd = currentBondDetailsForWrite();
        if (maturityDate == null) {
            bd.clearMaturityDate();
        } else {
            bd.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(maturityDate));
        }
        commitBondDetails(bd);
    }

    public BigDecimal getPriceScaleFactor() {
        return getFaceValue().divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);
    }

    @Override
    public ProductTypeProto getProductType() {
        ProductTypeProto pt = super.getProductType();
        return pt == ProductTypeProto.PRODUCT_TYPE_UNKNOWN ? ProductTypeProto.TREASURY_NOTE : pt;
    }

    @Override
    protected ProductTypeProto getSubclassProductType() {
        return ProductTypeProto.TREASURY_NOTE;
    }

    @Override
    public String toString() {
        List<common.models.security.identifier.Identifier> ids = getIdentifiers();
        String securityId = ids.isEmpty() ? "No Security Id" : ids.get(0).toString();
        Tenor t = getTenor();
        String tenorDescription = t.getTenorDescription();
        return "Bond: " + securityId + " " + getMaturityDate() +
                " " + getCouponRate() + "% " + tenorDescription;
    }

    public List<Issuance> getIssuances() {
        BondDetailsProto bd = readBondDetails();
        if (bd == null) return Collections.emptyList();
        List<IssuanceProto> raw = bd.getIssuanceInfoList();
        if (raw.isEmpty()) return Collections.emptyList();
        List<Issuance> out = new ArrayList<>(raw.size());
        for (IssuanceProto p : raw) {
            out.add(new Issuance(p));
        }
        return out;
    }

    public static SecurityProto fromPricerInputs(BigDecimal faceValue,
                                                 BigDecimal couponRate,
                                                 CouponTypeProto couponType,
                                                 CouponFrequencyProto couponFrequency,
                                                 LocalDate issueDate,
                                                 LocalDate maturityDate) {
        return SecurityProto.newBuilder()
                .setProductType(ProductTypeProto.TREASURY_NOTE)
                .setBondDetails(buildBondDetails(faceValue, couponRate, couponType,
                        couponFrequency, issueDate, maturityDate))
                .build();
    }

    public static BondDetailsProto buildBondDetails(BigDecimal faceValue,
                                              BigDecimal couponRate,
                                              CouponTypeProto couponType,
                                              CouponFrequencyProto couponFrequency,
                                              LocalDate issueDate,
                                              LocalDate maturityDate) {
        BondDetailsProto.Builder b = BondDetailsProto.newBuilder();
        if (faceValue != null)
            b.setFaceValue(ProtoSerializationUtil.serializeBigDecimal(faceValue));
        if (couponRate != null)
            b.setCouponRate(ProtoSerializationUtil.serializeBigDecimal(couponRate));
        if (couponType != null)
            b.setCouponType(couponType);
        if (couponFrequency != null)
            b.setCouponFrequency(couponFrequency);
        if (issueDate != null)
            b.setIssueDate(ProtoSerializationUtil.serializeLocalDate(issueDate));
        if (maturityDate != null)
            b.setMaturityDate(ProtoSerializationUtil.serializeLocalDate(maturityDate));
        return b.build();
    }

    public Tenor getTenor() {
        LocalDate issue = getIssueDate();
        LocalDate maturity = getMaturityDate();
        if (issue == null || maturity == null) {
            return Tenor.UNKNOWN_TENOR;
        }
        return new Tenor(TenorType.TERM, Period.between(issue, maturity));
    }

    public Tenor getAdjustedTenor(LocalDate asOfDate) {
        LocalDate maturity = getMaturityDate();
        if (maturity == null) return Tenor.UNKNOWN_TENOR;
        return new Tenor(TenorType.TERM, Period.between(asOfDate, maturity));
    }

    @Deprecated
    public Tenor getAdjustedTenor() {
        return getAdjustedTenor(LocalDate.now());
    }

    /***
     * Plumbing for positions
     */
    public Object getField(Field field) {
        return switch (field) {
            case TENOR-> getTenor();
            case ADJUSTED_TENOR -> getAdjustedTenor();
            case MATURITY_DATE -> getMaturityDate();
            case ISSUE_DATE -> getIssueDate();
            default -> super.getField(field);
        };
    }
}
