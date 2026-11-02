import warnings
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
    valuation input type in hierarchy.json valuation_input_types, or is listed
    there as unpriced. Services map it to gRPC INVALID_ARGUMENT. A sibling of
    ModelValidationError, not a state error (docs/adr/valuation_input_types.md)."""

    def __init__(self, product_type: str, coupon_type: str):
        self.product_type = product_type
        self.coupon_type = coupon_type
        super().__init__(
            f"No valuation input type for product_type {product_type}, coupon_type {coupon_type}"
        )


class MissingMarketDataError(ModelValidationError):
    """Typed input error: the security's valuation input type requires market
    data (hierarchy.json valuation_input_types `requires`) that the caller did
    not supply, e.g. input type `tips` with no `CPI_U`. Raised by
    product_inputs.for_security and ValuationRequests.typed. Carries one
    violation on the input type's field, e.g. `tips.cpi`
    (docs/adr/product_input_builders.md)."""

    def __init__(self, input_type: Optional[str] = None, kind: Optional[str] = None,
                 field: Optional[str] = None, object_id: Optional[UUID] = None, *,
                 arm: Optional[str] = None):
        """`kind` is the MarketDataKind value, e.g. "CPI_U". `arm=` is the
        deprecated keyword for `input_type` (LM-418)."""
        if arm is not None:
            warnings.warn("MissingMarketDataError(arm=...) is deprecated; use input_type",
                          DeprecationWarning, stacklevel=2)
            if input_type is not None:
                raise TypeError("MissingMarketDataError takes input_type or arm, not both")
            input_type = arm
        if input_type is None or kind is None or field is None:
            raise TypeError("MissingMarketDataError needs input_type, kind and field")
        self.input_type = input_type
        self.kind = kind
        super().__init__([violation(field, object_id, f"missing market data {kind} for input type {input_type}")])

    @property
    def arm(self) -> str:
        """Deprecated: use input_type. Removed in a later release (LM-418)."""
        warnings.warn("MissingMarketDataError.arm is deprecated; use input_type", DeprecationWarning, stacklevel=2)
        return self.input_type


class InvalidRegistryError(RuntimeError):
    """hierarchy.json itself is broken (e.g. a valuation_input_types requires value
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
