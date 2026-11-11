from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import pytest

from fintekkers.models.position.position_status_pb2 import PositionStatusProto
from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.product_type_pb2 import COMMON_STOCK, FX_SPOT, TIPS, TREASURY_NOTE
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.transaction.create_transaction_request_pb2 import CreateTransactionRequestProto
from fintekkers.wrappers.models import price_rules
from fintekkers.wrappers.models.errors import ModelValidationError, NoDefaultPriceTypeError
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.decimal import decode_decimal
from fintekkers.wrappers.requests.transaction import CreateTransactionRequest


def test_create_from_produces_valid_proto():
    txn = Transaction.create_from(
        trade_date=date(2024, 6, 15),
        settlement_date=date(2024, 6, 17),
        position_status=PositionStatusProto.INTENDED,
        transaction_type=TransactionTypeProto.BUY,
        price=Decimal("99.5"),
        quantity=1000,
        as_of=datetime(2024, 6, 15, 10, 30, 0),
        price_type=PriceTypeProto.ABSOLUTE,
    )

    proto: TransactionProto = txn.proto
    assert proto.position_status == PositionStatusProto.INTENDED
    assert proto.transaction_type == TransactionTypeProto.BUY
    assert format(decode_decimal(proto.quantity), "f") == "1000"
    assert proto.trade_date.year == 2024
    assert proto.trade_date.month == 6
    assert proto.trade_date.day == 15
    assert proto.settlement_date.year == 2024
    assert proto.settlement_date.month == 6
    assert proto.settlement_date.day == 17


def test_create_from_as_of_is_local_timestamp():
    txn = Transaction.create_from(
        as_of=datetime(2025, 1, 1, 0, 0, 0),
        price_type=PriceTypeProto.ABSOLUTE,
    )

    assert isinstance(txn.proto.as_of, LocalTimestampProto)
    assert txn.proto.as_of.time_zone == "America/New_York"


# ---------- LM-461: the trade price carries a typed price_type ----------

SECURITY_ID = UUID("6f1c5a3e-1d2b-4c5d-8e9f-0a1b2c3d4e5f")


def _security(product_type: int) -> SecurityProto:
    return SecurityProto(uuid=UUIDProto(raw_uuid=SECURITY_ID.bytes), product_type=product_type)


def _request(security: SecurityProto, **kwargs) -> CreateTransactionRequestProto:
    return CreateTransactionRequest.create_transaction_request(
        security=security, price=Decimal("99.5"), quantity=Decimal(1000),
        as_of=datetime(2024, 6, 15, 10, 30, 0), **kwargs).proto


def test_treasury_note_with_only_a_price_is_percentage():
    price = _request(_security(TREASURY_NOTE)).create_transaction_input.price

    assert price.price_type == PriceTypeProto.PERCENTAGE
    assert price_rules.validate(price) == []


def test_stock_with_only_a_price_is_absolute():
    price = _request(_security(COMMON_STOCK)).create_transaction_input.price

    assert price.price_type == PriceTypeProto.ABSOLUTE
    assert price_rules.validate(price) == []


def test_explicit_price_type_overrides_the_default():
    price = _request(_security(TREASURY_NOTE), price_type=PriceTypeProto.ABSOLUTE).create_transaction_input.price

    assert price.price_type == PriceTypeProto.ABSOLUTE


def test_create_from_takes_price_type_too():
    txn = Transaction.create_from(security=_security(COMMON_STOCK), price=Decimal("10"),
                                  as_of=datetime(2024, 6, 15), price_type=PriceTypeProto.INDEX_LEVEL)

    assert txn.proto.price.price_type == PriceTypeProto.INDEX_LEVEL


def test_price_type_survives_the_wire():
    wire = _request(_security(TREASURY_NOTE)).SerializeToString()

    parsed = CreateTransactionRequestProto.FromString(wire)

    assert parsed.create_transaction_input.price.price_type == PriceTypeProto.PERCENTAGE


def test_price_number_is_unchanged():
    price = _request(_security(TIPS)).create_transaction_input.price

    assert decode_decimal(price.price).as_tuple() == Decimal("99.5").as_tuple()


def test_no_default_and_no_price_type_raises_naming_the_product():
    result = None
    with pytest.raises(NoDefaultPriceTypeError) as raised:
        result = _request(_security(FX_SPOT))

    assert result is None
    err = raised.value
    assert isinstance(err, ModelValidationError)
    assert err.product_type == "FX_SPOT"
    assert err.field == "price.price_type"
    assert err.object_id == SECURITY_ID
    assert "FX_SPOT" in str(err)


def test_no_security_and_no_price_type_raises():
    with pytest.raises(NoDefaultPriceTypeError, match="PRODUCT_TYPE_UNKNOWN"):
        Transaction.create_from(price=Decimal("1"), as_of=datetime(2024, 6, 15))


def test_explicit_price_type_passes_through_on_a_product_with_no_default():
    price = _request(_security(FX_SPOT), price_type=PriceTypeProto.RATE).create_transaction_input.price

    assert price.price_type == PriceTypeProto.RATE


def test_explicit_unknown_price_type_counts_as_omitted():
    price = _request(_security(COMMON_STOCK), price_type=PriceTypeProto.UNKNOWN_PRICE_TYPE).create_transaction_input.price
    assert price.price_type == PriceTypeProto.ABSOLUTE

    with pytest.raises(NoDefaultPriceTypeError):
        _request(_security(FX_SPOT), price_type=PriceTypeProto.UNKNOWN_PRICE_TYPE)
