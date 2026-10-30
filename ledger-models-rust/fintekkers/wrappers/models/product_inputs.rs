//! Which `ProductInput` arm values a security, and which market data that
//! arm needs. Backed by the `valuation_arms` section of
//! ledger-models-protos/hierarchy.json; there is no mapping table in code.
//! Same rule in Java / Rust / Python / JS-TS. See docs/adr/valuation_arms.md.
//!
//! Resolution walks from the security's `product_type` up its parent chain.
//! At each node a `coupon_types` entry matching `bond_details.coupon_type`
//! wins, then the node's plain entry, then an `unpriced` listing. The first
//! node with any match decides. No match, or an `unpriced` match, is
//! [`ProductInputError::Unmapped`]: there is no default arm.
//!
//! Embeds the crate-root `hierarchy.json` itself rather than reading it
//! through [`product_hierarchy`], so that loader stays unchanged. A broken
//! section is [`ProductInputError::InvalidRegistry`], never a panic.

use crate::fintekkers::models::security::{CouponTypeProto, ProductTypeProto, SecurityProto};
use crate::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use crate::fintekkers::wrappers::models::product_hierarchy;
use prost::Message;
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use std::fmt;
use std::sync::OnceLock;
use tonic::{Code, Status};

const HIERARCHY_JSON: &str = include_str!("../../../hierarchy.json");

/// The closed `requires` vocabulary: market data an arm needs beyond the price.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum MarketDataKind {
    /// CPI-U index readings (TIPS inflation accrual).
    CpiU,
    /// Reference-rate fixings for a floating coupon.
    FrnFixings,
    /// Forward curve for projecting floating coupons.
    FrnCurve,
}

impl MarketDataKind {
    /// Name as written in hierarchy.json, e.g. `CPI_U`.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            MarketDataKind::CpiU => "CPI_U",
            MarketDataKind::FrnFixings => "FRN_FIXINGS",
            MarketDataKind::FrnCurve => "FRN_CURVE",
        }
    }

    pub fn from_str_name(value: &str) -> Option<Self> {
        match value {
            "CPI_U" => Some(MarketDataKind::CpiU),
            "FRN_FIXINGS" => Some(MarketDataKind::FrnFixings),
            "FRN_CURVE" => Some(MarketDataKind::FrnCurve),
            _ => None,
        }
    }
}

/// Typed input error for valuation-arm lookups (docs/adr/typed-input-errors.md).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProductInputError {
    /// The product type (and coupon type) has no arm, or is `unpriced`.
    /// Rust counterpart of `UnmappedProductTypeError`. Maps to `Code::InvalidArgument`.
    Unmapped { product_type: String, coupon_type: String },
    /// hierarchy.json `valuation_arms` is broken. Maps to `Code::Internal`.
    InvalidRegistry(String),
}

impl fmt::Display for ProductInputError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ProductInputError::Unmapped { product_type, coupon_type } => write!(
                f,
                "No valuation arm for product_type {product_type}, coupon_type {coupon_type}"
            ),
            ProductInputError::InvalidRegistry(detail) => {
                write!(f, "hierarchy.json valuation_arms: {detail}")
            }
        }
    }
}

impl std::error::Error for ProductInputError {}

impl From<ProductInputError> for Status {
    fn from(value: ProductInputError) -> Self {
        let code = match value {
            ProductInputError::Unmapped { .. } => Code::InvalidArgument,
            ProductInputError::InvalidRegistry(_) => Code::Internal,
        };
        Status::new(code, value.to_string())
    }
}

/// One resolved arm and the market data it requires, in file order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Arm {
    pub arm: String,
    pub requires: Vec<MarketDataKind>,
}

/// A parsed, checked `valuation_arms` section.
#[derive(Debug)]
pub struct ValuationArms {
    /// node -> coupon type name (`None` for the plain entry) -> arm.
    entries: HashMap<String, HashMap<Option<String>, Arm>>,
    unpriced: HashSet<String>,
}

impl ValuationArms {
    /// The deepest matching node's arm, or `Err(Unmapped)` when unmapped or unpriced.
    pub fn resolve(&self, product_type: &str, coupon_type: &str) -> Result<&Arm, ProductInputError> {
        let mut node = Some(product_type.to_string());
        while let Some(n) = node {
            if let Some(by_coupon) = self.entries.get(&n) {
                if let Some(arm) = by_coupon.get(&Some(coupon_type.to_string())).or_else(|| by_coupon.get(&None)) {
                    return Ok(arm);
                }
            }
            if self.unpriced.contains(&n) {
                break;
            }
            node = product_hierarchy::parent_of(&n);
        }
        Err(ProductInputError::Unmapped {
            product_type: product_type.to_string(),
            coupon_type: coupon_type.to_string(),
        })
    }

    /// Leaf product types (active and planned) with neither an entry nor an
    /// `unpriced` listing.
    pub fn uncovered_leaves(&self) -> Vec<String> {
        product_hierarchy::all_product_types()
            .into_iter()
            .filter(|n| product_hierarchy::descendants_of(n).is_empty() && !self.covers(n))
            .collect()
    }

    fn covers(&self, product_type: &str) -> bool {
        let mut node = Some(product_type.to_string());
        while let Some(n) = node {
            if self.entries.contains_key(&n) || self.unpriced.contains(&n) {
                return true;
            }
            node = product_hierarchy::parent_of(&n);
        }
        false
    }
}

fn bad(detail: String) -> ProductInputError {
    ProductInputError::InvalidRegistry(detail)
}

fn string_of<'a>(body: &'a Map<String, Value>, key: &str) -> Result<&'a str, ProductInputError> {
    body.get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| bad(format!("'{key}' must be a string in {}", Value::Object(body.clone()))))
}

fn strings_of<'a>(body: &'a Map<String, Value>, key: &str) -> Result<Vec<&'a str>, ProductInputError> {
    let err = || bad(format!("'{key}' must be a list of strings in {}", Value::Object(body.clone())));
    body.get(key)
        .and_then(Value::as_array)
        .ok_or_else(err)?
        .iter()
        .map(|v| v.as_str().ok_or_else(err))
        .collect()
}

/// Field names of the `ProductInput.input` oneof, read from the generated
/// descriptor set with prost-types (no prost-reflect in the default build).
fn oneof_arms() -> Result<HashSet<String>, ProductInputError> {
    let set = prost_types::FileDescriptorSet::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET)
        .map_err(|e| bad(format!("cannot decode the proto descriptor set: {e}")))?;
    let message = set
        .file
        .iter()
        .filter(|f| f.package() == "fintekkers.requests.valuation")
        .flat_map(|f| f.message_type.iter())
        .find(|m| m.name() == "ProductInput")
        .ok_or_else(|| bad("ProductInput is not in the proto descriptor set".to_string()))?;
    let index = message
        .oneof_decl
        .iter()
        .position(|o| o.name() == "input")
        .ok_or_else(|| bad("ProductInput has no input oneof".to_string()))?;
    Ok(message
        .field
        .iter()
        .filter(|f| f.oneof_index == Some(index as i32))
        .map(|f| f.name().to_string())
        .collect())
}

/// Parses and checks a `valuation_arms` section (as JSON text) against the
/// shipped product_types tree, the `ProductInput` oneof and the
/// `CouponTypeProto` / [`MarketDataKind`] vocabularies.
pub fn parse_valuation_arms(json: &str) -> Result<ValuationArms, ProductInputError> {
    let section: Value =
        serde_json::from_str(json).map_err(|e| bad(format!("not valid JSON: {e}")))?;
    let section = section
        .as_object()
        .ok_or_else(|| bad("section must be an object".to_string()))?;
    let product_types: HashSet<String> = product_hierarchy::all_product_types().into_iter().collect();
    let arms = oneof_arms()?;

    let mut entries: HashMap<String, HashMap<Option<String>, Arm>> = HashMap::new();
    let raw_entries = section
        .get("entries")
        .and_then(Value::as_array)
        .ok_or_else(|| bad("'entries' must be a list".to_string()))?;
    for raw in raw_entries {
        let body = raw
            .as_object()
            .ok_or_else(|| bad(format!("entry must be an object, got {raw}")))?;
        let node = string_of(body, "node")?;
        if !product_types.contains(node) {
            return Err(bad(format!("node '{node}' is not in product_types")));
        }
        let arm = string_of(body, "arm")?;
        if !arms.contains(arm) {
            return Err(bad(format!("arm '{arm}' is not a ProductInput.input field")));
        }
        let requires = strings_of(body, "requires")?
            .into_iter()
            .map(|r| {
                MarketDataKind::from_str_name(r).ok_or_else(|| {
                    bad(format!("requires value '{r}' is not one of CPI_U, FRN_FIXINGS, FRN_CURVE"))
                })
            })
            .collect::<Result<Vec<_>, _>>()?;
        let coupons: Vec<Option<String>> = if body.contains_key("coupon_types") {
            strings_of(body, "coupon_types")?
                .into_iter()
                .map(|c| match CouponTypeProto::from_str_name(c) {
                    Some(_) => Ok(Some(c.to_string())),
                    None => Err(bad(format!("coupon_types value '{c}' is not a CouponTypeProto name"))),
                })
                .collect::<Result<_, _>>()?
        } else {
            vec![None]
        };
        let by_coupon = entries.entry(node.to_string()).or_default();
        for coupon in coupons {
            if by_coupon.contains_key(&coupon) {
                let suffix = coupon.as_deref().map(|c| format!(", coupon_type {c}")).unwrap_or_default();
                return Err(bad(format!("duplicate entry for node {node}{suffix}")));
            }
            by_coupon.insert(coupon, Arm { arm: arm.to_string(), requires: requires.clone() });
        }
    }

    let mut unpriced = HashSet::new();
    for node in strings_of(section, "unpriced")? {
        if !product_types.contains(node) {
            return Err(bad(format!("node '{node}' is not in product_types")));
        }
        if entries.contains_key(node) {
            return Err(bad(format!("node {node} is both mapped and unpriced")));
        }
        unpriced.insert(node.to_string());
    }
    Ok(ValuationArms { entries, unpriced })
}

/// The shipped `valuation_arms` section, parsed and checked on first use.
pub fn shipped_valuation_arms() -> Result<&'static ValuationArms, ProductInputError> {
    static SHIPPED: OnceLock<Result<ValuationArms, ProductInputError>> = OnceLock::new();
    SHIPPED
        .get_or_init(|| {
            let root: Value = serde_json::from_str(HIERARCHY_JSON)
                .map_err(|e| bad(format!("hierarchy.json failed to parse: {e}")))?;
            let section = root
                .get("valuation_arms")
                .ok_or_else(|| bad("section missing from hierarchy.json".to_string()))?;
            parse_valuation_arms(&section.to_string())
        })
        .as_ref()
        .map_err(Clone::clone)
}

fn product_type_of(security: &SecurityProto) -> String {
    ProductTypeProto::from_i32(security.product_type)
        .map(|p| p.as_str_name().to_string())
        .unwrap_or_else(|| security.product_type.to_string())
}

/// Read from the proto field only; unset `bond_details` reads as UNKNOWN_COUPON_TYPE.
fn coupon_type_of(security: &SecurityProto) -> String {
    match &security.bond_details {
        None => CouponTypeProto::UnknownCouponType.as_str_name().to_string(),
        Some(b) => CouponTypeProto::from_i32(b.coupon_type)
            .map(|c| c.as_str_name().to_string())
            .unwrap_or_else(|| b.coupon_type.to_string()),
    }
}

fn resolve(security: &SecurityProto) -> Result<&'static Arm, ProductInputError> {
    shipped_valuation_arms()?.resolve(&product_type_of(security), &coupon_type_of(security))
}

/// Name of the `ProductInput.input` oneof field that values `security`, e.g. `"tips"`.
pub fn arm_for(security: &SecurityProto) -> Result<&'static str, ProductInputError> {
    resolve(security).map(|a| a.arm.as_str())
}

/// Market data the security's arm needs, in file order; empty when none.
pub fn required_market_data(security: &SecurityProto) -> Result<Vec<MarketDataKind>, ProductInputError> {
    resolve(security).map(|a| a.requires.clone())
}
