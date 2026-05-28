from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.position.field_pb2 import *
from fintekkers.models.position.measure_pb2 import MeasureProto

from uuid import UUID
from datetime import datetime, timezone
from typing import Optional
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.wrappers.models.security.security_identifier import Identifier

from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.util import link_cache as _link_cache

# Module-level fetcher hook — pluggable so this module stays free of a
# direct SecurityServiceClient import (avoids cycles in tests). Set via
# set_security_fetcher(callable). Signature: (uuid: UUID, as_of: Optional[datetime]) -> SecurityProto.
_security_fetcher = None


def set_security_fetcher(fetcher) -> None:
    """Register the resolver used when a link-mode Security needs to
    hydrate and the LinkCache misses. Called once at process start by the
    service-client layer. See `docs/adr/lazy-link-hydration.md`."""
    global _security_fetcher
    _security_fetcher = fetcher

class IFinancialModelObject:
    def get_field(field:FieldProto) -> object:
        pass

    def get_measure(measure:MeasureProto) -> object:
        pass

    def get_fields() -> set[FieldProto]:
        pass

    def get_measures() -> set[MeasureProto]:
        pass

    def get_as_of() -> datetime:
        pass

class RawDataModelObject:
    def __init__(self, id: UUID, as_of: datetime):
        self.id = id
        self.as_of = as_of

class Security():
    def __init__(self, proto:SecurityProto):
        self.proto:SecurityProto = proto

    def __str__(self) -> str:
        return f"ID[{str(self.get_id())}], {self._primary_identifier_str()}[{self.proto.issuer_name}]"

    @staticmethod
    def link_of(uuid: UUID, as_of: datetime) -> SecurityProto:
        """Build a SecurityProto link reference (is_link=true) with uuid and
        as_of populated. Use this when embedding a Security inside another
        message that carries an as_of — the link MUST carry the same as_of so
        the resolver hydrates the correct point-in-time vintage. See
        docs/adr/is_link_pattern.md.

        `as_of` is required; for the rare "always-latest" case use
        link_of_latest(uuid).
        """
        if uuid is None:
            raise ValueError("uuid is required for link_of")
        if as_of is None:
            raise ValueError("as_of is required for link_of; use link_of_latest(uuid) for latest-version semantics")
        return SecurityProto(
            is_link=True,
            uuid=UUIDProto(raw_uuid=uuid.bytes),
            as_of=_datetime_to_local_timestamp(as_of),
        )

    @staticmethod
    def link_of_latest(uuid: UUID) -> SecurityProto:
        """Build a SecurityProto link reference (is_link=true) with only uuid
        set. Resolution returns the latest version. Explicit escape hatch —
        most callers should prefer link_of(uuid, as_of).
        """
        if uuid is None:
            raise ValueError("uuid is required for link_of_latest")
        return SecurityProto(
            is_link=True,
            uuid=UUIDProto(raw_uuid=uuid.bytes),
        )

    def is_link(self) -> bool:
        """True iff this Security is a link reference (only uuid + optionally
        as_of populated). See docs/adr/is_link_pattern.md. Pair with
        LinkResolver to hydrate to a full entity. When True, other field
        accessors (get_asset_class, get_product_type, etc.) raise
        RuntimeError; resolve via SecurityService.GetByIds first."""
        return self.proto.is_link

    def _ensure_hydrated(self, accessor: str) -> None:
        """Lazy hydration. If proto is link-mode, resolve via LinkCache or
        the registered fetcher and swap in the resolved proto. After this
        returns, ``self.proto.is_link is False`` and field accessors read
        through normally. See `docs/adr/lazy-link-hydration.md`."""
        if not self.proto.is_link:
            return
        uuid_proto = self.proto.uuid
        uuid_obj: UUID = ProtoSerializationUtil.deserialize(uuid_proto).uuid
        as_of: Optional[datetime] = None
        if self.proto.HasField("as_of"):
            as_of = ProtoSerializationUtil.deserialize(self.proto.as_of)
        cached = _link_cache.SECURITY.get(uuid_obj, as_of)
        if cached is not None:
            self.proto = cached
            return
        fetcher = _security_fetcher
        if fetcher is None:
            raise RuntimeError(
                f"Cannot read {accessor} on link-mode Security uuid={uuid_obj} "
                f"— LinkCache miss and no fetcher registered. "
                f"Pre-warm via LinkResolver or register one with "
                f"fintekkers.wrappers.models.security.security.set_security_fetcher(). "
                f"See docs/adr/lazy-link-hydration.md."
            )
        resolved: SecurityProto = fetcher(uuid_obj, as_of)
        if resolved is None or resolved.is_link:
            raise RuntimeError(
                f"Fetcher returned no full SecurityProto for uuid={uuid_obj}, as_of={as_of}."
            )
        resolved_as_of: Optional[datetime] = None
        if resolved.HasField("as_of"):
            resolved_as_of = ProtoSerializationUtil.deserialize(resolved.as_of)
        _link_cache.SECURITY.put(uuid_obj, resolved, resolved_as_of)
        self.proto = resolved

    def get_fields(self) -> list[FieldProto]:
        return [
            ID, SECURITY_ID, AS_OF, ASSET_CLASS, IDENTIFIER
        ]

    def get_field(self, field:FieldProto) -> object:
        if field in (ID, SECURITY_ID):
            return self.get_id()
        elif field == AS_OF:
            return self.get_as_of()
        elif field == ASSET_CLASS:
            return self.get_asset_class()
        elif field == PRODUCT_CLASS:
            return self.get_product_class()
        elif field == PRODUCT_TYPE:
            return self.get_product_type()
        elif field == IDENTIFIER:
            identifiers = self.get_identifiers()
            return identifiers[0] if identifiers else None
        elif field in (TENOR, ADJUSTED_TENOR):
            return self.get_tenor()
        elif field == MATURITY_DATE:
            return self.get_maturity_date()
        elif field == ISSUE_DATE:
            return self.get_issue_date()
        else:
            raise ValueError(f"Field not mapped in Security wrapper: {FieldProto.DESCRIPTOR.values_by_number[field].name}")

    def get_id(self) -> UUID:
        uuid:FintekkersUuid = ProtoSerializationUtil.deserialize(self.proto.uuid)
        return uuid.uuid
    
    def get_as_of(self) -> datetime:
        as_of:datetime = ProtoSerializationUtil.deserialize(self.proto.as_of)
        return as_of
        
    def get_asset_class(self) -> str:
        self._ensure_hydrated("asset_class")
        return self.proto.asset_class

    def get_product_class(self) -> str:
        self._ensure_hydrated("product_class")
        raise ValueError("Not implemented yet. See Java implementation for reference")

    def get_product_type(self) -> object:
        self._ensure_hydrated("product_type")
        raise ValueError("Not implemented yet. See Java implementation for reference")

    def get_identifiers(self) -> list[Identifier]:
        """Returns all identifiers carried by this security as wrapped
        Identifier instances. Order matches the proto's repeated field:
        the primary identifier (used as the human-readable ID) is index 0.
        """
        self._ensure_hydrated("identifiers")
        return [Identifier(p) for p in self.proto.identifiers]

    def get_identifier_by_type(self, identifier_type) -> Optional[Identifier]:
        """Returns the first Identifier matching the given IdentifierTypeProto
        value, or None if no identifier of that type is attached. The argument
        is the integer enum value (IdentifierTypeProto.CUSIP, .ISIN, ...).
        """
        self._ensure_hydrated("identifiers")
        for p in self.proto.identifiers:
            if p.identifier_type == identifier_type:
                return Identifier(p)
        return None

    def _primary_identifier_str(self) -> str:
        """Internal helper for __str__: render the primary identifier or
        a placeholder when none is attached. Does not trigger a link-mode
        guard; __str__ is allowed on links so a UUID is still loggable."""
        if self.proto.is_link or len(self.proto.identifiers) == 0:
            return str(Identifier(IdentifierProto()))
        return str(Identifier(self.proto.identifiers[0]))

    ###
    ### Bond specific functions. Bond fields live on the canonical bond_details
    ### sub-message; TIPS and FRN extras co-exist on tips_extension / frn_extension.
    ###
    def _get_bond_like_details(self):
        """Returns the canonical bond_details sub-message if populated, else None.

        TIPS and FRN extras live in tips_extension / frn_extension and co-exist
        with bond_details rather than replacing it.
        """
        if self.proto.HasField('bond_details'):
            return self.proto.bond_details
        return None

    def get_issue_date(self) -> datetime:
        self._ensure_hydrated("issue_date")
        bond = self._get_bond_like_details()
        if bond is None or not bond.HasField('issue_date'):
            raise ValueError("issue_date is not set; populate SecurityProto.bond_details.issue_date")
        return ProtoSerializationUtil.deserialize(bond.issue_date)

    def get_maturity_date(self) -> datetime:
        self._ensure_hydrated("maturity_date")
        bond = self._get_bond_like_details()
        if bond is None or not bond.HasField('maturity_date'):
            raise ValueError("maturity_date is not set; populate SecurityProto.bond_details.maturity_date")
        return ProtoSerializationUtil.deserialize(bond.maturity_date)

    def get_tenor(self) -> str:
        self._ensure_hydrated("tenor")
        return ProtoSerializationUtil.deserialize(self.proto.tenor)

    def get_face_value(self) -> float:
        self._ensure_hydrated("face_value")
        bond = self._get_bond_like_details()
        if bond is None or not bond.HasField('face_value'):
            raise ValueError("face_value is not set; populate SecurityProto.bond_details.face_value")
        return ProtoSerializationUtil.deserialize(bond.face_value)

    def get_product_type_proto(self) -> ProductTypeProto:
        """Returns the leaf ProductTypeProto carried by the proto.
        For tree walks (parentOf, descendantsOf), see ProductHierarchy."""
        self._ensure_hydrated("product_type")
        return self.proto.product_type

    def get_description(self) -> str:
        return self.proto.description

    def is_deleted(self, as_of: Optional[datetime] = None) -> bool:
        """Time-based soft-delete check. A Security is considered deleted iff
        it carries a ``valid_to`` that has already elapsed at ``as_of``. A
        future-dated ``valid_to`` means the row is still live today and
        becomes deleted automatically when ``as_of`` catches up. An unset
        ``valid_to`` is always active.

        Canonical soft-delete check across the platform — the predecessor
        ``SecurityProto.deleted_at`` field has been removed (tag 15
        reserved). See /specs/soft-delete-validto-collapse.md
        (FinTekkers/second-brain#316).
        """
        if not self.proto.HasField("valid_to"):
            return False
        if as_of is None:
            as_of = datetime.now(timezone.utc)
        valid_to: datetime = ProtoSerializationUtil.deserialize(self.proto.valid_to)
        return valid_to < as_of

    def __str__(self):
        return f'ID[{self._primary_identifier_str()}], {type(self).__name__}[{self.proto.issuer_name}]'

    def __eq__(self, other):
        if isinstance(other, Security):
            return self.get_id() == other.get_id()
        else:
            return False

    def __lt__(self, other):
        if isinstance(other, Security):
            return self.get_id() < other.get_id()
        else:
            return False

    def __hash__(self):
        return hash(self.get_id())


def _datetime_to_local_timestamp(as_of: datetime) -> LocalTimestampProto:
    """Convert a Python datetime to a LocalTimestampProto. Used by
    Security.link_of() to populate the link's as_of from a caller-supplied
    datetime. Tzaware datetimes preserve their zone id; naive datetimes are
    treated as UTC."""
    if as_of.tzinfo is None:
        zone = "UTC"
        epoch = as_of.replace(tzinfo=None)
        from datetime import timezone as _tz
        seconds_total = int(as_of.replace(tzinfo=_tz.utc).timestamp())
        nanos = as_of.microsecond * 1000
    else:
        zone = str(as_of.tzinfo)
        seconds_total = int(as_of.timestamp())
        nanos = as_of.microsecond * 1000
    return LocalTimestampProto(
        timestamp=Timestamp(seconds=seconds_total, nanos=nanos),
        time_zone=zone,
    )
