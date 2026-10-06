from typing import Optional
from uuid import UUID

from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.util.errors.field_violation_pb2 import FieldViolationProto


class ModelValidationError(ValueError):
    """Typed input error: the object handed to ledger-models has one or more
    bad or missing fields. Python counterpart of Java's
    ModelValidationException (docs/adr/typed-input-errors.md). Services map it
    to gRPC INVALID_ARGUMENT and can put `violations` as-is into
    ErrorProto.violations. Subclass of ValueError so existing
    `except ValueError` paths keep working."""

    def __init__(self, violations: list[FieldViolationProto]):
        if not violations:
            raise ValueError("ModelValidationError needs at least one violation")
        self.violations: tuple[FieldViolationProto, ...] = tuple(violations)
        super().__init__("; ".join(
            f"{v.field}: {v.message} (id {_object_id_of(v)})" for v in self.violations
        ))

    @property
    def field(self) -> str:
        """Field path of the first violation, e.g. `bond_details.coupon_rate`."""
        return self.violations[0].field

    @property
    def object_id(self) -> Optional[UUID]:
        """UUID of the object that owns the first bad field, or None if unset."""
        return _object_id_of(self.violations[0])


def violation(field: str, object_id: Optional[UUID], message: str) -> FieldViolationProto:
    """Builds one violation. `object_id` may be None when the input had no UUID."""
    v = FieldViolationProto(field=field, message=message)
    if object_id is not None:
        v.object_id.CopyFrom(UUIDProto(raw_uuid=object_id.bytes))
    return v


def _object_id_of(v: FieldViolationProto) -> Optional[UUID]:
    return UUID(bytes=v.object_id.raw_uuid) if v.HasField("object_id") else None
