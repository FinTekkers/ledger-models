"""Unit tests confirming SecurityService / PortfolioService / PriceService /
TransactionService each populate LinkCache on a successful create_or_update.

Pure unit tests — mock the gRPC stub, exercise the wrapper's create_or_update
surface, then assert LinkCache.<entity>.get(uuid, as_of) returns the persisted
proto. See docs/adr/lazy-link-hydration.md."""

from __future__ import annotations

from uuid import UUID, uuid4

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.security.create_security_request_pb2 import (
    CreateSecurityRequestProto,
)
from fintekkers.requests.security.create_security_response_pb2 import (
    CreateSecurityResponseProto,
)
from fintekkers.requests.portfolio.create_portfolio_response_pb2 import (
    CreatePortfolioResponseProto,
)
from fintekkers.requests.price.create_price_response_pb2 import (
    CreatePriceResponseProto,
)
from fintekkers.requests.transaction.create_transaction_response_pb2 import (
    CreateTransactionResponseProto,
)

from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.services.price import PriceService
from fintekkers.wrappers.services.transaction import TransactionService
from fintekkers.wrappers.util import link_cache


def _as_of(seconds: int) -> LocalTimestampProto:
    return LocalTimestampProto(timestamp=Timestamp(seconds=seconds, nanos=0), time_zone="UTC")


class _RecordingStub:
    """Returns the pre-canned response on any CreateOrUpdate call."""

    def __init__(self, response):
        self._response = response
        self.calls = 0

    def CreateOrUpdate(self, _request):
        self.calls += 1
        return self._response


# ---- SecurityService ----

def test_security_create_or_update_populates_link_cache():
    link_cache.SECURITY.clear()
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_000)
    persisted = SecurityProto(
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        as_of=as_of,
        issuer_name="ACME",
    )
    response = CreateSecurityResponseProto(security_response=persisted)

    SecurityService._reset_for_tests()
    svc = SecurityService()
    svc.stub = _RecordingStub(response)

    # CreateSecurityRequestProto carrying a real-typed identifier so the
    # client-side identifier guard (#347) lets the call through.
    class _ReqProto:
        def __init__(self):
            self.proto = CreateSecurityRequestProto(
                security_input=SecurityProto(
                    identifiers=[
                        IdentifierProto(
                            identifier_type=IdentifierTypeProto.EXCH_TICKER,
                            identifier_value="ACME",
                        )
                    ]
                )
            )
    svc.create_or_update(_ReqProto())

    as_of_dt = ProtoSerializationUtil.deserialize(as_of)
    cached = link_cache.SECURITY.get(uuid_obj, as_of_dt)
    assert cached is not None
    assert cached.issuer_name == "ACME"
    link_cache.SECURITY.clear()
    SecurityService._reset_for_tests()


# ---- PortfolioService ----

def test_portfolio_create_or_update_populates_link_cache():
    link_cache.PORTFOLIO.clear()
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_001)
    persisted = PortfolioProto(
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        as_of=as_of,
        portfolio_name="Strategy Z",
    )
    response = CreatePortfolioResponseProto(portfolio_response=[persisted])

    PortfolioService._reset_for_tests()
    svc = PortfolioService()
    svc.stub = _RecordingStub(response)
    svc.create_or_update(object())  # request is passed straight to stub

    as_of_dt = ProtoSerializationUtil.deserialize(as_of)
    cached = link_cache.PORTFOLIO.get(uuid_obj, as_of_dt)
    assert cached is not None
    assert cached.portfolio_name == "Strategy Z"
    link_cache.PORTFOLIO.clear()
    PortfolioService._reset_for_tests()


# ---- PriceService ----

def test_price_create_or_update_populates_link_cache():
    link_cache.PRICE.clear()
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_002)
    persisted = PriceProto(
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        as_of=as_of,
    )
    response = CreatePriceResponseProto(price_response=[persisted])

    PriceService._reset_for_tests()
    svc = PriceService()
    svc.stub = _RecordingStub(response)

    class _ReqProto:
        def __init__(self):
            self.proto = PriceProto()
    svc.create_or_update(_ReqProto())

    as_of_dt = ProtoSerializationUtil.deserialize(as_of)
    cached = link_cache.PRICE.get(uuid_obj, as_of_dt)
    assert cached is not None
    link_cache.PRICE.clear()
    PriceService._reset_for_tests()


# ---- TransactionService ----

def test_transaction_create_or_update_populates_link_cache():
    link_cache.TRANSACTION.clear()
    uuid_obj = uuid4()
    as_of = _as_of(1_700_000_003)
    persisted = TransactionProto(
        uuid=UUIDProto(raw_uuid=uuid_obj.bytes),
        as_of=as_of,
    )
    response = CreateTransactionResponseProto(transaction_response=persisted)

    TransactionService._reset_for_tests()
    svc = TransactionService()
    svc.stub = _RecordingStub(response)

    class _ReqProto:
        def __init__(self):
            self.proto = TransactionProto()
    svc.create_or_update(_ReqProto())

    as_of_dt = ProtoSerializationUtil.deserialize(as_of)
    cached = link_cache.TRANSACTION.get(uuid_obj, as_of_dt)
    assert cached is not None
    link_cache.TRANSACTION.clear()
    TransactionService._reset_for_tests()
