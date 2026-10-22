"""The measure catalog lists REFERENCE_CPI (28) and INDEX_RATIO (29) (LM-343),
in the source copy and the packaged Python mirror, matching MeasureProto.
ADJUSTED_COST_BASIS has a written spec and every language's mirror matches
the source (LM-364)."""
import json
from pathlib import Path

import pytest

from fintekkers.models.position import measure_pb2

_PYTHON = Path(__file__).resolve().parents[1]
SOURCE = _PYTHON.parent / "ledger-models-protos" / "catalog" / "measures.json"
MIRROR = _PYTHON / "fintekkers" / "catalog" / "measures.json"
_REPO = _PYTHON.parent
MIRRORS = {
    "python": MIRROR,
    "java": _REPO / "ledger-models-java" / "src" / "main" / "resources" / "catalog" / "measures.json",
    "javascript": _REPO / "ledger-models-javascript" / "catalog" / "measures.json",
    "rust": _REPO / "ledger-models-rust" / "catalog" / "measures.json",
}
UNCHANGED = json.loads((_REPO / "test-fixtures" / "catalog" / "lm-364-unchanged.json").read_text())


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
@pytest.mark.parametrize("name,number", [("REFERENCE_CPI", 28), ("INDEX_RATIO", 29)])
def test_catalog_lists_new_tips_measure(path, name, number):
    measures = {m["name"]: m for m in json.loads(path.read_text())["measures"]}
    assert measures[name]["enum_value"] == number
    assert measures[name]["implemented"] is False
    assert measures[name]["applies_to"] == ["TIPS"]
    assert measure_pb2.MeasureProto.Value(name) == number


@pytest.mark.parametrize("mirror", MIRRORS.values(), ids=MIRRORS.keys())
def test_mirror_matches_source(mirror):
    assert mirror.read_bytes() == SOURCE.read_bytes()


def _measures(path):
    return {m["name"]: m for m in json.loads(path.read_text())["measures"]}


@pytest.mark.parametrize("path", [SOURCE, MIRROR], ids=["source", "python-mirror"])
def test_adjusted_cost_basis_is_specified(path):
    entry = _measures(path)["ADJUSTED_COST_BASIS"]
    assert entry["enum_value"] == 4
    assert "reserved" not in entry["description"].lower()
    description = entry["description"].lower()
    for phrase in ("tax amortised cost", "constant yield", "per 100 face",
                   "quantity-weighted across open lots"):
        assert phrase in description, phrase
    assert entry["formula"]
    assert entry["applies_to"] == ["BOND_SECURITY", "TIPS", "FRN"]


@pytest.mark.parametrize("name", UNCHANGED["catalog"])
def test_unadjusted_cost_basis_and_profit_loss_entries_are_unchanged(name):
    assert _measures(SOURCE).get(name) == UNCHANGED["catalog"][name]
