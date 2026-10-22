"""The measure catalog lists REFERENCE_CPI (28) and INDEX_RATIO (29) (LM-343),
in the source copy and the packaged Python mirror, matching MeasureProto.
applies_to holds ProductTypeProto names or hierarchy.json nodes (LM-372),
every language's mirror is byte-equal to the source, and LM-364 leaves the
UNADJUSTED_COST_BASIS and PROFIT_LOSS entries unchanged."""
import json
from pathlib import Path

import pytest

from fintekkers.models.position import measure_pb2
from fintekkers.models.security import product_type_pb2

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
LM364_UNCHANGED = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-364-unchanged.json").read_text())


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
@pytest.mark.parametrize("name,number", [("REFERENCE_CPI", 28), ("INDEX_RATIO", 29)])
def test_catalog_lists_new_tips_measure(path, name, number):
    measures = {m["name"]: m for m in json.loads(path.read_text())["measures"]}
    assert measures[name]["enum_value"] == number
    assert measures[name]["implemented"] is False
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
    measures = {m["name"]: m for m in json.loads(SOURCE.read_text())["measures"]}
    assert measures.get(name) == LM364_UNCHANGED["catalog"][name]
