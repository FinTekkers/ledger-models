"""AmortisationElectionsProto and its three enums are exactly as ruled for
LM-364 (VS-110), value 0 of each enum means "use the default", and the
elections ride on PortfolioProto.amortisation_elections = 11. One message of
enums: no bools, no key/value bag, no effective date, no book elections, and
no object_type/version, since it is a nested value (LM-318).
"""
from google.protobuf import descriptor_pb2
from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.portfolio import amortisation_elections_pb2, portfolio_pb2

FILE = amortisation_elections_pb2.DESCRIPTOR
ELECTIONS = amortisation_elections_pb2.AmortisationElectionsProto
ELECTIONS_NAME = "fintekkers.models.portfolio.AmortisationElectionsProto"

# The ruled fields: number -> (name, enum type name).
RULED_FIELDS = {
    10: ("bond_premium", "fintekkers.models.portfolio.PremiumAmortisationElectionProto"),
    11: ("market_discount_inclusion", "fintekkers.models.portfolio.MarketDiscountInclusionProto"),
    12: ("market_discount_accrual", "fintekkers.models.portfolio.MarketDiscountAccrualMethodProto"),
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


def test_file_defines_the_elections_message_and_three_enums():
    assert FILE.name == "fintekkers/models/portfolio/amortisation_elections.proto"
    assert FILE.package == "fintekkers.models.portfolio"
    assert list(FILE.message_types_by_name) == ["AmortisationElectionsProto"]
    assert sorted(FILE.enum_types_by_name) == sorted(RULED_ENUMS)
    assert FILE.GetOptions().java_outer_classname == "AmortisationElectionsProtos"


def test_elections_fields_are_as_ruled():
    fields = {f.number: (f.name, f.enum_type.full_name) for f in ELECTIONS.DESCRIPTOR.fields}
    assert fields == RULED_FIELDS


def test_enums_are_as_ruled():
    for name, values in RULED_ENUMS.items():
        enum = FILE.enum_types_by_name[name]
        assert [(v.name, v.number) for v in enum.values] == values, name


def test_every_elections_field_is_a_single_enum():
    proto = descriptor_pb2.FileDescriptorProto()
    FILE.CopyToProto(proto)
    assert [m.name for m in proto.message_type] == ["AmortisationElectionsProto"]
    message = proto.message_type[0]
    assert not message.nested_type, "no map entry or second message"
    for field in message.field:
        assert field.type == descriptor_pb2.FieldDescriptorProto.TYPE_ENUM, field.name
        assert field.label != descriptor_pb2.FieldDescriptorProto.LABEL_REPEATED, field.name


def test_elections_have_no_stamp():
    names = set(ELECTIONS.DESCRIPTOR.fields_by_name)
    assert not names & {"object_type", "version"}
    assert not {1, 2} & set(ELECTIONS.DESCRIPTOR.fields_by_number)


def test_no_book_elections():
    names = [ELECTIONS.DESCRIPTOR.name] + [f.name for f in ELECTIONS.DESCRIPTOR.fields]
    for enum in FILE.enum_types_by_name.values():
        names += [enum.name] + [v.name for v in enum.values]
    for name in names:
        assert not any(word in name.upper() for word in ("GAAP", "IFRS", "BOOK")), name


def test_unset_elections_read_back_every_default():
    decoded = ELECTIONS.FromString(ELECTIONS().SerializeToString())
    assert decoded.bond_premium == amortisation_elections_pb2.UNSPECIFIED_PREMIUM_ELECTION
    assert decoded.market_discount_inclusion == amortisation_elections_pb2.UNSPECIFIED_MARKET_DISCOUNT_INCLUSION
    assert decoded.market_discount_accrual == amortisation_elections_pb2.UNSPECIFIED_ACCRUAL_METHOD


def test_portfolio_carries_the_elections_on_11():
    field = portfolio_pb2.PortfolioProto.DESCRIPTOR.fields_by_number[11]
    assert field.name == "amortisation_elections"
    assert field.message_type.full_name == ELECTIONS_NAME
    assert field.label == FieldDescriptor.LABEL_OPTIONAL
