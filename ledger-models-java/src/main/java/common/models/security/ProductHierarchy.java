package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.JsonArray;
import fintekkers.models.security.ProductTypeProto;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Multi-language registry helper backed by ledger-models-protos/hierarchy.json.
 *
 * Identical signatures across Java / Rust / Python / JS-TS so consumers
 * can rely on the same query shape regardless of language. M1 of #257.
 *
 * <p>Two trees are exposed:
 * <ul>
 *   <li><b>productType</b> — what kind of contract is this. Walked via
 *       {@link #parentOf(String)}, {@link #descendantsOf(String)},
 *       {@link #isDescendantOf(String, String)}.</li>
 *   <li><b>asset_class</b> — what exposure family does it belong to.
 *       Same shape via {@link #assetClassParentOf}, etc.</li>
 * </ul>
 *
 * <p>Plus per-leaf classification lookups:
 * <ul>
 *   <li>{@link #assetClassOf(String)} — leaf asset_class for a product type</li>
 *   <li>{@link #instrumentTypeOf(String)} — CASH / DERIVATIVE / REFERENCE_INDEX</li>
 *   <li>{@link #labelOf(String)} — display label</li>
 * </ul>
 *
 * <p>The {@code indexTypeOf} helper is intentionally absent — that
 * dimension is deferred per the M1 descope.
 */
public final class ProductHierarchy {

    /** A single entry from hierarchy.json product_types. */
    public static final class ProductTypeEntry {
        public final String name;
        public final String parent;          // null for top-level
        public final boolean isAbstract;
        public final String assetClass;       // null for abstract nodes
        public final String instrumentType;   // null for abstract nodes
        public final String label;
        public final String status;           // "active" | "planned" | null

        ProductTypeEntry(String name, String parent, boolean isAbstract,
                         String assetClass, String instrumentType,
                         String label, String status) {
            this.name = name;
            this.parent = parent;
            this.isAbstract = isAbstract;
            this.assetClass = assetClass;
            this.instrumentType = instrumentType;
            this.label = label;
            this.status = status;
        }
    }

    /** A single asset_class entry from hierarchy.json. */
    public static final class AssetClassEntry {
        public final String name;
        public final String parent;  // null for top-level
        public final String label;

        AssetClassEntry(String name, String parent, String label) {
            this.name = name;
            this.parent = parent;
            this.label = label;
        }
    }

    private static final Map<String, ProductTypeEntry> PRODUCT_TYPES;
    private static final Map<String, AssetClassEntry> ASSET_CLASSES;
    private static final List<String> INSTRUMENT_TYPES;

    static {
        try (InputStream in = ProductHierarchy.class.getResourceAsStream("/hierarchy.json")) {
            if (in == null) {
                throw new IllegalStateException(
                        "hierarchy.json not found on classpath. Build wiring should bundle it from ledger-models-protos/");
            }
            JsonObject root;
            try (InputStreamReader r = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                root = new Gson().fromJson(r, JsonObject.class);
            }

            Map<String, ProductTypeEntry> products = new HashMap<>();
            JsonObject pt = root.getAsJsonObject("product_types");
            for (Map.Entry<String, JsonElement> e : pt.entrySet()) {
                String name = e.getKey();
                JsonObject body = e.getValue().getAsJsonObject();
                String parent = body.has("parent") && !body.get("parent").isJsonNull()
                        ? body.get("parent").getAsString() : null;
                boolean isAbstract = body.has("abstract") && body.get("abstract").getAsBoolean();
                String assetClass = body.has("asset_class") ? body.get("asset_class").getAsString() : null;
                String instrumentType = body.has("instrument_type") ? body.get("instrument_type").getAsString() : null;
                String label = body.has("label") ? body.get("label").getAsString() : null;
                String status = body.has("status") ? body.get("status").getAsString() : null;
                products.put(name, new ProductTypeEntry(name, parent, isAbstract, assetClass, instrumentType, label, status));
            }
            PRODUCT_TYPES = Collections.unmodifiableMap(products);

            Map<String, AssetClassEntry> classes = new HashMap<>();
            JsonObject ac = root.getAsJsonObject("asset_classes");
            for (Map.Entry<String, JsonElement> e : ac.entrySet()) {
                String name = e.getKey();
                JsonObject body = e.getValue().getAsJsonObject();
                String parent = body.has("parent") && !body.get("parent").isJsonNull()
                        ? body.get("parent").getAsString() : null;
                String label = body.has("label") ? body.get("label").getAsString() : null;
                classes.put(name, new AssetClassEntry(name, parent, label));
            }
            ASSET_CLASSES = Collections.unmodifiableMap(classes);

            JsonArray it = root.getAsJsonArray("instrument_types");
            String[] arr = new String[it.size()];
            for (int i = 0; i < it.size(); i++) arr[i] = it.get(i).getAsString();
            INSTRUMENT_TYPES = Collections.unmodifiableList(java.util.Arrays.asList(arr));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load hierarchy.json", e);
        }
    }

    private ProductHierarchy() { }

    // ---------- productType tree ----------

    /** Parent productType node (abstract or leaf). null for top-level nodes; null for unknown nodes. */
    public static String parentOf(String node) {
        ProductTypeEntry e = PRODUCT_TYPES.get(node);
        return e == null ? null : e.parent;
    }

    /** Same as {@link #parentOf(String)} for ProductTypeProto enum convenience. */
    public static String parentOf(ProductTypeProto pt) {
        return parentOf(pt == null ? null : pt.name());
    }

    /**
     * Set of all descendant nodes (transitive) of {@code ancestor} in the productType tree.
     * Includes leaves and abstract intermediates beneath {@code ancestor}, but NOT
     * {@code ancestor} itself. Returns empty set if {@code ancestor} is unknown.
     */
    public static Set<String> descendantsOf(String ancestor) {
        Set<String> out = new LinkedHashSet<>();
        for (ProductTypeEntry e : PRODUCT_TYPES.values()) {
            String p = e.parent;
            while (p != null) {
                if (p.equals(ancestor)) {
                    out.add(e.name);
                    break;
                }
                ProductTypeEntry parentEntry = PRODUCT_TYPES.get(p);
                p = parentEntry == null ? null : parentEntry.parent;
            }
        }
        return out;
    }

    /**
     * True iff {@code node} is a strict descendant of {@code ancestor} (any depth) in the productType tree.
     * Returns false if either node is unknown, or if they are the same node.
     */
    public static boolean isDescendantOf(String node, String ancestor) {
        if (node == null || ancestor == null || node.equals(ancestor)) return false;
        ProductTypeEntry e = PRODUCT_TYPES.get(node);
        if (e == null) return false;
        String p = e.parent;
        while (p != null) {
            if (p.equals(ancestor)) return true;
            ProductTypeEntry parentEntry = PRODUCT_TYPES.get(p);
            p = parentEntry == null ? null : parentEntry.parent;
        }
        return false;
    }

    /** Convenience overload accepting ProductTypeProto. */
    public static boolean isDescendantOf(ProductTypeProto pt, String ancestor) {
        return isDescendantOf(pt == null ? null : pt.name(), ancestor);
    }

    /** Display label, or null if the node is unknown. */
    public static String labelOf(String node) {
        ProductTypeEntry e = PRODUCT_TYPES.get(node);
        return e == null ? null : e.label;
    }

    /** Asset class for a leaf productType. null for abstract nodes or unknown nodes. */
    public static String assetClassOf(String productType) {
        ProductTypeEntry e = PRODUCT_TYPES.get(productType);
        return e == null ? null : e.assetClass;
    }

    public static String assetClassOf(ProductTypeProto pt) {
        return assetClassOf(pt == null ? null : pt.name());
    }

    /** instrument_type for a leaf productType. null for abstract nodes or unknown nodes. */
    public static String instrumentTypeOf(String productType) {
        ProductTypeEntry e = PRODUCT_TYPES.get(productType);
        return e == null ? null : e.instrumentType;
    }

    public static String instrumentTypeOf(ProductTypeProto pt) {
        return instrumentTypeOf(pt == null ? null : pt.name());
    }

    // ---------- asset_class tree ----------

    public static String assetClassParentOf(String node) {
        AssetClassEntry e = ASSET_CLASSES.get(node);
        return e == null ? null : e.parent;
    }

    public static Set<String> assetClassDescendantsOf(String ancestor) {
        Set<String> out = new LinkedHashSet<>();
        for (AssetClassEntry e : ASSET_CLASSES.values()) {
            String p = e.parent;
            while (p != null) {
                if (p.equals(ancestor)) {
                    out.add(e.name);
                    break;
                }
                AssetClassEntry parentEntry = ASSET_CLASSES.get(p);
                p = parentEntry == null ? null : parentEntry.parent;
            }
        }
        return out;
    }

    public static boolean isAssetClassDescendantOf(String node, String ancestor) {
        if (node == null || ancestor == null || node.equals(ancestor)) return false;
        AssetClassEntry e = ASSET_CLASSES.get(node);
        if (e == null) return false;
        String p = e.parent;
        while (p != null) {
            if (p.equals(ancestor)) return true;
            AssetClassEntry parentEntry = ASSET_CLASSES.get(p);
            p = parentEntry == null ? null : parentEntry.parent;
        }
        return false;
    }

    public static String assetClassLabelOf(String node) {
        AssetClassEntry e = ASSET_CLASSES.get(node);
        return e == null ? null : e.label;
    }

    // ---------- introspection ----------

    /** All productType node names known to the registry (active + planned + abstract). */
    public static Set<String> allProductTypes() {
        return Collections.unmodifiableSet(new HashSet<>(PRODUCT_TYPES.keySet()));
    }

    /** All productType node names with status=active in hierarchy.json. */
    public static Set<String> activeProductTypes() {
        Set<String> out = new HashSet<>();
        for (ProductTypeEntry e : PRODUCT_TYPES.values()) {
            if ("active".equals(e.status)) out.add(e.name);
        }
        return Collections.unmodifiableSet(out);
    }

    public static Set<String> allAssetClasses() {
        return Collections.unmodifiableSet(new HashSet<>(ASSET_CLASSES.keySet()));
    }

    public static List<String> allInstrumentTypes() {
        return INSTRUMENT_TYPES;
    }
}
