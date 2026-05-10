package common.models.security;

import common.models.JSONFieldNames;
import common.models.postion.Field;
import fintekkers.models.security.ProductTypeProto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZonedDateTime;
import java.util.UUID;

/***
 * Bond security 0.01. Based on treasury bonds. Will expand/evolve significantly
 *
 * Example US Treasuries:
 *
 *
 */
public class BondSecurity extends Security {
    public final static String ASSET_CLASS = JSONFieldNames.FIXED_INCOME;

    private BigDecimal couponRate;
    private CouponType couponType;
    private CouponFrequency couponFrequency;
    private LocalDate datedDate;
    private BigDecimal faceValue;
    private LocalDate issueDate;
    private LocalDate maturityDate;
//    private final Tenor tenor;
    public BondSecurity(UUID id, String issuer, ZonedDateTime asOf, CashSecurity settlementCurrency) {
        super(id, issuer, asOf, settlementCurrency);
//        tenor = new Tenor(TenorType.TERM, Period.between(issueDate, maturityDate));
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

    public void setCouponRate(BigDecimal couponRate) {
        this.couponRate = couponRate;
    }

    public BigDecimal getCouponRate() {
        return this.couponRate;
    }

    public void setCouponType(CouponType couponType) {
        this.couponType = couponType;
    }

    public CouponType getCouponType() {
        return this.couponType;
    }

    public void setCouponFrequency(CouponFrequency CouponFrequency) {
        this.couponFrequency = CouponFrequency;
    }

    public CouponFrequency getCouponFrequency() {
        return this.couponFrequency;
    }

    /***
     * This is the date when the security starts to accrue interest. Generally,
     * the dated date will be the same as the issue date, but not always.
     *
     * For example US treasuries when re-opening a previous issue, the dated date
     * may be before the issue date. In this case the buyer of the bond pays the
     * accrued interest to the seller.
     *
     * @param datedDate A LocalDate
     */
    public void setDatedDate(LocalDate datedDate) {
        this.datedDate = datedDate;
    }

    /***
     * This is the date when the security starts to accrue interest. Generally,
     * the dated date will be the same as the issue date, but not always.
     *
     * For example US treasuries when re-opening a previous issue, the dated date
     * may be before the issue date. In this case the buyer of the bond pays the
     * accrued interest to the seller.
     *
    */
     public LocalDate getDatedDate() {
        return datedDate;
    }

    public void setFaceValue(BigDecimal faceValue) {
        this.faceValue = faceValue;
    }

    /***
     * Gets the face value of a bond. Typically, this represents
     * the amount you will lend to the borrow when purchasing the
     * bond at issuance, as well as the mount you will
     * receive at maturity per individual unit
     * of the security.
     *
     * For example, a US treasury will lend $1,000 to the US Treasury
     * and receive the same amount at maturity, with a coupon being
     * paid to the lender semi-annually.
     *
     * @return The nominal value per individual unit of a bond
     */
    public BigDecimal getFaceValue() {
        return faceValue;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setMaturityDate(LocalDate maturityDate) {
        this.maturityDate = maturityDate;
    }

    public LocalDate getMaturityDate() {
        return maturityDate;
    }

    public BigDecimal getPriceScaleFactor() {
        return getFaceValue().divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);
    }

    /**
     * BondSecurity is a generic wrapper for bond-shape product types
     * (TBILL, TREASURY_NOTE, TREASURY_BOND, STRIPS, SOVEREIGN_BOND,
     * CORP_BOND, MUNI_BOND). When constructed from a proto via the
     * deserialize path the source proto carries the actual leaf type;
     * for legacy non-proto-constructed instances we default to
     * TREASURY_NOTE as the sensible "vanilla bond" fallback.
     * Specialized subclasses (TIPSBond, FloatingRateNote) override.
     */
    @Override
    public ProductTypeProto getProductType() {
        ProductTypeProto pt = super.getProductType();
        return pt == ProductTypeProto.PRODUCT_TYPE_UNKNOWN ? ProductTypeProto.TREASURY_NOTE : pt;
    }

    @Override
    public String toString() {
        String securityId = getSecurityId() != null ? getSecurityId().toString() : "No Security Id";
        String tenorDescription = getTenor().getTenorDescription();
        return "Bond: " + securityId + " " + maturityDate +
                " " + couponRate + "% " + tenorDescription;
    }

    public Tenor getTenor() {
        return new Tenor(TenorType.TERM, Period.between(issueDate, maturityDate));
    }

    public Tenor getAdjustedTenor(LocalDate asOfDate) {
        return new Tenor(TenorType.TERM, Period.between(asOfDate, maturityDate));
    }

    /**
     * @deprecated Hardcodes {@link LocalDate#now()}, which makes backtesting and
     * deterministic curve construction impossible. Prefer
     * {@link #getAdjustedTenor(LocalDate)} with an explicit as-of date.
     */
    @Deprecated
    public Tenor getAdjustedTenor() {
        return getAdjustedTenor(LocalDate.now());
    }

    // The Java-only ProductType enum (BILL/NOTE/BOND derived from tenor)
    // was deleted as part of the 4-dim registry refactor (M1 of #257).
    // ProductTypeProto.{TBILL, TREASURY_NOTE, TREASURY_BOND} now carries
    // the same distinction explicitly on the proto. Tenor-derived
    // classification is no longer authoritative.

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
