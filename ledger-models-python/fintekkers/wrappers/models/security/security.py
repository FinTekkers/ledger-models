from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.position.field_pb2 import *
from fintekkers.models.position.measure_pb2 import MeasureProto

from uuid import UUID
from datetime import datetime
from typing import Optional
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.wrappers.models.security.security_identifier import Identifier

from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil

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
        return f"ID[{str(self.get_id())}], {self.get_security_id()}[{self.proto.issuer_name}]"

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

    def _assert_not_link(self, accessor: str) -> None:
        if self.proto.is_link:
            raise RuntimeError(
                f"Cannot read {accessor} on a link-mode Security (is_link=true). "
                f"Resolve via SecurityService.GetByIds first. "
                f"See docs/adr/is_link_pattern.md."
            )

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
            return self.get_security_id()
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
        self._assert_not_link("asset_class")
        return self.proto.asset_class

    def get_product_class(self) -> str:
        self._assert_not_link("product_class")
        raise ValueError("Not implemented yet. See Java implementation for reference")

    def get_product_type(self) -> object:
        self._assert_not_link("product_type")
        raise ValueError("Not implemented yet. See Java implementation for reference")

    def get_security_id(self) -> Identifier:
        self._assert_not_link("security_id")
        id:IdentifierProto = self.proto.identifier
        return Identifier(id)
    
    ###
    ### Bond specific functions. These prefer the oneof product_details sub-message
    ### if set, falling back to flat fields for backward compatibility.
    ###
    def _get_bond_like_details(self):
        """Returns the canonical bond_details sub-message if populated, else None.

        v0.3.0 collapsed bond/tips/frn into a single bond_details. TIPS and FRN
        extras live in tips_extension / frn_extension and co-exist with
        bond_details rather than replacing it.
        """
        if self.proto.HasField('bond_details'):
            return self.proto.bond_details
        return None

    def get_issue_date(self) -> datetime:
        self._assert_not_link("issue_date")
        bond = self._get_bond_like_details()
        src = bond.issue_date if bond and bond.HasField('issue_date') else self.proto.issue_date
        return ProtoSerializationUtil.deserialize(src)

    def get_maturity_date(self) -> datetime:
        self._assert_not_link("maturity_date")
        bond = self._get_bond_like_details()
        src = bond.maturity_date if bond and bond.HasField('maturity_date') else self.proto.maturity_date
        return ProtoSerializationUtil.deserialize(src)

    def get_tenor(self) -> str:
        self._assert_not_link("tenor")
        return ProtoSerializationUtil.deserialize(self.proto.tenor)

    def get_face_value(self) -> float:
        self._assert_not_link("face_value")
        bond = self._get_bond_like_details()
        src = bond.face_value if bond and bond.HasField('face_value') else self.proto.face_value
        return ProtoSerializationUtil.deserialize(src)

    def get_product_type_proto(self) -> ProductTypeProto:
        """Returns the leaf ProductTypeProto carried by the proto.
        For tree walks (parentOf, descendantsOf), see ProductHierarchy."""
        self._assert_not_link("product_type")
        return self.proto.product_type

    def get_description(self) -> str:
        return self.proto.description

    def __str__(self):
        return f'ID[{str(self.get_security_id())}], {type(self).__name__}[{self.proto.issuer_name}]'

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
