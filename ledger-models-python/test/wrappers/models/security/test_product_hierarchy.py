"""Tests for the ProductHierarchy registry helper.

The helper loads hierarchy.json via two strategies (see
fintekkers/wrappers/models/security/product_hierarchy.py::_load_registry):

  1. Packaged resource — alongside the module after wheel install.
  2. Development-checkout fallback — walks up for
     ledger-models-protos/hierarchy.json.

v0.2.1 shipped a broken wheel that didn't include hierarchy.json
(MANIFEST.in didn't list *.json), so strategy 1 always failed for
consumers and forced the vendoring-into-consumer-repo antipattern
(market-data-inputs PR #14). v0.2.2 added 'recursive-include
fintekkers *.json' to MANIFEST.in.

These tests exercise the helper end-to-end. They pass in both the
development checkout (strategy 2) and the wheel-installed environment
(strategy 1), so a future MANIFEST.in regression that breaks the
packaged-resource path won't be caught by these tests alone — see
check-python-wheel-hierarchy.sh for the post-build wheel inspection
that DOES catch that regression.
"""

import pytest

from fintekkers.wrappers.models.security import product_hierarchy as PH


def test_registry_loads_without_error():
    """If hierarchy.json can't be found by either strategy, this fails
    at import-via-call time with FileNotFoundError. The bug v0.2.2
    fixes is that strategy 1 wasn't usable for consumers because the
    wheel didn't bundle the file; this test passing means at least one
    of the two load strategies worked."""
    types = PH.all_product_types()
    assert isinstance(types, list)
    assert len(types) > 0


def test_active_product_types_match_m1_spec_count():
    """M1 of #257 locked in 26 active leaves; the count is a sentinel
    for accidental dropping or reverting of registry entries."""
    active = PH.active_product_types()
    assert len(active) == 26, f"expected 26 active leaves, got {len(active)}: {active}"


def test_active_product_types_include_known_m1_leaves():
    """Spot-check against the canonical M1 spec leaves to catch a
    case where the loader returns a wrong / stale registry."""
    active = set(PH.active_product_types())
    for expected in [
        "TBILL", "TREASURY_NOTE", "TREASURY_BOND", "TIPS", "TREASURY_FRN",
        "STRIPS", "SOVEREIGN_BOND", "CORP_BOND", "MUNI_BOND",
        "COMMON_STOCK", "PREFERRED_STOCK", "ADR", "ETF",
        "EQUITY_INDEX", "BOND_INDEX", "COMMODITY_INDEX", "VIX_SPOT",
        "CPI_SERIES", "SOFR_SERIES",
        "CURRENCY", "FX_SPOT", "MONEY_MARKET_FUND",
        "CRYPTOCURRENCY", "STABLECOIN",
        "GOLD", "SILVER",
    ]:
        assert expected in active, f"{expected} missing from active product types"


def test_descendants_of_bond_walks_transitively():
    descendants = set(PH.descendants_of("BOND"))
    for expected in ["TBILL", "TREASURY_NOTE", "CORP_BOND", "MUNI_BOND"]:
        assert expected in descendants, f"{expected} missing from descendants_of('BOND')"


def test_is_descendant_of_traverses_abstract_intermediates():
    assert PH.is_descendant_of("TBILL", "GOV_BOND")
    assert PH.is_descendant_of("TBILL", "BOND")           # transitive through GOV_BOND
    assert PH.is_descendant_of("CORP_BOND", "BOND")        # transitive through CREDIT_BOND
    assert not PH.is_descendant_of("TBILL", "STOCK")
    assert not PH.is_descendant_of("BOND", "BOND")         # strict descendant


def test_classification_lookups():
    assert PH.asset_class_of("TBILL") == "RATES"
    assert PH.asset_class_of("CORP_BOND") == "CREDIT"
    assert PH.asset_class_of("STABLECOIN") == "CRYPTO"
    assert PH.asset_class_of("FX_SPOT") == "FX"
    assert PH.instrument_type_of("TBILL") == "CASH"
    assert PH.instrument_type_of("EQUITY_INDEX") == "REFERENCE_INDEX"
    assert PH.asset_class_of("BOND") is None  # abstract node has no asset_class


def test_label_returns_human_readable_string():
    assert PH.label_of("TBILL") == "Treasury Bill"
    assert PH.label_of("STABLECOIN") == "Stablecoin"
    assert PH.label_of("NOT_A_REAL_LEAF") is None


def test_instrument_types_are_three_known_values():
    its = PH.all_instrument_types()
    assert sorted(its) == ["CASH", "DERIVATIVE", "REFERENCE_INDEX"]
