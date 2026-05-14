from fintekkers.models.security.tenor_pb2 import TenorProto
from fintekkers.wrappers.models.security.tenor import Tenor
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto

from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto

from uuid import uuid4, UUID
from datetime import datetime, timezone, date
from dateutil.relativedelta import relativedelta
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from pytz import timezone

def test_tenor_deserialization():
    tenor = Tenor(TenorTypeProto.TERM, "1Y6M")
    assert tenor.get_tenor_description() == "1Y6M"

    proto = ProtoSerializationUtil.serialize(tenor)
    assert proto.tenor_type == TenorTypeProto.TERM
    assert proto.term_value == "1Y6M"

    tenor_deserialized = ProtoSerializationUtil.deserialize(proto)
    assert tenor_deserialized.get_tenor_description() == "1Y6M"
    

def test_tenor_serialization():
    serialized: UUIDProto = ProtoSerializationUtil.serialize(uuid4())
    assert isinstance(serialized, UUIDProto)
    deserialized: FintekkersUuid = ProtoSerializationUtil.deserialize(serialized)
    assert isinstance(deserialized, FintekkersUuid)

    serialized: LocalDateProto = ProtoSerializationUtil.serialize(date.today())
    assert isinstance(serialized, LocalDateProto)
    deserialized: date = ProtoSerializationUtil.deserialize(serialized)
    assert isinstance(deserialized, date)

    obj = datetime.today().replace(tzinfo=timezone("America/New_York"))
    serialized: LocalTimestampProto = ProtoSerializationUtil.serialize(obj)
    assert isinstance(serialized, LocalTimestampProto)
    deserialized: datetime = ProtoSerializationUtil.deserialize(serialized)
    assert isinstance(deserialized, datetime)


# second-brain#276 — lock in that ProtoSerializationUtil.deserialize raises
# on a LocalTimestampProto with empty time_zone. Python already loud-fails
# (pytz.timezone("") raises UnknownTimeZoneError), but without a test future
# refactors could regress into a silent now()-style default.

import pytest
from pytz.exceptions import UnknownTimeZoneError


def test_deserialize_timestamp_raises_on_empty_time_zone():
    proto = LocalTimestampProto()  # proto3 default — empty time_zone, default timestamp
    with pytest.raises(UnknownTimeZoneError):
        ProtoSerializationUtil.deserialize(proto)


def test_deserialize_timestamp_raises_on_seconds_set_but_time_zone_empty():
    # The exact shape backend-dev-ledger hit during #268: seconds populated,
    # time_zone forgotten on the wire. Must surface as an exception, not a
    # silent fallback to now().
    from google.protobuf.timestamp_pb2 import Timestamp
    proto = LocalTimestampProto(
        timestamp=Timestamp(seconds=1_700_000_000, nanos=0),
        # time_zone left empty
    )
    with pytest.raises(UnknownTimeZoneError):
        ProtoSerializationUtil.deserialize(proto)


def test_deserialize_timestamp_happy_path_still_works():
    # Sanity: valid time_zone continues to decode.
    from google.protobuf.timestamp_pb2 import Timestamp
    proto = LocalTimestampProto(
        timestamp=Timestamp(seconds=1_700_000_000, nanos=0),
        time_zone="UTC",
    )
    result = ProtoSerializationUtil.deserialize(proto)
    assert isinstance(result, datetime)
    assert result.year == 2023  # 1700000000 → 2023-11-14
