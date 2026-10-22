"""TaxLotProto has exactly open_date, open_quantity and price, CostBasisInput
carries the elections and repeated lots, and cost_basis = 20 sits on BondInput,
TipsInput and FrnInput (LM-364). Nothing is added to the root of
ValuationRequestProto, and its 24 and 25 stay reserved. A TipsInput with
non-default elections and two lots round-trips unchanged.
"""
import json
from decimal import Decimal
from pathlib import Path

from google.protobuf import descriptor_pb2
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.portfolio import amortisation_elections_pb2
from fintekkers.models.position import tax_lot_pb2
from fintekkers.models.util import decimal_value_pb2, local_date_pb2
from fintekkers.requests.valuation import product_inputs_pb2, valuation_request_pb2
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

REPO_ROOT = Path(__file__).resolve().parents[3]
# The names of 24 and 25 come from the LM-344 fixture, never spelled here.
REMOVED = [
    f for f in json.loads((REPO_ROOT / "test-fixtures" / "removed-fields" / "lm-344.json").read_text())["fields"]
    if f["message"] == ".fintekkers.requests.valuation.ValuationRequestProto"
]
# ValuationRequestProto's field numbers on main (caa1b3db), before LM-364.
REQUEST_FIELDS_ON_MAIN = {1, 2, 10, 20, 21, 22, 23, 30, 70}
TAX_LOT = tax_lot_pb2.TaxLotProto
COST_BASIS = product_inputs_pb2.CostBasisInput


def _decimal(value: str) -> decimal_value_pb2.DecimalValueProto:
    return encode_decimal(Decimal(value))


def _text(d: decimal_value_pb2.DecimalValueProto) -> str:
    return str(decode_decimal(d))


def _fields(message) -> dict:
    return {
        f.number: (f.name, f.message_type.full_name, f.label == FieldDescriptor.LABEL_REPEATED)
        for f in message.DESCRIPTOR.fields
    }


def test_tax_lot_has_exactly_three_fields():
    assert TAX_LOT.DESCRIPTOR.full_name == "fintekkers.models.position.TaxLotProto"
    assert TAX_LOT.DESCRIPTOR.file.name == "fintekkers/models/position/tax_lot.proto"
    assert _fields(TAX_LOT) == {
        1: ("open_date", "fintekkers.models.util.LocalDateProto", False),
        2: ("open_quantity", "fintekkers.models.util.DecimalValueProto", False),
        3: ("price", "fintekkers.models.util.DecimalValueProto", False),
    }


def test_cost_basis_input_has_elections_and_repeated_lots():
    assert _fields(COST_BASIS) == {
        1: ("elections", "fintekkers.models.portfolio.AmortisationElectionsProto", False),
        2: ("lots", "fintekkers.models.position.TaxLotProto", True),
    }
    assert not COST_BASIS.DESCRIPTOR.fields_by_number[2].message_type.GetOptions().map_entry


def test_cost_basis_is_20_on_bond_tips_and_frn():
    for message in (product_inputs_pb2.BondInput, product_inputs_pb2.TipsInput, product_inputs_pb2.FrnInput):
        field = message.DESCRIPTOR.fields_by_number[20]
        assert field.name == "cost_basis", message.DESCRIPTOR.name
        assert field.message_type is COST_BASIS.DESCRIPTOR, message.DESCRIPTOR.name
        assert field.label == FieldDescriptor.LABEL_OPTIONAL, message.DESCRIPTOR.name


def test_valuation_request_has_no_new_fields():
    assert set(valuation_request_pb2.ValuationRequestProto.DESCRIPTOR.fields_by_number) == REQUEST_FIELDS_ON_MAIN


def test_24_and_25_stay_reserved():
    proto = descriptor_pb2.DescriptorProto()
    valuation_request_pb2.ValuationRequestProto.DESCRIPTOR.CopyToProto(proto)
    reserved = {n for r in proto.reserved_range for n in range(r.start, r.end)}
    assert sorted(f["number"] for f in REMOVED) == [24, 25]
    assert {24, 25} <= reserved
    assert {f["name"] for f in REMOVED} <= set(proto.reserved_name)


def _lot(year: int, month: int, day: int, quantity: str, price: str) -> tax_lot_pb2.TaxLotProto:
    return TAX_LOT(
        open_date=local_date_pb2.LocalDateProto(year=year, month=month, day=day),
        open_quantity=_decimal(quantity),
        price=_decimal(price),
    )


def test_tips_input_cost_basis_round_trips_unchanged():
    original = product_inputs_pb2.TipsInput(
        clean_price=_decimal("97.50"),
        cost_basis=COST_BASIS(
            elections=amortisation_elections_pb2.AmortisationElectionsProto(
                bond_premium=amortisation_elections_pb2.PREMIUM_NOT_ELECTED,
                market_discount_inclusion=amortisation_elections_pb2.INCLUDE_CURRENTLY,
                market_discount_accrual=amortisation_elections_pb2.CONSTANT_YIELD,
            ),
            lots=[_lot(2024, 1, 15, "10000", "98.25"), _lot(2025, 6, 2, "5000", "101.50")],
        ),
    )
    request = valuation_request_pb2.ValuationRequestProto(
        product_input=product_inputs_pb2.ProductInput(tips=original),
    )

    parsed = valuation_request_pb2.ValuationRequestProto.FromString(request.SerializeToString())

    tips = parsed.product_input.tips
    assert tips == original
    assert tips.HasField("cost_basis")
    assert tips.cost_basis.HasField("elections")
    elections = tips.cost_basis.elections
    assert elections.bond_premium == amortisation_elections_pb2.PREMIUM_NOT_ELECTED
    assert elections.market_discount_inclusion == amortisation_elections_pb2.INCLUDE_CURRENTLY
    assert elections.market_discount_accrual == amortisation_elections_pb2.CONSTANT_YIELD
    lots = [
        ((lot.open_date.year, lot.open_date.month, lot.open_date.day), _text(lot.open_quantity), _text(lot.price))
        for lot in tips.cost_basis.lots
    ]
    assert lots == [((2024, 1, 15), "10000", "98.25"), ((2025, 6, 2), "5000", "101.50")]
