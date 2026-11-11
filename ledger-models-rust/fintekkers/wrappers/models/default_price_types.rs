//! The default `price_type` of a trade price, by product. Backed by the
//! `default_price_types` section of ledger-models-protos/hierarchy.json; there
//! is no mapping table in code. Same rule in Java / Rust / Python / JS-TS. See
//! docs/adr/default_price_types.md.
//!
//! Resolution walks from the security's `product_type` up its parent chain;
//! the first node with an entry decides, so `SOFR_SERIES -> RATE` beats
//! `INDEX -> INDEX_LEVEL`. A product with no entry anywhere on its chain has
//! no default.
//!
//! [`resolve_trade_price_type`] is what [`CreateTransaction`] calls: an
//! explicit type wins (`UNKNOWN_PRICE_TYPE`, proto3's unset value, counts as
//! omitted), then the table default, else
//! [`ProductInputError::NoDefaultPriceType`]. It never returns
//! `UNKNOWN_PRICE_TYPE`. A broken section is
//! [`ProductInputError::InvalidRegistry`], never a panic.
//!
//! [`CreateTransaction`]: crate::fintekkers::wrappers::models::transaction::CreateTransaction

use crate::fintekkers::models::price::PriceTypeProto;
use crate::fintekkers::models::security::{ProductTypeProto, SecurityProto};
use crate::fintekkers::wrappers::models::product_hierarchy;
use crate::fintekkers::wrappers::models::product_inputs::ProductInputError;
use crate::fintekkers::wrappers::models::utils::errors::object_id_of;
use serde_json::Value;
use std::collections::{BTreeMap, HashSet};
use std::sync::OnceLock;

const HIERARCHY_JSON: &str = include_str!("../../../hierarchy.json");

const SECTION: &str = "default_price_types";

/// A parsed, checked `default_price_types` section: node -> type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DefaultPriceTypes {
    entries: BTreeMap<String, PriceTypeProto>,
}

impl DefaultPriceTypes {
    /// node -> type, as written in the section.
    pub fn entries(&self) -> &BTreeMap<String, PriceTypeProto> {
        &self.entries
    }

    /// The deepest entry on `product_type`'s parent chain, or `None`.
    pub fn default_for(&self, product_type: &str) -> Option<PriceTypeProto> {
        let mut node = Some(product_type.to_string());
        while let Some(n) = node {
            if let Some(t) = self.entries.get(&n) {
                return Some(*t);
            }
            node = product_hierarchy::parent_of(&n);
        }
        None
    }
}

fn bad(detail: String) -> ProductInputError {
    ProductInputError::InvalidRegistry(format!("{SECTION}: {detail}"))
}

/// Parses and checks a `default_price_types` section (as JSON text) against
/// the shipped product_types tree and the `PriceTypeProto` names. A key that
/// is not a product_types node, or a value that is not a `PriceTypeProto`
/// name or is `UNKNOWN_PRICE_TYPE`, is `InvalidRegistry`.
pub fn parse_default_price_types(json: &str) -> Result<DefaultPriceTypes, ProductInputError> {
    let section: Value = serde_json::from_str(json).map_err(|e| bad(format!("not valid JSON: {e}")))?;
    let section = section.as_object().ok_or_else(|| bad("section must be an object".to_string()))?;
    let product_types: HashSet<String> = product_hierarchy::all_product_types().into_iter().collect();
    let mut entries = BTreeMap::new();
    for (node, value) in section {
        if !product_types.contains(node) {
            return Err(bad(format!("node '{node}' is not in product_types")));
        }
        let price_type = value
            .as_str()
            .and_then(PriceTypeProto::from_str_name)
            .ok_or_else(|| bad(format!("value {value} for node {node} is not a PriceTypeProto name")))?;
        if price_type == PriceTypeProto::UnknownPriceType {
            return Err(bad(format!("node {node} must not default to UNKNOWN_PRICE_TYPE")));
        }
        entries.insert(node.clone(), price_type);
    }
    Ok(DefaultPriceTypes { entries })
}

/// Parses and checks the `default_price_types` section of a whole
/// hierarchy.json (as JSON text). A root without the section is `InvalidRegistry`.
pub fn default_price_types_from_hierarchy(json: &str) -> Result<DefaultPriceTypes, ProductInputError> {
    let root: Value = serde_json::from_str(json).map_err(|e| bad(format!("hierarchy.json failed to parse: {e}")))?;
    let section = root.get(SECTION).ok_or_else(|| bad("section missing from hierarchy.json".to_string()))?;
    parse_default_price_types(&section.to_string())
}

/// The shipped `default_price_types` section, parsed and checked on first use.
pub fn shipped_default_price_types() -> Result<&'static DefaultPriceTypes, ProductInputError> {
    static SHIPPED: OnceLock<Result<DefaultPriceTypes, ProductInputError>> = OnceLock::new();
    SHIPPED
        .get_or_init(|| default_price_types_from_hierarchy(HIERARCHY_JSON))
        .as_ref()
        .map_err(Clone::clone)
}

/// The table default for the security's `product_type`, or `None` when it has
/// none. A missing security reads as `PRODUCT_TYPE_UNKNOWN`.
pub fn default_price_type_for(security: Option<&SecurityProto>) -> Result<Option<PriceTypeProto>, ProductInputError> {
    Ok(shipped_default_price_types()?.default_for(&product_type_of(security)))
}

/// The `price_type` to put on a trade price for this security. An explicit
/// type other than `UNKNOWN_PRICE_TYPE` is returned unchanged; otherwise the
/// table default. With neither it is [`ProductInputError::NoDefaultPriceType`]
/// naming the product.
pub fn resolve_trade_price_type(
    security: Option<&SecurityProto>,
    explicit: Option<PriceTypeProto>,
) -> Result<PriceTypeProto, ProductInputError> {
    if let Some(t) = explicit.filter(|t| *t != PriceTypeProto::UnknownPriceType) {
        return Ok(t);
    }
    default_price_type_for(security)?.ok_or_else(|| ProductInputError::NoDefaultPriceType {
        product_type: product_type_of(security),
        object_id: object_id_of(security.and_then(|s| s.uuid.as_ref())),
    })
}

/// The `ProductTypeProto` name, or the raw number for an unknown value.
fn product_type_of(security: Option<&SecurityProto>) -> String {
    let value = security.map_or(ProductTypeProto::ProductTypeUnknown as i32, |s| s.product_type);
    ProductTypeProto::from_i32(value)
        .map(|t| t.as_str_name().to_string())
        .unwrap_or_else(|| value.to_string())
}
