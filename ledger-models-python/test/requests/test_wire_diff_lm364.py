"""wire-diff.py rule lm364 allows exactly the LM-364 additions, with their types.

Keys use wire-diff's shape() form, with the leading dot.
"""
import importlib.util
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
REQUEST = ".fintekkers.requests.valuation.ValuationRequestProto"
ELECTIONS = ".fintekkers.models.portfolio.AmortisationElectionsProto"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def test_each_addition_is_allowed():
    assert len(wire_diff.LM364) == 25
    for key, new in wire_diff.LM364.items():
        assert wire_diff.lm364(key, None, new, {}), key


def test_reserved_24_and_25_are_rejected():
    for number in (24, 25):
        key = f"field {REQUEST} = {number}"
        assert not wire_diff.lm364(key, None, f"{ELECTIONS} amortisation_elections", {})


def test_a_retyped_kept_field_is_rejected():
    key = "field .fintekkers.models.portfolio.PortfolioProto = 10"
    assert not wire_diff.lm364(key, "string portfolio_name", f"{ELECTIONS} portfolio_name", {})


def test_a_changed_addition_is_rejected():
    assert not wire_diff.lm364(f"field {ELECTIONS} = 10", None, "bool bond_premium", {})
    assert not wire_diff.lm364(f"field {REQUEST} = 27", None, ".fintekkers.requests.valuation.TaxLotInputProto tax_lots", {})
    key = f"field {ELECTIONS} = 1"
    assert not wire_diff.lm364(key, None, "string object_class", {})


def test_removing_an_addition_is_rejected():
    key = f"field {REQUEST} = 26"
    assert not wire_diff.lm364(key, wire_diff.LM364[key], None, {})


def test_lm364_is_in_allowed():
    assert wire_diff.lm364 in wire_diff.ALLOWED
