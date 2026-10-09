"""LM-276: a Transaction built from a TransactionProto whose inline security (or
that security's inline settlement_currency) has no UUID fills it once, at
construction. Parity with Java TransactionSecurityDefaultsTest, JS
transaction_security_defaults.test.ts and the Rust transaction tests; case
names match across languages."""
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid

AS_OF = LocalTimestampProto(timestamp=Timestamp(seconds=1718461800), time_zone="America/New_York")


def _currency(**kwargs) -> SecurityProto:
    return SecurityProto(
        object_class="Security",
        version="0.0.1",
        as_of=AS_OF,
        product_type=ProductTypeProto.CURRENCY,
        asset_class="Cash",
        issuer_name="US Dollar",
        **kwargs,
    )


def _bond(**kwargs) -> SecurityProto:
    kwargs.setdefault("settlement_currency", _currency())
    return SecurityProto(
        object_class="Security",
        version="0.0.1",
        as_of=AS_OF,
        product_type=ProductTypeProto.CORP_BOND,
        asset_class="Fixed Income",
        issuer_name="ACME Corp",
        **kwargs,
    )


def _txn_with_security(security: SecurityProto) -> TransactionProto:
    return TransactionProto(
        object_class="Transaction",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=FintekkersUuid.new_uuid().as_bytes()),
        as_of=AS_OF,
        security=security,
    )


def test_missing_security_uuid_is_filled_and_stable():
    caller_proto = _txn_with_security(_bond())
    txn = Transaction(caller_proto)

    ids = [Security(txn.proto.security).get_id() for _ in range(3)]
    assert ids[0] is not None
    assert ids[0] == ids[1] == ids[2]
    assert len(txn.proto.security.uuid.raw_uuid) == 16
    # The caller's message is not mutated.
    assert not caller_proto.security.HasField("uuid")


def test_missing_settlement_currency_uuid_is_filled_and_stable():
    txn = Transaction(_txn_with_security(_bond()))

    ids = [Security(txn.proto.security.settlement_currency).get_id() for _ in range(3)]
    assert ids[0] is not None
    assert ids[0] == ids[1] == ids[2]
    assert len(txn.proto.security.settlement_currency.uuid.raw_uuid) == 16


def test_existing_security_uuid_is_kept():
    security_id = FintekkersUuid.new_uuid().as_bytes()
    currency_id = FintekkersUuid.new_uuid().as_bytes()
    caller_proto = _txn_with_security(_bond(
        uuid=UUIDProto(raw_uuid=security_id),
        settlement_currency=_currency(uuid=UUIDProto(raw_uuid=currency_id)),
    ))
    txn = Transaction(caller_proto)

    assert txn.proto.security.uuid.raw_uuid == security_id
    assert txn.proto.security.settlement_currency.uuid.raw_uuid == currency_id
    assert txn.proto is caller_proto


def test_link_security_gets_no_uuid():
    link = SecurityProto(is_link=True, as_of=AS_OF, settlement_currency=_currency())
    txn = Transaction(_txn_with_security(link))

    assert txn.proto.security == link
    assert not txn.proto.security.HasField("uuid")
    assert not txn.proto.security.settlement_currency.HasField("uuid")


def test_link_settlement_currency_gets_no_uuid():
    txn = Transaction(_txn_with_security(_bond(settlement_currency=SecurityProto(is_link=True))))

    assert len(txn.proto.security.uuid.raw_uuid) == 16
    assert txn.proto.security.settlement_currency.is_link
    assert not txn.proto.security.settlement_currency.HasField("uuid")
