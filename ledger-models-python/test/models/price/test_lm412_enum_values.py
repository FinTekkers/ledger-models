"""LM-412 is additive: PriceTypeProto gains RATE = 5 and ProductTypeProto gains
T_BILL_13_WEEK_SERIES = 36. Every existing value keeps its number and name.

The values come from test-fixtures/field-changes/lm-412.json, which wire-diff
rule lm412 and the Java, Rust and JS descriptor tests also read.
"""
import json
from pathlib import Path

import pytest

from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto

REPO_ROOT = Path(__file__).resolve().parents[4]
SPEC = json.loads((REPO_ROOT / "test-fixtures" / "field-changes" / "lm-412.json").read_text())
ENUMS = {
    ".fintekkers.models.price.PriceTypeProto": PriceTypeProto.DESCRIPTOR,
    ".fintekkers.models.security.ProductTypeProto": ProductTypeProto.DESCRIPTOR,
}


def _id(v: dict) -> str:
    return f"{v['enum'].rsplit('.', 1)[1]}.{v['name']}"


def test_added_values_are_rate_and_t_bill_13_week_series():
    assert [(v["enum"], v["number"], v["name"]) for v in SPEC["added_values"]] == [
        (".fintekkers.models.price.PriceTypeProto", 5, "RATE"),
        (".fintekkers.models.security.ProductTypeProto", 36, "T_BILL_13_WEEK_SERIES"),
    ]
    assert PriceTypeProto.RATE == 5
    assert ProductTypeProto.T_BILL_13_WEEK_SERIES == 36


@pytest.mark.parametrize("value", SPEC["added_values"] + SPEC["kept"], ids=_id)
def test_value_has_its_number_and_name(value):
    descriptor = ENUMS[value["enum"]]
    assert descriptor.values_by_name[value["name"]].number == value["number"]
    assert descriptor.values_by_number[value["number"]].name == value["name"]


@pytest.mark.parametrize("enum", sorted(ENUMS))
def test_kept_plus_added_is_the_whole_enum(enum):
    listed = {(v["number"], v["name"]) for v in SPEC["kept"] + SPEC["added_values"] if v["enum"] == enum}
    actual = {(v.number, v.name) for v in ENUMS[enum].values}
    assert len(listed) == len(ENUMS[enum].values)
    assert listed == actual
