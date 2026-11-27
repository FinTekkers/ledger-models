"""Price input rules (LM-289): Python counterpart of Java's PriceRules
(docs/adr/typed-input-errors.md). Pure: proto in, violations out.

Rules, checked in this order: `security` has a non-empty UUID; at least one
of mid, bid and ask has a non-empty unscaled_value (zero is valid, see the
PriceProto comment), else a violation on `mid`; when bid and ask are both
set, ask >= bid, else a violation on `ask` (LM-508); and `price_type` is not
UNKNOWN_PRICE_TYPE. Only bid and ask are parsed, for the comparison; an
unreadable one skips it. Never raises on bad or unset input; None is checked as an empty
PriceProto. Unlike security_rules, a link price is not skipped: hydrate it
first. The Price wrapper does not call these rules.
"""

from typing import Optional
from uuid import UUID

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.price.price_source_pb2 import PriceSourceProto
from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.requests.util.errors.field_violation_pb2 import FieldViolationProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.util.decimal import decode_decimal, is_decimal_set

SECURITY = "security"
# LM-508: field 10, named `price` before.
MID = "mid"
BID = "bid"
ASK = "ask"
# Deprecated alias: LM-508 renamed field 10 to `mid`. Use MID.
PRICE = MID
PRICE_TYPE = "price_type"


def validate(proto: Optional[PriceProto]) -> list[FieldViolationProto]:
    """Returns every field-level violation on this price, or an empty list
    when it is valid."""
    p = proto if proto is not None else PriceProto()
    object_id = _object_id_of(p)
    out: list[FieldViolationProto] = []
    if not p.HasField("security") or not p.security.HasField("uuid") or not p.security.uuid.raw_uuid:
        out.append(violation(SECURITY, object_id, "security with a non-empty uuid is required"))
    has_mid, has_bid, has_ask = (p.HasField(f) and is_decimal_set(getattr(p, f)) for f in (MID, BID, ASK))
    if not (has_mid or has_bid or has_ask):
        out.append(violation(MID, object_id, "one of mid, bid or ask is required"))
    if has_bid and has_ask and _is_below(p.ask, p.bid):
        out.append(violation(ASK, object_id, "ask must not be less than bid"))
    if p.price_type == PriceTypeProto.UNKNOWN_PRICE_TYPE:
        out.append(violation(PRICE_TYPE, object_id, "price_type must not be UNKNOWN_PRICE_TYPE"))
    return out


def require_valid(proto: Optional[PriceProto]) -> None:
    """Raises ModelValidationError carrying every violation if `validate` finds any."""
    violations = validate(proto)
    if violations:
        raise ModelValidationError(violations)


def is_market_price(proto: Optional[PriceProto]) -> bool:
    """True when price_source is unset or MARKET; False for TRADE or an
    unrecognised value, so a new source is never read as market by accident.
    None reads as unset. Not a validation rule: an unset source is valid. See
    docs/adr/price_source.md."""
    p = proto if proto is not None else PriceProto()
    return p.price_source in (PriceSourceProto.UNKNOWN_PRICE_SOURCE, PriceSourceProto.MARKET)


def _is_below(ask: DecimalValueProto, bid: DecimalValueProto) -> bool:
    """True when ask < bid; False when either is unreadable, so validate never raises."""
    try:
        return decode_decimal(ask) < decode_decimal(bid)
    except ModelValidationError:
        return False


def _object_id_of(proto: PriceProto) -> Optional[UUID]:
    """The price's UUID, or None when it has none or it is not 16 bytes."""
    if not proto.HasField("uuid") or len(proto.uuid.raw_uuid) != 16:
        return None
    return UUID(bytes=proto.uuid.raw_uuid)
