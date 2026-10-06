"""LM-253: a Transaction built from a TransactionProto whose price has no UUID
(or no as_of) fills them once, at construction. Parity with Java
TransactionPriceDefaultsTest and JS transaction_price_defaults.test.ts; case
names match across languages."""
from datetime import datetime

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid

AS_OF_RULE = "price.as_of defaults to the transaction's as_of (transaction.py / Price.create)"

TXN_AS_OF = LocalTimestampProto(timestamp=Timestamp(seconds=1718461800), time_zone="America/New_York")
PRICE_AS_OF = LocalTimestampProto(timestamp=Timestamp(seconds=1718377200), time_zone="Europe/London")


def _price(**kwargs) -> PriceProto:
    return PriceProto(
        object_class="Price",
        version="0.0.1",
        price=DecimalValueProto(arbitrary_precision_value="99.5"),
        **kwargs,
    )


def _txn_with_price(price: PriceProto, with_txn_as_of: bool = True) -> TransactionProto:
    proto = TransactionProto(
        object_class="Transaction",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=FintekkersUuid.new_uuid().as_bytes()),
        price=price,
    )
    if with_txn_as_of:
        proto.as_of.CopyFrom(TXN_AS_OF)
    return proto


def test_missing_price_uuid_is_filled():
    caller_proto = _txn_with_price(_price(as_of=PRICE_AS_OF))
    txn = Transaction(caller_proto)

    assert len(txn.proto.price.uuid.raw_uuid) == 16
    # The caller's message is not mutated.
    assert not caller_proto.price.HasField("uuid")


def test_empty_raw_uuid_is_treated_as_missing():
    txn = Transaction(_txn_with_price(_price(as_of=PRICE_AS_OF, uuid=UUIDProto(raw_uuid=b""))))

    assert len(txn.proto.price.uuid.raw_uuid) == 16


def test_price_uuid_is_assigned_once():
    txn = Transaction(_txn_with_price(_price(as_of=PRICE_AS_OF)))

    first = txn.proto.price.uuid.raw_uuid
    second = txn.proto.price.uuid.raw_uuid
    assert first == second
    assert len(first) == 16


def test_round_trip_keeps_price_uuid():
    first = Transaction(_txn_with_price(_price(as_of=PRICE_AS_OF)))
    second = Transaction(first.proto)

    assert second.proto.price.uuid.raw_uuid == first.proto.price.uuid.raw_uuid
    assert len(second.proto.price.uuid.raw_uuid) == 16


def test_existing_price_uuid_is_kept():
    existing = FintekkersUuid.new_uuid().as_bytes()
    caller_proto = _txn_with_price(_price(as_of=PRICE_AS_OF, uuid=UUIDProto(raw_uuid=existing)))
    txn = Transaction(caller_proto)

    assert txn.proto.price.uuid.raw_uuid == existing
    # Nothing missing: the wrapper keeps the caller's proto as-is.
    assert txn.proto is caller_proto


def test_missing_price_as_of_defaults_to_transaction_as_of():
    txn = Transaction(_txn_with_price(_price()))

    assert txn.proto.price.as_of == TXN_AS_OF, AS_OF_RULE
    assert txn.proto.price.as_of == txn.proto.as_of, AS_OF_RULE
    assert txn.proto.price.as_of == txn.proto.price.as_of


def test_existing_price_as_of_is_kept():
    txn = Transaction(_txn_with_price(_price(as_of=PRICE_AS_OF)))

    assert txn.proto.price.as_of == PRICE_AS_OF


def test_no_as_of_anywhere_leaves_price_as_of_unset():
    txn = Transaction(_txn_with_price(_price(), with_txn_as_of=False))

    assert not txn.proto.price.HasField("as_of")
    assert len(txn.proto.price.uuid.raw_uuid) == 16


def test_link_price_passes_through_unchanged():
    link = PriceProto(is_link=True)
    txn = Transaction(_txn_with_price(link))

    assert txn.proto.price == link
    assert not txn.proto.price.HasField("uuid")


def test_factory_path_fills_price_uuid_and_as_of():
    txn = Transaction.create_from(price=99.5, as_of=datetime(2024, 6, 15, 10, 30, 0))

    assert len(txn.proto.price.uuid.raw_uuid) == 16
    assert txn.proto.price.as_of == txn.proto.as_of, AS_OF_RULE
