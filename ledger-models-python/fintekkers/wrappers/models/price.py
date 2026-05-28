from datetime import datetime
from typing import Optional
from uuid import UUID

from google.protobuf.timestamp_pb2 import Timestamp
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util import link_cache as _link_cache

_price_fetcher = None


def set_price_fetcher(fetcher) -> None:
    """Register the resolver used when a link-mode Price needs to
    hydrate and the LinkCache misses. Signature:
    (uuid: UUID, as_of: Optional[datetime]) -> PriceProto."""
    global _price_fetcher
    _price_fetcher = fetcher


class Price:
    def __init__(self, proto: PriceProto):
        self.proto: PriceProto = proto

    def __str__(self):
        return f"ID[{self.get_uuid()}], Price[{self.get_price()}]"

    def is_link(self) -> bool:
        """True iff this Price is a link reference. See
        docs/adr/is_link_pattern.md. Pair with LinkResolver to hydrate."""
        return self.proto.is_link

    def _ensure_hydrated(self) -> None:
        """Lazy hydration. See docs/adr/lazy-link-hydration.md."""
        if not self.proto.is_link:
            return
        uuid_obj: UUID = ProtoSerializationUtil.deserialize(self.proto.uuid).uuid
        as_of: Optional[datetime] = None
        if self.proto.HasField("as_of"):
            as_of = ProtoSerializationUtil.deserialize(self.proto.as_of)
        cached = _link_cache.PRICE.get(uuid_obj, as_of)
        if cached is not None:
            self.proto = cached
            return
        fetcher = _price_fetcher
        if fetcher is None:
            raise RuntimeError(
                f"Cannot read fields on link-mode Price uuid={uuid_obj} "
                f"— LinkCache miss and no fetcher registered. "
                f"Pre-warm via LinkResolver or register one with "
                f"fintekkers.wrappers.models.price.set_price_fetcher(). "
                f"See docs/adr/lazy-link-hydration.md."
            )
        resolved: PriceProto = fetcher(uuid_obj, as_of)
        if resolved is None or resolved.is_link:
            raise RuntimeError(
                f"Fetcher returned no full PriceProto for uuid={uuid_obj}, as_of={as_of}."
            )
        resolved_as_of: Optional[datetime] = None
        if resolved.HasField("as_of"):
            resolved_as_of = ProtoSerializationUtil.deserialize(resolved.as_of)
        _link_cache.PRICE.put(uuid_obj, resolved, resolved_as_of)
        self.proto = resolved

    def get_price(self) -> float:
        self._ensure_hydrated()
        price:float = ProtoSerializationUtil.deserialize(self.proto.price)
        return price

    def get_as_of(self) -> datetime:
        as_of: LocalTimestampProto = ProtoSerializationUtil.deserialize(self.proto.as_of)
        return as_of

    def get_uuid(self) -> UUID:
        uuid: FintekkersUuid = ProtoSerializationUtil.deserialize(self.proto.uuid)
        return uuid.as_uuid()


    @staticmethod
    def create_price(security:Security, price: float, as_of_date:Timestamp):
        uuid_value = FintekkersUuid.new_uuid().as_uuid()

        price = PriceProto(
            as_of=LocalTimestampProto(
                timestamp=as_of_date, time_zone="America/New_York"
            ),
            is_link=False,
            object_class="PriceProto",
            uuid=UUIDProto(raw_uuid=uuid_value.bytes),
            price=ProtoSerializationUtil.serialize(price),
            security=security.proto,
            version="0.0.1",
        )

        return Price(price)
