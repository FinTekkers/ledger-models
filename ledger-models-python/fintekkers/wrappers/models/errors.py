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


class UnmappedProductTypeError(ValueError):
    """Typed input error: the security's product_type (and coupon_type) has no
    valuation arm in hierarchy.json valuation_arms, or is listed there as
    unpriced. Services map it to gRPC INVALID_ARGUMENT. A sibling of
    ModelValidationError, not a state error (docs/adr/valuation_arms.md)."""

    def __init__(self, product_type: str, coupon_type: str):
        self.product_type = product_type
        self.coupon_type = coupon_type
        super().__init__(
            f"No valuation arm for product_type {product_type}, coupon_type {coupon_type}"
        )


class InvalidRegistryError(RuntimeError):
    """hierarchy.json itself is broken (e.g. a valuation_arms requires value
    outside the closed vocabulary). Not a ValueError, so callers catching bad
    input never mistake a broken registry for it."""


def violation(field: str, object_id: Optional[UUID], message: str) -> FieldViolationProto:
    """Builds one violation. `object_id` may be None when the input had no UUID."""
    v = FieldViolationProto(field=field, message=message)
    if object_id is not None:
        v.object_id.CopyFrom(UUIDProto(raw_uuid=object_id.bytes))
    return v


def _object_id_of(v: FieldViolationProto) -> Optional[UUID]:
    return UUID(bytes=v.object_id.raw_uuid) if v.HasField("object_id") else None
