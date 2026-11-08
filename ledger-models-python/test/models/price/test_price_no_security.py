"""LM-449: a price with no security serializes with ``security`` absent."""
from uuid import UUID

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.security import Security


def _now() -> Timestamp:
    ts = Timestamp()
    ts.GetCurrentTime()
    return ts


def test_create_price_without_security_has_no_security():
    price = Price.create_price(None, 100, _now())

    assert not price.proto.HasField("security")
    assert price.get_price() == 100


def test_create_price_with_security_keeps_security():
    security = Security(SecurityProto(
        uuid=UUIDProto(raw_uuid=UUID(int=1).bytes),
        as_of=LocalTimestampProto(timestamp=Timestamp(), time_zone="America/New_York"),
        product_type=ProductTypeProto.CORP_BOND,
        issuer_name="ACME Corp",
    ))

    price = Price.create_price(security, 100, _now())

    assert price.proto.HasField("security")
    assert price.proto.security.uuid.raw_uuid == UUID(int=1).bytes
