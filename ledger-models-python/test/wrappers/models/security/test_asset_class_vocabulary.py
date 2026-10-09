"""LM-275: one asset-class vocabulary (hierarchy.json), a shared match helper
and labels for every enum the UI shows.

The match cases live in ledger-models-protos/fixtures/asset_class_matches.json,
shared with the Java and JS tests.
"""

import json
import re
from pathlib import Path

import pytest

from fintekkers.models.security.asset_class_pb2 import AssetClassProto
from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)
from fintekkers.models.security.instrument_type_pb2 import InstrumentTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.wrappers.models.security import product_hierarchy as PH


def _repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "ledger-models-protos" / "hierarchy.json").exists():
            return parent
    raise FileNotFoundError("ledger-models-protos/ not found above this test")


REPO = _repo_root()
PROTOS = REPO / "ledger-models-protos"


def _fixture_rows():
    with (PROTOS / "fixtures" / "asset_class_matches.json").open(encoding="utf-8") as f:
        return json.load(f)["cases"]


def _hierarchy():
    with (PROTOS / "hierarchy.json").open(encoding="utf-8") as f:
        return json.load(f)


# ---------- metric 1: hierarchy.json is the canonical list ----------


def _comment_above_mentions_hierarchy(proto_lines, value_name):
    """True iff the comment block directly above value_name mentions hierarchy.json."""
    for i, line in enumerate(proto_lines):
        if re.match(rf"\s*{value_name}\s*=", line):
            j = i - 1
            while j >= 0 and proto_lines[j].strip().startswith("//"):
                if "hierarchy.json" in proto_lines[j]:
                    return True
                j -= 1
            return False
    return False


def test_every_asset_class_proto_value_is_canonical_or_deprecated():
    proto = (PROTOS / "fintekkers/models/security/asset_class.proto").read_text(
        encoding="utf-8"
    ).splitlines()
    codes = set(PH.all_asset_classes())
    offenders = [
        v.name
        for v in AssetClassProto.DESCRIPTOR.values
        if v.name != "UNKNOWN_ASSET_CLASS"
        and v.name not in codes
        and not (
            v.GetOptions().deprecated
            and _comment_above_mentions_hierarchy(proto, v.name)
        )
    ]
    assert offenders == [], (
        "AssetClassProto values with no hierarchy.json code that are not "
        f"deprecated with a comment pointing at hierarchy.json: {offenders}"
    )


def test_proto_comment_matcher_is_not_vacuous():
    assert _comment_above_mentions_hierarchy(
        ["  // Deprecated: see hierarchy.json", "  FOO = 1 [deprecated = true];"], "FOO"
    )
    assert not _comment_above_mentions_hierarchy(
        ["  // Deprecated.", "  FOO = 1 [deprecated = true];"], "FOO"
    )


# ---------- metric 2: shared fixture ----------


@pytest.mark.parametrize(
    "row", _fixture_rows(), ids=lambda r: f"{r['filter']!r}-{r['stored']!r}"
)
def test_asset_class_matches_shared_fixture(row):
    assert PH.asset_class_matches(row["filter"], row["stored"]) is row["expected"]


def test_fixture_has_the_required_rows():
    rows = _fixture_rows()
    assert len(rows) >= 7
    found = {(r["filter"], r["stored"]): r["expected"] for r in rows}
    required = {
        ("FIXED_INCOME", "RATES"): True,
        ("FIXED_INCOME", "CREDIT"): True,
        ("FIXED_INCOME", "Fixed Income"): True,
        ("EQUITY", "Equity"): True,
        ("CASH", "Cash"): True,
        ("EQUITY", "RATES"): False,
        ("EQUITY", "NOT_AN_ASSET_CLASS"): False,
    }
    for key, expected in required.items():
        assert found.get(key) is expected, f"required fixture row {key}"


# ---------- guardrail 3: the tree comes from hierarchy.json ----------


def test_every_hierarchy_entry_matches_its_parent_label_and_aliases():
    classes = _hierarchy()["asset_classes"]
    assert len(classes) == len(PH.all_asset_classes())
    for code, entry in classes.items():
        if entry.get("parent"):
            assert PH.asset_class_matches(entry["parent"], code), code
        assert PH.asset_class_matches(code, entry["label"]), code
        for alias in entry.get("aliases", []):
            assert PH.asset_class_matches(code, alias), (code, alias)


def test_loaders_do_not_hand_copy_asset_class_codes():
    loaders = [
        REPO / "ledger-models-java/src/main/java/common/models/security/ProductHierarchy.java",
        REPO / "ledger-models-javascript/node/wrappers/models/security/product_hierarchy.ts",
        REPO / "ledger-models-python/fintekkers/wrappers/models/security/product_hierarchy.py",
    ]
    codes = _hierarchy()["asset_classes"].keys()
    hits = []
    for path in loaders:
        src = path.read_text(encoding="utf-8")
        for code in codes:
            if re.search(rf"""["']{re.escape(code)}["']""", src):
                hits.append(f"{path.name}: {code}")
    assert hits == [], f"asset-class codes hand-copied into loaders: {hits}"


def test_ambiguous_label_fails_at_load():
    with pytest.raises(ValueError):
        PH._build_asset_class_lookup(
            {"A": {"parent": None, "label": "Shared"}, "B": {"parent": None, "label": "shared"}}
        )


# ---------- metric 3: labels and placeholders ----------


@pytest.mark.parametrize(
    "enum, label_of",
    [
        (IdentifierTypeProto, PH.identifier_type_label_of),
        (InstrumentTypeProto, PH.instrument_type_label_of),
        (ProductTypeProto, PH.product_type_label_of),
        (AssetClassProto, PH.asset_class_proto_label_of),
    ],
    ids=lambda p: getattr(p, "DESCRIPTOR", None) and p.DESCRIPTOR.name,
)
def test_every_enum_value_has_a_label(enum, label_of):
    checked = 0
    for v in enum.DESCRIPTOR.values:
        label = label_of(v.number)
        assert label and label.strip(), f"{enum.DESCRIPTOR.name}.{v.name} has no label"
        checked += 1
    assert checked == len(enum.DESCRIPTOR.values) > 0


def test_every_identifier_type_has_a_placeholder():
    checked = 0
    for v in IdentifierTypeProto.DESCRIPTOR.values:
        placeholder = PH.identifier_type_placeholder_of(v.number)
        assert placeholder and placeholder.strip(), f"IdentifierTypeProto.{v.name}"
        checked += 1
    assert checked == len(IdentifierTypeProto.DESCRIPTOR.values) > 0


def test_cash_asset_class_label_is_cash():
    assert PH.asset_class_proto_label_of(AssetClassProto.CASH_ASSET_CLASS) == "Cash"


def test_unknown_enum_numbers_return_none():
    assert PH.identifier_type_label_of(9999) is None
    assert PH.identifier_type_placeholder_of(9999) is None
    assert PH.instrument_type_label_of(9999) is None
    assert PH.product_type_label_of(9999) is None
    assert PH.asset_class_proto_label_of(9999) is None
