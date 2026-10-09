"""Multi-language registry helper backed by ledger-models-protos/hierarchy.json.

Identical signatures across Java / Rust / Python / JS-TS so consumers can rely
on the same query shape regardless of language. M1 of #257.

Two trees are exposed:
  - product_type — what kind of contract is this. Walked via parent_of,
    descendants_of, is_descendant_of.
  - asset_class — what exposure family does it belong to. Same shape via
    asset_class_parent_of, etc.

Plus per-leaf classification lookups: asset_class_of, instrument_type_of,
label_of.

asset_classes is the one canonical asset-class vocabulary.
asset_class_matches filters stored asset-class values (codes, labels such as
"Fixed Income", or aliases such as "CASH_ASSET_CLASS") against a code, walking
the tree. The *_label_of / identifier_type_placeholder_of helpers give display
strings for every value of the enums the UI shows. See
docs/adr/asset_class_vocabulary.md.

`index_type_of` is intentionally absent — that dimension is deferred per
the M1 descope.

Ergonomic for upstream string-code lookups (TreasuryDirect "BILL"/"NOTE"/
"BOND"/"TIPS"/"FRN"/"STRIPS"): downstream loaders typically map their
string codes to leaf product type names directly (e.g. "BILL" → "TBILL",
"NOTE" → "TREASURY_NOTE", "BOND" → "TREASURY_BOND", "FRN" → "TREASURY_FRN")
and then use this module's helpers to walk the tree.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from importlib import resources
from pathlib import Path
from typing import Any, Dict, List, Optional

from fintekkers.models.security.asset_class_pb2 import AssetClassProto
from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)
from fintekkers.models.security.instrument_type_pb2 import InstrumentTypeProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto


def _load_registry() -> Dict[str, Any]:
    """Load hierarchy.json. First tries packaged resource (after wheel install);
    falls back to a relative path from this file (development checkout)."""
    # Packaged resource — set up by setup.py to ship hierarchy.json alongside
    # the wrapper code under fintekkers.wrappers.models.security.
    try:
        with resources.files("fintekkers.wrappers.models.security").joinpath(
            "hierarchy.json"
        ).open("r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ModuleNotFoundError):
        pass

    # Development checkout — walk up to ledger-models-protos/hierarchy.json
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "ledger-models-protos" / "hierarchy.json"
        if candidate.exists():
            with candidate.open("r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError(
        "hierarchy.json not found on packaged resource path or in any parent "
        "directory's ledger-models-protos/. Build wiring should bundle it."
    )


_INSTRUMENT_TYPE_PREFIX = "INSTRUMENT_TYPE_"


def _check_instrument_types(registry: Dict[str, Any]) -> None:
    """Every instrument_types code needs an INSTRUMENT_TYPE_<CODE> enum value."""
    for code in registry["instrument_types"]:
        try:
            InstrumentTypeProto.Value(_INSTRUMENT_TYPE_PREFIX + code)
        except ValueError:
            raise ValueError(
                f"hierarchy.json instrument_types: no InstrumentTypeProto value for '{code}'"
            ) from None


@lru_cache(maxsize=1)
def _registry() -> Dict[str, Any]:
    registry = _load_registry()
    _check_instrument_types(registry)
    return registry


def _product_types() -> Dict[str, Dict[str, Any]]:
    return _registry()["product_types"]


def _asset_classes() -> Dict[str, Dict[str, Any]]:
    return _registry()["asset_classes"]


# ---------- product_type tree ----------


def parent_of(node: str) -> Optional[str]:
    """Parent product_type node (abstract or leaf). None for top-level nodes;
    None for unknown nodes."""
    entry = _product_types().get(node)
    return entry.get("parent") if entry else None


def descendants_of(ancestor: str) -> List[str]:
    """All descendant nodes (transitive) of ancestor in the product_type tree.
    Includes leaves and abstract intermediates beneath ancestor but NOT
    ancestor itself. Returns sorted list (empty if ancestor is unknown)."""
    pt = _product_types()
    out = []
    for name, entry in pt.items():
        p = entry.get("parent")
        while p is not None:
            if p == ancestor:
                out.append(name)
                break
            p = pt.get(p, {}).get("parent")
    return sorted(out)


def is_descendant_of(node: str, ancestor: str) -> bool:
    """True iff node is a strict descendant of ancestor (any depth) in the
    product_type tree. False if either is unknown or they are the same."""
    if node == ancestor:
        return False
    pt = _product_types()
    entry = pt.get(node)
    if not entry:
        return False
    p = entry.get("parent")
    while p is not None:
        if p == ancestor:
            return True
        p = pt.get(p, {}).get("parent")
    return False


def label_of(node: str) -> Optional[str]:
    """Display label, or None if the node is unknown."""
    entry = _product_types().get(node)
    return entry.get("label") if entry else None


def asset_class_of(product_type: str) -> Optional[str]:
    """Asset class for a leaf product_type. None for abstract or unknown."""
    entry = _product_types().get(product_type)
    return entry.get("asset_class") if entry else None


def instrument_type_of(product_type: str) -> Optional[str]:
    """instrument_type for a leaf product_type. None for abstract or unknown."""
    entry = _product_types().get(product_type)
    return entry.get("instrument_type") if entry else None


# ---------- asset_class tree ----------


def asset_class_parent_of(node: str) -> Optional[str]:
    entry = _asset_classes().get(node)
    return entry.get("parent") if entry else None


def asset_class_descendants_of(ancestor: str) -> List[str]:
    ac = _asset_classes()
    out = []
    for name, entry in ac.items():
        p = entry.get("parent")
        while p is not None:
            if p == ancestor:
                out.append(name)
                break
            p = ac.get(p, {}).get("parent")
    return sorted(out)


def is_asset_class_descendant_of(node: str, ancestor: str) -> bool:
    if node == ancestor:
        return False
    ac = _asset_classes()
    entry = ac.get(node)
    if not entry:
        return False
    p = entry.get("parent")
    while p is not None:
        if p == ancestor:
            return True
        p = ac.get(p, {}).get("parent")
    return False


def asset_class_label_of(node: str) -> Optional[str]:
    entry = _asset_classes().get(node)
    return entry.get("label") if entry else None


_SEPARATORS = re.compile(r"[\s-]+")


def _normalise_asset_class(value: str) -> str:
    return _SEPARATORS.sub("_", value.strip().upper())


def _build_asset_class_lookup(classes: Dict[str, Dict[str, Any]]) -> Dict[str, str]:
    """Normalised code / label / alias -> code. Raises ValueError if two codes
    claim the same key, so an ambiguous label or alias fails at load time."""
    lookup: Dict[str, str] = {}
    for code, entry in classes.items():
        keys = [code]
        if entry.get("label"):
            keys.append(entry["label"])
        keys.extend(entry.get("aliases", []))
        for key in keys:
            n = _normalise_asset_class(key)
            if not n:
                continue
            prev = lookup.setdefault(n, code)
            if prev != code:
                raise ValueError(
                    f"hierarchy.json asset_classes: {key!r} resolves to both "
                    f"{prev} and {code}"
                )
    return lookup


@lru_cache(maxsize=1)
def _asset_class_lookup() -> Dict[str, str]:
    return _build_asset_class_lookup(_asset_classes())


def resolve_asset_class(value: Optional[str]) -> Optional[str]:
    """Resolve a stored or user-supplied asset-class value to its hierarchy.json
    code. An exact code wins; otherwise the value is normalised (stripped,
    upper-cased, runs of whitespace or hyphens turned into ``_``) and matched
    against every code, label and alias. None for None, blank or unknown."""
    if value is None:
        return None
    if value in _asset_classes():
        return value
    return _asset_class_lookup().get(_normalise_asset_class(value))


def asset_class_matches(filter_code: Optional[str], stored_value: Optional[str]) -> bool:
    """True iff stored_value falls under filter_code: both resolve (see
    resolve_asset_class) and the stored code equals the filter code or
    descends from it. FIXED_INCOME matches RATES, CREDIT and "Fixed Income";
    EQUITY does not match RATES; unknown values match nothing."""
    f = resolve_asset_class(filter_code)
    s = resolve_asset_class(stored_value)
    if f is None or s is None:
        return False
    return f == s or is_asset_class_descendant_of(s, f)


# ---------- enum labels ----------


def _enum_entry(enum_name: str, value_name: str) -> Dict[str, Any]:
    return _registry().get("enum_labels", {}).get(enum_name, {}).get(value_name, {})


def _value_name(enum: Any, v: int) -> Optional[str]:
    try:
        return enum.Name(v)
    except ValueError:  # unknown number
        return None


def identifier_type_label_of(v: int) -> Optional[str]:
    """Display label for an IdentifierTypeProto value, or None if unknown."""
    name = _value_name(IdentifierTypeProto, v)
    return _enum_entry("IdentifierTypeProto", name).get("label") if name else None


def identifier_type_placeholder_of(v: int) -> Optional[str]:
    """Input placeholder (e.g. "e.g. US0378331005") for an IdentifierTypeProto
    value, or None if unknown."""
    name = _value_name(IdentifierTypeProto, v)
    return _enum_entry("IdentifierTypeProto", name).get("placeholder") if name else None


def _instrument_type_code(value_name: str) -> Optional[str]:
    """Instrument-type code for an enum value name (INSTRUMENT_TYPE_CASH -> CASH)."""
    if value_name.startswith(_INSTRUMENT_TYPE_PREFIX):
        return value_name[len(_INSTRUMENT_TYPE_PREFIX):]
    return None


def instrument_type_code_label_of(code: Optional[str]) -> Optional[str]:
    """Display label for an instrument-type code from all_instrument_types()
    (e.g. CASH -> "Cash"). None for None or an unknown code; the match is exact."""
    entry = _registry()["instrument_types"].get(code) if isinstance(code, str) else None
    return entry.get("label") if entry else None


def instrument_type_label_of(v: int) -> Optional[str]:
    """Display label for an InstrumentTypeProto value: the instrument_types
    label of its code (INSTRUMENT_TYPE_CASH -> CASH -> "Cash"), else
    enum_labels (e.g. INSTRUMENT_TYPE_UNKNOWN). None if unknown."""
    name = _value_name(InstrumentTypeProto, v)
    if name is None:
        return None
    return instrument_type_code_label_of(_instrument_type_code(name)) or _enum_entry(
        "InstrumentTypeProto", name
    ).get("label")


def product_type_label_of(v: int) -> Optional[str]:
    """Display label for a ProductTypeProto value: the product_types label,
    else enum_labels (e.g. PRODUCT_TYPE_UNKNOWN). None if unknown."""
    name = _value_name(ProductTypeProto, v)
    if name is None:
        return None
    return label_of(name) or _enum_entry("ProductTypeProto", name).get("label")


def asset_class_proto_label_of(v: int) -> Optional[str]:
    """Display label for an AssetClassProto value: the label of the
    hierarchy.json code it resolves to (CASH_ASSET_CLASS -> "Cash"), else
    enum_labels (e.g. INDEX). None if unknown."""
    name = _value_name(AssetClassProto, v)
    if name is None:
        return None
    code = resolve_asset_class(name)
    if code is not None:
        return asset_class_label_of(code)
    return _enum_entry("AssetClassProto", name).get("label")


# ---------- introspection ----------


def all_product_types() -> List[str]:
    return sorted(_product_types().keys())


def active_product_types() -> List[str]:
    return sorted(
        name for name, entry in _product_types().items()
        if entry.get("status") == "active"
    )


def all_asset_classes() -> List[str]:
    return sorted(_asset_classes().keys())


def all_instrument_types() -> List[str]:
    return list(_registry()["instrument_types"])
