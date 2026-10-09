"""Row filtering with the shared asset-class rule (LM-281).

Mirrors Java's ``PositionFilter.matches`` / ``PositionFilter.filter``: a row
matches every ``(field, operator, filter value)`` clause (AND semantics,
input order preserved). ``ASSET_CLASS`` with ``EQUALS`` / ``NOT_EQUALS`` uses
the shared ``product_hierarchy.asset_class_matches`` rule, so a group code
such as ``FIXED_INCOME`` matches its members and labels; every other field
compares exactly.

A ``None`` stored value never throws and drops the row for every operator,
except ``ASSET_CLASS`` with ``NOT_EQUALS``, which keeps it (LM-281). The
``None`` check in ``matches`` runs before the ``ASSET_CLASS`` branch, so it
handles that asset-class exception itself (LM-284). Errors raised by ``row.get_field``
propagate (a row represents an absent value by returning ``None``).
"""

from __future__ import annotations

from typing import Any, Iterable, List, Sequence, Tuple

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_util_pb2 import PositionFilterOperator
from fintekkers.wrappers.models.security import product_hierarchy as _ph

#: A single filter clause: ``(field, operator, filter value)``. Field and
#: operator are ``FieldProto`` / ``PositionFilterOperator`` values (ints).
FilterSpec = Tuple[int, int, Any]


def matches(field: int, operator: int, filter_value: Any, stored_value: Any) -> bool:
    """True iff a row's stored value satisfies one filter clause.

    ``field`` / ``operator`` are ``FieldProto`` / ``PositionFilterOperator``
    values. An unknown operator matches nothing.
    """
    if stored_value is None:
        return (
            field == FieldProto.ASSET_CLASS
            and operator == PositionFilterOperator.NOT_EQUALS
        )
    if field == FieldProto.ASSET_CLASS and operator in (
        PositionFilterOperator.EQUALS,
        PositionFilterOperator.NOT_EQUALS,
    ):
        equals = _ph.asset_class_matches(filter_value, stored_value)
        return equals if operator == PositionFilterOperator.EQUALS else not equals
    if operator == PositionFilterOperator.EQUALS:
        return stored_value == filter_value
    if operator == PositionFilterOperator.NOT_EQUALS:
        return stored_value != filter_value
    if operator == PositionFilterOperator.LESS_THAN:
        return stored_value < filter_value
    if operator == PositionFilterOperator.LESS_THAN_OR_EQUALS:
        return stored_value <= filter_value
    if operator == PositionFilterOperator.MORE_THAN:
        return stored_value > filter_value
    if operator == PositionFilterOperator.MORE_THAN_OR_EQUALS:
        return stored_value >= filter_value
    return False


def filter_rows(rows: Iterable[Any], filters: Sequence[FilterSpec]) -> List[Any]:
    """Keep the rows matching every clause in ``filters``.

    Each row exposes ``get_field(field)`` (``Security`` / ``Position``
    wrappers do). Rows are returned in input order.
    """
    kept: List[Any] = []
    for row in rows:
        include = True
        for field, operator, filter_value in filters:
            if not matches(field, operator, filter_value, row.get_field(field)):
                include = False
                break
        if include:
            kept.append(row)
    return kept
