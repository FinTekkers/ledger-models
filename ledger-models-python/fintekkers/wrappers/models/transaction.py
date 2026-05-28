from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.position.position_status_pb2 import PositionStatusProto

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.security_pb2 import SecurityProto

from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto

from fintekkers.wrappers.util import link_cache as _link_cache

_transaction_fetcher = None


def set_transaction_fetcher(fetcher) -> None:
    """Register the resolver used when a link-mode Transaction needs to
    hydrate and the LinkCache misses. Signature:
    (uuid: UUID, as_of: Optional[datetime]) -> TransactionProto."""
    global _transaction_fetcher
    _transaction_fetcher = fetcher


class Transaction():
    @staticmethod
    def create_from(
        security:SecurityProto=None, portfolio:PortfolioProto=None, \
        trade_date:date=date.today(), settlement_date:date=date.today(), \
        position_status:PositionStatusProto=PositionStatusProto.INTENDED, \
        transaction_type:TransactionTypeProto=TransactionTypeProto.BUY, \
        price:float=-100.00, quantity=100,
        as_of:datetime=datetime.now()):

        # Inline import: serialization.py imports TransactionType from this module, so top-level import would be circular
        from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
        as_of_proto = ProtoSerializationUtil.serialize(as_of)

        return Transaction(proto=TransactionProto(
            as_of=as_of_proto,
            is_cancelled=False,
            is_link=False,
            object_class="Transaction",
            portfolio=portfolio,
            security=security,
            position_status=position_status,
            price=PriceProto(
                uuid=UUIDProto(raw_uuid=FintekkersUuid.new_uuid().as_bytes()),
                as_of=as_of_proto,
                price=DecimalValueProto(arbitrary_precision_value=f"{price}"),
                security=security
            ),
            transaction_type=transaction_type,
            quantity=DecimalValueProto(arbitrary_precision_value=f"{quantity}"),
            trade_date=LocalDateProto(year=trade_date.year, month=trade_date.month, day=trade_date.day),
            settlement_date=LocalDateProto(year=settlement_date.year, month=settlement_date.month, day=settlement_date.day),
            uuid=UUIDProto(raw_uuid=FintekkersUuid.new_uuid().as_bytes()),
            trade_name="No trade name",
            strategy_allocation=None
        ))

    def __init__(self, proto:TransactionProto):
        self.proto:TransactionProto = proto

    def is_link(self) -> bool:
        """True iff this Transaction is a link reference. See
        docs/adr/is_link_pattern.md. Pair with LinkResolver to hydrate."""
        return self.proto.is_link

    def _ensure_hydrated(self) -> None:
        """Lazy hydration. See docs/adr/lazy-link-hydration.md."""
        if not self.proto.is_link:
            return
        # Inline import to avoid circular dependency.
        from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil

        uuid_obj: UUID = ProtoSerializationUtil.deserialize(self.proto.uuid).uuid
        as_of: Optional[datetime] = None
        if self.proto.HasField("as_of"):
            as_of = ProtoSerializationUtil.deserialize(self.proto.as_of)
        cached = _link_cache.TRANSACTION.get(uuid_obj, as_of)
        if cached is not None:
            self.proto = cached
            return
        fetcher = _transaction_fetcher
        if fetcher is None:
            raise RuntimeError(
                f"Cannot read fields on link-mode Transaction uuid={uuid_obj} "
                f"— LinkCache miss and no fetcher registered. "
                f"Pre-warm via LinkResolver or register one with "
                f"fintekkers.wrappers.models.transaction.set_transaction_fetcher(). "
                f"See docs/adr/lazy-link-hydration.md."
            )
        resolved: TransactionProto = fetcher(uuid_obj, as_of)
        if resolved is None or resolved.is_link:
            raise RuntimeError(
                f"Fetcher returned no full TransactionProto for uuid={uuid_obj}, as_of={as_of}."
            )
        resolved_as_of: Optional[datetime] = None
        if resolved.HasField("as_of"):
            resolved_as_of = ProtoSerializationUtil.deserialize(resolved.as_of)
        _link_cache.TRANSACTION.put(uuid_obj, resolved, resolved_as_of)
        self.proto = resolved


class TransactionType():
    def __init__(self, proto: TransactionTypeProto):
        self.proto = proto

    def __str__(self) -> str:
        return TransactionTypeProto.Name(self.proto)
