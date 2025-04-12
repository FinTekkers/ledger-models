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
