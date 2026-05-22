package common.models.security;

import fintekkers.models.security.ProductTypeProto;
import fintekkers.models.security.SecurityProto;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;

import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.DynamicTest.dynamicTest;

/**
 * CI guard for the bond-shape consolidation.
 *
 * Every {@code status: "active"} leaf in {@code hierarchy.json} that descends
 * from {@code BOND} must serialize through {@link common.models.security.Security#getProto()}
 * with the canonical {@code bond_details} sub-message populated. If a new
 * bond-shape leaf is added to the registry but the wrapper dispatch isn't
 * updated, this guard catches it before release.
 *
 * <p>Post-#338 refactor: serialize is now {@code security.getProto()} (no
 * separate Serializer indirection); the dispatch lives in
 * {@link common.models.security.Security#fromProto(SecurityProto)}.
 *
 * <p>Shape mirrors {@link ProductHierarchyRegistryGuardTest} which guards the
 * active-registry-vs-ProductTypeProto symmetry.
 */
class BondShapeRegistryGuardTest {

    @TestFactory
    Stream<DynamicTest> everyActiveBondShapeLeafSerializesIntoBondDetails() {
        Set<String> bondShapeLeaves = new TreeSet<>(ProductHierarchy.descendantsOf("BOND"));
        // descendantsOf returns descendants only, but limit to active leaves
        // — the registry guard separately ensures every active leaf has a
        // matching ProductTypeProto enum value.
        Set<String> active = new TreeSet<>(ProductHierarchy.activeProductTypes());
        bondShapeLeaves.retainAll(active);

        // Sanity: the 10 known bond-shape leaves. If new ones land, they appear
        // in this dynamic test set automatically; the assertion below catches
        // any serializer dispatch oversight.
        assertTrue(bondShapeLeaves.size() >= 10,
                "Expected at least 10 active bond-shape leaves in hierarchy.json (TBILL, "
                + "TREASURY_NOTE, TREASURY_BOND, TIPS, TREASURY_FRN, STRIPS, "
                + "SOVEREIGN_BOND, CORP_BOND, MUNI_BOND, MORTGAGE_BACKED). Got: " + bondShapeLeaves);

        return bondShapeLeaves.stream().map(leaf ->
                dynamicTest(leaf + " serializes with bond_details populated", () -> {
                    ProductTypeProto pt = ProductTypeProto.valueOf(leaf);
                    Security wrapper = buildMinimalBondShapeSecurity(pt);

                    SecurityProto serialized = wrapper.getProto();

                    assertTrue(serialized.hasBondDetails(),
                            "Active bond-shape leaf " + leaf + " serialized without "
                            + "bond_details — the wrapper's overlay must populate "
                            + "bond_details for every BOND descendant. If you added a "
                            + "new bond-shape leaf, ensure the Security.fromProto "
                            + "dispatch covers the new productType. See "
                            + "docs/adr/big-bang-proto-change.md.");
                })
        );
    }

    private static Security buildMinimalBondShapeSecurity(ProductTypeProto pt) {
        // Post-#338 refactor: build a proper bond-shape proto with the leaf
        // productType + an empty bond_details, then dispatch through
        // Security.fromProto. The wrapper IS the proto holder; the dispatch
        // logic that used to live in SecuritySerializer + BondSerializer.initialize
        // is now in Security.fromProto.
        SecurityProto proto = SecurityProto.newBuilder()
                .setProductType(pt)
                .setBondDetails(fintekkers.models.security.BondDetailsProto.getDefaultInstance())
                .build();
        return Security.fromProto(proto);
    }
}
