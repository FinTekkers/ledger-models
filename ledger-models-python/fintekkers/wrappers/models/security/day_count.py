"""Bond day-count conventions (LM-498). Same rules in Java / Rust / Python /
JS-TS. See docs/adr/day_count_convention.md; the DayCountConventionProto
comments are the spec.

Two halves that change for different reasons:

- The resolver (resolve_day_count) picks a bond's convention: an explicit
  BondDetailsProto.day_count other than UNKNOWN_DAY_COUNT wins, else the
  default_day_count entry of ledger-models-protos/hierarchy.json for the
  security's product_type (deepest node on the parent chain wins), else
  UNKNOWN_DAY_COUNT. It never raises for a product with no entry and never
  guesses a convention. A broken section raises InvalidRegistryError.
- The date helpers (day_count, year_fraction, icma_*) are plain date
  arithmetic. They never read hierarchy.json, so a broken registry cannot
  break them. Results are floats: fine for fractions, not for decimal cash
  amounts. Bad input raises ModelValidationError.
"""

from __future__ import annotations

from datetime import date
from functools import lru_cache
from types import MappingProxyType
from typing import Any, Mapping, Optional

from fintekkers.models.security.day_count_convention_pb2 import DayCountConventionProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.errors import InvalidRegistryError, ModelValidationError, violation
from fintekkers.wrappers.models.security import product_hierarchy

_SECTION = "default_day_count"
_UNKNOWN = DayCountConventionProto.Name(DayCountConventionProto.UNKNOWN_DAY_COUNT)


# ---------- resolver: hierarchy.json default_day_count ----------

class DefaultDayCounts:
    """A parsed, checked default_day_count section: node -> DayCountConventionProto value."""

    def __init__(self, entries: Mapping[str, int]):
        self._entries = MappingProxyType(dict(entries))

    @property
    def entries(self) -> Mapping[str, int]:
        """node -> DayCountConventionProto value, as written in the section. Read-only."""
        return self._entries

    def default_for(self, product_type: str) -> int:
        """The deepest entry on product_type's parent chain, or UNKNOWN_DAY_COUNT."""
        node: Optional[str] = product_type
        while node is not None:
            if node in self._entries:
                return self._entries[node]
            node = product_hierarchy.parent_of(node)
        return DayCountConventionProto.UNKNOWN_DAY_COUNT


def parse_default_day_count(section: Any) -> DefaultDayCounts:
    """Parses and checks a default_day_count section against the shipped
    product_types tree and the DayCountConventionProto names. Raises
    InvalidRegistryError when the section is missing (None) or not an object,
    a key is not a product_types node, or a value is not a
    DayCountConventionProto name or is UNKNOWN_DAY_COUNT."""
    if section is None:
        raise _bad("section missing from hierarchy.json")
    if not isinstance(section, dict):
        raise _bad("section must be an object")
    product_types = set(product_hierarchy.all_product_types())
    entries = {}
    for node, name in section.items():
        if node not in product_types:
            raise _bad(f"node '{node}' is not in product_types")
        if not isinstance(name, str) or name not in DayCountConventionProto.keys():
            raise _bad(f"value {name!r} for node {node} is not a DayCountConventionProto name")
        if name == _UNKNOWN:
            raise _bad(f"node {node} must not default to {_UNKNOWN}")
        entries[node] = DayCountConventionProto.Value(name)
    return DefaultDayCounts(entries)


@lru_cache(maxsize=1)
def shipped() -> DefaultDayCounts:
    """The shipped default_day_count section, parsed and checked on first use."""
    return parse_default_day_count(product_hierarchy.registry_section(_SECTION))


def default_day_count_for(security: Optional[SecurityProto]) -> int:
    """The product default for the security's raw product_type, or
    UNKNOWN_DAY_COUNT when it has none. A missing security reads as
    PRODUCT_TYPE_UNKNOWN."""
    return shipped().default_for(_product_type_of(security))


def resolve_day_count(security: Optional[SecurityProto]) -> int:
    """The bond's day-count convention: bond_details.day_count when set to
    anything but UNKNOWN_DAY_COUNT, else the product default, else
    UNKNOWN_DAY_COUNT. Never guesses: a number this build does not know (a
    newer writer's value) is UNKNOWN_DAY_COUNT, not the product default."""
    if security is not None and security.HasField("bond_details"):
        bond = security.bond_details
        if bond.HasField("day_count") and bond.day_count != DayCountConventionProto.UNKNOWN_DAY_COUNT:
            if bond.day_count not in DayCountConventionProto.values():
                return DayCountConventionProto.UNKNOWN_DAY_COUNT
            return bond.day_count
    return default_day_count_for(security)


def _product_type_of(security: Optional[SecurityProto]) -> str:
    if security is None:
        return ProductTypeProto.Name(ProductTypeProto.PRODUCT_TYPE_UNKNOWN)
    try:
        return ProductTypeProto.Name(security.product_type)
    except ValueError:
        return str(security.product_type)


def _bad(detail: str) -> InvalidRegistryError:
    return InvalidRegistryError(f"hierarchy.json {_SECTION}: {detail}")


# ---------- date helpers: no registry access ----------

def day_count(convention: int, start: date, end: date) -> int:
    """Days from start (excluded) to end (included) under the convention.
    THIRTY_360_US applies the bond-basis rules; every other convention counts
    actual calendar days. Raises ModelValidationError for UNKNOWN_DAY_COUNT
    (or an unknown value) or start > end."""
    _check_convention(convention)
    _check_order(start, end)
    if convention == DayCountConventionProto.THIRTY_360_US:
        return _thirty_360_us(start, end)
    return (end - start).days


def year_fraction(convention: int, start: date, end: date) -> float:
    """Years from start to end: days / 360 for THIRTY_360_US and ACT_360,
    days / 365 for ACT_365_FIXED. ACT_ACT_ICMA needs the coupon period: use
    icma_year_fraction (this raises ModelValidationError for it)."""
    if convention == DayCountConventionProto.ACT_ACT_ICMA:
        raise _invalid("convention", "ACT_ACT_ICMA needs the coupon period: use icma_year_fraction")
    days = day_count(convention, start, end)
    if convention == DayCountConventionProto.ACT_365_FIXED:
        return days / 365
    return days / 360


def icma_period_fraction(start: date, end: date, period_start: date, period_end: date) -> float:
    """ACT/ACT ICMA: actual days start -> end over actual days in the regular
    coupon period that contains them. Raises ModelValidationError unless
    period_start <= start <= end <= period_end and period_start < period_end."""
    _check_period(start, end, period_start, period_end)
    return (end - start).days / (period_end - period_start).days


def icma_year_fraction(start: date, end: date, period_start: date, period_end: date, frequency: int) -> float:
    """ACT/ACT ICMA in years: days / (frequency x period days), frequency
    being coupons a year (2 for semiannual). Raises ModelValidationError as
    icma_period_fraction does, or when frequency is not positive."""
    if isinstance(frequency, bool) or not isinstance(frequency, int) or frequency <= 0:
        raise _invalid("frequency", f"frequency must be a positive number of coupons a year, got {frequency!r}")
    return icma_period_fraction(start, end, period_start, period_end) / frequency


def _thirty_360_us(start: date, end: date) -> int:
    d1, d2 = start.day, end.day
    if d1 == 31:
        d1 = 30
    if d2 == 31 and d1 >= 30:
        d2 = 30
    return 360 * (end.year - start.year) + 30 * (end.month - start.month) + (d2 - d1)


def _check_convention(convention: int) -> None:
    if convention == DayCountConventionProto.UNKNOWN_DAY_COUNT or convention not in DayCountConventionProto.values():
        raise _invalid("convention", f"no day-count convention to apply (got {convention!r})")


def _check_order(start: date, end: date) -> None:
    if start > end:
        raise _invalid("end", f"start {start} is after end {end}")


def _check_period(start: date, end: date, period_start: date, period_end: date) -> None:
    _check_order(start, end)
    if period_start >= period_end:
        raise _invalid("period_end", f"period_start {period_start} must be before period_end {period_end}")
    if start < period_start or end > period_end:
        raise _invalid("period_start",
                       f"{start} -> {end} is outside the coupon period {period_start} -> {period_end}")


def _invalid(field: str, message: str) -> ModelValidationError:
    return ModelValidationError([violation(field, None, message)])
