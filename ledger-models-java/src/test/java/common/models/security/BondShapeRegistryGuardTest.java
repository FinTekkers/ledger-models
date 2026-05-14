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
 * v0.3.0 / #272 / Phase 1 — CI guard for the v0.3.0 bond-shape consolidation.
 *
 * Every {@code status: "active"} leaf in {@code hierarchy.json} that descends
 * from {@code BOND} must serialize through {@link protos.serializers.security.SecuritySerializer}
 * with the canonical {@code bond_details} sub-message populated. If a new
 * bond-shape leaf is added to the registry but the serializer dispatch isn't
 * updated, this guard catches it before release.
 *
 * <p>Shape mirrors {@link ProductHierarchyRegistryGuardTest} (#257 / M1.7)
 * which guards the active-registry-vs-ProductTypeProto symmetry.
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

        // Sanity: the 9 known bond-shape leaves at v0.3.0 release time.
        // If new ones land, they appear in this dynamic test set automatically;
        // the assertion below catches any serializer dispatch oversight.
        assertTrue(bondShapeLeaves.size() >= 9,
                "Expected at least 9 active bond-shape leaves in hierarchy.json (TBILL, "
                + "TREASURY_NOTE, TREASURY_BOND, TIPS, TREASURY_FRN, STRIPS, "
                + "SOVEREIGN_BOND, CORP_BOND, MUNI_BOND). Got: " + bondShapeLeaves);

        return bondShapeLeaves.stream().map(leaf ->
                dynamicTest(leaf + " serializes with bond_details populated", () -> {
                    ProductTypeProto pt = ProductTypeProto.valueOf(leaf);
                    Security wrapper = buildMinimalBondShapeSecurity(pt);

                    SecurityProto serialized = protos.serializers.security.SecuritySerializer
                            .getInstance().serialize(wrapper);

                    assertTrue(serialized.hasBondDetails(),
                            "Active bond-shape leaf " + leaf + " serialized without "
                            + "bond_details — SecuritySerializer.serializeBondSecurityAttributes "
                            + "must populate bond_details for every BOND descendant. "
                            + "If you added a new bond-shape leaf, ensure the serializer "
                            + "dispatch (BondSerializer.initiatlize switch + ProductHierarchy"
                            + ".isDescendantOf(pt, \"BOND\") branch in serializeBondSecurityAttributes) "
                            + "covers the new productType. See docs/adr/big-bang-proto-change.md "
                            + "for the v0.3.0 layout.");
                })
        );
    }

    private static Security buildMinimalBondShapeSecurity(ProductTypeProto pt) {
        java.util.UUID id = java.util.UUID.randomUUID();
        java.time.ZonedDateTime asOf = java.time.ZonedDateTime.now();
        CashSecurity usd = CashSecurity.USD;

        // The serializer's bond branch dispatches by productType (TIPS →
        // TIPSBond, TREASURY_FRN → FloatingRateNote, everything else BOND-
        // shape → BondSecurity). Each subclass populates getProductType()
        // appropriately; for the catch-all BondSecurity we stash the proto
        // so getProductType() returns the leaf value rather than
        // PRODUCT_TYPE_UNKNOWN.
        if (pt == ProductTypeProto.TIPS) {
            return new common.models.security.bonds.TIPSBond(id, "Test", asOf, usd);
        }
        if (pt == ProductTypeProto.TREASURY_FRN) {
            return new common.models.security.bonds.FloatingRateNote(id, "Test", asOf, usd);
        }
        BondSecurity bs = new BondSecurity(id, "Test", asOf, usd);
        SecurityProto stash = SecurityProto.newBuilder().setProductType(pt).build();
        bs.setSecurityProto(stash);
        return bs;
    }
}
