package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.google.protobuf.Descriptors.FieldDescriptor;
import com.google.protobuf.Descriptors.OneofDescriptor;
import com.google.protobuf.Message;
import common.models.errors.MissingMarketDataError;
import common.models.errors.ModelValidationException;
import common.models.errors.UnmappedProductTypeError;
import fintekkers.models.position.MeasureProto;
import fintekkers.models.price.PriceProto;
import fintekkers.models.security.CouponTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import fintekkers.requests.valuation.BondInput;
import fintekkers.requests.valuation.CashInput;
import fintekkers.requests.valuation.EquityInput;
import fintekkers.requests.valuation.FrnInput;
import fintekkers.requests.valuation.InflationIndexInput;
import fintekkers.requests.valuation.MbsInput;
import fintekkers.requests.valuation.ProductInput;
import fintekkers.requests.valuation.TipsInput;
import protos.serializers.util.proto.ProtoSerializationUtil;

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
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

/**
 * Which {@code ProductInput} input type values a security, and which market
 * data that input type needs. Backed by the {@code valuation_input_types}
 * section of ledger-models-protos/hierarchy.json; there is no mapping table in
 * code. Same rule in Java / Rust / Python / JS-TS. See
 * docs/adr/valuation_input_types.md.
 *
 * <p>Resolution walks from the security's {@code product_type} up its parent
 * chain. At each node a {@code coupon_types} entry matching
 * {@code bond_details.coupon_type} wins, then the node's plain entry, then an
 * {@code unpriced} listing. The first node with any match decides. No match,
 * or an {@code unpriced} match, throws {@link UnmappedProductTypeError}:
 * there is no default input type.
 *
 * <p>{@link #forSecurity} builds the {@code ProductInput} for that input type from a
 * security, its price and its market data; {@link #checkProductInput} checks
 * a {@code ProductInput} against the same rule (LM-410, see
 * docs/adr/product_input_builders.md).
 *
 * <p>{@link #measuresForInputType} lists the measures valuation-service computes
 * for an input type, read from the bundled {@code /catalog/measures.json} through the
 * same lookup (LM-427). There is no measure list in code.
 *
 * <p>Reads {@code /hierarchy.json} itself rather than through
 * {@link ProductHierarchy}, so the existing loader stays unchanged.
 */
public final class ProductInputs {

    /** Map key for a node's entry with no {@code coupon_types}. */
    private static final String ANY_COUPON = "";
    private static final String UNKNOWN_COUPON = CouponTypeProto.UNKNOWN_COUPON_TYPE.name();

    private static final String SECTION = "valuation_input_types";
    private static final String ENTRY_KEY = "input_type";
    /** Legacy names, still read for one release (LM-418). */
    private static final String LEGACY_SECTION = "valuation_arms";
    private static final String LEGACY_ENTRY_KEY = "arm";

    /** One resolved input type and the market data it requires, in file order. */
    static final class InputTypeEntry {
        final String inputType;
        final List<MarketDataKind> requires;

        InputTypeEntry(String inputType, List<MarketDataKind> requires) {
            this.inputType = inputType;
            this.requires = requires;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof InputTypeEntry && inputType.equals(((InputTypeEntry) o).inputType)
                    && requires.equals(((InputTypeEntry) o).requires);
        }

        @Override
        public int hashCode() {
            return Objects.hash(inputType, requires);
        }
    }

    /** A parsed, checked {@code valuation_input_types} section. */
    static final class ValuationInputTypes {
        /** node → coupon type name (or {@link #ANY_COUPON}) → input type. */
        private final Map<String, Map<String, InputTypeEntry>> entries;
        private final Set<String> unpriced;

        ValuationInputTypes(Map<String, Map<String, InputTypeEntry>> entries, Set<String> unpriced) {
            this.entries = entries;
            this.unpriced = unpriced;
        }

        /** The deepest matching node's input type, or null when unmapped or unpriced. */
        InputTypeEntry resolve(String productType, String couponType) {
            for (String node = productType; node != null; node = ProductHierarchy.parentOf(node)) {
                Map<String, InputTypeEntry> byCoupon = entries.get(node);
                if (byCoupon != null) {
                    InputTypeEntry a = byCoupon.get(couponType);
                    if (a == null) a = byCoupon.get(ANY_COUPON);
                    if (a != null) return a;
                }
                if (unpriced.contains(node)) return null;
            }
            return null;
        }

        InputTypeEntry require(String productType, String couponType) {
            InputTypeEntry a = resolve(productType, couponType);
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

        /** Same entries (every node, coupon type, input type and requires list) and same unpriced nodes. */
        @Override
        public boolean equals(Object o) {
            return o instanceof ValuationInputTypes && entries.equals(((ValuationInputTypes) o).entries)
                    && unpriced.equals(((ValuationInputTypes) o).unpriced);
        }

        @Override
        public int hashCode() {
            return Objects.hash(entries, unpriced);
        }
    }

    private static final class Shipped {
        static final ValuationInputTypes INPUT_TYPES = load();
    }

    private static final class ShippedMeasures {
        static final JsonArray MEASURES = loadMeasures();
    }

    private ProductInputs() { }

    /** Name of the {@code ProductInput.input} oneof field that values {@code security}, e.g. {@code "tips"}. */
    public static String inputTypeFor(SecurityProto security) {
        return Shipped.INPUT_TYPES.require(productTypeOf(security), couponTypeOf(security)).inputType;
    }

    /**
     * @deprecated Use {@link #inputTypeFor(SecurityProto)}. Removed in a later release (LM-418).
     */
    @Deprecated
    public static String armFor(SecurityProto security) {
        return inputTypeFor(security);
    }

    /** Market data the security's input type needs, in file order. Unmodifiable; empty when none. */
    public static List<MarketDataKind> requiredMarketData(SecurityProto security) {
        return Shipped.INPUT_TYPES.require(productTypeOf(security), couponTypeOf(security)).requires;
    }

    /**
     * The measures valuation-service computes for {@code inputType} (e.g. {@code "frn"}),
     * in catalog order: entries of the bundled catalog/measures.json with
     * {@code computed_by: valuation-service} and {@code implemented: true} whose
     * {@code applies_to} names a leaf product type the input type values, or an
     * ancestor of one. A fresh, modifiable list.
     *
     * @throws UnmappedProductTypeError with {@code productType} = {@code inputType}
     *         when no leaf maps to {@code inputType}
     */
    public static List<MeasureProto> measuresForInputType(String inputType) {
        return measuresForInputType(ShippedMeasures.MEASURES, inputType);
    }

    /**
     * @deprecated Use {@link #measuresForInputType(String)}. Removed in a later release (LM-418).
     */
    @Deprecated
    public static List<MeasureProto> measuresForArm(String arm) {
        return measuresForInputType(arm);
    }

    /** {@link #measuresForInputType(String)} over a given {@code measures} list. */
    static List<MeasureProto> measuresForInputType(JsonArray measures, String inputType) {
        Set<String> enumTypes = new HashSet<>();
        for (ProductTypeProto pt : ProductTypeProto.values()) {
            if (pt != ProductTypeProto.UNRECOGNIZED) enumTypes.add(pt.name());
        }
        Set<String> lineage = new HashSet<>();
        for (String leaf : ProductHierarchy.allProductTypes()) {
            if (!ProductHierarchy.descendantsOf(leaf).isEmpty() || !enumTypes.contains(leaf)) continue;
            // Leaves resolve with no coupon type, as inputTypeFor does with no bond_details:
            // the BOND + FLOAT entry is ignored on purpose (docs/adr/valuation_input_types.md).
            InputTypeEntry a = Shipped.INPUT_TYPES.resolve(leaf, UNKNOWN_COUPON);
            if (a == null || !a.inputType.equals(inputType)) continue;
            for (String node = leaf; node != null; node = ProductHierarchy.parentOf(node)) lineage.add(node);
        }
        if (lineage.isEmpty()) throw new UnmappedProductTypeError(inputType, UNKNOWN_COUPON);
        List<MeasureProto> out = new ArrayList<>();
        for (JsonElement e : measures) {
            JsonObject m = e.getAsJsonObject();
            boolean implemented = new JsonPrimitive(true).equals(m.get("implemented"));
            if (!"valuation-service".equals(stringOrNull(m.get("computed_by"))) || !implemented) continue;
            boolean applies = false;
            for (JsonElement node : catalogArray(m, "applies_to")) {
                if (lineage.contains(stringOrNull(node))) applies = true;
            }
            if (!applies) continue;
            String name = stringOrNull(m.get("name"));
            MeasureProto measure;
            try {
                measure = MeasureProto.valueOf(name == null ? "" : name);
            } catch (IllegalArgumentException ex) {
                throw new IllegalStateException("catalog/measures.json: '" + name + "' is not a MeasureProto name", ex);
            }
            if (!out.contains(measure)) out.add(measure);
        }
        return out;
    }

    /**
     * The {@code ProductInput} for {@code security}, in the input type {@link #inputTypeFor} picks.
     *
     * <p>Sets the input type's security and copies {@code price.price} as is into
     * clean_price (bond, tips, frn, mbs) or unit_price (equity, cash). Never
     * sets cost_basis. {@code marketData} supplies the input type's other fields.
     *
     * @throws UnmappedProductTypeError when the security's type has no input type
     * @throws MissingMarketDataError   when {@code marketData} lacks a kind the input type requires
     */
    public static ProductInput forSecurity(SecurityProto security, PriceProto price, MarketData marketData) {
        MarketData md = marketData != null ? marketData : MarketData.NONE;
        String inputType = inputTypeFor(security);
        ProductInput.Builder out = ProductInput.newBuilder();
        switch (inputType) {
            case "bond": {
                BondInput.Builder b = BondInput.newBuilder().setSecurity(security);
                if (price.hasPrice()) b.setCleanPrice(price.getPrice());
                out.setBond(b);
                break;
            }
            case "tips": {
                TipsInput.Builder b = TipsInput.newBuilder().setSecurity(security);
                if (price.hasPrice()) b.setCleanPrice(price.getPrice());
                md.cpi().ifPresent(b::setCpi);
                out.setTips(b);
                break;
            }
            case "frn": {
                FrnInput.Builder b = FrnInput.newBuilder().setSecurity(security);
                if (price.hasPrice()) b.setCleanPrice(price.getPrice());
                md.curve().ifPresent(b::setCurve);
                b.addAllFixings(md.fixings());
                out.setFrn(b);
                break;
            }
            case "mbs": {
                MbsInput.Builder b = MbsInput.newBuilder().setSecurity(security);
                if (price.hasPrice()) b.setCleanPrice(price.getPrice());
                out.setMbs(b);
                break;
            }
            case "equity": {
                EquityInput.Builder b = EquityInput.newBuilder().setSecurity(security);
                if (price.hasPrice()) b.setUnitPrice(price.getPrice());
                out.setEquity(b);
                break;
            }
            case "cash": {
                CashInput.Builder b = CashInput.newBuilder().setSecurity(security);
                if (price.hasPrice()) b.setUnitPrice(price.getPrice());
                out.setCash(b);
                break;
            }
            default:
                throw new IllegalStateException("forSecurity has no builder for input type " + inputType);
        }
        ProductInput built = out.build();
        checkProductInput(built);
        return built;
    }

    /**
     * Checks {@code productInput} is the input type {@link #inputTypeFor} picks for its
     * security, and holds every market-data kind that input type requires.
     *
     * @throws ModelValidationException  when no input type is set, or the wrong input type
     * @throws UnmappedProductTypeError  when the security's type has no input type
     * @throws MissingMarketDataError    when a required kind is missing
     */
    public static void checkProductInput(ProductInput productInput) {
        if (productInput == null || productInput.getInputCase() == ProductInput.InputCase.INPUT_NOT_SET) {
            throw new ModelValidationException(List.of(
                    ModelValidationException.violation("product_input", null, "no ProductInput input type is set")));
        }
        FieldDescriptor inputField = ProductInput.getDescriptor().findFieldByNumber(productInput.getInputCase().getNumber());
        String inputType = inputField.getName();
        Message body = (Message) productInput.getField(inputField);
        SecurityProto security = (SecurityProto) body.getField(body.getDescriptorForType().findFieldByName("security"));
        String productType = productTypeOf(security);
        InputTypeEntry resolved = Shipped.INPUT_TYPES.require(productType, couponTypeOf(security));
        if (!resolved.inputType.equals(inputType)) {
            throw new ModelValidationException(List.of(ModelValidationException.violation("product_input." + inputType,
                    uuidOf(security), "input type " + inputType + " does not match input type " + resolved.inputType
                            + " for product_type " + productType)));
        }
        for (MarketDataKind kind : resolved.requires) {
            if (!has(productInput, kind)) {
                throw new MissingMarketDataError(inputType, kind, inputType + "." + fieldOf(kind), uuidOf(security));
            }
        }
    }

    /** The ProductInput input type's field (and {@link MarketData} field) that holds {@code kind}. */
    private static String fieldOf(MarketDataKind kind) {
        switch (kind) {
            case CPI_U: return "cpi";
            case FRN_FIXINGS: return "fixings";
            case FRN_CURVE: return "curve";
            default: throw new IllegalStateException("no field for market data " + kind);
        }
    }

    /** Whether {@code in} holds {@code kind}. A cpi with neither readings nor reference_cpi does not count. */
    private static boolean has(ProductInput in, MarketDataKind kind) {
        switch (kind) {
            case CPI_U:
                return in.hasTips() && in.getTips().getCpi().getCpiCase() != InflationIndexInput.CpiCase.CPI_NOT_SET;
            case FRN_FIXINGS:
                return in.hasFrn() && in.getFrn().getFixingsCount() > 0;
            case FRN_CURVE:
                return in.hasFrn() && in.getFrn().hasCurve();
            default:
                throw new IllegalStateException("no presence rule for market data " + kind);
        }
    }

    /** The security's UUID, or null when unset or not 16 bytes. */
    private static UUID uuidOf(SecurityProto security) {
        return security.getUuid().getRawUuid().size() == 16
                ? ProtoSerializationUtil.deserializeUUID(security.getUuid()) : null;
    }

    static ValuationInputTypes shipped() {
        return Shipped.INPUT_TYPES;
    }

    private static String productTypeOf(SecurityProto security) {
        return security.getProductType().name();
    }

    /** Read from the proto field only; unset {@code bond_details} reads as UNKNOWN_COUPON_TYPE. */
    private static String couponTypeOf(SecurityProto security) {
        return security.hasBondDetails() ? security.getBondDetails().getCouponType().name() : UNKNOWN_COUPON;
    }

    private static ValuationInputTypes load() {
        try (InputStream in = ProductInputs.class.getResourceAsStream("/hierarchy.json")) {
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

    private static JsonArray loadMeasures() {
        try (InputStream in = ProductInputs.class.getResourceAsStream("/catalog/measures.json")) {
            if (in == null) {
                throw new IllegalStateException(
                        "catalog/measures.json not found on classpath. compile.sh copies it into src/main/resources/catalog/");
            }
            JsonObject root;
            try (InputStreamReader r = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                root = new Gson().fromJson(r, JsonObject.class);
            }
            return catalogArray(root, "measures");
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load catalog/measures.json", e);
        }
    }

    private static String stringOrNull(JsonElement v) {
        return v != null && v.isJsonPrimitive() ? v.getAsString() : null;
    }

    private static JsonArray catalogArray(JsonObject o, String key) {
        JsonElement v = o.get(key);
        if (v == null || !v.isJsonArray()) {
            throw new IllegalStateException("catalog/measures.json: '" + key + "' must be a list in " + o);
        }
        return v.getAsJsonArray();
    }

    /**
     * Parses and checks the {@code valuation_input_types} section of a whole
     * hierarchy.json {@code root}. For one release a root with the legacy
     * {@code valuation_arms} key instead loads the same way (LM-418); a root
     * with both keys, or neither, is rejected.
     *
     * @throws IllegalStateException if any check fails
     */
    static ValuationInputTypes fromHierarchy(JsonObject root) {
        boolean current = root.has(SECTION);
        boolean legacy = root.has(LEGACY_SECTION);
        if (current && legacy) {
            throw new IllegalStateException(bad("both " + SECTION + " and " + LEGACY_SECTION + " present"));
        }
        if (!current && !legacy) {
            throw new IllegalStateException("hierarchy.json has no " + SECTION + " section");
        }
        JsonElement section = root.get(current ? SECTION : LEGACY_SECTION);
        if (!section.isJsonObject()) throw new IllegalStateException(bad("section must be an object"));
        return parse(section.getAsJsonObject());
    }

    /**
     * Parses and checks a {@code valuation_input_types} section against the shipped
     * product_types tree, the {@code ProductInput} oneof and the
     * CouponTypeProto / {@link MarketDataKind} vocabularies.
     *
     * @throws IllegalStateException if any check fails
     */
    static ValuationInputTypes parse(JsonObject section) {
        Set<String> productTypes = ProductHierarchy.allProductTypes();
        Set<String> inputTypes = oneofInputTypes();

        Map<String, Map<String, InputTypeEntry>> entries = new HashMap<>();
        for (JsonElement el : array(section, "entries")) {
            JsonObject e = el.getAsJsonObject();
            String node = string(e, "node");
            requireNode(productTypes, node);
            String inputType = string(e, inputTypeKey(e));
            if (!inputTypes.contains(inputType)) {
                throw new IllegalStateException(bad("input_type '" + inputType + "' is not a ProductInput.input field"));
            }
            List<MarketDataKind> requires = new ArrayList<>();
            for (JsonElement r : array(e, "requires")) requires.add(marketDataKind(string(r, "requires")));
            InputTypeEntry value = new InputTypeEntry(inputType, Collections.unmodifiableList(requires));

            List<String> coupons = new ArrayList<>();
            if (e.has("coupon_types")) {
                for (JsonElement c : array(e, "coupon_types")) coupons.add(couponType(string(c, "coupon_types")));
            } else {
                coupons.add(ANY_COUPON);
            }
            Map<String, InputTypeEntry> byCoupon = entries.computeIfAbsent(node, k -> new HashMap<>());
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
        return new ValuationInputTypes(entries, Collections.unmodifiableSet(unpriced));
    }

    /**
     * The key that names an entry's input type: {@code input_type}, or for one
     * release the legacy {@code arm} (LM-418). An entry with both is rejected.
     */
    private static String inputTypeKey(JsonObject entry) {
        if (entry.has(ENTRY_KEY) && entry.has(LEGACY_ENTRY_KEY)) {
            throw new IllegalStateException(bad("entry has both " + ENTRY_KEY + " and " + LEGACY_ENTRY_KEY + ": " + entry));
        }
        return entry.has(LEGACY_ENTRY_KEY) ? LEGACY_ENTRY_KEY : ENTRY_KEY;
    }

    private static Set<String> oneofInputTypes() {
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
        return "hierarchy.json " + SECTION + ": " + detail;
    }
}
