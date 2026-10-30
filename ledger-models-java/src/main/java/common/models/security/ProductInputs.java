package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Descriptors.OneofDescriptor;
import common.models.errors.UnmappedProductTypeError;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.requests.valuation.ProductInput;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * Which {@code ProductInput} arm values a security, and which market data
 * that arm needs. Backed by the {@code valuation_arms} section of
 * ledger-models-protos/hierarchy.json; there is no mapping table in code.
 * Same rule in Java / Rust / Python / JS-TS. See docs/adr/valuation_arms.md.
 *
 * <p>Resolution walks from the security's {@code product_type} up its parent
 * chain. At each node a {@code coupon_types} entry matching
 * {@code bond_details.coupon_type} wins, then the node's plain entry, then an
 * {@code unpriced} listing. The first node with any match decides. No match,
 * or an {@code unpriced} match, throws {@link UnmappedProductTypeError}:
 * there is no default arm.
 *
 * <p>Reads {@code /hierarchy.json} itself rather than through
 * {@link ProductHierarchy}, so the existing loader stays unchanged.
 */
public final class ProductInputs {

    /** Map key for a node's entry with no {@code coupon_types}. */
    private static final String ANY_COUPON = "";
    private static final String UNKNOWN_COUPON = CouponTypeProto.UNKNOWN_COUPON_TYPE.name();

    /** One resolved arm and the market data it requires, in file order. */
    static final class Arm {
        final String arm;
        final List<MarketDataKind> requires;

        Arm(String arm, List<MarketDataKind> requires) {
            this.arm = arm;
            this.requires = requires;
        }
    }

    /** A parsed, checked {@code valuation_arms} section. */
    static final class ValuationArms {
        /** node → coupon type name (or {@link #ANY_COUPON}) → arm. */
        private final Map<String, Map<String, Arm>> entries;
        private final Set<String> unpriced;

        ValuationArms(Map<String, Map<String, Arm>> entries, Set<String> unpriced) {
            this.entries = entries;
            this.unpriced = unpriced;
        }

        /** The deepest matching node's arm, or null when unmapped or unpriced. */
        Arm resolve(String productType, String couponType) {
            for (String node = productType; node != null; node = ProductHierarchy.parentOf(node)) {
                Map<String, Arm> byCoupon = entries.get(node);
                if (byCoupon != null) {
                    Arm a = byCoupon.get(couponType);
                    if (a == null) a = byCoupon.get(ANY_COUPON);
                    if (a != null) return a;
                }
                if (unpriced.contains(node)) return null;
            }
            return null;
        }

        Arm require(String productType, String couponType) {
            Arm a = resolve(productType, couponType);
            if (a == null) throw new UnmappedProductTypeError(productType, couponType);
            return a;
        }

        /** True iff some node on the chain has an entry for any coupon, or is unpriced. */
        boolean covers(String productType) {
            for (String node = productType; node != null; node = ProductHierarchy.parentOf(node)) {
                if (entries.containsKey(node) || unpriced.contains(node)) return true;
            }
            return false;
        }

        /** Leaf product types (active and planned) with neither an entry nor an unpriced listing. */
        Set<String> uncoveredLeaves() {
            Set<String> out = new TreeSet<>();
            for (String node : ProductHierarchy.allProductTypes()) {
                if (ProductHierarchy.descendantsOf(node).isEmpty() && !covers(node)) out.add(node);
            }
            return out;
        }
    }

    private static final class Shipped {
        static final ValuationArms ARMS = load();
    }

    private ProductInputs() { }

    /** Name of the {@code ProductInput.input} oneof field that values {@code security}, e.g. {@code "tips"}. */
    public static String armFor(SecurityProto security) {
        return Shipped.ARMS.require(productTypeOf(security), couponTypeOf(security)).arm;
    }

    /** Market data the security's arm needs, in file order. Unmodifiable; empty when none. */
    public static List<MarketDataKind> requiredMarketData(SecurityProto security) {
        return Shipped.ARMS.require(productTypeOf(security), couponTypeOf(security)).requires;
    }

    static ValuationArms shipped() {
        return Shipped.ARMS;
    }

    private static String productTypeOf(SecurityProto security) {
        return security.getProductType().name();
    }

    /** Read from the proto field only; unset {@code bond_details} reads as UNKNOWN_COUPON_TYPE. */
    private static String couponTypeOf(SecurityProto security) {
        return security.hasBondDetails() ? security.getBondDetails().getCouponType().name() : UNKNOWN_COUPON;
    }

    private static ValuationArms load() {
        try (InputStream in = ProductInputs.class.getResourceAsStream("/hierarchy.json")) {
            if (in == null) {
                throw new IllegalStateException(
                        "hierarchy.json not found on classpath. Build wiring should bundle it from ledger-models-protos/");
            }
            JsonObject root;
            try (InputStreamReader r = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                root = new Gson().fromJson(r, JsonObject.class);
            }
            if (!root.has("valuation_arms")) {
                throw new IllegalStateException("hierarchy.json has no valuation_arms section");
            }
            return parse(root.getAsJsonObject("valuation_arms"));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load hierarchy.json", e);
        }
    }

    /**
     * Parses and checks a {@code valuation_arms} section against the shipped
     * product_types tree, the {@code ProductInput} oneof and the
     * CouponTypeProto / {@link MarketDataKind} vocabularies.
     *
     * @throws IllegalStateException if any check fails
     */
    static ValuationArms parse(JsonObject section) {
        Set<String> productTypes = ProductHierarchy.allProductTypes();
        Set<String> arms = oneofArms();

        Map<String, Map<String, Arm>> entries = new HashMap<>();
        for (JsonElement el : array(section, "entries")) {
            JsonObject e = el.getAsJsonObject();
            String node = string(e, "node");
            requireNode(productTypes, node);
            String arm = string(e, "arm");
            if (!arms.contains(arm)) {
                throw new IllegalStateException(bad("arm '" + arm + "' is not a ProductInput.input field"));
            }
            List<MarketDataKind> requires = new ArrayList<>();
            for (JsonElement r : array(e, "requires")) requires.add(marketDataKind(string(r, "requires")));
            Arm value = new Arm(arm, Collections.unmodifiableList(requires));

            List<String> coupons = new ArrayList<>();
            if (e.has("coupon_types")) {
                for (JsonElement c : array(e, "coupon_types")) coupons.add(couponType(string(c, "coupon_types")));
            } else {
                coupons.add(ANY_COUPON);
            }
            Map<String, Arm> byCoupon = entries.computeIfAbsent(node, k -> new HashMap<>());
            for (String coupon : coupons) {
                if (byCoupon.put(coupon, value) != null) {
                    throw new IllegalStateException(bad("duplicate entry for node " + node
                            + (coupon.isEmpty() ? "" : ", coupon_type " + coupon)));
                }
            }
        }

        Set<String> unpriced = new HashSet<>();
        for (JsonElement el : array(section, "unpriced")) {
            String node = string(el, "unpriced");
            requireNode(productTypes, node);
            if (entries.containsKey(node)) {
                throw new IllegalStateException(bad("node " + node + " is both mapped and unpriced"));
            }
            unpriced.add(node);
        }
        return new ValuationArms(entries, Collections.unmodifiableSet(unpriced));
    }

    private static Set<String> oneofArms() {
        Set<String> out = new HashSet<>();
        for (OneofDescriptor o : ProductInput.getDescriptor().getOneofs()) {
            if (!o.getName().equals("input")) continue;
            for (FieldDescriptor f : o.getFields()) out.add(f.getName());
        }
        return out;
    }

    private static void requireNode(Set<String> productTypes, String node) {
        if (!productTypes.contains(node)) {
            throw new IllegalStateException(bad("node '" + node + "' is not in product_types"));
        }
    }

    private static MarketDataKind marketDataKind(String value) {
        try {
            return MarketDataKind.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(bad("requires value '" + value
                    + "' is not one of CPI_U, FRN_FIXINGS, FRN_CURVE"), ex);
        }
    }

    private static String couponType(String value) {
        try {
            if (CouponTypeProto.valueOf(value) != CouponTypeProto.UNRECOGNIZED) return value;
        } catch (IllegalArgumentException ex) {
            // Falls through to the registry error below.
        }
        throw new IllegalStateException(bad("coupon_types value '" + value + "' is not a CouponTypeProto name"));
    }

    private static String string(JsonObject o, String key) {
        return string(o.get(key), key);
    }

    private static String string(JsonElement v, String key) {
        if (v == null || !v.isJsonPrimitive() || !v.getAsJsonPrimitive().isString()) {
            throw new IllegalStateException(bad("'" + key + "' values must be strings, got " + v));
        }
        return v.getAsString();
    }

    private static JsonArray array(JsonObject o, String key) {
        JsonElement v = o.get(key);
        if (v == null || !v.isJsonArray()) {
            throw new IllegalStateException(bad("'" + key + "' must be a list in " + o));
        }
        return v.getAsJsonArray();
    }

    private static String bad(String detail) {
        return "hierarchy.json valuation_arms: " + detail;
    }
}
