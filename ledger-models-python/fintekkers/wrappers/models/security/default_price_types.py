"""The default price_type of a trade price, by product. Backed by the
default_price_types section of ledger-models-protos/hierarchy.json; there is
no mapping table in code. Same rule in Java / Rust / Python / JS-TS. See
docs/adr/default_price_types.md.

Resolution walks from the security's product_type up its parent chain; the
first node with an entry decides, so SOFR_SERIES -> RATE beats INDEX ->
INDEX_LEVEL. A product with no entry anywhere on its chain has no default.

resolve_trade_price_type is what the create-transaction wrappers call: an
explicit price_type wins (UNKNOWN_PRICE_TYPE, proto3's unset value, counts as
omitted), then the table default, else NoDefaultPriceTypeError. It never
returns UNKNOWN_PRICE_TYPE. A broken section raises InvalidRegistryError.
"""

from __future__ import annotations

from functools import lru_cache
from types import MappingProxyType
from typing import Any, Mapping, Optional
from uuid import UUID

from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.errors import InvalidRegistryError, NoDefaultPriceTypeError
from fintekkers.wrappers.models.security import product_hierarchy

_SECTION = "default_price_types"
_UNKNOWN = PriceTypeProto.Name(PriceTypeProto.UNKNOWN_PRICE_TYPE)


class DefaultPriceTypes:
    """A parsed, checked default_price_types section: node -> PriceTypeProto value."""

    def __init__(self, entries: Mapping[str, int]):
        self._entries = MappingProxyType(dict(entries))

    @property
    def entries(self) -> Mapping[str, int]:
        """node -> PriceTypeProto value, as written in the section. Read-only."""
        return self._entries

    def default_for(self, product_type: str) -> Optional[int]:
        """The deepest entry on product_type's parent chain, or None."""
        node: Optional[str] = product_type
        while node is not None:
            if node in self._entries:
                return self._entries[node]
            node = product_hierarchy.parent_of(node)
        return None


def parse_default_price_types(section: Any) -> DefaultPriceTypes:
    """Parses and checks a default_price_types section against the shipped
    product_types tree and the PriceTypeProto names. Raises InvalidRegistryError
    when the section is missing (None) or not an object, a key is not a
    product_types node, or a value is not a PriceTypeProto name or is
    UNKNOWN_PRICE_TYPE."""
    if section is None:
        raise _bad("section missing from hierarchy.json")
    if not isinstance(section, dict):
        raise _bad("section must be an object")
    product_types = set(product_hierarchy.all_product_types())
    entries = {}
    for node, name in section.items():
        if node not in product_types:
            raise _bad(f"node '{node}' is not in product_types")
        if not isinstance(name, str) or name not in PriceTypeProto.keys():
            raise _bad(f"value {name!r} for node {node} is not a PriceTypeProto name")
        if name == _UNKNOWN:
            raise _bad(f"node {node} must not default to {_UNKNOWN}")
        entries[node] = PriceTypeProto.Value(name)
    return DefaultPriceTypes(entries)


@lru_cache(maxsize=1)
def shipped() -> DefaultPriceTypes:
    """The shipped default_price_types section, parsed and checked on first use."""
    return parse_default_price_types(product_hierarchy.registry_section(_SECTION))


def default_price_type_for(security: Optional[SecurityProto]) -> Optional[int]:
    """The table default for the security's product_type, or None when it has
    none. A missing security reads as PRODUCT_TYPE_UNKNOWN."""
    return shipped().default_for(_product_type_of(security))


def resolve_trade_price_type(security: Optional[SecurityProto], price_type: Optional[int] = None) -> int:
    """The price_type to put on a trade price for this security. An explicit
    price_type other than UNKNOWN_PRICE_TYPE is returned unchanged; otherwise
    the table default. Raises NoDefaultPriceTypeError naming the product when
    there is neither."""
    if price_type is not None and price_type != PriceTypeProto.UNKNOWN_PRICE_TYPE:
        return price_type
    resolved = default_price_type_for(security)
    if resolved is None:
        raise NoDefaultPriceTypeError(_product_type_of(security), _uuid_of(security))
    return resolved


def _product_type_of(security: Optional[SecurityProto]) -> str:
    if security is None:
        return ProductTypeProto.Name(ProductTypeProto.PRODUCT_TYPE_UNKNOWN)
    try:
        return ProductTypeProto.Name(security.product_type)
    except ValueError:
        return str(security.product_type)


def _uuid_of(security: Optional[SecurityProto]) -> Optional[UUID]:
    if security is None or len(security.uuid.raw_uuid) != 16:
        return None
    return UUID(bytes=security.uuid.raw_uuid)


def _bad(detail: str) -> InvalidRegistryError:
    return InvalidRegistryError(f"hierarchy.json {_SECTION}: {detail}")
