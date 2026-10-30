"""Which ProductInput arm values a security, and which market data that arm
needs. Backed by the valuation_arms section of
ledger-models-protos/hierarchy.json; there is no mapping table in code. Same
rule in Java / Rust / Python / JS-TS. See docs/adr/valuation_arms.md.

Resolution walks from the security's product_type up its parent chain. At each
node a coupon_types entry matching bond_details.coupon_type wins, then the
node's plain entry, then an unpriced listing. The first node with any match
decides. No match, or an unpriced match, raises UnmappedProductTypeError:
there is no default arm. A broken section raises InvalidRegistryError.
"""

from __future__ import annotations

from enum import Enum
from functools import lru_cache
from typing import Any, Dict, FrozenSet, List, NamedTuple, Optional, Set, Tuple

from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.requests.valuation.product_inputs_pb2 import ProductInput
from fintekkers.wrappers.models.errors import InvalidRegistryError, UnmappedProductTypeError
from fintekkers.wrappers.models.security import product_hierarchy

_UNKNOWN_COUPON = CouponTypeProto.Name(CouponTypeProto.UNKNOWN_COUPON_TYPE)


class MarketDataKind(str, Enum):
    """The closed requires vocabulary: market data an arm needs beyond the price."""

    CPI_U = "CPI_U"
    FRN_FIXINGS = "FRN_FIXINGS"
    FRN_CURVE = "FRN_CURVE"


class _Arm(NamedTuple):
    arm: str
    requires: Tuple[MarketDataKind, ...]


class _ValuationArms:
    """A parsed, checked valuation_arms section."""

    def __init__(self, entries: Dict[str, Dict[Optional[str], _Arm]], unpriced: FrozenSet[str]):
        # node -> coupon type name (None for the plain entry) -> arm
        self._entries = entries
        self._unpriced = unpriced

    def resolve(self, product_type: str, coupon_type: str) -> Optional[_Arm]:
        """The deepest matching node's arm, or None when unmapped or unpriced."""
        node: Optional[str] = product_type
        while node is not None:
            by_coupon = self._entries.get(node)
            if by_coupon is not None:
                arm = by_coupon.get(coupon_type) or by_coupon.get(None)
                if arm is not None:
                    return arm
            if node in self._unpriced:
                return None
            node = product_hierarchy.parent_of(node)
        return None

    def require(self, product_type: str, coupon_type: str) -> _Arm:
        arm = self.resolve(product_type, coupon_type)
        if arm is None:
            raise UnmappedProductTypeError(product_type, coupon_type)
        return arm

    def _covers(self, product_type: str) -> bool:
        node: Optional[str] = product_type
        while node is not None:
            if node in self._entries or node in self._unpriced:
                return True
            node = product_hierarchy.parent_of(node)
        return False

    def uncovered_leaves(self) -> List[str]:
        """Leaf product types (active and planned) with neither an entry nor an
        unpriced listing."""
        return [
            n for n in product_hierarchy.all_product_types()
            if not product_hierarchy.descendants_of(n) and not self._covers(n)
        ]


def arm_for(security: SecurityProto) -> str:
    """Name of the ProductInput.input oneof field that values `security`, e.g. "tips"."""
    return _shipped().require(_product_type_of(security), _coupon_type_of(security)).arm


def required_market_data(security: SecurityProto) -> List[MarketDataKind]:
    """Market data the security's arm needs, in file order. A fresh list; empty when none."""
    return list(_shipped().require(_product_type_of(security), _coupon_type_of(security)).requires)


def _product_type_of(security: SecurityProto) -> str:
    return _enum_name(ProductTypeProto, security.product_type)


def _coupon_type_of(security: SecurityProto) -> str:
    """Read from the proto field only; unset bond_details reads as UNKNOWN_COUPON_TYPE."""
    if not security.HasField("bond_details"):
        return _UNKNOWN_COUPON
    return _enum_name(CouponTypeProto, security.bond_details.coupon_type)


def _enum_name(enum: Any, value: int) -> str:
    try:
        return enum.Name(value)
    except ValueError:
        return str(value)


@lru_cache(maxsize=1)
def _shipped() -> _ValuationArms:
    section = product_hierarchy.registry_section("valuation_arms")
    if section is None:
        raise InvalidRegistryError("hierarchy.json has no valuation_arms section")
    return _parse_valuation_arms(section)


def _bad(detail: str) -> InvalidRegistryError:
    return InvalidRegistryError(f"hierarchy.json valuation_arms: {detail}")


def _strings(body: Dict[str, Any], key: str) -> List[str]:
    values = body.get(key)
    if not isinstance(values, list) or not all(isinstance(v, str) for v in values):
        raise _bad(f"'{key}' must be a list of strings in {body!r}")
    return values


def _string(body: Dict[str, Any], key: str) -> str:
    value = body.get(key)
    if not isinstance(value, str):
        raise _bad(f"'{key}' must be a string in {body!r}")
    return value


def _parse_valuation_arms(section: Dict[str, Any]) -> _ValuationArms:
    """Parses and checks a valuation_arms section against the shipped
    product_types tree, the ProductInput oneof and the CouponTypeProto /
    MarketDataKind vocabularies. Raises InvalidRegistryError on any failure."""
    if not isinstance(section, dict):
        raise _bad("section must be an object")
    product_types = set(product_hierarchy.all_product_types())
    arms = {f.name for f in ProductInput.DESCRIPTOR.oneofs_by_name["input"].fields}
    coupon_types = set(CouponTypeProto.keys())
    kinds = {k.value: k for k in MarketDataKind}

    entries_raw = section.get("entries")
    if not isinstance(entries_raw, list):
        raise _bad("'entries' must be a list")
    entries: Dict[str, Dict[Optional[str], _Arm]] = {}
    for body in entries_raw:
        if not isinstance(body, dict):
            raise _bad(f"entry must be an object, got {body!r}")
        node = _string(body, "node")
        if node not in product_types:
            raise _bad(f"node '{node}' is not in product_types")
        arm = _string(body, "arm")
        if arm not in arms:
            raise _bad(f"arm '{arm}' is not a ProductInput.input field")
        requires = []
        for value in _strings(body, "requires"):
            if value not in kinds:
                raise _bad(f"requires value '{value}' is not one of CPI_U, FRN_FIXINGS, FRN_CURVE")
            requires.append(kinds[value])
        coupons: List[Optional[str]] = [None]
        if "coupon_types" in body:
            coupons = list(_strings(body, "coupon_types"))
            for c in coupons:
                if c not in coupon_types:
                    raise _bad(f"coupon_types value '{c}' is not a CouponTypeProto name")
        by_coupon = entries.setdefault(node, {})
        for c in coupons:
            if c in by_coupon:
                raise _bad(f"duplicate entry for node {node}" + (f", coupon_type {c}" if c else ""))
            by_coupon[c] = _Arm(arm, tuple(requires))

    unpriced: Set[str] = set()
    for node in _strings(section, "unpriced"):
        if node not in product_types:
            raise _bad(f"node '{node}' is not in product_types")
        if node in entries:
            raise _bad(f"node {node} is both mapped and unpriced")
        unpriced.add(node)
    return _ValuationArms(entries, frozenset(unpriced))
