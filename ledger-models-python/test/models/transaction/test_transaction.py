from datetime import datetime
from uuid import uuid4

from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.transaction import Transaction


def _build_tx(as_of: datetime, security: SecurityProto) -> Transaction:
    return Transaction.create_from(security=security, as_of=as_of)


def test_get_as_of_round_trips_aware_datetime():
    as_of = datetime(2024, 6, 15, 12, 30, 45)
    sec = SecurityProto(uuid=UUIDProto(raw_uuid=uuid4().bytes))
    tx = _build_tx(as_of, sec)

    got = tx.get_as_of()

    assert got.year == 2024 and got.month == 6 and got.day == 15
    assert got.hour == 12 and got.minute == 30 and got.second == 45


def test_get_security_returns_wrapper():
    sec_uuid = uuid4()
    sec = SecurityProto(uuid=UUIDProto(raw_uuid=sec_uuid.bytes))
    tx = _build_tx(datetime.now(), sec)

    wrapped = tx.get_security()

    assert isinstance(wrapped, Security)
    assert wrapped.get_id() == sec_uuid


def test_get_security_preserves_is_link():
    sec_uuid = uuid4()
    link = Security.link_of(sec_uuid, datetime.now())
    tx = _build_tx(datetime.now(), link)

    wrapped = tx.get_security()

    assert wrapped.is_link() is True
    assert wrapped.get_id() == sec_uuid
