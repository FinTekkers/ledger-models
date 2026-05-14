//! Multi-language registry helper backed by ledger-models-protos/hierarchy.json.
//!
//! Identical signatures across Java / Rust / Python / JS-TS so consumers can
//! rely on the same query shape regardless of language. M1 of #257.
//!
//! The registry is loaded on first access (lazy) from a hierarchy.json file
//! bundled into the crate via `include_str!`. Because the JSON is embedded at
//! compile time, no I/O or runtime config is required.
//!
//! The file lives at the crate root (`ledger-models-rust/hierarchy.json`) so
//! it survives `cargo package` / `cargo publish` (the canonical source under
//! `ledger-models-protos/` is OUTSIDE the crate and is therefore unavailable
//! to the packaged tarball; we mirror it at the crate root). The mirror copy
//! is kept in sync with `ledger-models-protos/hierarchy.json` — when the
//! latter changes, the copy must be refreshed (and Cargo.toml's `include`
//! list bundles the crate-root copy).
//!
//! Two trees are exposed:
//!   - **product_type** — what kind of contract is this. Walked via
//!     [`parent_of`], [`descendants_of`], [`is_descendant_of`].
//!   - **asset_class** — what exposure family does it belong to. Same shape via
//!     [`asset_class_parent_of`], etc.
//!
//! Plus per-leaf classification lookups: [`asset_class_of`],
//! [`instrument_type_of`], [`label_of`].
//!
//! `index_type_of` is intentionally absent — that dimension is deferred per
//! the M1 descope.

use serde::Deserialize;
use std::collections::HashMap;
use std::sync::OnceLock;

const HIERARCHY_JSON: &str = include_str!("../../../hierarchy.json");

#[derive(Debug, Deserialize)]
pub struct ProductTypeEntry {
    #[serde(default)]
    pub parent: Option<String>,
    #[serde(default, rename = "abstract")]
    pub is_abstract: bool,
    #[serde(default)]
    pub asset_class: Option<String>,
    #[serde(default)]
    pub instrument_type: Option<String>,
    #[serde(default)]
    pub label: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AssetClassEntry {
    #[serde(default)]
    pub parent: Option<String>,
    #[serde(default)]
    pub label: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Registry {
    product_types: HashMap<String, ProductTypeEntry>,
    asset_classes: HashMap<String, AssetClassEntry>,
    instrument_types: Vec<String>,
}

fn registry() -> &'static Registry {
    static REGISTRY: OnceLock<Registry> = OnceLock::new();
    REGISTRY.get_or_init(|| {
        serde_json::from_str(HIERARCHY_JSON).expect("hierarchy.json failed to parse")
    })
}

// ---------- product_type tree ----------

/// Parent product_type node (abstract or leaf). `None` for top-level nodes;
/// `None` for unknown nodes.
pub fn parent_of(node: &str) -> Option<String> {
    registry()
        .product_types
        .get(node)
        .and_then(|e| e.parent.clone())
}

/// All descendant nodes (transitive) of `ancestor` in the product_type tree.
/// Includes leaves and abstract intermediates beneath `ancestor` but NOT
/// `ancestor` itself. Returns empty if `ancestor` is unknown.
pub fn descendants_of(ancestor: &str) -> Vec<String> {
    let r = registry();
    let mut out = Vec::new();
    for (name, entry) in &r.product_types {
        let mut p = entry.parent.as_deref();
        while let Some(parent) = p {
            if parent == ancestor {
                out.push(name.clone());
                break;
            }
            p = r.product_types.get(parent).and_then(|e| e.parent.as_deref());
        }
    }
    out.sort();
    out
}

/// True iff `node` is a strict descendant of `ancestor` (any depth) in the
/// product_type tree. False if either is unknown or they are the same node.
pub fn is_descendant_of(node: &str, ancestor: &str) -> bool {
    if node == ancestor {
        return false;
    }
    let r = registry();
    let entry = match r.product_types.get(node) {
        Some(e) => e,
        None => return false,
    };
    let mut p = entry.parent.as_deref();
    while let Some(parent) = p {
        if parent == ancestor {
            return true;
        }
        p = r.product_types.get(parent).and_then(|e| e.parent.as_deref());
    }
    false
}

/// Display label, or `None` if the node is unknown.
pub fn label_of(node: &str) -> Option<String> {
    registry()
        .product_types
        .get(node)
        .and_then(|e| e.label.clone())
}

/// Asset class for a leaf product_type. `None` for abstract or unknown nodes.
pub fn asset_class_of(product_type: &str) -> Option<String> {
    registry()
        .product_types
        .get(product_type)
        .and_then(|e| e.asset_class.clone())
}

/// instrument_type for a leaf product_type. `None` for abstract or unknown.
pub fn instrument_type_of(product_type: &str) -> Option<String> {
    registry()
        .product_types
        .get(product_type)
        .and_then(|e| e.instrument_type.clone())
}

// ---------- asset_class tree ----------

pub fn asset_class_parent_of(node: &str) -> Option<String> {
    registry()
        .asset_classes
        .get(node)
        .and_then(|e| e.parent.clone())
}

pub fn asset_class_descendants_of(ancestor: &str) -> Vec<String> {
    let r = registry();
    let mut out = Vec::new();
    for (name, entry) in &r.asset_classes {
        let mut p = entry.parent.as_deref();
        while let Some(parent) = p {
            if parent == ancestor {
                out.push(name.clone());
                break;
            }
            p = r.asset_classes.get(parent).and_then(|e| e.parent.as_deref());
        }
    }
    out.sort();
    out
}

pub fn is_asset_class_descendant_of(node: &str, ancestor: &str) -> bool {
    if node == ancestor {
        return false;
    }
    let r = registry();
    let entry = match r.asset_classes.get(node) {
        Some(e) => e,
        None => return false,
    };
    let mut p = entry.parent.as_deref();
    while let Some(parent) = p {
        if parent == ancestor {
            return true;
        }
        p = r.asset_classes.get(parent).and_then(|e| e.parent.as_deref());
    }
    false
}

pub fn asset_class_label_of(node: &str) -> Option<String> {
    registry()
        .asset_classes
        .get(node)
        .and_then(|e| e.label.clone())
}

// ---------- introspection ----------

pub fn all_product_types() -> Vec<String> {
    let mut v: Vec<String> = registry().product_types.keys().cloned().collect();
    v.sort();
    v
}

pub fn active_product_types() -> Vec<String> {
    let mut v: Vec<String> = registry()
        .product_types
        .iter()
        .filter(|(_, e)| e.status.as_deref() == Some("active"))
        .map(|(k, _)| k.clone())
        .collect();
    v.sort();
    v
}

pub fn all_asset_classes() -> Vec<String> {
    let mut v: Vec<String> = registry().asset_classes.keys().cloned().collect();
    v.sort();
    v
}

pub fn all_instrument_types() -> &'static [String] {
    &registry().instrument_types
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn registry_loads_and_active_count_matches_spec() {
        let active = active_product_types();
        // M1 locked 26 active leaves; #274 Phase 2 promotes MORTGAGE_BACKED → 27.
        assert_eq!(active.len(), 27, "expected 27 active leaves, got {}: {active:?}", active.len());
    }

    #[test]
    fn descendants_of_bond_includes_all_bond_shapes() {
        let descendants = descendants_of("BOND");
        for expected in [
            "TBILL", "TREASURY_NOTE", "TREASURY_BOND", "TIPS", "TREASURY_FRN",
            "STRIPS", "SOVEREIGN_BOND", "CORP_BOND", "MUNI_BOND", "MORTGAGE_BACKED",
        ] {
            assert!(descendants.contains(&expected.to_string()), "{expected} missing from descendants_of(\"BOND\")");
        }
    }

    #[test]
    fn is_descendant_of_walks_transitively() {
        assert!(is_descendant_of("TBILL", "GOV_BOND"));
        assert!(is_descendant_of("TBILL", "BOND"));    // through GOV_BOND
        assert!(is_descendant_of("CORP_BOND", "BOND")); // through CREDIT_BOND
        assert!(!is_descendant_of("TBILL", "STOCK"));
        assert!(!is_descendant_of("BOND", "BOND"));     // strict descendant
    }

    #[test]
    fn parent_of_returns_immediate_parent() {
        assert_eq!(parent_of("TBILL"), Some("GOV_BOND".to_string()));
        assert_eq!(parent_of("CORP_BOND"), Some("CREDIT_BOND".to_string()));
        assert_eq!(parent_of("BOND"), None); // top-level
    }

    #[test]
    fn classification_lookups_work() {
        assert_eq!(asset_class_of("TBILL"), Some("RATES".to_string()));
        assert_eq!(asset_class_of("CORP_BOND"), Some("CREDIT".to_string()));
        assert_eq!(asset_class_of("STABLECOIN"), Some("CRYPTO".to_string()));
        assert_eq!(asset_class_of("FX_SPOT"), Some("FX".to_string()));
        assert_eq!(instrument_type_of("TBILL"), Some("CASH".to_string()));
        assert_eq!(instrument_type_of("EQUITY_INDEX"), Some("REFERENCE_INDEX".to_string()));
        // Abstract nodes have no asset_class
        assert_eq!(asset_class_of("BOND"), None);
    }

    #[test]
    fn asset_class_tree_walks_correctly() {
        assert!(is_asset_class_descendant_of("RATES", "FIXED_INCOME"));
        assert!(is_asset_class_descendant_of("METALS", "COMMODITY"));
        assert!(!is_asset_class_descendant_of("EQUITY", "FIXED_INCOME"));
    }

    #[test]
    fn label_of_returns_human_readable() {
        assert_eq!(label_of("TBILL"), Some("Treasury Bill".to_string()));
        assert_eq!(label_of("STABLECOIN"), Some("Stablecoin".to_string()));
    }

    #[test]
    fn instrument_types_are_three() {
        let its = all_instrument_types();
        assert_eq!(its.len(), 3);
        assert!(its.iter().any(|s| s == "CASH"));
        assert!(its.iter().any(|s| s == "DERIVATIVE"));
        assert!(its.iter().any(|s| s == "REFERENCE_INDEX"));
    }
}
