from datetime import date, datetime

from fintekkers.models.position.position_status_pb2 import PositionStatusProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.wrappers.models.transaction import Transaction


def test_create_from_produces_valid_proto():
    txn = Transaction.create_from(
        trade_date=date(2024, 6, 15),
        settlement_date=date(2024, 6, 17),
        position_status=PositionStatusProto.INTENDED,
        transaction_type=TransactionTypeProto.BUY,
        price=99.5,
        quantity=1000,
        as_of=datetime(2024, 6, 15, 10, 30, 0),
    )

    proto: TransactionProto = txn.proto
    assert proto.position_status == PositionStatusProto.INTENDED
    assert proto.transaction_type == TransactionTypeProto.BUY
    assert proto.quantity.arbitrary_precision_value == "1000"
    assert proto.trade_date.year == 2024
    assert proto.trade_date.month == 6
    assert proto.trade_date.day == 15
    assert proto.settlement_date.year == 2024
    assert proto.settlement_date.month == 6
    assert proto.settlement_date.day == 17


def test_create_from_as_of_is_local_timestamp():
    txn = Transaction.create_from(
        as_of=datetime(2025, 1, 1, 0, 0, 0),
    )

    assert isinstance(txn.proto.as_of, LocalTimestampProto)
    assert txn.proto.as_of.time_zone == "America/New_York"
