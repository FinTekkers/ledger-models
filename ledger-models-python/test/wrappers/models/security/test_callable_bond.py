"""LM-465: a bond carries callable and its first call_date. The call date is
never the maturity date: maturity_date and get_field(MATURITY_DATE) stay the
legal final maturity."""

from datetime import date

import pytest

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto

from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.index_security import IndexSecurity
from fintekkers.wrappers.models.security.security import Security

# 912810CK2, 10 3/8% Bonds of 2004-2009: called 2004-11-15, legal maturity 2009-11-15.
_CALL_DATE = date(2004, 11, 15)
_MATURITY = date(2009, 11, 15)
_EPOCH = date(1970, 1, 1)


def _local_date(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def _bond(callable_: bool) -> SecurityProto:
    proto = SecurityProto(product_type=ProductTypeProto.TREASURY_BOND, issuer_name="US Treasury")
    proto.identifiers.append(
        IdentifierProto(identifier_type=IdentifierTypeProto.CUSIP, identifier_value="912810CK2"))
    proto.bond_details.maturity_date.CopyFrom(_local_date(_MATURITY))
    if callable_:
        proto.bond_details.callable = True
        proto.bond_details.call_date.CopyFrom(_local_date(_CALL_DATE))
    return proto


def _rewrap(security: Security) -> BondSecurity:
    """Serializes the wrapper's proto, parses the bytes and wraps them again."""
    return BondSecurity(SecurityProto.FromString(security.proto.SerializeToString()))


def test_callable_bond_wire_round_trip_keeps_all_three_values():
    decoded = SecurityProto.FromString(_bond(True).SerializeToString())
    assert decoded.bond_details.callable is True
    assert decoded.bond_details.HasField("call_date")

    bond = BondSecurity(decoded)
    assert bond.is_callable() is True
    assert bond.get_call_date() == _CALL_DATE
    assert bond.get_maturity_date() == _MATURITY


def test_callable_bond_resaved_through_wrapper_keeps_all_three_values():
    bond = _rewrap(BondSecurity(_bond(True)))
    assert bond.is_callable() is True
    assert bond.get_call_date() == _CALL_DATE
    assert bond.get_maturity_date() == _MATURITY


def test_get_field_maturity_date_is_the_legal_maturity_not_the_call_date():
    bond = _rewrap(BondSecurity(_bond(True)))
    assert bond.get_field(FieldProto.MATURITY_DATE) == _MATURITY
    assert bond.get_field(FieldProto.MATURITY_DATE) != _CALL_DATE


def test_non_callable_bond_round_trip_call_date_unset():
    decoded = SecurityProto.FromString(_bond(False).SerializeToString())
    assert decoded.bond_details.callable is False
    assert not decoded.bond_details.HasField("call_date")

    bond = _rewrap(BondSecurity(decoded))
    assert bond.is_callable() is False
    assert bond.get_call_date() is None
    assert bond.get_call_date() != _EPOCH
    assert bond.get_maturity_date() == _MATURITY


@pytest.mark.parametrize(
    "cls,product_type",
    [
        (Security, ProductTypeProto.COMMON_STOCK),
        (Security, ProductTypeProto.CURRENCY),
        (IndexSecurity, ProductTypeProto.EQUITY_INDEX),
    ],
)
def test_non_bond_security_is_not_callable_and_has_no_call_date(cls, product_type):
    security = cls(SecurityProto.FromString(SecurityProto(product_type=product_type).SerializeToString()))
    assert security.is_callable() is False
    assert security.get_call_date() is None
