"""LM-409: valuation_arms in hierarchy.json, resolved by
product_inputs.arm_for / required_market_data.

The shared cases live in ledger-models-protos/fixtures/valuation_arms_cases.json,
read by the Java, JS and Rust tests too.
"""

import copy
import json
from importlib import resources
from pathlib import Path

import pytest

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import BondDetailsProto, SecurityProto
from fintekkers.requests.valuation.product_inputs_pb2 import ProductInput
from fintekkers.wrappers.models.errors import (
    InvalidRegistryError,
    ModelValidationError,
    UnmappedProductTypeError,
)
from fintekkers.wrappers.models.security import product_hierarchy as PH
from fintekkers.wrappers.models.security import product_inputs as PI


def _repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "ledger-models-protos" / "hierarchy.json").exists():
            return parent
    raise FileNotFoundError("ledger-models-protos/ not found above this test")


PROTOS = _repo_root() / "ledger-models-protos"


def _source_section() -> dict:
    with (PROTOS / "hierarchy.json").open(encoding="utf-8") as f:
        return json.load(f)["valuation_arms"]


def _security(product_type: str, coupon_type: str) -> SecurityProto:
    return SecurityProto(
        product_type=ProductTypeProto.Value(product_type),
        bond_details=BondDetailsProto(coupon_type=CouponTypeProto.Value(coupon_type)),
    )


def _resolve(product_type: str, coupon_type: str):
    """(arm, requires) through a real proto when the type has an enum value;
    planned leaves by name."""
    if product_type not in ProductTypeProto.keys():
        a = PI._shipped().require(product_type, coupon_type)
        return a.arm, list(a.requires)
    s = _security(product_type, coupon_type)
    return PI.arm_for(s), PI.required_market_data(s)


# ---------- metric 1: shared fixture ----------

def _fixture_cases():
    with (PROTOS / "fixtures" / "valuation_arms_cases.json").open(encoding="utf-8") as f:
        return json.load(f)["cases"]


def test_fixture_has_the_required_cases():
    cases = _fixture_cases()
    assert len(cases) >= 5
    seen = {(c["product_type"], c["coupon_type"]) for c in cases}
    assert {
        ("TBILL", "ZERO"), ("TIPS", "FIXED"), ("CORP_BOND", "FLOAT"),
        ("TREASURY_NOTE", "FLOAT"), ("FX_SPOT", "UNKNOWN_COUPON_TYPE"),
    } <= seen


@pytest.mark.parametrize("case", _fixture_cases(), ids=lambda c: f"{c['product_type']}/{c['coupon_type']}")
def test_fixture_cases(case):
    pt, coupon = case["product_type"], case["coupon_type"]
    if "error" in case:
        assert case["error"] == "UnmappedProductTypeError"
        with pytest.raises(UnmappedProductTypeError) as e:
            _resolve(pt, coupon)
        assert (e.value.product_type, e.value.coupon_type) == (pt, coupon)
    else:
        arm, requires = _resolve(pt, coupon)
        assert arm == case["arm"]
        assert [k.value for k in requires] == case["requires"]


# ---------- metric 2: unmapped types raise ----------

def _unmapped_leaves():
    out = {"FX_SPOT"}
    for root in ("INDEX", "CRYPTO", "COMMODITY_SPOT"):
        out |= {n for n in PH.descendants_of(root) if not PH.descendants_of(n)}
    return sorted(out)


def test_unmapped_set_comes_from_the_registry():
    assert {"FX_SPOT", "COMMODITY_INDEX", "PLATINUM", "PALLADIUM", "CRYPTOCURRENCY", "GOLD"} <= set(
        _unmapped_leaves())


@pytest.mark.parametrize("product_type", _unmapped_leaves())
def test_unmapped_types_raise(product_type):
    with pytest.raises(UnmappedProductTypeError) as e:
        _resolve(product_type, "UNKNOWN_COUPON_TYPE")
    assert product_type in str(e.value)
    assert "UNKNOWN_COUPON_TYPE" in str(e.value)


def test_message_names_product_and_coupon_type():
    gold = _security("GOLD", "FLOAT")
    with pytest.raises(UnmappedProductTypeError) as e:
        PI.arm_for(gold)
    assert "GOLD" in str(e.value) and "FLOAT" in str(e.value)
    with pytest.raises(UnmappedProductTypeError):
        PI.required_market_data(gold)


# ---------- LM-411: every ProductTypeProto value maps to an arm or raises ----------

ARMS = {f.name for f in ProductInput.DESCRIPTOR.oneofs_by_name["input"].fields}


@pytest.mark.parametrize("product_type", ProductTypeProto.keys())
def test_every_product_type_maps_to_an_arm_or_raises(product_type):
    security = SecurityProto(product_type=ProductTypeProto.Value(product_type))
    try:
        arm = PI.arm_for(security)
    except UnmappedProductTypeError as e:
        assert e.product_type == product_type
        assert product_type in str(e)
        return
    assert arm in ARMS, (product_type, arm)


def test_product_type_unknown_raises():
    with pytest.raises(UnmappedProductTypeError) as e:
        PI.arm_for(SecurityProto(product_type=ProductTypeProto.PRODUCT_TYPE_UNKNOWN))
    assert "PRODUCT_TYPE_UNKNOWN" in str(e.value)


# ---------- metric 3: every leaf covered ----------

def test_every_leaf_covered():
    assert PI._shipped().uncovered_leaves() == []


def test_uncovered_leaf_is_reported():
    section = copy.deepcopy(_source_section())
    section["unpriced"].remove("FUND_LP")
    assert PI._parse_valuation_arms(section).uncovered_leaves() == ["FUND_LP"]


# ---------- metric 4: bundled section equals source ----------

def test_bundled_section_matches_source():
    bundled = resources.files("fintekkers.wrappers.models.security").joinpath("hierarchy.json")
    assert bundled.is_file(), "bundled hierarchy.json missing: run ./sync-hierarchy-mirrors.sh or ./compile.sh"
    with bundled.open("r", encoding="utf-8") as f:
        data = json.load(f)
    assert "valuation_arms" in data
    assert data["valuation_arms"] == _source_section()


# ---------- metric 5: closed requires vocabulary ----------

def test_shipped_requires_in_vocabulary():
    values = [r for e in _source_section()["entries"] for r in e["requires"]]
    assert values
    assert set(values) <= {"CPI_U", "FRN_FIXINGS", "FRN_CURVE"}
    assert {k.value for k in PI.MarketDataKind} == {"CPI_U", "FRN_FIXINGS", "FRN_CURVE"}


def test_parse_rejects_unknown_requires():
    section = copy.deepcopy(_source_section())
    section["entries"][0]["requires"].append("FX_RATE")
    with pytest.raises(InvalidRegistryError, match="FX_RATE"):
        PI._parse_valuation_arms(section)


# ---------- guardrails ----------

def test_resolution_reads_the_section():
    section = copy.deepcopy(_source_section())
    for e in section["entries"]:
        if e["node"] == "STOCK":
            e["arm"] = "cash"
    assert PI._parse_valuation_arms(section).require("COMMON_STOCK", "UNKNOWN_COUPON_TYPE").arm == "cash"
    assert PI.arm_for(_security("COMMON_STOCK", "UNKNOWN_COUPON_TYPE")) == "equity"


def test_unset_bond_details_reads_as_unknown_coupon_type():
    corp = SecurityProto(product_type=ProductTypeProto.CORP_BOND)
    assert PI.arm_for(corp) == "bond"
    assert PI.required_market_data(corp) == []

    with pytest.raises(UnmappedProductTypeError) as e:
        PI.arm_for(SecurityProto(product_type=ProductTypeProto.FX_SPOT))
    assert e.value.coupon_type == "UNKNOWN_COUPON_TYPE"
    assert "UNKNOWN_COUPON_TYPE" in str(e.value)


def test_unmapped_is_an_input_error():
    assert issubclass(UnmappedProductTypeError, ValueError)
    assert not issubclass(UnmappedProductTypeError, ModelValidationError)
    assert not issubclass(InvalidRegistryError, ValueError)


def test_required_market_data_is_a_fresh_list():
    tips = _security("TIPS", "FIXED")
    PI.required_market_data(tips).append(PI.MarketDataKind.FRN_CURVE)
    assert PI.required_market_data(tips) == [PI.MarketDataKind.CPI_U]


# ---------- LM-427: measures_for_arm ----------

ARMS = {"bond", "tips", "frn", "mbs", "equity", "cash"}
MEASURES_FIXTURE = json.loads(
    (_repo_root() / "test-fixtures" / "catalog" / "measures-for-arm.json").read_text(encoding="utf-8"))


def _measure_names(arm: str) -> list:
    return [MeasureProto.Name(m) for m in PI.measures_for_arm(arm)]


def test_measures_fixture_lists_the_six_arms_none_empty():
    assert set(MEASURES_FIXTURE["arms"]) == ARMS
    assert all(MEASURES_FIXTURE["arms"][arm] for arm in ARMS)


@pytest.mark.parametrize("arm", sorted(ARMS))
def test_measures_for_arm_matches_the_shared_fixture(arm):
    names = _measure_names(arm)
    assert len(names) == len(set(names))
    assert sorted(names) == sorted(MEASURES_FIXTURE["arms"][arm])


def test_measures_for_arm_frn_and_tips():
    frn = _measure_names("frn")
    assert not {"CONVEXITY", "MODIFIED_DURATION", "DV01", "PROFIT_LOSS_PERCENT"} & set(frn)
    assert {"REFERENCE_CPI", "INDEX_RATIO"} <= set(_measure_names("tips"))


def test_measures_for_unknown_arm_is_unmapped():
    with pytest.raises(UnmappedProductTypeError) as e:
        PI.measures_for_arm(MEASURES_FIXTURE["unknown_arm"])
    assert type(e.value) is UnmappedProductTypeError
    assert e.value.product_type == "swap"


def _catalog_with(name: str, **fields) -> list:
    measures = copy.deepcopy(PI._shipped_measures())
    for m in measures:
        if m["name"] == name:
            m.update(fields)
    return measures


def test_measures_for_arm_follows_implemented():
    dm = MeasureProto.DISCOUNT_MARGIN
    assert dm in PI.measures_for_arm("frn")
    assert dm not in PI._measures_for_arm_in(_catalog_with("DISCOUNT_MARGIN", implemented=False), "frn")


def test_measures_for_arm_follows_an_ancestor_node():
    measures = _catalog_with("PAR_YIELD", implemented=True, applies_to=["GOV_BOND"])
    for arm in ("frn", "bond"):
        assert MeasureProto.PAR_YIELD not in PI.measures_for_arm(arm)
        assert MeasureProto.PAR_YIELD in PI._measures_for_arm_in(measures, arm)
