"""LM-441: get_field(MATURITY_DATE) / get_field(ISSUE_DATE) report an unset
date as None, never a placeholder such as 2999-12-31 or 1900-01-01. Bonds
keep their real dates."""

from datetime import date

import pytest

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto

from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.floating_rate_note import FloatingRateNote
from fintekkers.wrappers.models.security.index_security import IndexSecurity
from fintekkers.wrappers.models.security.mortgage_backed_security import MortgageBackedSecurity
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.security.tips_bond import TIPSBond

_PLACEHOLDERS = (date(2999, 12, 31), date(1900, 1, 1))
_ISSUE = date(2024, 5, 15)
_MATURITY = date(2034, 5, 15)


def _local_date(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def _proto(product_type, with_bond_details=False, with_dates=False) -> SecurityProto:
    proto = SecurityProto(product_type=product_type)
    if with_bond_details:
        proto.bond_details.SetInParent()
    if with_dates:
        proto.bond_details.issue_date.CopyFrom(_local_date(_ISSUE))
        proto.bond_details.maturity_date.CopyFrom(_local_date(_MATURITY))
    return proto


# Python has no EquitySecurity / CashSecurity: plain Security stands in.
_NON_BONDS = [
    ("stock", Security, ProductTypeProto.COMMON_STOCK),
    ("index", IndexSecurity, ProductTypeProto.EQUITY_INDEX),
    ("cash", Security, ProductTypeProto.CURRENCY),
    ("fx_spot", Security, ProductTypeProto.FX_SPOT),
    ("crypto", Security, ProductTypeProto.CRYPTOCURRENCY),
]


@pytest.mark.parametrize("name,cls,product_type", _NON_BONDS)
@pytest.mark.parametrize("with_bond_details", [False, True])
def test_non_bond_dates_are_absent(name, cls, product_type, with_bond_details):
    security = cls(_proto(product_type, with_bond_details=with_bond_details))
    for field in (FieldProto.MATURITY_DATE, FieldProto.ISSUE_DATE):
        value = security.get_field(field)
        assert value is None
        assert value not in _PLACEHOLDERS


@pytest.mark.parametrize("product_type", [ProductTypeProto.FX_SPOT, ProductTypeProto.CRYPTOCURRENCY])
def test_plain_security_with_dates_returns_them(product_type):
    security = Security(_proto(product_type, with_dates=True))
    assert security.get_field(FieldProto.MATURITY_DATE) == _MATURITY
    assert security.get_field(FieldProto.ISSUE_DATE) == _ISSUE


@pytest.mark.parametrize(
    "cls,product_type",
    [
        (BondSecurity, ProductTypeProto.TREASURY_NOTE),
        (TIPSBond, ProductTypeProto.TIPS),
        (FloatingRateNote, ProductTypeProto.TREASURY_FRN),
        (MortgageBackedSecurity, ProductTypeProto.MORTGAGE_BACKED),
    ],
)
def test_bond_dates_unchanged(cls, product_type):
    security = cls(_proto(product_type, with_dates=True))
    assert security.get_field(FieldProto.MATURITY_DATE) == _MATURITY
    assert security.get_field(FieldProto.ISSUE_DATE) == _ISSUE
    assert security.get_maturity_date() == _MATURITY
    assert security.get_issue_date() == _ISSUE


def test_bond_with_no_maturity_returns_none_not_value_error():
    bond = BondSecurity(_proto(ProductTypeProto.TREASURY_NOTE, with_bond_details=True))
    assert bond.get_field(FieldProto.MATURITY_DATE) is None
    assert bond.get_field(FieldProto.ISSUE_DATE) is None


def test_required_getters_still_raise_for_non_bonds():
    security = Security(_proto(ProductTypeProto.COMMON_STOCK))
    with pytest.raises(ValueError):
        security.get_maturity_date()
    with pytest.raises(ValueError):
        security.get_issue_date()


def test_position_with_unset_date_entry_does_not_raise():
    proto = PositionProto(fields=[FieldMapEntry(field=FieldProto.MATURITY_DATE)])
    position = Position(proto)
    assert position.get_field_value(FieldProto.MATURITY_DATE) is None
    assert position.get_field_display(FieldMapEntry(field=FieldProto.MATURITY_DATE)) == ""
    assert str(position) == "MATURITY_DATE,;"
