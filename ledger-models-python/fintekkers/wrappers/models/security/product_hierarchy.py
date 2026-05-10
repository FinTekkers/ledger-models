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
from functools import lru_cache
from importlib import resources
from pathlib import Path
from typing import Any, Dict, List, Optional


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


@lru_cache(maxsize=1)
def _registry() -> Dict[str, Any]:
    return _load_registry()


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
