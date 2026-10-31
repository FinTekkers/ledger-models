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
//! [`for_security`] builds the `ProductInput` for that arm from a security,
//! its price and its market data; [`check_product_input`] checks a
//! `ProductInput` against the same rule (LM-410, see
//! docs/adr/product_input_builders.md).
//!
//! [`measures_for_arm`] lists the measures valuation-service computes for an
//! arm, read from the embedded catalog/measures.json through the same lookup
//! (LM-427). There is no measure list in code.
//!
//! Embeds the crate-root `hierarchy.json` itself rather than reading it
//! through [`product_hierarchy`], so that loader stays unchanged. A broken
//! section is [`ProductInputError::InvalidRegistry`], never a panic.

use crate::fintekkers::models::position::MeasureProto;
use crate::fintekkers::models::price::PriceProto;
use crate::fintekkers::models::security::{CouponTypeProto, ProductTypeProto, SecurityProto};
use crate::fintekkers::models::util::UuidProto;
use crate::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use crate::fintekkers::requests::util::errors::FieldViolationProto;
use crate::fintekkers::requests::valuation::product_input::Input;
use crate::fintekkers::requests::valuation::{
    BondInput, CashInput, EquityInput, FrnInput, InflationIndexInput, MbsInput, ProductInput,
    ReferenceRateFixingProto, TipsInput, YieldCurveInput,
};
use crate::fintekkers::wrappers::models::product_hierarchy;
use crate::fintekkers::wrappers::models::utils::errors::object_id_of;
use prost::Message;
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use std::fmt;
use std::sync::OnceLock;
use tonic::{Code, Status};

const HIERARCHY_JSON: &str = include_str!("../../../hierarchy.json");
const MEASURES_JSON: &str = include_str!("../../../catalog/measures.json");

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
/// Non-exhaustive: match it with a wildcard arm.
#[derive(Debug, Clone, PartialEq)]
#[non_exhaustive]
pub enum ProductInputError {
    /// The product type (and coupon type) has no arm, or is `unpriced`.
    /// Rust counterpart of `UnmappedProductTypeError`. Maps to `Code::InvalidArgument`.
    Unmapped { product_type: String, coupon_type: String },
    /// hierarchy.json `valuation_arms` is broken. Maps to `Code::Internal`.
    InvalidRegistry(String),
    /// The arm requires market data the caller did not supply (LM-410).
    /// Maps to `Code::InvalidArgument`.
    MissingMarketData(MissingMarketDataError),
    /// The `ProductInput` or request is malformed: no arm, the wrong arm, or a
    /// missing required field (LM-410). Never empty. Maps to `Code::InvalidArgument`.
    Validation(Vec<FieldViolationProto>),
}

impl ProductInputError {
    /// Field-level violations of a `MissingMarketData` or `Validation` error;
    /// empty for the other variants.
    pub fn violations(&self) -> Vec<FieldViolationProto> {
        match self {
            ProductInputError::MissingMarketData(e) => vec![e.violation()],
            ProductInputError::Validation(v) => v.clone(),
            _ => vec![],
        }
    }
}

/// The security's valuation arm requires market data (hierarchy.json
/// `valuation_arms` `requires`) that the caller did not supply, e.g. arm
/// `tips` with no `CPI_U`. Rust counterpart of `MissingMarketDataError`.
#[derive(Debug, Clone, PartialEq)]
pub struct MissingMarketDataError {
    /// The `ProductInput.input` field, e.g. `tips`.
    pub arm: String,
    pub kind: MarketDataKind,
    /// The arm field that holds it, e.g. `tips.cpi`.
    pub field: String,
    /// UUID of the security; `None` when it has none.
    pub object_id: Option<UuidProto>,
}

impl MissingMarketDataError {
    /// The one field-level violation, on [`Self::field`].
    pub fn violation(&self) -> FieldViolationProto {
        FieldViolationProto {
            field: self.field.clone(),
            object_id: self.object_id.clone(),
            message: self.to_string(),
        }
    }
}

impl fmt::Display for MissingMarketDataError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "missing market data {} for arm {}", self.kind.as_str_name(), self.arm)
    }
}

impl std::error::Error for MissingMarketDataError {}

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
            ProductInputError::MissingMarketData(e) => write!(f, "{}: {e}", e.field),
            ProductInputError::Validation(violations) => write!(
                f,
                "{}",
                violations.iter().map(|v| format!("{}: {}", v.field, v.message)).collect::<Vec<_>>().join("; ")
            ),
        }
    }
}

impl std::error::Error for ProductInputError {}

impl From<ProductInputError> for Status {
    fn from(value: ProductInputError) -> Self {
        let code = match value {
            ProductInputError::Unmapped { .. }
            | ProductInputError::MissingMarketData(_)
            | ProductInputError::Validation(_) => Code::InvalidArgument,
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

/// The measures valuation-service computes for `arm` (e.g. `"frn"`), in
/// catalog order: entries of the embedded catalog/measures.json with
/// `computed_by: valuation-service` and `implemented: true` whose `applies_to`
/// names a leaf product type the arm values, or an ancestor of one (LM-427).
/// `Err(Unmapped)` with `product_type` = `arm` when no leaf maps to `arm`.
pub fn measures_for_arm(arm: &str) -> Result<Vec<MeasureProto>, ProductInputError> {
    measures_for_arm_in(shipped_measures()?, arm)
}

/// The embedded catalog's `measures` list, parsed on first use.
fn shipped_measures() -> Result<&'static [Value], ProductInputError> {
    static SHIPPED: OnceLock<Result<Vec<Value>, ProductInputError>> = OnceLock::new();
    SHIPPED
        .get_or_init(|| {
            let root: Value = serde_json::from_str(MEASURES_JSON)
                .map_err(|e| bad(format!("catalog/measures.json failed to parse: {e}")))?;
            root.get("measures")
                .and_then(Value::as_array)
                .cloned()
                .ok_or_else(|| bad("catalog/measures.json has no measures list".to_string()))
        })
        .as_ref()
        .map(Vec::as_slice)
        .map_err(Clone::clone)
}

/// [`measures_for_arm`] over a given `measures` list.
fn measures_for_arm_in(measures: &[Value], arm: &str) -> Result<Vec<MeasureProto>, ProductInputError> {
    let arms = shipped_valuation_arms()?;
    let unknown_coupon = CouponTypeProto::UnknownCouponType.as_str_name();
    // Leaves resolve with no coupon type, as arm_for does with no bond_details:
    // the BOND + FLOAT entry is ignored on purpose (docs/adr/valuation_arms.md).
    let lineage: HashSet<String> = product_hierarchy::all_product_types()
        .into_iter()
        .filter(|n| product_hierarchy::descendants_of(n).is_empty() && ProductTypeProto::from_str_name(n).is_some())
        .filter(|n| arms.resolve(n, unknown_coupon).is_ok_and(|a| a.arm == arm))
        .flat_map(|leaf| std::iter::successors(Some(leaf), |n| product_hierarchy::parent_of(n)))
        .collect();
    if lineage.is_empty() {
        return Err(ProductInputError::Unmapped {
            product_type: arm.to_string(),
            coupon_type: unknown_coupon.to_string(),
        });
    }
    let mut out = Vec::new();
    for m in measures {
        if m.get("computed_by").and_then(Value::as_str) != Some("valuation-service")
            || m.get("implemented").and_then(Value::as_bool) != Some(true)
        {
            continue;
        }
        let applies_to = m.get("applies_to").and_then(Value::as_array).ok_or_else(|| {
            bad(format!("catalog/measures.json: 'applies_to' must be a list in {m}"))
        })?;
        if !applies_to.iter().any(|n| n.as_str().is_some_and(|n| lineage.contains(n))) {
            continue;
        }
        let name = m.get("name").and_then(Value::as_str).unwrap_or_default();
        let measure = MeasureProto::from_str_name(name)
            .ok_or_else(|| bad(format!("catalog/measures.json: '{name}' is not a MeasureProto name")))?;
        if !out.contains(&measure) {
            out.push(measure);
        }
    }
    Ok(out)
}

/// Market data for [`for_security`], one field per [`MarketDataKind`]:
/// `CpiU` is `cpi`, `FrnFixings` is `fixings`, `FrnCurve` is `curve`. Each is
/// copied to the arm field of the same name (`TipsInput.cpi`,
/// `FrnInput.fixings`, `FrnInput.curve`) when the arm has one; the others are
/// ignored.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct MarketData {
    pub cpi: Option<InflationIndexInput>,
    pub fixings: Vec<ReferenceRateFixingProto>,
    pub curve: Option<YieldCurveInput>,
}

/// The `ProductInput` for `security`, in the arm [`arm_for`] picks.
///
/// Sets the arm's security and copies `price.price` as is into `clean_price`
/// (bond, tips, frn, mbs) or `unit_price` (equity, cash). Never sets
/// `cost_basis`. `Err(Unmapped)` when the type has no arm,
/// `Err(MissingMarketData)` when `market_data` lacks a kind the arm requires.
pub fn for_security(
    security: &SecurityProto,
    price: &PriceProto,
    market_data: &MarketData,
) -> Result<ProductInput, ProductInputError> {
    let arm = arm_for(security)?;
    let security_field = Some(security.clone());
    let price_field = price.price.clone();
    let input = match arm {
        "bond" => Input::Bond(BondInput { security: security_field, clean_price: price_field, ..Default::default() }),
        "tips" => Input::Tips(TipsInput {
            security: security_field,
            clean_price: price_field,
            cpi: market_data.cpi.clone(),
            ..Default::default()
        }),
        "frn" => Input::Frn(FrnInput {
            security: security_field,
            clean_price: price_field,
            curve: market_data.curve.clone(),
            fixings: market_data.fixings.clone(),
            ..Default::default()
        }),
        "mbs" => Input::Mbs(MbsInput { security: security_field, clean_price: price_field, ..Default::default() }),
        "equity" => Input::Equity(EquityInput { security: security_field, unit_price: price_field }),
        "cash" => Input::Cash(CashInput { security: security_field, unit_price: price_field }),
        other => return Err(bad(format!("for_security has no builder for arm {other}"))),
    };
    let out = ProductInput { input: Some(input) };
    check_product_input(&out)?;
    Ok(out)
}

/// Checks `product_input` is the arm [`arm_for`] picks for its security, and
/// holds every market-data kind that arm requires. `Err(Validation)` when no
/// arm is set or it is the wrong arm, `Err(Unmapped)`, or
/// `Err(MissingMarketData)`.
pub fn check_product_input(product_input: &ProductInput) -> Result<(), ProductInputError> {
    let Some(input) = &product_input.input else {
        return Err(ProductInputError::Validation(vec![FieldViolationProto {
            field: "product_input".to_string(),
            object_id: None,
            message: "no ProductInput arm is set".to_string(),
        }]));
    };
    let (arm, security) = match input {
        Input::Bond(b) => ("bond", &b.security),
        Input::Tips(t) => ("tips", &t.security),
        Input::Frn(f) => ("frn", &f.security),
        Input::Mbs(m) => ("mbs", &m.security),
        Input::Equity(e) => ("equity", &e.security),
        Input::Cash(c) => ("cash", &c.security),
    };
    let security = security.clone().unwrap_or_default();
    let resolved = resolve(&security)?;
    let object_id = object_id_of(security.uuid.as_ref());
    if resolved.arm != arm {
        return Err(ProductInputError::Validation(vec![FieldViolationProto {
            field: format!("product_input.{arm}"),
            object_id,
            message: format!(
                "arm {arm} does not match arm {} for product_type {}",
                resolved.arm,
                product_type_of(&security)
            ),
        }]));
    }
    match resolved.requires.iter().find(|kind| !has(product_input, **kind)) {
        Some(kind) => Err(ProductInputError::MissingMarketData(MissingMarketDataError {
            arm: arm.to_string(),
            kind: *kind,
            field: format!("{arm}.{}", field_of(*kind)),
            object_id,
        })),
        None => Ok(()),
    }
}

/// The `ProductInput` arm field (and [`MarketData`] field) that holds `kind`.
fn field_of(kind: MarketDataKind) -> &'static str {
    match kind {
        MarketDataKind::CpiU => "cpi",
        MarketDataKind::FrnFixings => "fixings",
        MarketDataKind::FrnCurve => "curve",
    }
}

/// Whether `product_input` holds `kind`. A cpi with neither readings nor
/// reference_cpi does not count.
fn has(product_input: &ProductInput, kind: MarketDataKind) -> bool {
    match (&product_input.input, kind) {
        (Some(Input::Tips(t)), MarketDataKind::CpiU) => t.cpi.as_ref().is_some_and(|c| c.cpi.is_some()),
        (Some(Input::Frn(f)), MarketDataKind::FrnFixings) => !f.fixings.is_empty(),
        (Some(Input::Frn(f)), MarketDataKind::FrnCurve) => f.curve.is_some(),
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The embedded catalog, with `edit` applied.
    fn catalog_with(edit: impl FnOnce(&mut Vec<Value>)) -> Vec<Value> {
        let mut measures = shipped_measures().expect("catalog").to_vec();
        edit(&mut measures);
        measures
    }

    // Guardrail 1: the result comes from the catalog data, not a list in code.
    #[test]
    fn measures_for_arm_in_follows_implemented() {
        let measures = catalog_with(|ms| {
            for m in ms.iter_mut().filter(|m| m["name"] == "DISCOUNT_MARGIN") {
                m["implemented"] = Value::Bool(false);
            }
        });
        assert!(measures_for_arm_in(shipped_measures().unwrap(), "frn").unwrap().contains(&MeasureProto::DiscountMargin));
        assert!(!measures_for_arm_in(&measures, "frn").unwrap().contains(&MeasureProto::DiscountMargin));
    }

    #[test]
    fn measures_for_arm_in_follows_an_ancestor_node() {
        let measures = catalog_with(|ms| {
            for m in ms.iter_mut().filter(|m| m["name"] == "PAR_YIELD") {
                m["implemented"] = Value::Bool(true);
                m["applies_to"] = serde_json::json!(["GOV_BOND"]);
            }
        });
        for arm in ["frn", "bond"] {
            assert!(!measures_for_arm_in(shipped_measures().unwrap(), arm).unwrap().contains(&MeasureProto::ParYield));
            assert!(measures_for_arm_in(&measures, arm).unwrap().contains(&MeasureProto::ParYield), "{arm}");
        }
    }
}
