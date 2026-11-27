"""LM-508: PriceProto bid / ask / mid. Driven by
test-fixtures/price/lm-508-cases.json, which the Java, JS and Rust tests share.
Values compare as canonical plain strings (format(d, 'f')), so a scale or
precision drift fails.
"""
import json
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Optional
from uuid import UUID

import pytest
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.position.position_status_pb2 import PositionStatusProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models import price_rules
from fintekkers.wrappers.models.errors import ModelValidationError
from fintekkers.wrappers.models.price import Price, PriceKind
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.decimal import decode_decimal, encode_decimal

REPO_ROOT = Path(__file__).resolve().parents[4]
CASES = json.loads((REPO_ROOT / "test-fixtures" / "price" / "lm-508-cases.json").read_text())
LEGACY = CASES["legacy"]
AS_OF = Timestamp(seconds=LEGACY["as_of_seconds"])


def _side(case: dict, key: str) -> Optional[Decimal]:
    return Decimal(case[key]) if key in case else None


def _quote(case: dict) -> Price:
    return Price.create_quote(None, AS_OF, mid=_side(case, "mid"), bid=_side(case, "bid"), ask=_side(case, "ask"),
                              price_type=PriceTypeProto.PERCENTAGE)


def _plain(value: Optional[Decimal]) -> Optional[str]:
    return None if value is None else format(value, "f")


def test_legacy_bytes_read_as_mid():
    proto = PriceProto.FromString(bytes.fromhex(LEGACY["hex"]))

    assert format(decode_decimal(proto.mid), "f") == LEGACY["mid"]
    assert not proto.HasField("bid")
    assert not proto.HasField("ask")
    price = Price(proto)
    assert format(price.get_price(), "f") == "99.5"
    assert price.get_price_kind() is PriceKind.MID
    assert format(price.get_mid(), "f") == "99.5"
    assert price.get_bid() is None
    assert price.get_ask() is None


def test_one_number_helper_rebuilds_legacy_bytes_exactly():
    security = Security(SecurityProto(uuid=UUIDProto(raw_uuid=UUID(LEGACY["security_uuid"]).bytes)))
    proto = Price.create_price(security, Decimal("99.5"), AS_OF).proto
    proto.uuid.raw_uuid = UUID(LEGACY["uuid"]).bytes
    proto.price_type = PriceTypeProto.PERCENTAGE

    assert proto.SerializeToString().hex() == LEGACY["hex"]


@pytest.mark.parametrize("case", CASES["resolve"], ids=lambda c: c["name"])
def test_get_price_resolves(case):
    price = _quote(case)

    assert format(price.get_price(), "f") == case["value"]
    assert price.get_price_kind() is PriceKind[case["kind"]]
    quote = price.get_price_quote()
    assert format(quote.value, "f") == case["value"]
    assert quote.kind is PriceKind[case["kind"]]


@pytest.mark.parametrize("case", CASES["resolve"], ids=lambda c: c["name"])
def test_stored_quote_reads_back_unchanged(case):
    written = _quote(case)
    read = Price(PriceProto.FromString(written.proto.SerializeToString()))

    assert _plain(read.get_mid()) == case.get("mid")
    assert _plain(read.get_bid()) == case.get("bid")
    assert _plain(read.get_ask()) == case.get("ask")
    assert format(read.get_price(), "f") == case["value"]
    assert read.get_price_kind() is PriceKind[case["kind"]]


def test_no_side_set_raises_typed_error_on_mid():
    price = Price.create_quote(None, AS_OF)

    for read in (price.get_price, price.get_price_kind, price.get_price_quote):
        with pytest.raises(ModelValidationError) as e:
            read()
        assert e.value.field == "mid"
    assert "Price[N/A]" in str(price)


@pytest.mark.parametrize("case", CASES["validate"], ids=lambda c: c["name"])
def test_validator(case):
    proto = PriceProto(
        security=SecurityProto(uuid=UUIDProto(raw_uuid=UUID(LEGACY["security_uuid"]).bytes)),
        price_type=PriceTypeProto.PERCENTAGE,
    )
    for field in ("mid", "bid", "ask"):
        if field in case:
            getattr(proto, field).CopyFrom(encode_decimal(Decimal(case[field])))

    assert [v.field for v in price_rules.validate(proto)] == case["violations"]


@pytest.mark.parametrize("case", CASES["golden_cases"], ids=lambda c: c["name"])
def test_golden_cases(case):
    tolerance = Decimal(case.get("tolerance", "0"))
    assert abs(_quote(case).get_price() - Decimal(case["value"])) <= tolerance


def test_transaction_price_is_written_as_mid():
    # transaction.py builds the nested PriceProto itself; Python has no compile
    # step, so a missed `price=` would only fail here, at run time.
    txn = Transaction.create_from(
        trade_date=date(2024, 6, 14), settlement_date=date(2024, 6, 17),
        position_status=PositionStatusProto.INTENDED, transaction_type=TransactionTypeProto.BUY,
        price=Decimal("99.5"), quantity=1000, as_of=datetime(2024, 6, 14, 10, 0, 0),
        price_type=PriceTypeProto.PERCENTAGE,
    )

    assert txn.proto.price.HasField("mid")
    assert format(decode_decimal(txn.proto.price.mid), "f") == "99.5"
    assert not txn.proto.price.HasField("bid")
    assert not txn.proto.price.HasField("ask")
