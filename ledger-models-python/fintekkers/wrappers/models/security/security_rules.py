"""Security input rules: Python counterpart of Java's SecurityRules
(docs/adr/typed-input-errors.md). Pure: proto in, violations out.

Holds the TBILL coupon rule (LM-258, docs/adr/tbill_coupon_validation.md);
LM-255b adds the bond rules Java already has.
The wrapper constructors do not call these rules, so stored rows that break
them still load; writers call `validate` / `require_valid` before saving.
"""

from decimal import Decimal, InvalidOperation
from typing import Optional
from uuid import UUID

from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.requests.util.errors.field_violation_pb2 import FieldViolationProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation

COUPON_RATE = "bond_details.coupon_rate"


def validate(proto: SecurityProto) -> list[FieldViolationProto]:
    """Returns every field-level violation on this security, or an empty
    list when it is valid. A link security returns an empty list: hydrate it
    first to have its fields checked."""
    if proto.is_link:
        return []
    out: list[FieldViolationProto] = []
    coupon = _tbill_coupon_violation(proto, _object_id_of(proto))
    if coupon is not None:
        out.append(coupon)
    return out


def require_valid(proto: SecurityProto) -> None:
    """Raises ModelValidationError carrying every violation if `validate` finds any."""
    violations = validate(proto)
    if violations:
        raise ModelValidationError(violations)


def _tbill_coupon_violation(proto: SecurityProto, object_id: Optional[UUID]) -> Optional[FieldViolationProto]:
    """A TBILL pays no coupon, so coupon_rate must be unset or 0. Uses the
    explicit product_type only. Units are not checked. A value that does not
    parse is skipped."""
    if proto.product_type != ProductTypeProto.TBILL:
        return None
    if not proto.HasField("bond_details") or not proto.bond_details.HasField("coupon_rate"):
        return None
    raw = proto.bond_details.coupon_rate.arbitrary_precision_value
    if raw == "":
        return None
    try:
        coupon = Decimal(raw)
    except InvalidOperation:
        return None
    if not coupon.is_finite() or coupon == 0:
        return None
    return violation(COUPON_RATE, object_id, f"coupon_rate must be null or 0 for a TBILL: coupon_rate={raw}")


def _object_id_of(proto: SecurityProto) -> Optional[UUID]:
    """The security's UUID, or None when it has none or it is not 16 bytes."""
    if not proto.HasField("uuid") or len(proto.uuid.raw_uuid) != 16:
        return None
    return UUID(bytes=proto.uuid.raw_uuid)
