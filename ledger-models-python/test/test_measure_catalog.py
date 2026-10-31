"""The measure catalog lists REFERENCE_CPI (28) and INDEX_RATIO (29) (LM-343),
in the source copy and the packaged Python mirror, matching MeasureProto.
applies_to holds ProductTypeProto names or hierarchy.json nodes (LM-372),
every language's mirror is byte-equal to the source, LM-364 leaves the
UNADJUSTED_COST_BASIS entry unchanged, every MeasureProto value has one
catalog entry (LM-402, which also added PROFIT_LOSS), and every entry says
what computes it and what it depends on (LM-403). LM-425 corrects applies_to
and implemented to match valuation-service: every change is listed, with its
engine file, in test-fixtures/catalog/lm-425-changes.json."""
import json
from pathlib import Path

import pytest

from fintekkers.models.position import measure_pb2
from fintekkers.models.security import product_type_pb2
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.errors import UnmappedProductTypeError
from fintekkers.wrappers.models.security import product_hierarchy
from fintekkers.wrappers.models.security.product_inputs import arm_for

_PYTHON = Path(__file__).resolve().parents[1]
SOURCE = _PYTHON.parent / "ledger-models-protos" / "catalog" / "measures.json"
MIRROR = _PYTHON / "fintekkers" / "catalog" / "measures.json"
_REPO = _PYTHON.parent
HIERARCHY = _REPO / "ledger-models-protos" / "hierarchy.json"
OTHER_MIRRORS = {
    "java": _REPO / "ledger-models-java" / "src" / "main" / "resources" / "catalog" / "measures.json",
    "javascript": _REPO / "ledger-models-javascript" / "catalog" / "measures.json",
    "rust": _REPO / "ledger-models-rust" / "catalog" / "measures.json",
}
COMPUTED_BY = {"input", "ledger-service", "valuation-service"}
INPUTS = {"TAX_LOTS", "SECURITY_TERMS", "CPI_U", "BILL_FIXINGS", "YIELD_CURVE", "TREASURY_PRICES"}
LM403_KEYS = {"computed_by", "depends_on"}
LM364_UNCHANGED = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-364-unchanged.json").read_text())


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
@pytest.mark.parametrize("name,number", [("REFERENCE_CPI", 28), ("INDEX_RATIO", 29)])
def test_catalog_lists_new_tips_measure(path, name, number):
    measures = {m["name"]: m for m in json.loads(path.read_text())["measures"]}
    assert measures[name]["enum_value"] == number
    assert measures[name]["implemented"] is True
    assert measures[name]["applies_to"] == ["TIPS"]
    assert measure_pb2.MeasureProto.Value(name) == number


def test_python_mirror_matches_source():
    assert MIRROR.read_bytes() == SOURCE.read_bytes()


@pytest.mark.parametrize("mirror", OTHER_MIRRORS.values(), ids=OTHER_MIRRORS.keys())
def test_language_mirror_matches_source(mirror):
    assert mirror.read_bytes() == SOURCE.read_bytes()


def test_applies_to_names_product_types_or_hierarchy_nodes():
    product_types = set(product_type_pb2.ProductTypeProto.keys())
    nodes = {
        name
        for name, entry in json.loads(HIERARCHY.read_text())["product_types"].items()
        if entry.get("abstract")
    }
    measures = json.loads(SOURCE.read_text())["measures"]
    unknown = {
        (m["name"], name)
        for m in measures
        for name in m["applies_to"]
        if name not in product_types and name not in nodes
    }
    assert not unknown
    assert any(m["applies_to"] for m in measures)


@pytest.mark.parametrize("name", LM364_UNCHANGED["catalog"])
def test_lm364_leaves_unadjusted_cost_basis_and_profit_loss_unchanged(name):
    if LM364_UNCHANGED["catalog"][name] is None:
        pytest.skip(f"{name} had no entry before LM-364; LM-402 added one")
    baseline = LM364_UNCHANGED["catalog"][name]
    entry = {m["name"]: m for m in json.loads(SOURCE.read_text())["measures"]}[name]
    assert set(entry) - set(baseline) <= LM403_KEYS
    assert {key: entry.get(key) for key in baseline} == baseline


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
def test_every_measure_has_one_catalog_entry(path):
    measures = json.loads(path.read_text())["measures"]
    for name, number in measure_pb2.MeasureProto.items():
        if name == "UNKNOWN_MEASURE":
            continue
        entries = [m for m in measures if m["name"] == name]
        assert len(entries) == 1, name
        assert entries[0]["enum_value"] == number, name


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
def test_every_measure_has_computed_by_and_depends_on(path):
    measures = json.loads(path.read_text())["measures"]
    names = {m["name"] for m in measures}
    for m in measures:
        assert LM403_KEYS <= set(m), m["name"]
        assert isinstance(m["depends_on"], list), m["name"]
        if m["category"] == "sentinel":
            assert m["computed_by"] is None and m["depends_on"] == [], m["name"]
            continue
        assert m["computed_by"] in COMPUTED_BY, m["name"]
        unknown = [d for d in m["depends_on"] if d not in names and d not in INPUTS]
        assert not unknown, (m["name"], unknown)
        assert m["name"] not in m["depends_on"], m["name"]
        if m["computed_by"] == "input":
            assert m["depends_on"] == [], m["name"]


def test_lm403_dependency_values():
    measures = {m["name"]: m for m in json.loads(SOURCE.read_text())["measures"]}
    assert (measures["CLEAN_PRICE"]["computed_by"], measures["CLEAN_PRICE"]["depends_on"]) == ("input", [])
    assert measures["DIRECTED_QUANTITY"]["computed_by"] == "ledger-service"
    assert measures["UNADJUSTED_COST_BASIS"]["depends_on"] == ["TAX_LOTS"]
    assert measures["ADJUSTED_COST_BASIS"]["depends_on"] == [
        "TAX_LOTS", "SECURITY_TERMS", "REFERENCE_CPI", "BILL_FIXINGS"]
    assert measures["DV01"]["depends_on"] == ["MODIFIED_DURATION", "MARKET_VALUE"]
    assert measures["REFERENCE_CPI"]["depends_on"] == ["CPI_U"]


LM425_BEFORE = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-425-before.json").read_text())["measures"]
LM425_CHANGES = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-425-changes.json").read_text())["changes"]
LM425_FIELDS = ("applies_to", "implemented")


def test_lm425_catalog_edits_touch_only_applies_to_and_implemented():
    after = json.loads(SOURCE.read_text())["measures"]
    assert [m["name"] for m in after] == [m["name"] for m in LM425_BEFORE]
    for old, new in zip(LM425_BEFORE, after):
        assert set(new) == set(old), new["name"]
        for key in set(old) - set(LM425_FIELDS):
            assert new[key] == old[key], (new["name"], key)


def _lm425_diffs():
    after = {m["name"]: m for m in json.loads(SOURCE.read_text())["measures"]}
    return {
        (old["name"], field): (old[field], after[old["name"]][field])
        for old in LM425_BEFORE
        for field in LM425_FIELDS
        if old[field] != after[old["name"]][field]
    }


def test_lm425_every_catalog_change_is_listed_with_its_engine_file():
    rows = {(row["measure"], row["field"]): row for row in LM425_CHANGES}
    assert len(rows) == len(LM425_CHANGES)
    assert set(rows) == set(_lm425_diffs())
    for key, (before, after) in _lm425_diffs().items():
        row = rows[key]
        assert (row["before"], row["after"]) == (before, after), key
        assert row["engine_file"].startswith("src/engine/") and row["reason"], key


def _arm_of(product_type):
    if product_type not in product_type_pb2.ProductTypeProto.keys():
        return None  # a planned leaf with no enum value yet: no security can carry it
    try:
        return arm_for(SecurityProto(product_type=product_type_pb2.ProductTypeProto.Value(product_type)))
    except UnmappedProductTypeError:
        return None


def _measures_by_arm(measures):
    """The valuation-service measures each arm reaches: an applies_to entry
    names one of the arm's leaf product types or an ancestor of it."""
    leaves = {}
    for product_type in product_hierarchy.all_product_types():
        if not product_hierarchy.descendants_of(product_type):
            arm = _arm_of(product_type)
            if arm is not None:
                leaves.setdefault(arm, []).append(product_type)

    def lineage(node):
        while node is not None:
            yield node
            node = product_hierarchy.parent_of(node)

    return {
        arm: {
            m["name"]
            for m in measures
            if m["computed_by"] == "valuation-service" and m["implemented"]
            and any(node in m["applies_to"] for leaf in arm_leaves for node in lineage(leaf))
        }
        for arm, arm_leaves in leaves.items()
    }


def test_lm425_changes_per_arm_are_only_the_listed_ones():
    before = _measures_by_arm(LM425_BEFORE)
    after = _measures_by_arm(json.loads(SOURCE.read_text())["measures"])
    assert set(before) == set(after) == {"bond", "tips", "frn", "mbs", "equity", "cash"}
    changes = {
        arm: (before[arm] - after[arm], after[arm] - before[arm])
        for arm in before
        if before[arm] != after[arm]
    }
    assert changes == {
        "frn": ({"YIELD_TO_MATURITY", "MACAULAY_DURATION", "PRESENT_VALUE",
                 "CONVEXITY", "MODIFIED_DURATION", "DV01"}, set()),
        "tips": (set(), {"REFERENCE_CPI", "INDEX_RATIO"}),
    }
    # What src/engine/frn.rs computes, less ADJUSTED_COST_BASIS (implemented:
    # false), plus PROFIT_LOSS_PERCENT, which LM-405 pins; frn.rs rejecting it
    # is a valuation-service follow-up.
    assert after["frn"] == {
        "MARKET_VALUE", "CURRENT_YIELD", "PRESENT_VALUE_CASHFLOWS", "DISCOUNT_MARGIN",
        "SPREAD_DURATION", "PROFIT_LOSS", "PROFIT_LOSS_PERCENT", "ACCRUED_INTEREST", "DIRTY_PRICE",
    }
