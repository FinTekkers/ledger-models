"""Which ProductInput input type values a security, and which market data that
input type needs. Backed by the valuation_input_types section of
ledger-models-protos/hierarchy.json; there is no mapping table in code. Same
rule in Java / Rust / Python / JS-TS. See docs/adr/valuation_input_types.md.

Resolution walks from the security's product_type up its parent chain. At each
node a coupon_types entry matching bond_details.coupon_type wins, then the
node's plain entry, then an unpriced listing. The first node with any match
decides. No match, or an unpriced match, raises UnmappedProductTypeError:
there is no default input type. A broken section raises InvalidRegistryError.

for_security builds the ProductInput for that input type from a security, its
price and its market data; check_product_input checks a ProductInput against the
same rule (LM-410). See docs/adr/product_input_builders.md.

measures_for_input_type lists the measures valuation-service computes for an
input type, read from the packaged catalog/measures.json through the same lookup (LM-427).
There is no measure list in code.

LM-418 renamed "arm" to "input type". arm_for and measures_for_arm stay one
release as deprecated aliases, and hierarchy.json still loads with the legacy
valuation_arms / arm keys.
"""

from __future__ import annotations

import json
import warnings
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from importlib import resources
from typing import Any, Dict, FrozenSet, List, NamedTuple, Optional, Set, Tuple
from uuid import UUID

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.coupon_type_pb2 import CouponTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.requests.valuation.product_inputs_pb2 import (
    BondInput,
    CashInput,
    EquityInput,
    FrnInput,
    InflationIndexInput,
    MbsInput,
    ProductInput,
    ReferenceRateFixingProto,
    TipsInput,
    YieldCurveInput,
)
from fintekkers.wrappers.models.errors import (
    InvalidRegistryError,
    MissingMarketDataError,
    ModelValidationError,
    UnmappedProductTypeError,
    violation,
)
from fintekkers.wrappers.models.security import product_hierarchy

_UNKNOWN_COUPON = CouponTypeProto.Name(CouponTypeProto.UNKNOWN_COUPON_TYPE)

_SECTION = "valuation_input_types"
_ENTRY_KEY = "input_type"
# Legacy names, still read for one release (LM-418).
_LEGACY_SECTION = "valuation_arms"
_LEGACY_ENTRY_KEY = "arm"


class MarketDataKind(str, Enum):
    """The closed requires vocabulary: market data an input type needs beyond the price."""

    CPI_U = "CPI_U"
    FRN_FIXINGS = "FRN_FIXINGS"
    FRN_CURVE = "FRN_CURVE"


class _InputTypeEntry(NamedTuple):
    input_type: str
    requires: Tuple[MarketDataKind, ...]


class _ValuationInputTypes:
    """A parsed, checked valuation_input_types section."""

    def __init__(self, entries: Dict[str, Dict[Optional[str], _InputTypeEntry]], unpriced: FrozenSet[str]):
        # node -> coupon type name (None for the plain entry) -> input type
        self._entries = entries
        self._unpriced = unpriced

    def resolve(self, product_type: str, coupon_type: str) -> Optional[_InputTypeEntry]:
        """The deepest matching node's input type, or None when unmapped or unpriced."""
        node: Optional[str] = product_type
        while node is not None:
            by_coupon = self._entries.get(node)
            if by_coupon is not None:
                entry = by_coupon.get(coupon_type) or by_coupon.get(None)
                if entry is not None:
                    return entry
            if node in self._unpriced:
                return None
            node = product_hierarchy.parent_of(node)
        return None

    def require(self, product_type: str, coupon_type: str) -> _InputTypeEntry:
        entry = self.resolve(product_type, coupon_type)
        if entry is None:
            raise UnmappedProductTypeError(product_type, coupon_type)
        return entry

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

    def __eq__(self, other: object) -> bool:
        """Same entries (every node, coupon type, input type and requires list)
        and same unpriced nodes."""
        if not isinstance(other, _ValuationInputTypes):
            return NotImplemented
        return self._entries == other._entries and self._unpriced == other._unpriced

    __hash__ = None  # type: ignore[assignment]

    @staticmethod
    def from_hierarchy(root: Dict[str, Any]) -> "_ValuationInputTypes":
        """Parses and checks the valuation_input_types section of a whole
        hierarchy.json `root`. For one release a root with the legacy
        valuation_arms key instead loads the same way (LM-418); a root with
        both keys, or neither, raises InvalidRegistryError."""
        if not isinstance(root, dict):
            raise _bad("hierarchy.json root must be an object")
        current = _SECTION in root
        legacy = _LEGACY_SECTION in root
        if current and legacy:
            raise _bad(f"both {_SECTION} and {_LEGACY_SECTION} present")
        if not current and not legacy:
            raise InvalidRegistryError(f"hierarchy.json has no {_SECTION} section")
        return _parse_valuation_input_types(root[_SECTION if current else _LEGACY_SECTION])


def input_type_for(security: SecurityProto) -> str:
    """Name of the ProductInput.input oneof field that values `security`, e.g. "tips"."""
    return _shipped().require(_product_type_of(security), _coupon_type_of(security)).input_type


def arm_for(security: SecurityProto) -> str:
    """Deprecated: use input_type_for. Removed in a later release (LM-418)."""
    warnings.warn("arm_for is deprecated; use input_type_for", DeprecationWarning, stacklevel=2)
    return input_type_for(security)


def required_market_data(security: SecurityProto) -> List[MarketDataKind]:
    """Market data the security's input type needs, in file order. A fresh list; empty when none."""
    return list(_shipped().require(_product_type_of(security), _coupon_type_of(security)).requires)


def measures_for_input_type(input_type: str) -> List[int]:
    """The MeasureProto values valuation-service computes for `input_type` (e.g.
    "frn"), in catalog order: entries of the packaged catalog/measures.json
    with computed_by valuation-service and implemented true whose applies_to
    names a leaf product type the input type values, or an ancestor of one. Raises
    UnmappedProductTypeError(input_type, "UNKNOWN_COUPON_TYPE") when no leaf maps
    to `input_type`. A fresh list."""
    return _measures_for_input_type_in(_shipped_measures(), input_type)


def measures_for_arm(arm: str) -> List[int]:
    """Deprecated: use measures_for_input_type. Removed in a later release (LM-418)."""
    warnings.warn("measures_for_arm is deprecated; use measures_for_input_type", DeprecationWarning, stacklevel=2)
    return measures_for_input_type(arm)


def _measures_for_input_type_in(measures: List[Dict[str, Any]], input_type: str) -> List[int]:
    """measures_for_input_type over a given `measures` list."""
    input_types = _shipped()
    # Leaves resolve with no coupon type, as input_type_for does with no bond_details:
    # the BOND + FLOAT entry is ignored on purpose (docs/adr/valuation_input_types.md).
    leaves = [
        n for n in product_hierarchy.all_product_types()
        if not product_hierarchy.descendants_of(n) and n in ProductTypeProto.keys()
    ]
    lineage: Set[str] = set()
    for leaf in leaves:
        resolved = input_types.resolve(leaf, _UNKNOWN_COUPON)
        if resolved is None or resolved.input_type != input_type:
            continue
        node: Optional[str] = leaf
        while node is not None:
            lineage.add(node)
            node = product_hierarchy.parent_of(node)
    if not lineage:
        raise UnmappedProductTypeError(input_type, _UNKNOWN_COUPON)
    out: List[int] = []
    for m in measures:
        if m.get("computed_by") != "valuation-service" or m.get("implemented") is not True:
            continue
        applies_to = m.get("applies_to")
        if not isinstance(applies_to, list):
            raise InvalidRegistryError(f"catalog/measures.json: 'applies_to' must be a list in {m!r}")
        if not any(node in lineage for node in applies_to):
            continue
        name = m.get("name")
        if name not in MeasureProto.keys():
            raise InvalidRegistryError(f"catalog/measures.json: '{name}' is not a MeasureProto name")
        value = MeasureProto.Value(name)
        if value not in out:
            out.append(value)
    return out


@lru_cache(maxsize=1)
def _shipped_measures() -> List[Dict[str, Any]]:
    """The packaged catalog's measures list. Read from the package only, with
    no repo-path fallback."""
    with resources.files("fintekkers.catalog").joinpath("measures.json").open("r", encoding="utf-8") as f:
        measures = json.load(f).get("measures")
    if not isinstance(measures, list):
        raise InvalidRegistryError("catalog/measures.json has no measures list")
    return measures


@dataclass(frozen=True)
class MarketData:
    """Market data for for_security, one field per MarketDataKind: CPI_U is
    `cpi`, FRN_FIXINGS is `fixings`, FRN_CURVE is `curve`. Each is copied to
    the input type field of the same name (TipsInput.cpi, FrnInput.fixings,
    FrnInput.curve) when the input type has one; the others are ignored."""

    cpi: Optional[InflationIndexInput] = None
    fixings: Tuple[ReferenceRateFixingProto, ...] = ()
    curve: Optional[YieldCurveInput] = None


def for_security(security: SecurityProto, price: PriceProto,
                 market_data: Optional[MarketData] = None) -> ProductInput:
    """The ProductInput for `security`, in the input type input_type_for picks.

    Sets the input type's security and copies price.price as is into clean_price
    (bond, tips, frn, mbs) or unit_price (equity, cash). Never sets
    cost_basis. Raises UnmappedProductTypeError when the type has no input type and
    MissingMarketDataError when `market_data` lacks a kind the input type requires.
    """
    md = market_data if market_data is not None else MarketData()
    input_type = input_type_for(security)
    p = price.price if price.HasField("price") else None
    out = ProductInput()
    if input_type == "bond":
        out.bond.CopyFrom(BondInput(security=security, clean_price=p))
    elif input_type == "tips":
        out.tips.CopyFrom(TipsInput(security=security, clean_price=p, cpi=md.cpi))
    elif input_type == "frn":
        out.frn.CopyFrom(FrnInput(security=security, clean_price=p, curve=md.curve, fixings=md.fixings))
    elif input_type == "mbs":
        out.mbs.CopyFrom(MbsInput(security=security, clean_price=p))
    elif input_type == "equity":
        out.equity.CopyFrom(EquityInput(security=security, unit_price=p))
    elif input_type == "cash":
        out.cash.CopyFrom(CashInput(security=security, unit_price=p))
    else:
        raise InvalidRegistryError(f"for_security has no builder for input type {input_type}")
    check_product_input(out)
    return out


def check_product_input(product_input: ProductInput) -> None:
    """Checks `product_input` is the input type input_type_for picks for its security, and
    holds every market-data kind that input type requires. Raises ModelValidationError
    (no input type, or the wrong input type), UnmappedProductTypeError or
    MissingMarketDataError."""
    input_type = product_input.WhichOneof("input")
    if input_type is None:
        raise ModelValidationError([violation("product_input", None, "no ProductInput input type is set")])
    security = getattr(product_input, input_type).security
    resolved = _shipped().require(_product_type_of(security), _coupon_type_of(security))
    if resolved.input_type != input_type:
        raise ModelValidationError([violation(
            f"product_input.{input_type}", _uuid_of(security),
            f"input type {input_type} does not match input type {resolved.input_type}"
            f" for product_type {_product_type_of(security)}")])
    for kind in resolved.requires:
        if not _has(product_input, kind):
            raise MissingMarketDataError(input_type, kind.value, f"{input_type}.{_FIELD_OF[kind]}", _uuid_of(security))


# The ProductInput input type field (and MarketData field) that holds each kind.
_FIELD_OF = {
    MarketDataKind.CPI_U: "cpi",
    MarketDataKind.FRN_FIXINGS: "fixings",
    MarketDataKind.FRN_CURVE: "curve",
}


def _has(product_input: ProductInput, kind: MarketDataKind) -> bool:
    """Whether `product_input` holds `kind`. A cpi with neither readings nor
    reference_cpi does not count."""
    if kind == MarketDataKind.CPI_U:
        return product_input.HasField("tips") and product_input.tips.cpi.WhichOneof("cpi") is not None
    if kind == MarketDataKind.FRN_FIXINGS:
        return product_input.HasField("frn") and len(product_input.frn.fixings) > 0
    if kind == MarketDataKind.FRN_CURVE:
        return product_input.HasField("frn") and product_input.frn.HasField("curve")
    raise InvalidRegistryError(f"no presence rule for market data {kind}")


def _uuid_of(security: SecurityProto) -> Optional[UUID]:
    raw = security.uuid.raw_uuid
    return UUID(bytes=raw) if len(raw) == 16 else None


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
def _shipped() -> _ValuationInputTypes:
    root: Dict[str, Any] = {}
    for key in (_SECTION, _LEGACY_SECTION):
        section = product_hierarchy.registry_section(key)
        if section is not None:
            root[key] = section
    return _ValuationInputTypes.from_hierarchy(root)


def _bad(detail: str) -> InvalidRegistryError:
    return InvalidRegistryError(f"hierarchy.json {_SECTION}: {detail}")


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


def _parse_valuation_input_types(section: Dict[str, Any]) -> _ValuationInputTypes:
    """Parses and checks a valuation_input_types section against the shipped
    product_types tree, the ProductInput oneof and the CouponTypeProto /
    MarketDataKind vocabularies. Raises InvalidRegistryError on any failure."""
    if not isinstance(section, dict):
        raise _bad("section must be an object")
    product_types = set(product_hierarchy.all_product_types())
    input_types = {f.name for f in ProductInput.DESCRIPTOR.oneofs_by_name["input"].fields}
    coupon_types = set(CouponTypeProto.keys())
    kinds = {k.value: k for k in MarketDataKind}

    entries_raw = section.get("entries")
    if not isinstance(entries_raw, list):
        raise _bad("'entries' must be a list")
    entries: Dict[str, Dict[Optional[str], _InputTypeEntry]] = {}
    for body in entries_raw:
        if not isinstance(body, dict):
            raise _bad(f"entry must be an object, got {body!r}")
        node = _string(body, "node")
        if node not in product_types:
            raise _bad(f"node '{node}' is not in product_types")
        input_type = _string(body, _input_type_key(body))
        if input_type not in input_types:
            raise _bad(f"input_type '{input_type}' is not a ProductInput.input field")
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
            by_coupon[c] = _InputTypeEntry(input_type, tuple(requires))

    unpriced: Set[str] = set()
    for node in _strings(section, "unpriced"):
        if node not in product_types:
            raise _bad(f"node '{node}' is not in product_types")
        if node in entries:
            raise _bad(f"node {node} is both mapped and unpriced")
        unpriced.add(node)
    return _ValuationInputTypes(entries, frozenset(unpriced))


def _input_type_key(body: Dict[str, Any]) -> str:
    """The key that names an entry's input type: input_type, or for one release
    the legacy arm (LM-418). An entry with both raises InvalidRegistryError."""
    if _ENTRY_KEY in body and _LEGACY_ENTRY_KEY in body:
        raise _bad(f"entry has both {_ENTRY_KEY} and {_LEGACY_ENTRY_KEY}: {body!r}")
    return _LEGACY_ENTRY_KEY if _LEGACY_ENTRY_KEY in body else _ENTRY_KEY
