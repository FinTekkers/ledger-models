"""LM-461: default trade-price type by product, from hierarchy.json
default_price_types. Parity with Java DefaultPriceTypesTest, JS
default_price_types.test.ts and Rust default_price_types_test.rs.

The shared cases live in ledger-models-protos/fixtures/default_price_types_cases.json;
expected values come from that file only, never from the resolver under test.
"""
import json
from pathlib import Path

import pytest

from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.errors import InvalidRegistryError, NoDefaultPriceTypeError
from fintekkers.wrappers.models.security import default_price_types as DPT


def _repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "ledger-models-protos" / "hierarchy.json").exists():
            return parent
    raise FileNotFoundError("ledger-models-protos/ not found above this test")


PROTOS = _repo_root() / "ledger-models-protos"


def _fixture_cases() -> dict:
    with (PROTOS / "fixtures" / "default_price_types_cases.json").open(encoding="utf-8") as f:
        return json.load(f)["cases"]


def _source_section() -> dict:
    with (PROTOS / "hierarchy.json").open(encoding="utf-8") as f:
        return json.load(f)["default_price_types"]


# ---------- metric 3: every product resolves to the fixture, never UNKNOWN ----------

def test_fixture_lists_every_product_type_enum_value():
    assert set(_fixture_cases()) == set(ProductTypeProto.keys())


def test_fixture_covers_deepest_node_wins():
    cases = _fixture_cases()
    assert cases["SOFR_SERIES"] == "RATE"
    assert cases["T_BILL_13_WEEK_SERIES"] == "RATE"
    assert cases["CPI_SERIES"] == "INDEX_LEVEL"


@pytest.mark.parametrize("product_type,expected", sorted(_fixture_cases().items()))
def test_every_product_resolves_as_the_fixture_says(product_type, expected):
    security = SecurityProto(product_type=ProductTypeProto.Value(product_type))
    if expected == "raises":
        assert DPT.default_price_type_for(security) is None
        with pytest.raises(NoDefaultPriceTypeError):
            DPT.resolve_trade_price_type(security)
    else:
        resolved = DPT.resolve_trade_price_type(security)
        assert resolved == PriceTypeProto.Value(expected)
        assert resolved != PriceTypeProto.UNKNOWN_PRICE_TYPE


def test_each_table_key_resolves_to_its_own_entry():
    section = _source_section()
    assert section
    for node, name in section.items():
        assert DPT.shipped().default_for(node) == PriceTypeProto.Value(name), node


def test_shipped_entries_are_read_only():
    with pytest.raises(TypeError):
        DPT.shipped().entries["BOND"] = PriceTypeProto.ABSOLUTE


# ---------- guardrail 3: a broken section is an InvalidRegistryError ----------

@pytest.mark.parametrize("section,match", [
    ({"NOT_A_NODE": "PERCENTAGE"}, "NOT_A_NODE"),
    ({"BOND": "PERCENT"}, "PERCENT"),
    ({"BOND": "UNKNOWN_PRICE_TYPE"}, "UNKNOWN_PRICE_TYPE"),
    ({"BOND": 2}, "BOND"),
    (None, "missing"),
    (["BOND", "PERCENTAGE"], "object"),
])
def test_broken_section_raises_invalid_registry_error(section, match):
    with pytest.raises(InvalidRegistryError, match=match):
        DPT.parse_default_price_types(section)


def test_source_section_parses_to_the_shipped_table():
    assert DPT.parse_default_price_types(_source_section()).entries == DPT.shipped().entries
