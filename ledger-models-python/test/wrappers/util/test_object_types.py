"""Object type and version (LM-297, LM-318): `stamp` writes object_type = 1
and version = 2 (0.0.1), and bytes from earlier releases are not readable."""
import uuid
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from google.protobuf.message import DecodeError
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.product_type_pb2 import TREASURY_NOTE
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.requests.price import CreatePriceRequest
from fintekkers.wrappers.requests.security import CreateSecurityRequest
from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.util import object_types
from fintekkers.wrappers.util.link_resolver import LinkResolver

# A PriceProto written by ledger-models v0.4.33: object_class / version
# strings in fields 1 and 2.
OLD_PRICE = Path(__file__).resolve().parents[4] / "ledger-models-protos" / "fixtures" / "legacy_v0433" / "price.bin"


# ---- stamp round-trips (metric 2) ----

def test_stamped_price_round_trips_type_and_version():
    price = object_types.stamp(PriceProto(), ObjectTypeProto.OBJECT_TYPE_PRICE)
    reread = PriceProto.FromString(price.SerializeToString())

    assert object_types.read_type(reread) == ObjectTypeProto.OBJECT_TYPE_PRICE
    assert object_types.read_version(reread) == (0, 0, 1)
    assert (reread.version.major, reread.version.minor, reread.version.patch) == (0, 0, 1)
    # Exactly field 1 (varint 11) and field 2 ({patch: 1}): nothing at the
    # removed 1001-1004, and nothing unknown kept on re-serialising.
    assert price.SerializeToString() == bytes([0x08, 11, 0x12, 0x02, 0x18, 0x01])
    assert reread.SerializeToString() == price.SerializeToString()


def test_an_unstamped_message_reads_as_unknown_and_absent():
    price = PriceProto.FromString(PriceProto().SerializeToString())
    assert object_types.read_type(price) == ObjectTypeProto.OBJECT_TYPE_UNKNOWN
    assert object_types.read_version(price) is None


# ---- Old bytes are not readable (metric 3) ----

def test_bytes_from_v0_4_33_are_not_readable():
    # Field 2 held the string "0.0.1", which does not parse as a VersionProto.
    with pytest.raises(DecodeError):
        PriceProto.FromString(OLD_PRICE.read_bytes())


# ---- Every library writer stamps the new form (metric 2) ----

def _captured_request(call):
    captured = []
    stub = MagicMock()
    stub.GetByIds.side_effect = lambda r: captured.append(r) or MagicMock(portfolio_response=[], security_response=[])
    call(stub)
    return captured[-1]


def _portfolio_service_request(stub):
    service = PortfolioService.__new__(PortfolioService)
    service.stub = stub
    service.get_portfolio_by_uuid(uuid.UUID(int=1))


def _security_service_request(stub):
    service = SecurityService.__new__(SecurityService)
    service.stub = stub
    service.get_security_by_uuid(uuid.UUID(int=1))


SECURITY = SecurityProto(issuer_name="X")

# (name, build the message, ObjectTypeProto value)
LIBRARY_WRITERS = [
    ("Price.create_price", lambda: Price.create_price(Security(SECURITY), Decimal("1.0"), Timestamp()).proto,
     "OBJECT_TYPE_PRICE"),
    ("Portfolio.create_portfolio", lambda: Portfolio.create_portfolio("P").proto,
     "OBJECT_TYPE_PORTFOLIO"),
    ("Transaction.create_from", lambda: Transaction.create_from(trade_date=date(2024, 1, 2), settlement_date=date(2024, 1, 4)).proto,
     "OBJECT_TYPE_TRANSACTION"),
    ("CreatePriceRequest", lambda: CreatePriceRequest.create_or_update_request(SECURITY, Decimal("1.0"), datetime(2024, 1, 2)).proto,
     "OBJECT_TYPE_CREATE_PRICE_REQUEST"),
    ("CreatePriceRequest.create_price_input",
     lambda: CreatePriceRequest.create_or_update_request(SECURITY, Decimal("1.0"), datetime(2024, 1, 2)).proto.create_price_input,
     "OBJECT_TYPE_PRICE"),
    ("CreateSecurityRequest issuance",
     lambda: CreateSecurityRequest.create_ust_security_request(
         cusip="C", cash_security=SECURITY, product_type=TREASURY_NOTE, spread=None,
         auction_announcement_date=date(2024, 1, 2)).proto.security_input.bond_details.issuance_info[0],
     "OBJECT_TYPE_ISSUANCE"),
    ("PortfolioService.get_portfolio_by_uuid", lambda: _captured_request(_portfolio_service_request),
     "OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST"),
    ("SecurityService.get_security_by_uuid", lambda: _captured_request(_security_service_request),
     "OBJECT_TYPE_QUERY_SECURITY_REQUEST"),
    ("LinkResolver._batch_fetch_securities",
     lambda: _captured_request(lambda stub: LinkResolver(stub, stub)._batch_fetch_securities([uuid.UUID(int=1)], None)),
     "OBJECT_TYPE_QUERY_SECURITY_REQUEST"),
    ("LinkResolver._batch_fetch_portfolios",
     lambda: _captured_request(lambda stub: LinkResolver(stub, stub)._batch_fetch_portfolios([uuid.UUID(int=1)], None)),
     "OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST"),
]


@pytest.mark.parametrize("build, type_name", [w[1:] for w in LIBRARY_WRITERS], ids=[w[0] for w in LIBRARY_WRITERS])
def test_writer_stamps_type_and_schema_version(build, type_name):
    message = build()

    assert object_types.read_type(message) == ObjectTypeProto.Value(type_name)
    assert object_types.read_version(message) == object_types.SCHEMA_VERSION == (0, 0, 1)
