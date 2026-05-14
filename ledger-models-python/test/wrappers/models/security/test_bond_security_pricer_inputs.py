"""Tests for the BondSecurity / TIPSBond / FloatingRateNote pricer-input
builders. Each builder returns a SecurityProto with the proper sub-message
populated; serialize/deserialize is exercised to confirm the message is wire
valid."""

from datetime import date
from decimal import Decimal

from fintekkers.models.security.coupon_frequency_pb2 import CouponFrequencyProto
from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto

from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.floating_rate_note import FloatingRateNote
from fintekkers.wrappers.models.security.tips_bond import TIPSBond


_FACE = Decimal("1000.00")
_COUPON = Decimal("0.045")
_ISSUE = date(2024, 5, 15)
_MATURITY = date(2034, 5, 15)


def _assert_bond_details_match(proto: SecurityProto) -> None:
    assert proto.HasField("bond_details")
    bd = proto.bond_details
    assert bd.coupon_type == CouponTypeProto.FIXED
    assert bd.coupon_frequency == CouponFrequencyProto.SEMIANNUALLY
    assert bd.coupon_rate.arbitrary_precision_value == str(_COUPON)
    assert bd.face_value.arbitrary_precision_value == str(_FACE)
    assert (bd.issue_date.year, bd.issue_date.month, bd.issue_date.day) == (
        _ISSUE.year,
        _ISSUE.month,
        _ISSUE.day,
    )
    assert (
        bd.maturity_date.year,
        bd.maturity_date.month,
        bd.maturity_date.day,
    ) == (_MATURITY.year, _MATURITY.month, _MATURITY.day)


def test_bond_security_from_pricer_inputs():
    proto = BondSecurity.from_pricer_inputs(
        face_value=_FACE,
        coupon_rate=_COUPON,
        coupon_type=CouponTypeProto.FIXED,
        coupon_frequency=CouponFrequencyProto.SEMIANNUALLY,
        issue_date=_ISSUE,
        maturity_date=_MATURITY,
    )
    assert proto.product_type == ProductTypeProto.TREASURY_NOTE
    _assert_bond_details_match(proto)
    # No TIPS/FRN extensions set on a plain bond.
    assert not proto.HasField("tips_extension")
    assert not proto.HasField("frn_extension")

    # Wire round-trip.
    parsed = SecurityProto.FromString(proto.SerializeToString())
    assert parsed == proto


def test_tips_bond_from_pricer_inputs():
    base_cpi = Decimal("256.394")
    index_date = date(2024, 5, 1)

    proto = TIPSBond.from_pricer_inputs(
        face_value=_FACE,
        coupon_rate=_COUPON,
        coupon_type=CouponTypeProto.FIXED,
        coupon_frequency=CouponFrequencyProto.SEMIANNUALLY,
        issue_date=_ISSUE,
        maturity_date=_MATURITY,
        base_cpi=base_cpi,
        index_date=index_date,
        inflation_index_type=IndexTypeProto.CPI_U,
    )
    assert proto.product_type == ProductTypeProto.TIPS
    _assert_bond_details_match(proto)
    assert proto.HasField("tips_extension")
    ext = proto.tips_extension
    assert ext.base_cpi.arbitrary_precision_value == str(base_cpi)
    assert (ext.index_date.year, ext.index_date.month, ext.index_date.day) == (
        index_date.year,
        index_date.month,
        index_date.day,
    )
    assert ext.inflation_index_type == IndexTypeProto.CPI_U

    parsed = SecurityProto.FromString(proto.SerializeToString())
    assert parsed == proto

    # Wrapper accessors round-trip.
    wrapped = TIPSBond(parsed)
    assert wrapped.get_base_cpi() == base_cpi
    assert wrapped.get_index_date() == index_date
    assert wrapped.get_inflation_index_type() == IndexTypeProto.CPI_U


def test_floating_rate_note_from_pricer_inputs():
    spread = Decimal("0.0015")

    proto = FloatingRateNote.from_pricer_inputs(
        face_value=_FACE,
        coupon_rate=_COUPON,
        coupon_type=CouponTypeProto.FLOAT,
        coupon_frequency=CouponFrequencyProto.QUARTERLY,
        issue_date=_ISSUE,
        maturity_date=_MATURITY,
        spread=spread,
        reference_rate_index=IndexTypeProto.SOFR,
        reset_frequency=CouponFrequencyProto.QUARTERLY,
    )
    assert proto.product_type == ProductTypeProto.TREASURY_FRN

    # bond_details still carries the shared shape, but with FLOAT/QUARTERLY.
    assert proto.HasField("bond_details")
    bd = proto.bond_details
    assert bd.coupon_type == CouponTypeProto.FLOAT
    assert bd.coupon_frequency == CouponFrequencyProto.QUARTERLY
    assert bd.coupon_rate.arbitrary_precision_value == str(_COUPON)
    assert bd.face_value.arbitrary_precision_value == str(_FACE)

    assert proto.HasField("frn_extension")
    ext = proto.frn_extension
    assert ext.spread.arbitrary_precision_value == str(spread)
    assert ext.reference_rate_index == IndexTypeProto.SOFR
    assert ext.reset_frequency == CouponFrequencyProto.QUARTERLY

    parsed = SecurityProto.FromString(proto.SerializeToString())
    assert parsed == proto

    wrapped = FloatingRateNote(parsed)
    assert wrapped.get_spread() == spread
    assert wrapped.get_reference_rate_index() == IndexTypeProto.SOFR
    assert wrapped.get_reset_frequency() == CouponFrequencyProto.QUARTERLY
