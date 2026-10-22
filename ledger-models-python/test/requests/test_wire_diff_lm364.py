"""wire-diff.py rule lm364 allows exactly the LM-364 additions, with their
types, and nothing on the root of ValuationRequestProto (LM-364).

Keys use wire-diff's shape() form, with the leading dot.
"""
import importlib.util
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
REQUEST = ".fintekkers.requests.valuation.ValuationRequestProto"
ELECTIONS = ".fintekkers.models.portfolio.AmortisationElectionsProto"
TAX_LOT = ".fintekkers.models.position.TaxLotProto"
COST_BASIS = ".fintekkers.requests.valuation.CostBasisInput"

_spec = importlib.util.spec_from_file_location("wire_diff", REPO_ROOT / "scripts" / "checks" / "wire-diff.py")
wire_diff = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(wire_diff)


def test_each_addition_is_allowed():
    assert len(wire_diff.LM364) == 27
    for key, new in wire_diff.LM364.items():
        assert wire_diff.lm364(key, None, new, {}), key


def test_a_field_on_the_valuation_request_root_is_rejected():
    for number in (24, 25, 26, 27):
        key = f"field {REQUEST} = {number}"
        assert not wire_diff.lm364(key, None, f"{ELECTIONS} amortisation_elections", {}), number
        assert not wire_diff.lm364(key, None, f"repeated {TAX_LOT} tax_lots", {}), number


def test_a_fourth_tax_lot_field_is_rejected():
    assert not wire_diff.lm364(f"field {TAX_LOT} = 4", None, ".fintekkers.models.util.LocalDateProto settlement_date", {})


def test_a_changed_addition_is_rejected():
    assert not wire_diff.lm364(f"field {ELECTIONS} = 10", None, "bool bond_premium", {})
    assert not wire_diff.lm364(f"field {ELECTIONS} = 13", None, ".fintekkers.models.util.LocalDateProto effective_from", {})
    assert not wire_diff.lm364(f"field {COST_BASIS} = 2", None, f"{TAX_LOT} lots", {})
    assert not wire_diff.lm364(f"field {COST_BASIS} = 2", None, f"{COST_BASIS}.LotsEntry lots", {})


def test_a_retyped_kept_field_is_rejected():
    key = "field .fintekkers.models.portfolio.PortfolioProto = 10"
    assert not wire_diff.lm364(key, "string portfolio_name", f"{ELECTIONS} portfolio_name", {})


def test_removing_an_addition_is_rejected():
    key = f"field {COST_BASIS} = 1"
    assert not wire_diff.lm364(key, wire_diff.LM364[key], None, {})


def test_lm364_is_in_allowed():
    assert wire_diff.lm364 in wire_diff.ALLOWED
