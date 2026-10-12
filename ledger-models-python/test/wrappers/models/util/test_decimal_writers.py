"""LM-305, metric 5: every decimal Python writes sets both forms until
LM-295 (bytes + scale, and the canonical arbitrary_precision_value string),
and floats are refused at every public writer (lossless guardrail)."""
import re
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import pytest
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.coupon_frequency_pb2 import CouponFrequencyProto
from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.product_type_pb2 import TREASURY_FRN, TREASURY_NOTE
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.floating_rate_note import FloatingRateNote
from fintekkers.wrappers.models.security.mortgage_backed_security import MortgageBackedSecurity
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.security.tips_bond import TIPSBond
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.decimal import decode_decimal
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.requests.price import CreatePriceRequest
from fintekkers.wrappers.requests.security import CreateSecurityRequest
from fintekkers.wrappers.requests.transaction import CreateTransactionRequest

V = Decimal("1.50")
AS_OF = datetime(2024, 1, 2, 10, 0, 0)
SECURITY = SecurityProto(product_type=TREASURY_NOTE)


def _bond(v):
    return BondSecurity.from_pricer_inputs(
        face_value=v, coupon_rate=v, coupon_type=CouponTypeProto.FIXED,
        coupon_frequency=CouponFrequencyProto.SEMIANNUALLY,
        issue_date=date(2020, 1, 1), maturity_date=date(2030, 1, 1))


def _mbs(v):
    return MortgageBackedSecurity.from_pricer_inputs(
        face_value=v, coupon_rate=v, coupon_type=CouponTypeProto.FIXED,
        coupon_frequency=CouponFrequencyProto.MONTHLY,
        issue_date=date(2020, 1, 1), maturity_date=date(2050, 1, 1),
        pool_number="P", agency=1, wac=v, wam=358, pass_through_rate=v,
        current_factor=v, original_face_value=v, current_upb=v, psa_speed=v)


def _frn(v):
    return FloatingRateNote.from_pricer_inputs(
        face_value=v, coupon_rate=v, coupon_type=CouponTypeProto.FLOAT,
        coupon_frequency=CouponFrequencyProto.QUARTERLY,
        issue_date=date(2020, 1, 1), maturity_date=date(2030, 1, 1),
        spread=v, reference_rate_index=0, reset_frequency=0)


def _tips(v):
    return TIPSBond.from_pricer_inputs(
        face_value=v, coupon_rate=v, coupon_type=CouponTypeProto.FIXED,
        coupon_frequency=CouponFrequencyProto.SEMIANNUALLY,
        issue_date=date(2020, 1, 1), maturity_date=date(2030, 1, 1),
        base_cpi=v, index_date=date(2020, 1, 1), inflation_index_type=0)


def _ust(v):
    return CreateSecurityRequest.create_ust_security_request(
        cusip="X", cash_security=SecurityProto(), product_type=TREASURY_FRN,
        coupon_rate=v, spread=v, face_value=v,
        post_auction_outstanding_quantity=v, auction_total_accepted=v,
        auction_announcement_date=date(2020, 1, 1)).proto.security_input


def _bond_decimals(s: SecurityProto) -> list[DecimalValueProto]:
    return [s.bond_details.face_value, s.bond_details.coupon_rate]


# name -> (build(value), decimals written)
WRITERS = {
    "ProtoSerializationUtil.serialize": (
        ProtoSerializationUtil.serialize, lambda d: [d]),
    "Transaction.create_from": (
        lambda v: Transaction.create_from(price=v, quantity=v, as_of=AS_OF).proto,
        lambda t: [t.price.price, t.quantity]),
    "BondSecurity.from_pricer_inputs": (_bond, _bond_decimals),
    "MortgageBackedSecurity.from_pricer_inputs": (
        _mbs, lambda s: _bond_decimals(s) + [
            s.mbs_extension.wac, s.mbs_extension.pass_through_rate,
            s.mbs_extension.current_factor, s.mbs_extension.original_face_value,
            s.mbs_extension.current_upb, s.mbs_extension.psa_speed]),
    "FloatingRateNote.from_pricer_inputs": (
        _frn, lambda s: _bond_decimals(s) + [s.frn_extension.spread]),
    "TIPSBond.from_pricer_inputs": (
        _tips, lambda s: _bond_decimals(s) + [s.tips_extension.base_cpi]),
    "Price.create_price": (
        lambda v: Price.create_price(Security(SECURITY), v, Timestamp()).proto,
        lambda p: [p.price]),
    "CreatePriceRequest.create_price_request": (
        lambda v: CreatePriceRequest.create_price_request(SECURITY, v).proto,
        lambda r: [r.create_price_input.price]),
    "CreatePriceRequest.create_or_update_request": (
        lambda v: CreatePriceRequest.create_or_update_request(SECURITY, v, AS_OF).proto,
        lambda r: [r.create_price_input.price]),
    "CreateSecurityRequest.create_ust_security_request": (
        _ust, lambda s: _bond_decimals(s) + [
            s.frn_extension.spread,
            s.bond_details.issuance_info[0].total_accepted,
            s.bond_details.issuance_info[0].post_auction_outstanding_quantity]),
    "CreateTransactionRequest.create_transaction_request": (
        lambda v: CreateTransactionRequest.create_transaction_request(
            price=v, quantity=v, as_of=AS_OF).proto.create_transaction_input,
        lambda t: [t.price.price, t.quantity]),
}


@pytest.mark.parametrize("name", list(WRITERS))
def test_writer_sets_both_forms(name):
    build, decimals = WRITERS[name]

    written = decimals(build(V))

    assert written
    for d in written:
        assert d.arbitrary_precision_value == "1.50"
        assert d.unscaled_value == b"\x00\x96"
        assert d.scale == 2
        # The string and compact forms decode to equal values.
        string_only = DecimalValueProto(arbitrary_precision_value=d.arbitrary_precision_value)
        compact_only = DecimalValueProto(unscaled_value=d.unscaled_value, scale=d.scale)
        assert decode_decimal(string_only).as_tuple() == decode_decimal(compact_only).as_tuple()


@pytest.mark.parametrize("name", list(WRITERS))
def test_writer_rejects_float(name):
    build, _ = WRITERS[name]

    with pytest.raises(TypeError):
        build(1.5)


def test_default_transaction_price_writes_both_forms():
    txn = Transaction.create_from(as_of=AS_OF).proto

    assert txn.price.price.arbitrary_precision_value == "-100.00"
    assert decode_decimal(txn.price.price) == Decimal("-100.00")
    assert txn.quantity.arbitrary_precision_value == "100"
    assert txn.quantity.unscaled_value == b"\x64"


def test_price_journey_round_trips_through_bytes():
    written = Price.create_price(Security(SECURITY), Decimal("100.25"), Timestamp()).proto

    parsed = PriceProto.FromString(written.SerializeToString())
    got = Price(parsed).get_price()

    assert isinstance(got, Decimal)
    assert got.as_tuple() == Decimal("100.25").as_tuple()

    string_only = PriceProto()
    string_only.CopyFrom(parsed)
    string_only.price.ClearField("unscaled_value")
    string_only.price.ClearField("scale")
    assert Price(string_only).get_price().as_tuple() == got.as_tuple()

    compact_only = PriceProto()
    compact_only.CopyFrom(parsed)
    compact_only.price.ClearField("arbitrary_precision_value")
    assert Price(compact_only).get_price().as_tuple() == got.as_tuple()


# Only the codec writes the deprecated string or builds a DecimalValueProto,
# so every future writer sets both forms too.
_PACKAGE = Path(__file__).resolve().parents[4] / "fintekkers"
_CODEC = _PACKAGE / "wrappers" / "models" / "util" / "decimal.py"
_FORBIDDEN = re.compile(
    r"arbitrary_precision_value\s*=(?!=)"     # field 10 assigned (kwarg or attribute)
    r"|DecimalValueProto\(\s*[^)\s]"          # DecimalValueProto built with arguments
)


def test_only_the_codec_writes_decimals():
    assert _CODEC.is_file()
    sources = [p for p in _PACKAGE.rglob("*.py") if "_pb2" not in p.name and p != _CODEC]
    assert len(sources) > 20

    offenders = [
        f"{p.relative_to(_PACKAGE)}:{n}: {line.strip()}"
        for p in sources
        for n, line in enumerate(p.read_text().splitlines(), 1)
        if not line.lstrip().startswith("#") and _FORBIDDEN.search(line)
    ]

    assert offenders == []
