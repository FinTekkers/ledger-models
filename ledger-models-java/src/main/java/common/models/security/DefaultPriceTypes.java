package common.models.security;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import common.models.errors.NoDefaultPriceTypeError;
import fintekkers.models.price.PriceTypeProto;
import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import protos.serializers.util.proto.ProtoSerializationUtil;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * The default {@code price_type} of a trade price, by product. Backed by the
 * {@code default_price_types} section of ledger-models-protos/hierarchy.json;
 * there is no mapping table in code. Same rule in Java / Rust / Python /
 * JS-TS. See docs/adr/default_price_types.md.
 *
 * <p>Resolution walks from the security's product_type up its parent chain;
 * the first node with an entry decides, so {@code SOFR_SERIES -> RATE} beats
 * {@code INDEX -> INDEX_LEVEL}. A product with no entry anywhere on its chain
 * has no default.
 *
 * <p>{@link #resolve} is what {@code Price.forTrade} calls: an explicit type
 * wins ({@code UNKNOWN_PRICE_TYPE}, proto3's unset value, counts as omitted),
 * then the table default, else {@link NoDefaultPriceTypeError}. It never
 * returns {@code UNKNOWN_PRICE_TYPE}. A broken section is an
 * {@link IllegalStateException} at load, like {@link ProductInputs}.
 */
public final class DefaultPriceTypes {
    static final String SECTION = "default_price_types";

    private DefaultPriceTypes() { }

    private static final class Shipped {
        static final Map<String, PriceTypeProto> DEFAULTS = load();
    }

    /**
     * The table default for the security's product_type, or empty when it has
     * none. A null security reads as {@code PRODUCT_TYPE_UNKNOWN}.
     */
    public static Optional<PriceTypeProto> defaultFor(SecurityProto security) {
        return defaultFor(Shipped.DEFAULTS, productTypeOf(security));
    }

    /**
     * The price_type to put on a trade price for this security. An explicit
     * type other than {@code UNKNOWN_PRICE_TYPE} (or null) is returned
     * unchanged; otherwise the table default.
     *
     * @throws NoDefaultPriceTypeError naming the product when there is neither
     */
    public static PriceTypeProto resolve(SecurityProto security, PriceTypeProto explicit) {
        if (explicit != null && explicit != PriceTypeProto.UNKNOWN_PRICE_TYPE) return explicit;
        return defaultFor(security).orElseThrow(
                () -> new NoDefaultPriceTypeError(productTypeOf(security), uuidOf(security)));
    }

    /** node -> type, as written in the shipped section. Unmodifiable. */
    static Map<String, PriceTypeProto> shippedDefaults() {
        return Shipped.DEFAULTS;
    }

    static Optional<PriceTypeProto> defaultFor(Map<String, PriceTypeProto> defaults, String productType) {
        for (String node = productType; node != null; node = ProductHierarchy.parentOf(node)) {
            PriceTypeProto type = defaults.get(node);
            if (type != null) return Optional.of(type);
        }
        return Optional.empty();
    }

    /**
     * Parses and checks the {@code default_price_types} section of a whole
     * hierarchy.json {@code root} against the shipped product_types tree and
     * the PriceTypeProto names.
     *
     * @throws IllegalStateException if the section is missing or not an
     *         object, a key is not a product_types node, or a value is not a
     *         PriceTypeProto name or is {@code UNKNOWN_PRICE_TYPE}
     */
    static Map<String, PriceTypeProto> fromHierarchy(JsonObject root) {
        JsonElement section = root.get(SECTION);
        if (section == null) throw new IllegalStateException(bad("section missing from hierarchy.json"));
        if (!section.isJsonObject()) throw new IllegalStateException(bad("section must be an object"));
        Set<String> productTypes = ProductHierarchy.allProductTypes();
        Map<String, PriceTypeProto> out = new LinkedHashMap<>();
        for (Map.Entry<String, JsonElement> e : section.getAsJsonObject().entrySet()) {
            String node = e.getKey();
            if (!productTypes.contains(node)) {
                throw new IllegalStateException(bad("node '" + node + "' is not in product_types"));
            }
            out.put(node, priceType(node, e.getValue()));
        }
        return Collections.unmodifiableMap(out);
    }

    private static PriceTypeProto priceType(String node, JsonElement value) {
        if (value.isJsonPrimitive() && value.getAsJsonPrimitive().isString()) {
            String name = value.getAsString();
            if (name.equals(PriceTypeProto.UNKNOWN_PRICE_TYPE.name())) {
                throw new IllegalStateException(bad("node " + node + " must not default to " + name));
            }
            for (PriceTypeProto t : PriceTypeProto.values()) {
                if (t != PriceTypeProto.UNRECOGNIZED && t.name().equals(name)) return t;
            }
        }
        throw new IllegalStateException(bad("value " + value + " for node " + node + " is not a PriceTypeProto name"));
    }

    private static Map<String, PriceTypeProto> load() {
        try (InputStream in = DefaultPriceTypes.class.getResourceAsStream("/hierarchy.json")) {
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

    /** The security's UUID, or null when there is none or it is not 16 bytes. */
    private static UUID uuidOf(SecurityProto security) {
        return security != null && security.getUuid().getRawUuid().size() == 16
                ? ProtoSerializationUtil.deserializeUUID(security.getUuid()) : null;
    }

    private static String bad(String detail) {
        return "hierarchy.json " + SECTION + ": " + detail;
    }
}
