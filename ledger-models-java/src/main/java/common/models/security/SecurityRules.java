package common.models.security;

import common.models.errors.ModelValidationException;
import fintekkers.models.security.BondDetailsProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.requests.util.errors.FieldViolation.FieldViolationProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static common.models.errors.ModelValidationException.violation;

/**
 * The one shared rule set for security input (LM-255). {@link Security#fromProto},
 * {@link BondSecurity#getProductType()} and transaction validation all call
 * these rules, and services call {@link #validate} / {@link #requireValid}
 * instead of copying them.
 *
 * <p>Pure: proto in, violations out. No I/O, no hydration of links, no
 * service state. Existence, duplicates, tax lots and permissions stay in
 * services. See docs/adr/typed-input-errors.md.
 */
public final class SecurityRules {
    public static final String FACE_VALUE = "bond_details.face_value";
    public static final String ISSUE_DATE = "bond_details.issue_date";
    public static final String MATURITY_DATE = "bond_details.maturity_date";

    private SecurityRules() {}

    /**
     * Returns {@code proto.getProductType()}, or when that is UNKNOWN infers
     * the type from the structured shape (extensions, bond_details,
     * non_bond_details). Returns UNKNOWN when nothing identifies the type.
     */
    public static ProductTypeProto inferProductType(SecurityProto proto) {
        ProductTypeProto productType = proto.getProductType();
        SecurityProto.NonBondDetailsCase nonBondCase = proto.getNonBondDetailsCase();

        if (productType == ProductTypeProto.PRODUCT_TYPE_UNKNOWN) {
            if (proto.hasTipsExtension()) {
                productType = ProductTypeProto.TIPS;
            } else if (proto.hasFrnExtension()) {
                productType = ProductTypeProto.TREASURY_FRN;
            } else if (proto.hasMbsExtension()) {
                productType = ProductTypeProto.MORTGAGE_BACKED;
            } else if (proto.hasBondDetails()) {
                productType = ProductTypeProto.TREASURY_NOTE;
            } else if (nonBondCase != SecurityProto.NonBondDetailsCase.NONBONDDETAILS_NOT_SET) {
                switch (nonBondCase) {
                    case CASH_DETAILS:   productType = ProductTypeProto.CURRENCY; break;
                    case EQUITY_DETAILS: productType = ProductTypeProto.COMMON_STOCK; break;
                    case INDEX_DETAILS:  productType = ProductTypeProto.EQUITY_INDEX; break;
                    default: break;
                }
            }
        }
        return productType;
    }

    /** True iff the (explicit or inferred) product type is a BOND descendant. */
    public static boolean isBond(SecurityProto proto) {
        return ProductHierarchy.isDescendantOf(inferProductType(proto), "BOND");
    }

    /** Field paths that must be set on this security: bonds need face_value and issue_date. */
    public static List<String> requiredFields(SecurityProto proto) {
        return isBond(proto) ? List.of(FACE_VALUE, ISSUE_DATE) : List.of();
    }

    /**
     * Returns every field-level violation on this security, or an empty list
     * when it is valid. A link security returns an empty list: hydrate it
     * first to have its fields checked.
     */
    public static List<FieldViolationProto> validate(SecurityProto proto) {
        Objects.requireNonNull(proto, "SecurityProto must not be null");
        List<FieldViolationProto> out = new ArrayList<>();
        if (proto.getIsLink() || !isBond(proto)) return out;

        UUID id = objectIdOf(proto);
        BondDetailsProto bond = proto.getBondDetails();
        for (String field : requiredFields(proto)) {
            if (!isSet(bond, field)) {
                out.add(violation(field, id, field + " is required for a bond"));
            }
        }
        FieldViolationProto dates = bondDatesViolation(proto, id);
        if (dates != null) out.add(dates);
        return out;
    }

    /** Throws {@link ModelValidationException} carrying every violation if {@link #validate} finds any. */
    public static void requireValid(SecurityProto proto) {
        List<FieldViolationProto> violations = validate(proto);
        if (!violations.isEmpty()) throw new ModelValidationException(violations);
    }

    /**
     * Construction-time rule used by {@link Security#fromProto}: maturity_date
     * must be strictly after issue_date when both are set.
     */
    static void checkBondDates(SecurityProto proto) {
        FieldViolationProto v = bondDatesViolation(proto, objectIdOf(proto));
        if (v != null) throw new ModelValidationException(List.of(v));
    }

    private static FieldViolationProto bondDatesViolation(SecurityProto proto, UUID id) {
        if (!proto.hasBondDetails()) return null;
        BondDetailsProto bond = proto.getBondDetails();
        if (!bond.hasIssueDate() || !bond.hasMaturityDate()) return null;
        LocalDate issue = ProtoSerializationUtil.deserializeOptionalLocalDate(bond.getIssueDate(), ISSUE_DATE);
        LocalDate maturity = ProtoSerializationUtil.deserializeOptionalLocalDate(bond.getMaturityDate(), MATURITY_DATE);
        if (issue == null || maturity == null || maturity.isAfter(issue)) return null;
        return violation(MATURITY_DATE, id,
                "maturity_date must be after issue_date: maturity=" + maturity + ", issue=" + issue);
    }

    private static boolean isSet(BondDetailsProto bond, String field) {
        switch (field) {
            case FACE_VALUE: return bond.hasFaceValue();
            case ISSUE_DATE:
                return bond.hasIssueDate() && !ProtoSerializationUtil.isUnsetLocalDate(bond.getIssueDate());
            case MATURITY_DATE:
                return bond.hasMaturityDate() && !ProtoSerializationUtil.isUnsetLocalDate(bond.getMaturityDate());
            default: throw new IllegalStateException("No presence check for " + field);
        }
    }

    /** The security's UUID, or null when it has none or it is not 16 bytes. */
    private static UUID objectIdOf(SecurityProto proto) {
        if (!proto.hasUuid() || proto.getUuid().getRawUuid().size() != 16) return null;
        return ProtoSerializationUtil.deserializeUUID(proto.getUuid());
    }
}
