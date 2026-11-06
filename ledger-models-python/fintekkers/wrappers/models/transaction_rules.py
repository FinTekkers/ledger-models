"""Transaction input rules: Python counterpart of Java's TransactionRules
(docs/adr/typed-input-errors.md). Pure: proto in, violations out.

The security rules run on an inline security, with field paths prefixed
`security.`. Child structure (LM-438) is checked at every level of
child_transactions: at most one cash child, and no two children with the
same UUID. Each violation is on `child_transactions[i]` (nested:
`child_transactions[1].child_transactions[0]`) and its object_id is the UUID
of the transaction that owns the list. A child with no UUID, or an empty one,
is never a duplicate. A child whose security is a link is not counted as
cash: hydrate it first. The Transaction wrapper does not call these rules,
so stored rows that break them still load; writers such as loaders call
`validate` / `require_valid` before sending.
"""

from typing import Optional
from uuid import UUID

from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.requests.util.errors.field_violation_pb2 import FieldViolationProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.security import security_rules

SECURITY_PREFIX = "security."
CHILD_TRANSACTIONS = "child_transactions"
SECOND_CASH_CHILD = "second cash child"
DUPLICATE_CHILD_ID = "duplicate child id"


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
    return out


def require_valid(proto: TransactionProto) -> None:
    """Raises ModelValidationError carrying every violation if `validate` finds any."""
    violations = validate(proto)
    if violations:
        raise ModelValidationError(violations)


def _add_child_violations(parent: TransactionProto, prefix: str, out: list[FieldViolationProto]) -> None:
    parent_id = _id_of(parent)
    seen_cash = False
    first_cash_id: Optional[UUID] = None
    seen_ids: set[UUID] = set()
    for i, child in enumerate(parent.childTransactions):
        field = f"{prefix}{CHILD_TRANSACTIONS}[{i}]"
        child_id = _id_of(child)
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


def _is_cash(child: TransactionProto) -> bool:
    """Same test as Java Security.isCash() on an inline security; a link is not cash."""
    if not child.HasField("security"):
        return False
    security = child.security
    if security.is_link:
        return False
    return security.product_type == ProductTypeProto.CURRENCY or security.HasField("cash_details")


def _id_of(proto: TransactionProto) -> Optional[UUID]:
    """The transaction's UUID, or None when it has none or it is not 16 bytes."""
    if not proto.HasField("uuid") or len(proto.uuid.raw_uuid) != 16:
        return None
    return UUID(bytes=proto.uuid.raw_uuid)
