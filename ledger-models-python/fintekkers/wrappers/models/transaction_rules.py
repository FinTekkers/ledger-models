"""Transaction input rules: Python counterpart of Java's TransactionRules
(docs/adr/typed-input-errors.md). Pure: proto in, violations out.

The security rules run on an inline security, with field paths prefixed
`security.`. Child structure (LM-438) is checked at every level of
child_transactions: at most one cash child, and no two children with the
same UUID. Each violation is on `child_transactions[i]` (nested:
`child_transactions[1].child_transactions[0]`) and its object_id is the UUID
of the transaction that owns the list. A child with no UUID, or an empty one,
is never a duplicate. A child whose security is a link is not counted as
cash: hydrate it first.

Trade price (LM-463): an inline `price` (not is_link) whose raw price_type is
UNKNOWN_PRICE_TYPE gives one violation on `price.price_type`, with object_id
the price's UUID. Every other value passes, including an unrecognised number.
A link price is never checked, and child transactions' prices are not
checked. The Transaction wrapper does not call these rules,
so stored rows that break them still load; writers such as loaders call
`validate` / `require_valid` before sending.
"""

from typing import Optional
from uuid import UUID

from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.util.errors.field_violation_pb2 import FieldViolationProto
from fintekkers.wrappers.models import price_rules
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.security import security_rules

SECURITY_PREFIX = "security."
CHILD_TRANSACTIONS = "child_transactions"
SECOND_CASH_CHILD = "second cash child"
DUPLICATE_CHILD_ID = "duplicate child id"
PRICE_PREFIX = "price."
UNKNOWN_TRADE_PRICE_TYPE = "price_type is UNKNOWN_PRICE_TYPE on an inline trade price"


def validate(proto: TransactionProto) -> list[FieldViolationProto]:
    """Returns every field-level violation on this transaction, or an empty
    list when it is valid."""
    out: list[FieldViolationProto] = []
    if proto.HasField("security"):
        for v in security_rules.validate(proto.security):
            prefixed = FieldViolationProto()
            prefixed.CopyFrom(v)
            prefixed.field = SECURITY_PREFIX + v.field
            out.append(prefixed)
    _add_child_violations(proto, "", out)
    _add_price_violation(proto, out)
    return out


def require_valid(proto: TransactionProto) -> None:
    """Raises ModelValidationError carrying every violation if `validate` finds any."""
    violations = validate(proto)
    if violations:
        raise ModelValidationError(violations)


def _add_child_violations(parent: TransactionProto, prefix: str, out: list[FieldViolationProto]) -> None:
    parent_id = _id_of(parent.uuid)
    seen_cash = False
    first_cash_id: Optional[UUID] = None
    seen_ids: set[UUID] = set()
    for i, child in enumerate(parent.childTransactions):
        field = f"{prefix}{CHILD_TRANSACTIONS}[{i}]"
        child_id = _id_of(child.uuid)
        if _is_cash(child):
            if seen_cash:
                out.append(violation(field, parent_id,
                                     f"{SECOND_CASH_CHILD}: transaction {parent_id} already has cash child "
                                     f"{first_cash_id}; {child_id} is a second one"))
            else:
                seen_cash = True
                first_cash_id = child_id
        if child_id is not None:
            if child_id in seen_ids:
                out.append(violation(field, parent_id,
                                     f"{DUPLICATE_CHILD_ID}: transaction {parent_id} already has a child "
                                     f"with id {child_id}"))
            seen_ids.add(child_id)
        _add_child_violations(child, field + ".", out)


def _add_price_violation(proto: TransactionProto, out: list[FieldViolationProto]) -> None:
    """LM-463: an inline trade price must have a price_type; a link price is never checked."""
    if not proto.HasField("price"):
        return
    price = proto.price
    if price.is_link:
        return
    # Raw number, so an unrecognised value is not rejected.
    if price.price_type == PriceTypeProto.UNKNOWN_PRICE_TYPE:
        out.append(violation(PRICE_PREFIX + price_rules.PRICE_TYPE,
                             _id_of(price.uuid),
                             UNKNOWN_TRADE_PRICE_TYPE))


def _is_cash(child: TransactionProto) -> bool:
    """Same test as Java Security.isCash() on an inline security; a link is not cash."""
    if not child.HasField("security"):
        return False
    security = child.security
    if security.is_link:
        return False
    return security.product_type == ProductTypeProto.CURRENCY or security.HasField("cash_details")


def _id_of(uuid: UUIDProto) -> Optional[UUID]:
    """The UUID, or None when it is unset (empty) or not 16 bytes."""
    if len(uuid.raw_uuid) != 16:
        return None
    return UUID(bytes=uuid.raw_uuid)
