from datetime import datetime, timezone

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.security.security import Security


def test_security_wrapper():
    as_of = LocalTimestampProto(
        timestamp=Timestamp(seconds=1_700_000_000, nanos=0),
        time_zone="America/New_York",
    )

    proto = SecurityProto(
        object_class="Security",
        version="0.0.1",
        uuid=UUIDProto(raw_uuid=b"\xb6H\x9du\x91,@\x9b\xa9 \xe4:\x83\xd5#B"),
        as_of=as_of,
        product_type=ProductTypeProto.TREASURY_NOTE,
        asset_class="Fixed Income",
        issuer_name="US Government",
        identifiers=[
            IdentifierProto(
                object_class="Identifier",
                version="0.0.1",
                identifier_type=IdentifierTypeProto.CUSIP,
                identifier_value="912796Y29",
            ),
        ],
    )

    security: Security = Security(proto)

    # Each declared field returns a non-None value.
    for field in security.get_fields():
        field: FieldProto
        obj = security.get_field(field)
        assert obj is not None

    assert security.get_as_of() == security.get_field(FieldProto.AS_OF)
    assert "datetime" in str(security.get_field(FieldProto.AS_OF).__class__)
    assert "UUID" in str(security.get_field(FieldProto.ID).__class__)
    assert "UUID" in str(security.get_field(FieldProto.SECURITY_ID).__class__)
    assert "Identifier" in str(security.get_field(FieldProto.IDENTIFIER).__class__)

    assert str(security) == "ID[CUSIP:912796Y29], Security[US Government]"
