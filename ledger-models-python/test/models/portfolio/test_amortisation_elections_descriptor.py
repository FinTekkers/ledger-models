"""AmortisationElectionsProto and its three enums are exactly as ruled in
VS-110 (LM-364), value 0 of each enum means "use the default", and the
elections ride on PortfolioProto 11 and ValuationRequestProto 26 next to the
typed lots on 27. Reserved 24 and 25 stay reserved.
"""
import json
from pathlib import Path

from google.protobuf import descriptor_pb2
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.portfolio import amortisation_elections_pb2, portfolio_pb2
from fintekkers.requests.valuation import valuation_request_pb2

REPO_ROOT = Path(__file__).resolve().parents[4]
# The names of 24 and 25 come from the LM-344 fixture, never spelled here.
REMOVED = [
    f for f in json.loads((REPO_ROOT / "test-fixtures" / "removed-fields" / "lm-344.json").read_text())["fields"]
    if f["message"] == ".fintekkers.requests.valuation.ValuationRequestProto"
]
FILE = amortisation_elections_pb2.DESCRIPTOR
ELECTIONS = amortisation_elections_pb2.AmortisationElectionsProto
ELECTIONS_NAME = "fintekkers.models.portfolio.AmortisationElectionsProto"

# The ruled fields: number -> (name, type name).
RULED_FIELDS = {
    10: ("bond_premium", "fintekkers.models.portfolio.PremiumAmortisationElectionProto"),
    11: ("market_discount_inclusion", "fintekkers.models.portfolio.MarketDiscountInclusionProto"),
    12: ("market_discount_accrual", "fintekkers.models.portfolio.MarketDiscountAccrualMethodProto"),
    13: ("effective_from", "fintekkers.models.util.LocalDateProto"),
}

# The ruled enums: name -> [(value name, number)]. Value 0 is "use the default".
RULED_ENUMS = {
    "PremiumAmortisationElectionProto": [
        ("UNSPECIFIED_PREMIUM_ELECTION", 0), ("PREMIUM_ELECTED", 1), ("PREMIUM_NOT_ELECTED", 2)],
    "MarketDiscountInclusionProto": [
        ("UNSPECIFIED_MARKET_DISCOUNT_INCLUSION", 0), ("AT_DISPOSITION", 1), ("INCLUDE_CURRENTLY", 2)],
    "MarketDiscountAccrualMethodProto": [
        ("UNSPECIFIED_ACCRUAL_METHOD", 0), ("RATABLE", 1), ("CONSTANT_YIELD", 2)],
}


def _type_name(field) -> str:
    return (field.message_type or field.enum_type).full_name


def test_file_defines_the_elections_message_and_three_enums():
    assert FILE.name == "fintekkers/models/portfolio/amortisation_elections.proto"
    assert FILE.package == "fintekkers.models.portfolio"
    assert list(FILE.message_types_by_name) == ["AmortisationElectionsProto"]
    assert sorted(FILE.enum_types_by_name) == sorted(RULED_ENUMS)
    assert FILE.GetOptions().java_outer_classname == "AmortisationElectionsProtos"


def test_elections_fields_are_as_ruled():
    fields = {f.number: (f.name, _type_name(f)) for f in ELECTIONS.DESCRIPTOR.fields}
    assert fields == RULED_FIELDS
    assert all(f.label == FieldDescriptor.LABEL_OPTIONAL for f in ELECTIONS.DESCRIPTOR.fields)


def test_enums_are_as_ruled():
    for name, values in RULED_ENUMS.items():
        enum = FILE.enum_types_by_name[name]
        assert [(v.name, v.number) for v in enum.values] == values, name


def test_value_zero_is_the_unspecified_default():
    for name, values in RULED_ENUMS.items():
        zero = FILE.enum_types_by_name[name].values_by_number[0].name
        assert zero == values[0][0] and zero.startswith("UNSPECIFIED_"), name


def test_unset_elections_read_back_every_default():
    decoded = ELECTIONS.FromString(ELECTIONS().SerializeToString())
    assert decoded.bond_premium == 0
    assert decoded.market_discount_inclusion == 0
    assert decoded.market_discount_accrual == 0
    assert not decoded.HasField("effective_from")


def test_elections_are_enums_in_one_message():
    proto = descriptor_pb2.FileDescriptorProto()
    FILE.CopyToProto(proto)
    assert [m.name for m in proto.message_type] == ["AmortisationElectionsProto"]
    message = proto.message_type[0]
    assert not message.nested_type, "no map entry or second message"
    assert all(f.type != descriptor_pb2.FieldDescriptorProto.TYPE_BOOL for f in message.field)
    assert all(f.label != descriptor_pb2.FieldDescriptorProto.LABEL_REPEATED for f in message.field)


def test_no_book_elections():
    names = [ELECTIONS.DESCRIPTOR.name] + [f.name for f in ELECTIONS.DESCRIPTOR.fields]
    for enum in FILE.enum_types_by_name.values():
        names += [enum.name] + [v.name for v in enum.values]
    for name in names:
        assert not any(word in name.upper() for word in ("GAAP", "IFRS", "BOOK")), name


def test_portfolio_and_request_carry_the_elections():
    portfolio = portfolio_pb2.PortfolioProto.DESCRIPTOR.fields_by_number[11]
    assert portfolio.name == "amortisation_elections"
    assert portfolio.message_type.full_name == ELECTIONS_NAME
    request = valuation_request_pb2.ValuationRequestProto.DESCRIPTOR.fields_by_number[26]
    assert request.name == "amortisation_elections"
    assert request.message_type.full_name == ELECTIONS_NAME
    assert request.label == FieldDescriptor.LABEL_OPTIONAL


def test_request_carries_repeated_typed_lots():
    lots = valuation_request_pb2.ValuationRequestProto.DESCRIPTOR.fields_by_number[27]
    assert lots.name == "tax_lots"
    assert lots.label == FieldDescriptor.LABEL_REPEATED
    # Found through field 27, wherever the message is declared.
    lot = lots.message_type
    assert lot.name == "TaxLotInputProto"
    assert [f.name for f in lot.fields] == ["trade_date", "settlement_date", "quantity", "price"]


def test_24_and_25_stay_reserved():
    proto = descriptor_pb2.DescriptorProto()
    valuation_request_pb2.ValuationRequestProto.DESCRIPTOR.CopyToProto(proto)
    reserved = {n for r in proto.reserved_range for n in range(r.start, r.end)}
    assert sorted(f["number"] for f in REMOVED) == [24, 25]
    assert {24, 25} <= reserved
    assert {f["name"] for f in REMOVED} <= set(proto.reserved_name)
    assert not {24, 25} & {f.number for f in proto.field}
