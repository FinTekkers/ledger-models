"""Price input rules (LM-289): Python counterpart of Java's PriceRules
(docs/adr/typed-input-errors.md). Pure: proto in, violations out.

Three rules, checked in this order: `security` has a non-empty UUID, `price`
has a non-empty unscaled_value (zero is valid, see the PriceProto
comment), and `price_type` is not UNKNOWN_PRICE_TYPE. The price value is not
parsed. Never raises on bad or unset input; None is checked as an empty
PriceProto. Unlike security_rules, a link price is not skipped: hydrate it
first. The Price wrapper does not call these rules.
"""

from typing import Optional
from uuid import UUID

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.requests.util.errors.field_violation_pb2 import FieldViolationProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.util.decimal import is_decimal_set

SECURITY = "security"
PRICE = "price"
PRICE_TYPE = "price_type"


def validate(proto: Optional[PriceProto]) -> list[FieldViolationProto]:
    """Returns every field-level violation on this price, or an empty list
    when it is valid."""
    p = proto if proto is not None else PriceProto()
    object_id = _object_id_of(p)
    out: list[FieldViolationProto] = []
    if not p.HasField("security") or not p.security.HasField("uuid") or not p.security.uuid.raw_uuid:
        out.append(violation(SECURITY, object_id, "security with a non-empty uuid is required"))
    if not p.HasField("price") or not is_decimal_set(p.price):
        out.append(violation(PRICE, object_id, "price is required"))
    if p.price_type == PriceTypeProto.UNKNOWN_PRICE_TYPE:
        out.append(violation(PRICE_TYPE, object_id, "price_type must not be UNKNOWN_PRICE_TYPE"))
    return out


def require_valid(proto: Optional[PriceProto]) -> None:
    """Raises ModelValidationError carrying every violation if `validate` finds any."""
    violations = validate(proto)
    if violations:
        raise ModelValidationError(violations)


def _object_id_of(proto: PriceProto) -> Optional[UUID]:
    """The price's UUID, or None when it has none or it is not 16 bytes."""
    if not proto.HasField("uuid") or len(proto.uuid.raw_uuid) != 16:
        return None
    return UUID(bytes=proto.uuid.raw_uuid)
