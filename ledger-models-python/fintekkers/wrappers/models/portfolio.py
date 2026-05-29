from datetime import datetime
from typing import Optional
from uuid import UUID

from google.protobuf.timestamp_pb2 import Timestamp
from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util import link_cache as _link_cache

# Module-level fetcher hook. Mirrors the security wrapper — wired once at
# process start by the service-client layer. See docs/adr/lazy-link-hydration.md.
_portfolio_fetcher = None


def set_portfolio_fetcher(fetcher) -> None:
    """Register the resolver used when a link-mode Portfolio needs to
    hydrate and the LinkCache misses. Signature:
    (uuid: UUID, as_of: Optional[datetime]) -> PortfolioProto."""
    global _portfolio_fetcher
    _portfolio_fetcher = fetcher


def _default_portfolio_fetcher(uuid_obj: UUID, as_of_dt: Optional[datetime]):
    """Default fetcher — delegates to `PortfolioService.get_portfolio_by_uuid`.
    No duplicated request-construction or stub-management; the service
    wrapper owns that. Auto-registered at module load. Override with
    `set_portfolio_fetcher(...)` for tests (canned protos) or alternate
    endpoints."""
    # Lazy import to avoid a cycle at module load.
    from fintekkers.wrappers.services.portfolio import PortfolioService

    as_of_proto = (
        ProtoSerializationUtil.serialize(as_of_dt) if as_of_dt is not None else None
    )
    portfolio = PortfolioService().get_portfolio_by_uuid(uuid_obj, as_of=as_of_proto)
    return portfolio.proto if portfolio is not None else None


_portfolio_fetcher = _default_portfolio_fetcher


class Portfolio:
    def __init__(self, proto: PortfolioProto):
        self.proto: PortfolioProto = proto

    def __str__(self):
        return f"ID[{self.proto.uuid}], Portfolio[{self.proto.portfolio_name}]"

    def is_link(self) -> bool:
        """True iff this Portfolio is a link reference. See
        docs/adr/is_link_pattern.md. Pair with LinkResolver to hydrate."""
        return self.proto.is_link

    def _ensure_hydrated(self) -> None:
        """Lazy hydration. If proto is link-mode, resolve via LinkCache or
        the registered fetcher and swap in the resolved proto. After this
        returns, ``self.proto.is_link is False``. See
        docs/adr/lazy-link-hydration.md."""
        if not self.proto.is_link:
            return
        uuid_obj: UUID = ProtoSerializationUtil.deserialize(self.proto.uuid).uuid
        as_of: Optional[datetime] = None
        if self.proto.HasField("as_of"):
            as_of = ProtoSerializationUtil.deserialize(self.proto.as_of)
        cached = _link_cache.PORTFOLIO.get(uuid_obj, as_of)
        if cached is not None:
            self.proto = cached
            return
        fetcher = _portfolio_fetcher
        if fetcher is None:
            raise RuntimeError(
                f"Cannot read fields on link-mode Portfolio uuid={uuid_obj} "
                f"— LinkCache miss and no fetcher registered. "
                f"Pre-warm via LinkResolver or register one with "
                f"fintekkers.wrappers.models.portfolio.set_portfolio_fetcher(). "
                f"See docs/adr/lazy-link-hydration.md."
            )
        resolved: PortfolioProto = fetcher(uuid_obj, as_of)
        if resolved is None or resolved.is_link:
            raise RuntimeError(
                f"Fetcher returned no full PortfolioProto for uuid={uuid_obj}, as_of={as_of}."
            )
        resolved_as_of: Optional[datetime] = None
        if resolved.HasField("as_of"):
            resolved_as_of = ProtoSerializationUtil.deserialize(resolved.as_of)
        _link_cache.PORTFOLIO.put(uuid_obj, resolved, resolved_as_of)
        self.proto = resolved

    def get_name(self) -> str:
        self._ensure_hydrated()
        return self.proto.portfolio_name

    def get_as_of(self) -> datetime:
        as_of: LocalTimestampProto = ProtoSerializationUtil.deserialize(self.proto.as_of)
        return as_of

    def get_uuid(self) -> UUID:
        uuid: FintekkersUuid = ProtoSerializationUtil.deserialize(self.proto.uuid)
        return uuid.as_uuid()


    @staticmethod
    def create_portfolio(portfolio_name: str):
        uuid_value = FintekkersUuid.new_uuid().as_uuid()
        portfolio = PortfolioProto(
            as_of=LocalTimestampProto(
                timestamp=Timestamp(), time_zone="America/New_York"
            ),
            is_link=False,
            object_class="Portfolio",
            portfolio_name=portfolio_name,
            uuid=UUIDProto(raw_uuid=uuid_value.bytes),
            version="0.0.1",
        )

        return Portfolio(portfolio)
