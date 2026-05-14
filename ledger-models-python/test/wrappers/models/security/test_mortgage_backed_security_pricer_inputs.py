"""Tests for the MortgageBackedSecurity pricer-input builder and typed
accessors. The builder returns a SecurityProto with bond_details and
mbs_extension populated; serialize/deserialize is exercised to confirm the
message is wire valid and the typed accessors read back the same values.
"""

from datetime import date
from decimal import Decimal

from fintekkers.models.security.bond.agency_pb2 import AgencyProto
from fintekkers.models.security.coupon_frequency_pb2 import CouponFrequencyProto
from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto

from fintekkers.wrappers.models.security.mortgage_backed_security import (
    MortgageBackedSecurity,
)


_FACE = Decimal("1000.00")
_COUPON = Decimal("0.04")
_ISSUE = date(2020, 1, 1)
_MATURITY = date(2050, 1, 1)

_POOL_NUMBER = "FN AS1234"
_AGENCY = AgencyProto.FNMA
_WAC = Decimal("0.045")
_WAM = 358
_PASS_THROUGH_RATE = Decimal("0.04")
_CURRENT_FACTOR = Decimal("0.95")
_ORIGINAL_FACE_VALUE = Decimal("250000000")
_CURRENT_UPB = Decimal("237500000")
_PSA_SPEED = Decimal("150")


def _build_proto() -> SecurityProto:
    return MortgageBackedSecurity.from_pricer_inputs(
        face_value=_FACE,
        coupon_rate=_COUPON,
        coupon_type=CouponTypeProto.FIXED,
        coupon_frequency=CouponFrequencyProto.MONTHLY,
        issue_date=_ISSUE,
        maturity_date=_MATURITY,
        pool_number=_POOL_NUMBER,
        agency=_AGENCY,
        wac=_WAC,
        wam=_WAM,
        pass_through_rate=_PASS_THROUGH_RATE,
        current_factor=_CURRENT_FACTOR,
        original_face_value=_ORIGINAL_FACE_VALUE,
        current_upb=_CURRENT_UPB,
        psa_speed=_PSA_SPEED,
    )


def test_mbs_from_pricer_inputs_populates_bond_details_and_mbs_extension():
    proto = _build_proto()

    assert proto.product_type == ProductTypeProto.MORTGAGE_BACKED

    assert proto.HasField("bond_details")
    bd = proto.bond_details
    assert bd.coupon_type == CouponTypeProto.FIXED
    assert bd.coupon_frequency == CouponFrequencyProto.MONTHLY
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

    assert proto.HasField("mbs_extension")
    ext = proto.mbs_extension
    assert ext.pool_number == _POOL_NUMBER
    assert ext.agency == _AGENCY
    assert ext.wac.arbitrary_precision_value == str(_WAC)
    assert ext.wam == _WAM
    assert ext.pass_through_rate.arbitrary_precision_value == str(_PASS_THROUGH_RATE)
    assert ext.current_factor.arbitrary_precision_value == str(_CURRENT_FACTOR)
    assert ext.original_face_value.arbitrary_precision_value == str(_ORIGINAL_FACE_VALUE)
    assert ext.current_upb.arbitrary_precision_value == str(_CURRENT_UPB)
    assert ext.psa_speed.arbitrary_precision_value == str(_PSA_SPEED)

    # No TIPS / FRN extensions on an MBS.
    assert not proto.HasField("tips_extension")
    assert not proto.HasField("frn_extension")


def test_mbs_round_trips_through_security_proto_bytes():
    proto = _build_proto()

    parsed = SecurityProto.FromString(proto.SerializeToString())
    assert parsed == proto


def test_mortgage_backed_security_typed_accessors_read_back():
    proto = _build_proto()
    parsed = SecurityProto.FromString(proto.SerializeToString())

    wrapped = MortgageBackedSecurity(parsed)

    assert wrapped.get_pool_number() == _POOL_NUMBER
    assert wrapped.get_agency() == _AGENCY
    assert wrapped.get_wac() == _WAC
    assert wrapped.get_wam() == _WAM
    assert wrapped.get_pass_through_rate() == _PASS_THROUGH_RATE
    assert wrapped.get_current_factor() == _CURRENT_FACTOR
    assert wrapped.get_original_face_value() == _ORIGINAL_FACE_VALUE
    assert wrapped.get_current_upb() == _CURRENT_UPB
    assert wrapped.get_psa_speed() == _PSA_SPEED
