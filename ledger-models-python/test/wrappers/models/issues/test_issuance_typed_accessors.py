"""Tests for the per-row Issuance wrapper's typed accessors.

Builds an IssuanceProto with the eight fields exposed by the wrapper and
asserts each accessor decodes the matching proto field. Unset-field
behaviour is checked separately via an empty IssuanceProto.
"""

from datetime import date
from decimal import Decimal

from fintekkers.models.security.bond.auction_type_pb2 import AuctionTypeProto
from fintekkers.models.security.bond.issuance_pb2 import IssuanceProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto

from fintekkers.wrappers.models.issues.issuance import Issuance


def _decimal_value(dec: Decimal) -> DecimalValueProto:
    return DecimalValueProto(arbitrary_precision_value=str(dec))


def _local_date(d: date) -> LocalDateProto:
    return LocalDateProto(year=d.year, month=d.month, day=d.day)


def test_typed_accessors_decode_all_fields():
    issue_date = date(2024, 5, 31)
    announcement_date = date(2024, 5, 24)
    offering = Decimal("70000000000")
    accepted = Decimal("69999800000")
    outstanding = Decimal("420000000000")
    matured = Decimal("70000000000")
    price = Decimal("99.873421")

    proto = IssuanceProto(
        auction_issue_date=_local_date(issue_date),
        auction_announcement_date=_local_date(announcement_date),
        auction_offering_amount=_decimal_value(offering),
        total_accepted=_decimal_value(accepted),
        post_auction_outstanding_quantity=_decimal_value(outstanding),
        mature_security_amount=_decimal_value(matured),
        price_for_single_price_auction=_decimal_value(price),
        auction_type=AuctionTypeProto.SINGLE_PRICE,
    )

    wrapper = Issuance(proto)

    assert wrapper.get_issue_date() == issue_date
    assert wrapper.get_announcement_date() == announcement_date
    assert wrapper.get_original_face_value() == offering
    assert wrapper.get_total_accepted() == accepted
    assert wrapper.get_post_auction_outstanding_quantity() == outstanding
    assert wrapper.get_mature_security_amount() == matured
    assert wrapper.get_price_for_single_price_auction() == price
    assert wrapper.get_auction_type() == AuctionTypeProto.SINGLE_PRICE


def test_unset_fields_return_none_or_unknown():
    wrapper = Issuance(IssuanceProto())

    assert wrapper.get_issue_date() is None
    assert wrapper.get_announcement_date() is None
    assert wrapper.get_original_face_value() is None
    assert wrapper.get_total_accepted() is None
    assert wrapper.get_post_auction_outstanding_quantity() is None
    assert wrapper.get_mature_security_amount() is None
    assert wrapper.get_price_for_single_price_auction() is None
    # auction_type is a scalar enum — unset reads as the zero value.
    assert wrapper.get_auction_type() == AuctionTypeProto.UNKNOWN_AUCTION_TYPE
