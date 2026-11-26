package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import common.models.errors.ModelValidationException;
import fintekkers.models.security.DayCountConventionProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Bond day-count conventions (LM-498). Same rules in Java / Rust / Python /
 * JS-TS. See docs/adr/day_count_convention.md; the DayCountConventionProto
 * comments are the spec.
 *
 * <p>Two halves that change for different reasons:
 * <ul>
 *   <li>The resolver ({@link #resolve}) picks a bond's convention: an explicit
 *   {@code bond_details.day_count} other than {@code UNKNOWN_DAY_COUNT} wins,
 *   else the {@code default_day_count} entry of hierarchy.json for the raw
 *   proto product_type (deepest node on the parent chain wins), else
 *   {@code UNKNOWN_DAY_COUNT}. It never throws for a product with no entry and
 *   never guesses. A broken section is an {@link IllegalStateException} on
 *   first use, like {@link DefaultPriceTypes}.</li>
 *   <li>The date helpers ({@link #dayCount}, {@link #yearFraction},
 *   {@code icma*}) are plain date arithmetic and never read hierarchy.json.
 *   Results are doubles: fine for fractions, not for decimal cash amounts.
 *   Bad input is a {@link ModelValidationException}.</li>
 * </ul>
 */
public final class DayCounts {
    static final String SECTION = "default_day_count";

    private DayCounts() { }

    // ---------- resolver: hierarchy.json default_day_count ----------

    private static final class Shipped {
        static final Map<String, DayCountConventionProto> DEFAULTS = load();
    }

    /**
     * The bond's convention: {@code bond_details.day_count} when set to anything
     * but {@code UNKNOWN_DAY_COUNT}, else {@link #defaultFor}. Never guesses: a
     * number this build does not know (a newer writer's value) is
     * {@code UNKNOWN_DAY_COUNT}, not the product default.
     */
    public static DayCountConventionProto resolve(SecurityProto security) {
        if (security != null && security.hasBondDetails() && security.getBondDetails().hasDayCount()) {
            DayCountConventionProto explicit = security.getBondDetails().getDayCount();
            if (explicit == DayCountConventionProto.UNRECOGNIZED) return DayCountConventionProto.UNKNOWN_DAY_COUNT;
            if (explicit != DayCountConventionProto.UNKNOWN_DAY_COUNT) return explicit;
        }
        return defaultFor(security);
    }

    /**
     * The product default for the security's raw product_type, or
     * {@code UNKNOWN_DAY_COUNT} when it has none. A null security reads as
     * {@code PRODUCT_TYPE_UNKNOWN}.
     */
    public static DayCountConventionProto defaultFor(SecurityProto security) {
        return defaultFor(Shipped.DEFAULTS, productTypeOf(security));
    }

    /** node -> convention, as written in the shipped section. Unmodifiable. */
    static Map<String, DayCountConventionProto> shippedDefaults() {
        return Shipped.DEFAULTS;
    }

    static DayCountConventionProto defaultFor(Map<String, DayCountConventionProto> defaults, String productType) {
        for (String node = productType; node != null; node = ProductHierarchy.parentOf(node)) {
            DayCountConventionProto conv = defaults.get(node);
            if (conv != null) return conv;
        }
        return DayCountConventionProto.UNKNOWN_DAY_COUNT;
    }

    /**
     * Parses and checks the {@code default_day_count} section of a whole
     * hierarchy.json {@code root} against the shipped product_types tree and
     * the DayCountConventionProto names.
     *
     * @throws IllegalStateException if the section is missing or not an
     *         object, a key is not a product_types node, or a value is not a
     *         DayCountConventionProto name or is {@code UNKNOWN_DAY_COUNT}
     */
    static Map<String, DayCountConventionProto> fromHierarchy(JsonObject root) {
        JsonElement section = root.get(SECTION);
        if (section == null) throw new IllegalStateException(bad("section missing from hierarchy.json"));
        if (!section.isJsonObject()) throw new IllegalStateException(bad("section must be an object"));
        Set<String> productTypes = ProductHierarchy.allProductTypes();
        Map<String, DayCountConventionProto> out = new LinkedHashMap<>();
        for (Map.Entry<String, JsonElement> e : section.getAsJsonObject().entrySet()) {
            String node = e.getKey();
            if (!productTypes.contains(node)) {
                throw new IllegalStateException(bad("node '" + node + "' is not in product_types"));
            }
            out.put(node, convention(node, e.getValue()));
        }
        return Collections.unmodifiableMap(out);
    }

    private static DayCountConventionProto convention(String node, JsonElement value) {
        if (value.isJsonPrimitive() && value.getAsJsonPrimitive().isString()) {
            String name = value.getAsString();
            if (name.equals(DayCountConventionProto.UNKNOWN_DAY_COUNT.name())) {
                throw new IllegalStateException(bad("node " + node + " must not default to " + name));
            }
            for (DayCountConventionProto c : DayCountConventionProto.values()) {
                if (c != DayCountConventionProto.UNRECOGNIZED && c.name().equals(name)) return c;
            }
        }
        throw new IllegalStateException(bad("value " + value + " for node " + node
                + " is not a DayCountConventionProto name"));
    }

    private static Map<String, DayCountConventionProto> load() {
        try (InputStream in = DayCounts.class.getResourceAsStream("/hierarchy.json")) {
            if (in == null) {
                throw new IllegalStateException(
                        "hierarchy.json not found on classpath. Build wiring should bundle it from ledger-models-protos/");
            }
            JsonObject root;
            try (InputStreamReader r = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                root = new Gson().fromJson(r, JsonObject.class);
            }
            return fromHierarchy(root);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load hierarchy.json", e);
        }
    }

    private static String productTypeOf(SecurityProto security) {
        if (security == null) return ProductTypeProto.PRODUCT_TYPE_UNKNOWN.name();
        ProductTypeProto type = security.getProductType();
        return type == ProductTypeProto.UNRECOGNIZED
                ? String.valueOf(security.getProductTypeValue()) : type.name();
    }

    private static String bad(String detail) {
        return "hierarchy.json " + SECTION + ": " + detail;
    }

    // ---------- date helpers: no registry access ----------

    /**
     * Days from {@code start} (excluded) to {@code end} (included).
     * {@code THIRTY_360_US} applies the bond-basis rules; every other
     * convention counts actual calendar days.
     *
     * @throws ModelValidationException for {@code UNKNOWN_DAY_COUNT}, a null
     *         argument or {@code start > end}
     */
    public static long dayCount(DayCountConventionProto convention, LocalDate start, LocalDate end) {
        checkConvention(convention);
        checkOrder(start, end);
        if (convention == DayCountConventionProto.THIRTY_360_US) return thirty360Us(start, end);
        return ChronoUnit.DAYS.between(start, end);
    }

    /**
     * Years from {@code start} to {@code end}: days / 360 for
     * {@code THIRTY_360_US} and {@code ACT_360}, days / 365 for
     * {@code ACT_365_FIXED}.
     *
     * @throws ModelValidationException as {@link #dayCount} does, or for
     *         {@code ACT_ACT_ICMA}, which needs the coupon period: use
     *         {@link #icmaYearFraction}
     */
    public static double yearFraction(DayCountConventionProto convention, LocalDate start, LocalDate end) {
        if (convention == DayCountConventionProto.ACT_ACT_ICMA) {
            throw invalid("convention", "ACT_ACT_ICMA needs the coupon period: use icmaYearFraction");
        }
        long days = dayCount(convention, start, end);
        return convention == DayCountConventionProto.ACT_365_FIXED ? days / 365.0 : days / 360.0;
    }

    /**
     * ACT/ACT ICMA: actual days {@code start -> end} over actual days in the
     * regular coupon period that contains them.
     *
     * @throws ModelValidationException unless
     *         {@code periodStart <= start <= end <= periodEnd} and
     *         {@code periodStart < periodEnd}
     */
    public static double icmaPeriodFraction(LocalDate start, LocalDate end, LocalDate periodStart, LocalDate periodEnd) {
        checkPeriod(start, end, periodStart, periodEnd);
        return (double) ChronoUnit.DAYS.between(start, end) / ChronoUnit.DAYS.between(periodStart, periodEnd);
    }

    /**
     * ACT/ACT ICMA in years: days / (frequency x period days), frequency being
     * coupons a year (2 for semiannual).
     *
     * @throws ModelValidationException as {@link #icmaPeriodFraction} does, or
     *         when frequency is not positive
     */
    public static double icmaYearFraction(LocalDate start, LocalDate end, LocalDate periodStart, LocalDate periodEnd,
                                          int frequency) {
        if (frequency <= 0) {
            throw invalid("frequency", "frequency must be a positive number of coupons a year, got " + frequency);
        }
        return icmaPeriodFraction(start, end, periodStart, periodEnd) / frequency;
    }

    private static long thirty360Us(LocalDate start, LocalDate end) {
        int d1 = start.getDayOfMonth();
        int d2 = end.getDayOfMonth();
        if (d1 == 31) d1 = 30;
        if (d2 == 31 && d1 >= 30) d2 = 30;
        return 360L * (end.getYear() - start.getYear()) + 30L * (end.getMonthValue() - start.getMonthValue())
                + (d2 - d1);
    }

    private static void checkConvention(DayCountConventionProto convention) {
        if (convention == null || convention == DayCountConventionProto.UNKNOWN_DAY_COUNT
                || convention == DayCountConventionProto.UNRECOGNIZED) {
            throw invalid("convention", "no day-count convention to apply (got " + convention + ")");
        }
    }

    private static void checkOrder(LocalDate start, LocalDate end) {
        if (start == null) throw invalid("start", "start is required");
        if (end == null) throw invalid("end", "end is required");
        if (start.isAfter(end)) throw invalid("end", "start " + start + " is after end " + end);
    }

    private static void checkPeriod(LocalDate start, LocalDate end, LocalDate periodStart, LocalDate periodEnd) {
        checkOrder(start, end);
        if (periodStart == null) throw invalid("period_start", "period_start is required");
        if (periodEnd == null) throw invalid("period_end", "period_end is required");
        if (!periodStart.isBefore(periodEnd)) {
            throw invalid("period_end", "period_start " + periodStart + " must be before period_end " + periodEnd);
        }
        if (start.isBefore(periodStart) || end.isAfter(periodEnd)) {
            throw invalid("period_start",
                    start + " -> " + end + " is outside the coupon period " + periodStart + " -> " + periodEnd);
        }
    }

    private static ModelValidationException invalid(String field, String message) {
        return new ModelValidationException(List.of(ModelValidationException.violation(field, null, message)));
    }
}
