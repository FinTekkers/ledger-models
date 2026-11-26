"""The spec for TipsInput.assumed_inflation_rate and CashflowProto.index_ratio
(LM-477). Both are optional DecimalValueProto fields on new, unreserved
numbers. Their proto comments state the units, the projected index-ratio
formula and that unset is absent, never 0. The PRESENT_VALUE_CASHFLOWS
catalog entry states the same formula, scopes the PV invariant to an unset
rate, and keeps implemented, depends_on and applies_to: the calculation ships
in VS-159.

Comments are found by the name they document, never by line number.
"""
import json
import re
from pathlib import Path

import pytest
from google.protobuf import descriptor_pb2

from fintekkers.models.util import decimal_value_pb2
from fintekkers.models.valuation import cashflow_pb2
from fintekkers.requests.valuation import product_inputs_pb2

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTOS = REPO_ROOT / "ledger-models-protos" / "fintekkers"
PRODUCT_INPUTS = PROTOS / "requests" / "valuation" / "product_inputs.proto"
CASHFLOW = PROTOS / "models" / "valuation" / "cashflow.proto"
CATALOG = REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json"

FORMULA = ["INDEX_RATIO at settlement x (1 + rate/100)^y", "days from settlement to t / 365 (ACT/365)"]
RATE_PHRASES = FORMULA + [
    "percent a year (3.0 = 3% a year)",
    "Coupon = principal x ratio(t) x coupon rate per period",
    "Principal at maturity = principal x max(ratio, 1)",
    "Absent when unset",
    "Unset is not 0%",
    "today's\n  // INDEX_RATIO for every row, as before",
    # Settlement wording reuses the existing header, with no UTC.
    "Settlement date is read\n  // from ValuationRequestProto.asof_datetime.",
    "Discounting\n  // of pv_amount is unchanged; see VS-159.",
]
RATIO_PHRASES = FORMULA + [
    "dimensionless ratio",
    "Set for TIPS rows only; absent for every\n  // other product",
    "Absent when unset, never 0",
    "unfloored ratio",
    "max(ratio, 1) floor applies only to\n  // principal at maturity",
]


def _block(path: Path, declaration: str) -> str:
    """The `//` comment lines directly above the line that declares
    `declaration`, plus that line, as in the file."""
    lines = path.read_text().splitlines()
    pattern = re.compile(rf"(^|\s){re.escape(declaration)}\s*=")
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{declaration} in {path.name}: {matches}"
    end = start = matches[0]
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end + 1])


def _entry(name: str) -> dict:
    entries = [m for m in json.loads(CATALOG.read_text())["measures"] if m["name"] == name]
    assert len(entries) == 1, name
    return entries[0]


@pytest.mark.parametrize("message, name, number", [
    (product_inputs_pb2.TipsInput, "assumed_inflation_rate", 5),
    (cashflow_pb2.CashflowProto, "index_ratio", 6),
], ids=["TipsInput", "CashflowProto"])
def test_field_is_an_optional_decimal_on_an_unreserved_number(message, name, number):
    field = message.DESCRIPTOR.fields_by_name[name]
    assert field.number == number
    assert field.message_type is decimal_value_pb2.DecimalValueProto.DESCRIPTOR
    proto = descriptor_pb2.DescriptorProto()
    message.DESCRIPTOR.CopyToProto(proto)
    [field_proto] = [f for f in proto.field if f.name == name]
    assert field_proto.proto3_optional
    assert not any(r.start <= number < r.end for r in proto.reserved_range)
    assert name not in proto.reserved_name


def test_assumed_inflation_rate_comment_states_units_formula_and_absence():
    comment = _block(PRODUCT_INPUTS, "assumed_inflation_rate")
    assert "optional fintekkers.models.util.DecimalValueProto assumed_inflation_rate = 5;" in comment
    for phrase in RATE_PHRASES:
        assert phrase in comment, phrase
    assert "UTC" not in comment


def test_index_ratio_comment_states_units_formula_and_absence():
    comment = _block(CASHFLOW, "index_ratio")
    assert "optional fintekkers.models.util.DecimalValueProto index_ratio = 6;" in comment
    for phrase in RATIO_PHRASES:
        assert phrase in comment, phrase


def test_catalog_states_the_formula_and_scopes_the_pv_invariant():
    entry = _entry("PRESENT_VALUE_CASHFLOWS")
    for phrase in FORMULA + [
        "index_ratio (TIPS only)",
        "Coupon = principal x ratio(t) x coupon rate per period",
        "Principal at maturity = principal x max(ratio, 1)",
        "Sum of pv_amounts equals dirty price × face / 100 when TipsInput.assumed_inflation_rate is unset",
        "Discounting of pv_amount is unchanged; see VS-159",
    ]:
        assert phrase in entry["formula"], phrase
    assert "index_ratio dimensionless" in entry["units"]
    assert "TipsInput.assumed_inflation_rate percent a year" in entry["units"]
    [invariant] = [a for a in entry["model_assumptions"] if "sum(pv_amounts) == dirty price × face / 100" in a]
    assert "Holds when TipsInput.assumed_inflation_rate is unset" in invariant
    assumptions = " ".join(entry["model_assumptions"])
    assert "compounded annually on ACT/365" in assumptions
    assert "max(ratio, 1) on principal at maturity only" in assumptions
    assert "Unset is absent, never 0%" in assumptions


def test_catalog_keeps_implemented_depends_on_and_applies_to():
    entry = _entry("PRESENT_VALUE_CASHFLOWS")
    assert entry["implemented"] is True
    assert entry["depends_on"] == ["YIELD_TO_MATURITY", "YIELD_CURVE"]
    assert entry["applies_to"] == ["BOND", "TIPS", "TREASURY_FRN"]
