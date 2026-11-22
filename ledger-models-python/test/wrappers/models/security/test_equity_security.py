"""LM-479: EquityDetailsProto.shares_outstanding round-trips, stays absent
when unset, and EquitySecurity.get_shares_outstanding never reports absent
as 0."""

from decimal import Decimal

from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import EquityDetailsProto, SecurityProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.wrappers.models.security.equity_security import EquitySecurity
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

ONE_BILLION = Decimal(1_000_000_000)


def _etf(details=None) -> SecurityProto:
    proto = SecurityProto(product_type=ProductTypeProto.ETF)
    if details is not None:
        proto.equity_details.CopyFrom(details)
    return proto


def _round_trip(proto: SecurityProto) -> SecurityProto:
    return SecurityProto.FromString(proto.SerializeToString())


def test_shares_outstanding_round_trips_through_bytes():
    proto = _etf(EquityDetailsProto(shares_outstanding=encode_decimal(ONE_BILLION)))

    parsed = _round_trip(proto)

    assert parsed.WhichOneof("non_bond_details") == "equity_details"
    assert parsed.equity_details.HasField("shares_outstanding")
    assert decode_decimal(parsed.equity_details.shares_outstanding) == ONE_BILLION


def test_unset_shares_outstanding_stays_absent_after_round_trip():
    parsed = _round_trip(_etf(EquityDetailsProto()))

    assert parsed.WhichOneof("non_bond_details") == "equity_details"
    assert not parsed.equity_details.HasField("shares_outstanding")


def test_getter_returns_value_after_serialize_parse_wrap():
    proto = _etf(EquityDetailsProto(shares_outstanding=encode_decimal(ONE_BILLION)))

    assert EquitySecurity(_round_trip(proto)).get_shares_outstanding() == ONE_BILLION


def test_getter_returns_none_when_field_absent_after_round_trip():
    security = EquitySecurity(_round_trip(_etf(EquityDetailsProto())))

    assert security.get_shares_outstanding() is None


def test_getter_returns_none_when_equity_details_absent():
    security = EquitySecurity(_round_trip(_etf()))

    assert security.get_shares_outstanding() is None


def test_getter_returns_none_for_present_but_empty_decimal():
    proto = _etf(EquityDetailsProto(shares_outstanding=DecimalValueProto()))
    parsed = _round_trip(proto)
    assert parsed.equity_details.HasField("shares_outstanding")

    assert EquitySecurity(parsed).get_shares_outstanding() is None
