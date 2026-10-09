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
//! Instrument types: [`all_instrument_types`] lists the codes in file order;
//! [`instrument_type_code_label_of`] and [`instrument_type_label_of`] give
//! their display labels, read from `instrument_types` (LM-282).
//!
//! `index_type_of` is intentionally absent — that dimension is deferred per
//! the M1 descope.

use crate::fintekkers::models::security::InstrumentTypeProto;
use serde::de::{Deserializer, MapAccess, Visitor};
use serde::Deserialize;
use std::collections::HashMap;
use std::fmt;
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
    #[serde(default)]
    pub aliases: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct InstrumentTypeEntry {
    #[serde(default)]
    label: Option<String>,
}

#[derive(Debug, Deserialize)]
struct EnumLabelEntry {
    #[serde(default)]
    label: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Registry {
    product_types: HashMap<String, ProductTypeEntry>,
    asset_classes: HashMap<String, AssetClassEntry>,
    /// Code -> entry, in file order (a HashMap would lose it).
    #[serde(deserialize_with = "ordered_map")]
    instrument_types: Vec<(String, InstrumentTypeEntry)>,
    /// Codes of `instrument_types`, in file order; filled after parsing.
    #[serde(skip)]
    instrument_type_codes: Vec<String>,
    #[serde(default)]
    enum_labels: HashMap<String, HashMap<String, EnumLabelEntry>>,
}

/// Deserializes a JSON object into its entries in file order, without
/// serde_json's `preserve_order` feature (which would change map order for
/// every crate that depends on serde_json).
fn ordered_map<'de, D, V>(deserializer: D) -> Result<Vec<(String, V)>, D::Error>
where
    D: Deserializer<'de>,
    V: Deserialize<'de>,
{
    struct OrderedMap<V>(std::marker::PhantomData<V>);

    impl<'de, V: Deserialize<'de>> Visitor<'de> for OrderedMap<V> {
        type Value = Vec<(String, V)>;

        fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
            f.write_str("a map")
        }

        fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<Self::Value, A::Error> {
            let mut out = Vec::new();
            while let Some(entry) = map.next_entry()? {
                out.push(entry);
            }
            Ok(out)
        }
    }

    deserializer.deserialize_map(OrderedMap(std::marker::PhantomData))
}

/// Prefix that turns an instrument-type code into its InstrumentTypeProto value name.
const INSTRUMENT_TYPE_PREFIX: &str = "INSTRUMENT_TYPE_";

/// Every instrument_types code needs an INSTRUMENT_TYPE_<CODE> enum value.
fn check_instrument_types(codes: &[String]) {
    for code in codes {
        if InstrumentTypeProto::from_str_name(&format!("{INSTRUMENT_TYPE_PREFIX}{code}")).is_none() {
            panic!("hierarchy.json instrument_types: no InstrumentTypeProto value for '{code}'");
        }
    }
}

fn registry() -> &'static Registry {
    static REGISTRY: OnceLock<Registry> = OnceLock::new();
    REGISTRY.get_or_init(|| {
        let mut r: Registry =
            serde_json::from_str(HIERARCHY_JSON).expect("hierarchy.json failed to parse");
        r.instrument_type_codes = r.instrument_types.iter().map(|(code, _)| code.clone()).collect();
        check_instrument_types(&r.instrument_type_codes);
        r
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

fn normalise_asset_class(value: &str) -> String {
    // Mirror of Java's normaliseAssetClass: trim, upper-case, and turn each
    // run of whitespace or hyphens into `_`.
    let upper = value.trim().to_uppercase();
    let mut out = String::with_capacity(upper.len());
    let mut in_gap = false;
    for c in upper.chars() {
        if c.is_whitespace() || c == '-' {
            if !in_gap {
                out.push('_');
                in_gap = true;
            }
        } else {
            out.push(c);
            in_gap = false;
        }
    }
    out
}

/// Normalised code / label / alias -> code, built from `asset_classes` only.
/// Panics if two codes claim the same key, so an ambiguous label or alias
/// fails at load time.
fn build_asset_class_lookup(classes: &HashMap<String, AssetClassEntry>) -> HashMap<String, String> {
    let mut lookup = HashMap::new();
    for (code, entry) in classes {
        let mut keys: Vec<&str> = vec![code.as_str()];
        if let Some(label) = &entry.label {
            keys.push(label.as_str());
        }
        for alias in &entry.aliases {
            keys.push(alias.as_str());
        }
        for key in keys {
            let n = normalise_asset_class(key);
            if n.is_empty() {
                continue;
            }
            if let Some(prev) = lookup.insert(n, code.clone()) {
                if prev != *code {
                    panic!(
                        "hierarchy.json asset_classes: '{key}' resolves to both {prev} and {code}"
                    );
                }
            }
        }
    }
    lookup
}

fn asset_class_lookup() -> &'static HashMap<String, String> {
    static LOOKUP: OnceLock<HashMap<String, String>> = OnceLock::new();
    LOOKUP.get_or_init(|| build_asset_class_lookup(&registry().asset_classes))
}

/// Resolve a stored or user-supplied asset-class value to its
/// hierarchy.json code. An exact code wins; otherwise the value is
/// normalised (trimmed, upper-cased, runs of whitespace or hyphens turned
/// into `_`) and matched against every code, label and alias.
/// `None` for `None`, blank or unknown values.
pub fn resolve_asset_class(value: Option<&str>) -> Option<String> {
    let v = value?;
    let r = registry();
    if r.asset_classes.contains_key(v) {
        return Some(v.to_string());
    }
    asset_class_lookup().get(&normalise_asset_class(v)).cloned()
}

/// True iff `stored_value` falls under `filter_code`: both resolve (see
/// [`resolve_asset_class`]) and the stored code equals the filter code or
/// descends from it. FIXED_INCOME matches RATES, CREDIT and "Fixed Income";
/// EQUITY does not match RATES; unknown values match nothing.
pub fn asset_class_matches(filter_code: Option<&str>, stored_value: Option<&str>) -> bool {
    match (resolve_asset_class(filter_code), resolve_asset_class(stored_value)) {
        (Some(f), Some(s)) => f == s || is_asset_class_descendant_of(&s, &f),
        _ => false,
    }
}

// ---------- instrument-type labels ----------

/// Instrument-type code for an enum value name (INSTRUMENT_TYPE_CASH -> CASH).
fn instrument_type_code(value_name: &str) -> Option<&str> {
    value_name.strip_prefix(INSTRUMENT_TYPE_PREFIX)
}

/// Display label for an instrument-type code from [`all_instrument_types`]
/// (e.g. CASH -> "Cash"). `None` for an unknown code; the match is exact.
pub fn instrument_type_code_label_of(code: &str) -> Option<String> {
    registry()
        .instrument_types
        .iter()
        .find(|(c, _)| c == code)
        .and_then(|(_, e)| e.label.clone())
}

/// Display label for an InstrumentTypeProto value: the instrument_types label
/// of its code (INSTRUMENT_TYPE_CASH -> CASH -> "Cash"), else enum_labels
/// (e.g. INSTRUMENT_TYPE_UNKNOWN).
pub fn instrument_type_label_of(v: InstrumentTypeProto) -> Option<String> {
    let name = v.as_str_name();
    instrument_type_code(name)
        .and_then(instrument_type_code_label_of)
        .or_else(|| {
            registry()
                .enum_labels
                .get("InstrumentTypeProto")
                .and_then(|values| values.get(name))
                .and_then(|e| e.label.clone())
        })
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
    &registry().instrument_type_codes
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
        assert_eq!(all_instrument_types(), ["CASH", "DERIVATIVE", "REFERENCE_INDEX"]);
    }

    // LM-282: cases come from ledger-models-protos/fixtures/instrument_type_labels.json,
    // shared with the Java, JS and Python tests.
    fn instrument_type_fixture(key: &str) -> Vec<String> {
        let path = concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../ledger-models-protos/fixtures/instrument_type_labels.json"
        );
        let text =
            std::fs::read_to_string(path).expect("read shared instrument_type_labels.json fixture");
        let root: serde_json::Value = serde_json::from_str(&text).expect("parse fixture");
        root.get(key)
            .and_then(|v| v.as_array())
            .unwrap_or_else(|| panic!("fixture has {key}"))
            .iter()
            .map(|v| v.as_str().expect("fixture entries are strings").to_string())
            .collect()
    }

    #[test]
    fn all_instrument_types_are_the_fixture_codes_in_order() {
        let codes = instrument_type_fixture("codes");
        assert_eq!(codes, ["CASH", "DERIVATIVE", "REFERENCE_INDEX"]);
        assert_eq!(all_instrument_types(), codes.as_slice());
    }

    #[test]
    fn instrument_type_code_label_of_known_and_unknown_codes() {
        for code in instrument_type_fixture("codes") {
            let label = instrument_type_code_label_of(&code);
            assert!(
                label.as_deref().is_some_and(|l| !l.trim().is_empty()),
                "{code} has no label"
            );
        }
        for code in instrument_type_fixture("unknown") {
            assert_eq!(instrument_type_code_label_of(&code), None, "{code:?}");
        }
    }

    #[test]
    fn code_label_equals_enum_label() {
        for code in instrument_type_fixture("codes") {
            let v = InstrumentTypeProto::from_str_name(&format!("INSTRUMENT_TYPE_{code}"))
                .unwrap_or_else(|| panic!("no enum value for {code}"));
            assert_eq!(instrument_type_code_label_of(&code), instrument_type_label_of(v), "{code}");
        }
    }

    #[test]
    fn every_instrument_type_enum_value_has_a_label() {
        for n in 0.. {
            let Some(v) = InstrumentTypeProto::from_i32(n) else { break };
            let label = instrument_type_label_of(v);
            assert!(
                label.as_deref().is_some_and(|l| !l.trim().is_empty()),
                "{} has no label",
                v.as_str_name()
            );
        }
        assert_eq!(
            instrument_type_label_of(InstrumentTypeProto::InstrumentTypeUnknown).as_deref(),
            Some("Unknown")
        );
        // Rust has no UNRECOGNIZED variant: an out-of-range number has no enum value at all.
        assert!(InstrumentTypeProto::from_i32(9999).is_none());
    }

    #[test]
    #[should_panic(expected = "BOGUS")]
    fn instrument_type_code_without_enum_value_fails_at_load() {
        check_instrument_types(&["CASH".to_string(), "BOGUS".to_string()]);
    }

    #[test]
    fn asset_class_matches_shared_fixture() {
        // LM-281: reads the canonical fixture directly (not a copy), like the
        // Java, JS and Python tests, so the four implementations can't drift.
        let path = concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../ledger-models-protos/fixtures/asset_class_matches.json"
        );
        let text =
            std::fs::read_to_string(path).expect("read shared asset_class_matches.json fixture");
        let root: serde_json::Value = serde_json::from_str(&text).expect("parse fixture");
        let cases = root
            .get("cases")
            .and_then(|c| c.as_array())
            .expect("fixture has cases");
        assert!(!cases.is_empty(), "fixture has no cases");
        for case in cases {
            let filter = case.get("filter").and_then(|v| v.as_str());
            let stored = case.get("stored").and_then(|v| v.as_str());
            let expected = case
                .get("expected")
                .and_then(|v| v.as_bool())
                .expect("case has expected");
            assert_eq!(
                asset_class_matches(filter, stored),
                expected,
                "asset_class_matches({filter:?}, {stored:?})"
            );
        }
    }

    #[test]
    fn resolve_asset_class_handles_codes_labels_and_aliases() {
        assert_eq!(resolve_asset_class(Some("RATES")), Some("RATES".to_string()));
        assert_eq!(
            resolve_asset_class(Some("Fixed Income")),
            Some("FIXED_INCOME".to_string())
        );
        assert_eq!(
            resolve_asset_class(Some("fixed-income")),
            Some("FIXED_INCOME".to_string())
        );
        assert_eq!(
            resolve_asset_class(Some("CASH_ASSET_CLASS")),
            Some("CASH".to_string())
        );
        assert_eq!(
            resolve_asset_class(Some(" equity ")),
            Some("EQUITY".to_string())
        );
        assert_eq!(resolve_asset_class(Some("NOT_AN_ASSET_CLASS")), None);
        assert_eq!(resolve_asset_class(Some("")), None);
        assert_eq!(resolve_asset_class(Some("   ")), None);
        assert_eq!(resolve_asset_class(None), None);
    }

    #[test]
    fn every_hierarchy_entry_matches_its_parent_label_and_aliases() {
        for code in all_asset_classes() {
            let entry = registry()
                .asset_classes
                .get(&code)
                .expect("code from all_asset_classes");
            if let Some(parent) = &entry.parent {
                assert!(
                    asset_class_matches(Some(parent), Some(&code)),
                    "{parent} should match {code}"
                );
            }
            if let Some(label) = &entry.label {
                assert!(
                    asset_class_matches(Some(&code), Some(label)),
                    "{code} should match its label"
                );
            }
            for alias in &entry.aliases {
                assert!(
                    asset_class_matches(Some(&code), Some(alias)),
                    "{code} should match alias {alias}"
                );
            }
        }
    }

    #[test]
    #[should_panic(expected = "resolves to both")]
    fn ambiguous_label_fails_at_load() {
        let mut classes = HashMap::new();
        classes.insert(
            "A".to_string(),
            AssetClassEntry {
                parent: None,
                label: Some("Shared".to_string()),
                aliases: vec![],
            },
        );
        classes.insert(
            "B".to_string(),
            AssetClassEntry {
                parent: None,
                label: Some("shared".to_string()),
                aliases: vec![],
            },
        );
        let _ = build_asset_class_lookup(&classes);
    }
}
