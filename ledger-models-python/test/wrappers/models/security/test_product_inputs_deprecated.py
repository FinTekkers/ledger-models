"""LM-418: the deprecated arm-named aliases give the same results as the
input-type names they call, each warns with a DeprecationWarning naming the
new name, and hierarchy.json still loads with the legacy valuation_arms / arm
keys for one release."""

import copy
import json
import warnings
from pathlib import Path

import pytest

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import BondDetailsProto, SecurityProto
from fintekkers.wrappers.models.errors import InvalidRegistryError, MissingMarketDataError
from fintekkers.wrappers.models.security import product_inputs as PI
from fintekkers.wrappers.models.security.product_inputs import (
    arm_for,
    input_type_for,
    measures_for_arm,
    measures_for_input_type,
)


def _repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "ledger-models-protos" / "hierarchy.json").exists():
            return parent
    raise FileNotFoundError("ledger-models-protos/ not found above this test")


ROOT = _repo_root()


def _json(*parts: str) -> dict:
    return json.loads(ROOT.joinpath(*parts).read_text(encoding="utf-8"))


def _outcome(call):
    """The value, or the raised exception's type and message."""
    try:
        return call()
    except (ValueError, RuntimeError) as e:
        return type(e), str(e)


def _legacy(root: dict) -> dict:
    """`root` with the section and entry keys renamed to the legacy names."""
    out = copy.deepcopy(root)
    section = out.pop("valuation_input_types")
    for entry in section["entries"]:
        entry["arm"] = entry.pop("input_type")
    out["valuation_arms"] = section
    return out


# ---------- metric 2: the aliases match the new names ----------

CASES = [
    c for c in _json("ledger-models-protos", "fixtures", "valuation_input_types_cases.json")["cases"]
    if c["product_type"] in ProductTypeProto.keys()
]


@pytest.mark.parametrize("case", CASES, ids=lambda c: f"{c['product_type']}/{c['coupon_type']}")
def test_arm_for_matches_input_type_for(case):
    security = SecurityProto(
        product_type=ProductTypeProto.Value(case["product_type"]),
        bond_details=BondDetailsProto(coupon_type=CouponTypeProto.Value(case["coupon_type"])),
    )
    expected = _outcome(lambda: input_type_for(security))
    with pytest.deprecated_call(match="input_type_for"):
        assert _outcome(lambda: arm_for(security)) == expected
    if "input_type" in case:
        assert expected == case["input_type"]


MEASURES = _json("test-fixtures", "catalog", "measures-for-input-type.json")


@pytest.mark.parametrize("input_type", [*MEASURES["input_types"], MEASURES["unknown_input_type"]])
def test_measures_for_arm_matches_measures_for_input_type(input_type):
    expected = _outcome(lambda: measures_for_input_type(input_type))
    with pytest.deprecated_call(match="measures_for_input_type"):
        assert _outcome(lambda: measures_for_arm(input_type)) == expected


def test_measures_for_arm_inflation_compensation_tips_only():
    # LM-434: valuation-service computes it for tips (VS-155).
    others = set(MEASURES["input_types"]) - {"tips"}
    assert len(others) == 5
    with pytest.deprecated_call(match="measures_for_input_type"):
        assert MeasureProto.INFLATION_COMPENSATION in measures_for_arm("tips")
    for arm in others:
        with pytest.deprecated_call(match="measures_for_input_type"):
            assert MeasureProto.INFLATION_COMPENSATION not in measures_for_arm(arm), arm


def test_missing_market_data_arm_matches_input_type():
    tips = SecurityProto(product_type=ProductTypeProto.TIPS)
    with pytest.raises(MissingMarketDataError) as raised:
        PI.for_security(tips, PriceProto())
    e = raised.value
    assert e.input_type == "tips"
    assert "for input type tips" in str(e)
    with pytest.deprecated_call(match="input_type"):
        assert e.arm == e.input_type


def test_missing_market_data_arm_keyword_matches_input_type():
    new = MissingMarketDataError("tips", "CPI_U", "tips.cpi", None)
    with pytest.deprecated_call(match="input_type"):
        old = MissingMarketDataError(arm="tips", kind="CPI_U", field="tips.cpi", object_id=None)
    assert (old.input_type, old.kind, old.field, str(old)) == (new.input_type, new.kind, new.field, str(new))
    assert list(old.violations) == list(new.violations)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        assert old.arm == new.arm == "tips"


def test_the_new_names_do_not_warn():
    security = SecurityProto(product_type=ProductTypeProto.TIPS)
    with warnings.catch_warnings():
        warnings.simplefilter("error", DeprecationWarning)
        assert input_type_for(security) == "tips"
        assert measures_for_input_type("tips")
        assert MissingMarketDataError("tips", "CPI_U", "tips.cpi", None).input_type == "tips"


# ---------- metric 3: the legacy keys load the same mapping ----------

def test_legacy_keys_load_the_same_mapping():
    root = _json("ledger-models-protos", "hierarchy.json")
    assert len(root["valuation_input_types"]["entries"]) == 8
    current = PI._ValuationInputTypes.from_hierarchy(root)
    legacy = PI._ValuationInputTypes.from_hierarchy(_legacy(root))
    assert current == legacy
    assert current == PI._shipped()
    assert current.uncovered_leaves() == legacy.uncovered_leaves()


def _both_root_keys(root):
    root["valuation_arms"] = copy.deepcopy(root["valuation_input_types"])


def _neither_root_key(root):
    del root["valuation_input_types"]


def _entry_with_both_fields(root):
    root["valuation_input_types"]["entries"][0]["arm"] = "bond"


@pytest.mark.parametrize("breaks", [_both_root_keys, _neither_root_key, _entry_with_both_fields])
def test_ambiguous_or_missing_keys_are_rejected(breaks):
    root = _json("ledger-models-protos", "hierarchy.json")
    breaks(root)
    with pytest.raises(InvalidRegistryError, match="valuation_input_types"):
        PI._ValuationInputTypes.from_hierarchy(root)
