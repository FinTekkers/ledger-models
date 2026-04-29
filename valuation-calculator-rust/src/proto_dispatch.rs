/// Proto dispatch bridge: helpers for converting between proto types and
/// the pure-Rust dispatch types.
///
/// This module does NOT depend on generated proto types. It provides utility
/// functions that the gRPC server layer (which depends on generated code via
/// the `proto` feature) can use to convert proto messages into `dispatch::ProductInput`
/// and convert `dispatch::ValuationResult` back to proto response fields.
///
/// The conversion pattern is:
///
/// ```text
/// proto::ProductInput (oneof)
///   --> proto_dispatch helpers
///     --> dispatch::ProductInput (Rust enum)
///       --> dispatch::dispatch_valuation()
///         --> dispatch::ValuationResult
///           --> proto_dispatch helpers
///             --> proto::ValuationResponseProto
/// ```

use crate::curve::YieldCurve;
use crate::date::Date;
use crate::dispatch::*;

// ═══════════════════════════════════════════════════════════════
// Curve conversion helpers
// ═══════════════════════════════════════════════════════════════

/// Convert raw curve data (tenors + rates) into a `YieldCurve`.
///
/// This is used when a proto `YieldCurveInput` is parsed into parallel
/// vectors of tenors and rates.
pub fn curve_from_raw(reference_date: Date, tenors: &[f64], rates: &[f64]) -> Result<YieldCurve, String> {
    YieldCurve::new(reference_date, tenors.to_vec(), rates.to_vec())
        .map_err(|e| format!("Invalid curve: {}", e))
}

/// Convert a `YieldCurve` back to raw tenors + rates for proto serialization.
pub fn curve_to_raw(curve: &YieldCurve) -> (Date, Vec<f64>, Vec<f64>) {
    (
        curve.reference_date(),
        curve.tenors().to_vec(),
        curve.zero_rates().to_vec(),
    )
}

// ═══════════════════════════════════════════════════════════════
// Result conversion helpers
// ═══════════════════════════════════════════════════════════════

/// Convert a `ValuationResult` back into proto-compatible format.
///
/// Returns `(measure_name, value_string)` pairs suitable for populating
/// `MeasureMapEntry` in the proto response. Values are formatted as strings
/// to match the proto `DecimalValueProto.arbitrary_precision_value` field.
pub fn result_to_measure_pairs(result: &ValuationResult) -> Vec<(String, String)> {
    result.measures.iter()
        .map(|(name, val)| (name.clone(), format!("{}", val)))
        .collect()
}

/// Extract error messages from a `ValuationResult` for the proto `SummaryProto`.
pub fn result_errors(result: &ValuationResult) -> Vec<String> {
    result.errors.clone()
}

/// Check if the valuation completed successfully (no errors).
pub fn result_is_ok(result: &ValuationResult) -> bool {
    result.errors.is_empty()
}

// ═══════════════════════════════════════════════════════════════
// Input construction helpers
// ═══════════════════════════════════════════════════════════════

/// Helper to build a `BondInput` from raw field values, as would be extracted
/// from a proto `BondInput` message.
pub fn build_bond_input(
    coupon_rate: f64,
    coupon_freq: u32,
    face_value: f64,
    dated_date: Date,
    maturity_date: Date,
    clean_price: f64,
    settlement: Date,
    day_count: crate::daycount::DayCountConvention,
    benchmark_curve: Option<YieldCurve>,
    z_spread: f64,
) -> ProductInput {
    ProductInput::Bond(BondInput {
        coupon_rate,
        coupon_freq,
        face_value,
        dated_date,
        maturity_date,
        clean_price,
        settlement,
        day_count,
        benchmark_curve,
        z_spread,
    })
}

/// Helper to build a `SwapInput` from raw field values.
pub fn build_swap_input(
    notional: f64,
    fixed_rate: f64,
    fixed_freq: u32,
    float_freq: u32,
    float_spread: f64,
    start_date: Date,
    maturity_date: Date,
    pay_fixed: bool,
    projection_curve: YieldCurve,
    discount_curve: YieldCurve,
) -> ProductInput {
    ProductInput::Swap(SwapInput {
        notional,
        fixed_rate,
        fixed_freq,
        float_freq,
        float_spread,
        start_date,
        maturity_date,
        pay_fixed,
        projection_curve,
        discount_curve,
    })
}

// ═══════════════════════════════════════════════════════════════
// Full dispatch entry point for proto callers
// ═══════════════════════════════════════════════════════════════

/// Run a valuation from a `ProductInput` and return structured results.
///
/// This is the entry point for the gRPC handler. The handler converts the
/// proto `ProductInput` oneof into a Rust `ProductInput` using the helpers
/// above, then calls this function, then converts the result back to proto
/// using `result_to_measure_pairs` and `result_errors`.
pub fn run_valuation(input: &ProductInput, settlement: Date) -> ValuationResult {
    crate::dispatch::dispatch_valuation(input, settlement)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    #[test]
    fn curve_round_trip() {
        let ref_date = d(2025, 1, 1);
        let tenors = vec![0.5, 1.0, 2.0, 5.0, 10.0];
        let rates = vec![0.03, 0.035, 0.04, 0.045, 0.05];

        let curve = curve_from_raw(ref_date, &tenors, &rates).unwrap();
        let (rd, t, r) = curve_to_raw(&curve);

        assert_eq!(rd, ref_date);
        assert_eq!(t, tenors);
        assert_eq!(r, rates);
    }

    #[test]
    fn curve_from_raw_empty_error() {
        let result = curve_from_raw(d(2025, 1, 1), &[], &[]);
        assert!(result.is_err());
    }

    #[test]
    fn result_to_pairs() {
        let result = ValuationResult {
            measures: vec![
                ("YTM".into(), 0.05),
                ("Duration".into(), 7.5),
            ],
            cashflows: vec![],
            errors: vec![],
        };

        let pairs = result_to_measure_pairs(&result);
        assert_eq!(pairs.len(), 2);
        assert_eq!(pairs[0].0, "YTM");
        assert_eq!(pairs[1].0, "Duration");
        assert!(result_is_ok(&result));
    }

    #[test]
    fn result_with_errors() {
        let result = ValuationResult {
            measures: vec![],
            cashflows: vec![],
            errors: vec!["Bond has matured".into()],
        };

        assert!(!result_is_ok(&result));
        assert_eq!(result_errors(&result).len(), 1);
    }

    #[test]
    fn build_and_dispatch_bond() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![0.04; 6],
        ).unwrap();

        let input = build_bond_input(
            0.05, 2, 100.0,
            d(2025, 1, 1), d(2035, 1, 1),
            100.0, d(2025, 1, 1),
            DayCountConvention::ActualActualICMA,
            Some(curve), 0.0,
        );

        let result = run_valuation(&input, d(2025, 1, 1));
        assert!(result_is_ok(&result));

        let pairs = result_to_measure_pairs(&result);
        assert!(!pairs.is_empty());

        // Find YTM in pairs
        let ytm_pair = pairs.iter().find(|(k, _)| k == "YieldToMaturity");
        assert!(ytm_pair.is_some(), "Should contain YieldToMaturity");
    }

    #[test]
    fn build_and_dispatch_swap() {
        let curve = YieldCurve::new(
            d(2025, 1, 1),
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![0.04; 6],
        ).unwrap();

        let input = build_swap_input(
            1_000_000.0, 0.04, 2, 4, 0.0,
            d(2025, 1, 1), d(2030, 1, 1),
            true,
            curve.clone(), curve,
        );

        let result = run_valuation(&input, d(2025, 1, 1));
        assert!(result_is_ok(&result));

        let pairs = result_to_measure_pairs(&result);
        let npv_pair = pairs.iter().find(|(k, _)| k == "NPV");
        assert!(npv_pair.is_some(), "Should contain NPV");
    }
}
