from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import NamedTuple, Optional
from uuid import UUID

from google.protobuf.timestamp_pb2 import Timestamp
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.wrappers.util.object_types import stamp
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.util.decimal import decode_decimal, is_decimal_set, midpoint
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util import link_cache as _link_cache

_price_fetcher = None


class PriceKind(Enum):
    """LM-508: which side of the market get_price() returned. Wrapper only;
    the proto has no enum for it. See docs/adr/price_bid_ask_mid.md."""
    MID = "MID"
    DERIVED_MID = "DERIVED_MID"
    BID = "BID"
    ASK = "ASK"


class PriceQuote(NamedTuple):
    """The one number a price resolves to, and which kind it is."""
    value: Decimal
    kind: PriceKind


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
        try:
            value = str(self.get_price())
        except ModelValidationError:
            value = "N/A"
        return f"ID[{self.get_uuid()}], Price[{value}]"

    def is_link(self) -> bool:
        """True iff this Price is a link reference. See
        docs/adr/is_link_pattern.md. Pair with LinkResolver to hydrate."""
        return self.proto.is_link

    def _ensure_hydrated(self) -> None:
        """Lazy hydration. See docs/adr/lazy-link-hydration.md."""
        if not self.proto.is_link:
            return
        uuid_obj: UUID = ProtoSerializationUtil.deserialize_required_uuid(self.proto.uuid, "price.uuid").uuid
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

    def get_price(self) -> Decimal:
        """The one number this price resolves to: mid if set; else the
        bid/ask midpoint when both are set; else the one side that is set.
        Raises ModelValidationError on `mid` when none is set. For new code
        prefer get_price_quote(), which also says which kind it is."""
        return self.get_price_quote().value

    def get_price_kind(self) -> PriceKind:
        """The kind get_price() returned (MID, DERIVED_MID, BID or ASK)."""
        return self.get_price_quote().kind

    def get_price_quote(self) -> PriceQuote:
        """The resolved value and its kind. Raises ModelValidationError on
        `mid` when none of mid, bid and ask is set."""
        mid, bid, ask = self.get_mid(), self.get_bid(), self.get_ask()
        if mid is not None:
            return PriceQuote(mid, PriceKind.MID)
        if bid is not None and ask is not None:
            return PriceQuote(midpoint(bid, ask), PriceKind.DERIVED_MID)
        if bid is not None:
            return PriceQuote(bid, PriceKind.BID)
        if ask is not None:
            return PriceQuote(ask, PriceKind.ASK)
        raise ModelValidationError([violation("mid", self._object_id(), "one of mid, bid or ask is required")])

    def get_mid(self) -> Optional[Decimal]:
        """The raw mid, or None when unset."""
        return self._side("mid")

    def get_bid(self) -> Optional[Decimal]:
        """The raw bid, or None when unset."""
        return self._side("bid")

    def get_ask(self) -> Optional[Decimal]:
        """The raw ask, or None when unset."""
        return self._side("ask")

    def _side(self, field: str) -> Optional[Decimal]:
        self._ensure_hydrated()
        if not self.proto.HasField(field) or not is_decimal_set(getattr(self.proto, field)):
            return None
        return decode_decimal(getattr(self.proto, field))

    def _object_id(self) -> Optional[UUID]:
        raw = self.proto.uuid.raw_uuid
        return UUID(bytes=raw) if len(raw) == 16 else None

    def get_as_of(self) -> datetime:
        return ProtoSerializationUtil.deserialize_required_timestamp(
            self.proto.as_of if self.proto.HasField("as_of") else None, "price.as_of")

    def get_uuid(self) -> UUID:
        uuid: FintekkersUuid = ProtoSerializationUtil.deserialize_required_uuid(self.proto.uuid, "price.uuid")
        return uuid.as_uuid()


    @staticmethod
    def create_price(security: Optional[Security], price: "Decimal | int", as_of_date:Timestamp):
        """A mid-only price (LM-508: field 10 is now named mid)."""
        return Price.create_quote(security, as_of_date, mid=price)

    @staticmethod
    def create_quote(security: Optional[Security], as_of_date: Timestamp,
                     mid: "Decimal | int | None" = None, bid: "Decimal | int | None" = None,
                     ask: "Decimal | int | None" = None,
                     price_type: "Optional[PriceTypeProto.ValueType]" = None) -> "Price":
        """LM-508: a price from any mix of mid, bid and ask; None leaves a side
        unset, and so does an unset price_type. Not validated here: see
        price_rules.validate."""
        # LM-449: an inline trade price may have no security; leave it unset.
        uuid_value = FintekkersUuid.new_uuid().as_uuid()

        price = stamp(PriceProto(
            as_of=LocalTimestampProto(
                timestamp=as_of_date, time_zone="America/New_York"
            ),
            is_link=False,
            uuid=UUIDProto(raw_uuid=uuid_value.bytes),
            mid=_encode_optional(mid),
            bid=_encode_optional(bid),
            ask=_encode_optional(ask),
            security=security.proto if security is not None else None,
            price_type=price_type,
        ), ObjectTypeProto.OBJECT_TYPE_PRICE)

        return Price(price)


def _encode_optional(value: "Decimal | int | None") -> Optional[DecimalValueProto]:
    return None if value is None else ProtoSerializationUtil.serialize(value)
