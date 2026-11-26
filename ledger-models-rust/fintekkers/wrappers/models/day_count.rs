//! Bond day-count conventions (LM-498). Same rules in Java / Rust / Python /
//! JS-TS. See docs/adr/day_count_convention.md; the `DayCountConventionProto`
//! comments are the spec.
//!
//! Two halves that change for different reasons:
//!
//! - The resolver ([`resolve_day_count`]) picks a bond's convention: an
//!   explicit `BondDetailsProto.day_count` other than `UNKNOWN_DAY_COUNT`
//!   wins, else the `default_day_count` entry of
//!   ledger-models-protos/hierarchy.json for the security's `product_type`
//!   (deepest node on the parent chain wins), else `UNKNOWN_DAY_COUNT`. It
//!   never errors for a product with no entry and never guesses a convention.
//!   A broken section is [`ProductInputError::InvalidRegistry`], never a panic.
//! - The date helpers ([`day_count`], [`year_fraction`], `icma_*`) are plain
//!   date arithmetic. They never read hierarchy.json, so a broken registry
//!   cannot break them. Results are `f64`: fine for fractions, not for decimal
//!   cash amounts. Bad input is a [`DayCountError`].

use crate::fintekkers::models::security::{DayCountConventionProto, ProductTypeProto, SecurityProto};
use crate::fintekkers::wrappers::models::product_hierarchy;
use crate::fintekkers::wrappers::models::product_inputs::ProductInputError;
use chrono::{Datelike, NaiveDate};
use serde_json::Value;
use std::collections::{BTreeMap, HashSet};
use std::fmt;
use std::sync::OnceLock;

const HIERARCHY_JSON: &str = include_str!("../../../hierarchy.json");

const SECTION: &str = "default_day_count";

// ---------- resolver: hierarchy.json default_day_count ----------

/// A parsed, checked `default_day_count` section: node -> convention.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DefaultDayCounts {
    entries: BTreeMap<String, DayCountConventionProto>,
}

impl DefaultDayCounts {
    /// node -> convention, as written in the section.
    pub fn entries(&self) -> &BTreeMap<String, DayCountConventionProto> {
        &self.entries
    }

    /// The deepest entry on `product_type`'s parent chain, or `UnknownDayCount`.
    pub fn default_for(&self, product_type: &str) -> DayCountConventionProto {
        let mut node = Some(product_type.to_string());
        while let Some(n) = node {
            if let Some(c) = self.entries.get(&n) {
                return *c;
            }
            node = product_hierarchy::parent_of(&n);
        }
        DayCountConventionProto::UnknownDayCount
    }
}

fn bad(detail: String) -> ProductInputError {
    ProductInputError::InvalidRegistry(format!("{SECTION}: {detail}"))
}

/// Parses and checks a `default_day_count` section (as JSON text) against the
/// shipped product_types tree and the `DayCountConventionProto` names. A key
/// that is not a product_types node, or a value that is not a
/// `DayCountConventionProto` name or is `UNKNOWN_DAY_COUNT`, is `InvalidRegistry`.
pub fn parse_default_day_count(json: &str) -> Result<DefaultDayCounts, ProductInputError> {
    let section: Value = serde_json::from_str(json).map_err(|e| bad(format!("not valid JSON: {e}")))?;
    let section = section.as_object().ok_or_else(|| bad("section must be an object".to_string()))?;
    let product_types: HashSet<String> = product_hierarchy::all_product_types().into_iter().collect();
    let mut entries = BTreeMap::new();
    for (node, value) in section {
        if !product_types.contains(node) {
            return Err(bad(format!("node '{node}' is not in product_types")));
        }
        let convention = value
            .as_str()
            .and_then(DayCountConventionProto::from_str_name)
            .ok_or_else(|| bad(format!("value {value} for node {node} is not a DayCountConventionProto name")))?;
        if convention == DayCountConventionProto::UnknownDayCount {
            return Err(bad(format!("node {node} must not default to UNKNOWN_DAY_COUNT")));
        }
        entries.insert(node.clone(), convention);
    }
    Ok(DefaultDayCounts { entries })
}

/// Parses and checks the `default_day_count` section of a whole hierarchy.json
/// (as JSON text). A root without the section is `InvalidRegistry`.
pub fn default_day_count_from_hierarchy(json: &str) -> Result<DefaultDayCounts, ProductInputError> {
    let root: Value = serde_json::from_str(json).map_err(|e| bad(format!("hierarchy.json failed to parse: {e}")))?;
    let section = root.get(SECTION).ok_or_else(|| bad("section missing from hierarchy.json".to_string()))?;
    parse_default_day_count(&section.to_string())
}

/// The shipped `default_day_count` section, parsed and checked on first use.
pub fn shipped_default_day_counts() -> Result<&'static DefaultDayCounts, ProductInputError> {
    static SHIPPED: OnceLock<Result<DefaultDayCounts, ProductInputError>> = OnceLock::new();
    SHIPPED
        .get_or_init(|| default_day_count_from_hierarchy(HIERARCHY_JSON))
        .as_ref()
        .map_err(Clone::clone)
}

/// The product default for the security's raw `product_type`, or
/// `UnknownDayCount` when it has none. `Err` only on a broken shipped registry.
pub fn default_day_count_for(security: &SecurityProto) -> Result<DayCountConventionProto, ProductInputError> {
    Ok(shipped_default_day_counts()?.default_for(&product_type_of(security)))
}

/// The bond's convention: `bond_details.day_count` when set to anything but
/// `UNKNOWN_DAY_COUNT`, else the product default, else `UnknownDayCount`.
/// Never guesses: a number this build does not know (a newer writer's value)
/// is `UnknownDayCount`, not the product default. `Err` only on a broken
/// shipped registry.
pub fn resolve_day_count(security: &SecurityProto) -> Result<DayCountConventionProto, ProductInputError> {
    let explicit = security.bond_details.as_ref().and_then(|bd| bd.day_count);
    match explicit {
        Some(v) if v != DayCountConventionProto::UnknownDayCount as i32 => {
            Ok(DayCountConventionProto::from_i32(v).unwrap_or(DayCountConventionProto::UnknownDayCount))
        }
        _ => default_day_count_for(security),
    }
}

/// The `ProductTypeProto` name, or the raw number for an unknown value.
fn product_type_of(security: &SecurityProto) -> String {
    ProductTypeProto::from_i32(security.product_type)
        .map(|t| t.as_str_name().to_string())
        .unwrap_or_else(|| security.product_type.to_string())
}

// ---------- date helpers: no registry access ----------

/// Typed input error from the date helpers (docs/adr/typed-input-errors.md).
/// Non-exhaustive: match it with a wildcard pattern.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub enum DayCountError {
    /// `UNKNOWN_DAY_COUNT`: there is no convention to apply.
    UnknownConvention,
    /// The start date is after the end date.
    StartAfterEnd { start: NaiveDate, end: NaiveDate },
    /// `year_fraction` was called with `ACT_ACT_ICMA`, which needs the coupon
    /// period: use [`icma_year_fraction`].
    UseIcma,
    /// The ICMA coupon period is empty or reversed.
    EmptyPeriod { period_start: NaiveDate, period_end: NaiveDate },
    /// The ICMA accrual is not inside its coupon period.
    OutsidePeriod { start: NaiveDate, end: NaiveDate, period_start: NaiveDate, period_end: NaiveDate },
    /// The ICMA frequency (coupons a year) is zero.
    InvalidFrequency,
}

impl fmt::Display for DayCountError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DayCountError::UnknownConvention => write!(f, "convention: no day-count convention to apply"),
            DayCountError::StartAfterEnd { start, end } => write!(f, "end: start {start} is after end {end}"),
            DayCountError::UseIcma => {
                write!(f, "convention: ACT_ACT_ICMA needs the coupon period: use icma_year_fraction")
            }
            DayCountError::EmptyPeriod { period_start, period_end } => {
                write!(f, "period_end: period_start {period_start} must be before period_end {period_end}")
            }
            DayCountError::OutsidePeriod { start, end, period_start, period_end } => write!(
                f,
                "period_start: {start} -> {end} is outside the coupon period {period_start} -> {period_end}"
            ),
            DayCountError::InvalidFrequency => {
                write!(f, "frequency: frequency must be a positive number of coupons a year")
            }
        }
    }
}

impl std::error::Error for DayCountError {}

/// Days from `start` (excluded) to `end` (included) under the convention.
/// `THIRTY_360_US` applies the bond-basis rules; every other convention
/// counts actual calendar days.
pub fn day_count(convention: DayCountConventionProto, start: NaiveDate, end: NaiveDate) -> Result<i64, DayCountError> {
    if convention == DayCountConventionProto::UnknownDayCount {
        return Err(DayCountError::UnknownConvention);
    }
    check_order(start, end)?;
    Ok(match convention {
        DayCountConventionProto::Thirty360Us => thirty_360_us(start, end),
        _ => actual_days(start, end),
    })
}

/// Years from `start` to `end`: days / 360 for `THIRTY_360_US` and
/// `ACT_360`, days / 365 for `ACT_365_FIXED`. `ACT_ACT_ICMA` is
/// [`DayCountError::UseIcma`].
pub fn year_fraction(convention: DayCountConventionProto, start: NaiveDate, end: NaiveDate) -> Result<f64, DayCountError> {
    if convention == DayCountConventionProto::ActActIcma {
        return Err(DayCountError::UseIcma);
    }
    let days = day_count(convention, start, end)? as f64;
    Ok(match convention {
        DayCountConventionProto::Act365Fixed => days / 365.0,
        _ => days / 360.0,
    })
}

/// ACT/ACT ICMA: actual days `start -> end` over actual days in the regular
/// coupon period that contains them. Needs `period_start <= start <= end <=
/// period_end` and `period_start < period_end`.
pub fn icma_period_fraction(
    start: NaiveDate,
    end: NaiveDate,
    period_start: NaiveDate,
    period_end: NaiveDate,
) -> Result<f64, DayCountError> {
    check_order(start, end)?;
    if period_start >= period_end {
        return Err(DayCountError::EmptyPeriod { period_start, period_end });
    }
    if start < period_start || end > period_end {
        return Err(DayCountError::OutsidePeriod { start, end, period_start, period_end });
    }
    Ok(actual_days(start, end) as f64 / actual_days(period_start, period_end) as f64)
}

/// ACT/ACT ICMA in years: days / (frequency x period days), `frequency` being
/// coupons a year (2 for semiannual). Errors as [`icma_period_fraction`]
/// does, or [`DayCountError::InvalidFrequency`] for 0.
pub fn icma_year_fraction(
    start: NaiveDate,
    end: NaiveDate,
    period_start: NaiveDate,
    period_end: NaiveDate,
    frequency: u32,
) -> Result<f64, DayCountError> {
    if frequency == 0 {
        return Err(DayCountError::InvalidFrequency);
    }
    Ok(icma_period_fraction(start, end, period_start, period_end)? / f64::from(frequency))
}

fn check_order(start: NaiveDate, end: NaiveDate) -> Result<(), DayCountError> {
    if start > end {
        return Err(DayCountError::StartAfterEnd { start, end });
    }
    Ok(())
}

fn actual_days(start: NaiveDate, end: NaiveDate) -> i64 {
    end.signed_duration_since(start).num_days()
}

fn thirty_360_us(start: NaiveDate, end: NaiveDate) -> i64 {
    let mut d1 = i64::from(start.day());
    let mut d2 = i64::from(end.day());
    if d1 == 31 {
        d1 = 30;
    }
    if d2 == 31 && d1 >= 30 {
        d2 = 30;
    }
    360 * i64::from(end.year() - start.year()) + 30 * (i64::from(end.month()) - i64::from(start.month())) + (d2 - d1)
}
