package common.models.security;

import fintekkers.models.security.ProductTypeProto;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * CI guard for the product registry. M1.7 of #257.
 *
 * <p>Every {@code ProductTypeProto} enum value (excluding the
 * {@code PRODUCT_TYPE_UNKNOWN} sentinel) must have a matching
 * {@code status: "active"} entry in {@code hierarchy.json}. Symmetrically,
 * every {@code status: "active"} entry in the registry must have a matching
 * proto enum value.
 *
 * <p>If you add a new {@code status: "active"} leaf to {@code hierarchy.json}
 * without adding the corresponding {@code ProductTypeProto} enum value (or
 * vice versa), this test fails. The fix is to add both sides — see
 * {@code registry-versioning.md} for the deprecation/promotion sequence.
 */
class ProductHierarchyRegistryGuardTest {

    @Test
    public void everyActiveRegistryEntryHasMatchingProtoEnumValue() {
        Set<String> protoNames = Stream.of(ProductTypeProto.values())
                .map(ProductTypeProto::name)
                .filter(n -> !n.equals("PRODUCT_TYPE_UNKNOWN"))
                .filter(n -> !n.equals("UNRECOGNIZED")) // protobuf-java sentinel
                .collect(Collectors.toCollection(TreeSet::new));

        Set<String> activeRegistry = new TreeSet<>(ProductHierarchy.activeProductTypes());

        Set<String> registryButNotProto = new TreeSet<>(activeRegistry);
        registryButNotProto.removeAll(protoNames);

        Set<String> protoButNotRegistry = new TreeSet<>(protoNames);
        protoButNotRegistry.removeAll(activeRegistry);

        if (!registryButNotProto.isEmpty() || !protoButNotRegistry.isEmpty()) {
            fail(String.format(
                    "Registry / ProductTypeProto mismatch.%n" +
                    "  In hierarchy.json (status=active) but missing from ProductTypeProto: %s%n" +
                    "  In ProductTypeProto but missing from hierarchy.json (status=active): %s%n" +
                    "If you added a new active leaf, add it to BOTH sides. " +
                    "If you added a planned leaf, leave the proto enum alone until promotion. " +
                    "See ledger-models-protos/registry-versioning.md.",
                    registryButNotProto, protoButNotRegistry));
        }

        assertEquals(activeRegistry, protoNames,
                "Registry active set and ProductTypeProto value set must agree");
    }

    @Test
    public void registryLoadsAndContainsKnownLeaves() {
        // Sanity check the registry parsed and core leaves are present.
        Set<String> all = ProductHierarchy.allProductTypes();
        assertTrue(all.contains("BOND"), "BOND abstract parent must be present");
        assertTrue(all.contains("TBILL"), "TBILL leaf must be present");
        assertTrue(all.contains("CRYPTOCURRENCY"), "CRYPTOCURRENCY leaf must be present");
        assertNotNull(ProductHierarchy.labelOf("TBILL"));
        assertEquals("RATES", ProductHierarchy.assetClassOf("TBILL"));
        assertEquals("CASH", ProductHierarchy.instrumentTypeOf("TBILL"));
    }

    /**
     * Test-the-test: deliberate omission must surface as a mismatch.
     * Done via a synthetic comparison: pretend the registry is missing one
     * entry and assert the gap detection fires.
     */
    @Test
    public void deliberateOmissionWouldFailTheGuard() {
        Set<String> protoNames = Stream.of(ProductTypeProto.values())
                .map(ProductTypeProto::name)
                .filter(n -> !n.equals("PRODUCT_TYPE_UNKNOWN"))
                .filter(n -> !n.equals("UNRECOGNIZED"))
                .collect(Collectors.toCollection(TreeSet::new));

        // Synthetic registry minus one entry — simulates an authoring slip
        // where the proto enum was added but hierarchy.json wasn't updated.
        Set<String> syntheticRegistry = new TreeSet<>(ProductHierarchy.activeProductTypes());
        String dropped = syntheticRegistry.iterator().next();
        syntheticRegistry.remove(dropped);

        Set<String> protoButNotRegistry = new TreeSet<>(protoNames);
        protoButNotRegistry.removeAll(syntheticRegistry);

        // The test-the-test invariant: the dropped entry must surface in
        // the proto-but-not-registry diff. If this assertion fails, the
        // primary guard above would silently miss the same kind of slip.
        assertTrue(protoButNotRegistry.contains(dropped),
                "Dropping " + dropped + " from a synthetic registry must surface in the diff. " +
                "If this assertion fails, the primary CI guard test would silently pass on a real omission.");
    }
}
