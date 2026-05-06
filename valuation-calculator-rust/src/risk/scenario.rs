use crate::curve::YieldCurve;

/// A scenario defines a set of shocks to apply to a yield curve.
#[derive(Debug, Clone)]
pub enum CurveScenario {
    /// Parallel shift: all rates move by the same amount
    ParallelShift(f64), // e.g., +0.01 = +100bp

    /// Steepener: short end down, long end up
    /// Linearly interpolates from short_shift at t=0 to 0 at pivot to long_shift at max tenor
    Steepener {
        pivot: f64,
        short_shift: f64,
        long_shift: f64,
    },

    /// Flattener: short end up, long end down
    /// Linearly interpolates from short_shift at t=0 to 0 at pivot to long_shift at max tenor
    Flattener {
        pivot: f64,
        short_shift: f64,
        long_shift: f64,
    },

    /// Twist: custom shifts at each curve tenor
    Custom(Vec<(f64, f64)>), // (tenor, shift) pairs

    /// Historical: shift to a specific rate level
    AbsoluteLevel(Vec<(f64, f64)>), // (tenor, target_rate) pairs
}

/// Apply a scenario to a yield curve, returning a new shocked curve.
pub fn apply_scenario(curve: &YieldCurve, scenario: &CurveScenario) -> YieldCurve {
    let tenors = curve.tenors().to_vec();
    let rates = curve.zero_rates().to_vec();

    let shocked_rates = match scenario {
        CurveScenario::ParallelShift(shift) => rates.iter().map(|r| r + shift).collect(),
        CurveScenario::Steepener {
            pivot,
            short_shift,
            long_shift,
        } => interpolate_twist(&tenors, &rates, *pivot, *short_shift, *long_shift),
        CurveScenario::Flattener {
            pivot,
            short_shift,
            long_shift,
        } => interpolate_twist(&tenors, &rates, *pivot, *short_shift, *long_shift),
        CurveScenario::Custom(shifts) => apply_custom_shifts(&tenors, &rates, shifts),
        CurveScenario::AbsoluteLevel(levels) => apply_absolute_levels(&tenors, levels),
    };

    YieldCurve::new(curve.reference_date(), tenors, shocked_rates).unwrap()
}

/// Linearly interpolate a twist/steepener/flattener shift profile.
///
/// The shift at each tenor is:
/// - At t=0: short_shift
/// - At t=pivot: 0 (no shift)
/// - At t=max_tenor: long_shift
/// Linear interpolation between these points.
fn interpolate_twist(
    tenors: &[f64],
    rates: &[f64],
    pivot: f64,
    short_shift: f64,
    long_shift: f64,
) -> Vec<f64> {
    let max_t = *tenors.last().unwrap();

    tenors
        .iter()
        .zip(rates.iter())
        .map(|(&t, &r)| {
            let shift = if t <= pivot {
                // Linear from short_shift at t=0 to 0 at pivot
                if pivot > 0.0 {
                    short_shift * (1.0 - t / pivot)
                } else {
                    0.0
                }
            } else {
                // Linear from 0 at pivot to long_shift at max_t
                if max_t > pivot {
                    long_shift * (t - pivot) / (max_t - pivot)
                } else {
                    0.0
                }
            };
            r + shift
        })
        .collect()
}

/// Apply custom shifts by linearly interpolating between the given (tenor, shift) pairs.
fn apply_custom_shifts(
    curve_tenors: &[f64],
    curve_rates: &[f64],
    shifts: &[(f64, f64)],
) -> Vec<f64> {
    if shifts.is_empty() {
        return curve_rates.to_vec();
    }

    curve_tenors
        .iter()
        .zip(curve_rates.iter())
        .map(|(&t, &r)| {
            let shift = interpolate_shift(t, shifts);
            r + shift
        })
        .collect()
}

/// Linearly interpolate a shift value at tenor t from a sorted list of (tenor, shift) pairs.
/// Flat extrapolation beyond the boundaries.
fn interpolate_shift(t: f64, shifts: &[(f64, f64)]) -> f64 {
    if shifts.is_empty() {
        return 0.0;
    }
    if t <= shifts[0].0 {
        return shifts[0].1;
    }
    if t >= shifts[shifts.len() - 1].0 {
        return shifts[shifts.len() - 1].1;
    }

    for i in 1..shifts.len() {
        if t <= shifts[i].0 {
            let (t0, s0) = shifts[i - 1];
            let (t1, s1) = shifts[i];
            let weight = (t - t0) / (t1 - t0);
            return s0 + weight * (s1 - s0);
        }
    }

    shifts[shifts.len() - 1].1
}

/// Apply absolute rate levels by interpolating between the given (tenor, target_rate) pairs.
fn apply_absolute_levels(tenors: &[f64], levels: &[(f64, f64)]) -> Vec<f64> {
    if levels.is_empty() {
        return vec![0.0; tenors.len()];
    }

    tenors.iter().map(|&t| interpolate_shift(t, levels)).collect()
}

/// Standard scenario set for stress testing
pub fn standard_scenarios() -> Vec<(&'static str, CurveScenario)> {
    vec![
        ("Parallel +100bp", CurveScenario::ParallelShift(0.01)),
        ("Parallel -100bp", CurveScenario::ParallelShift(-0.01)),
        ("Parallel +200bp", CurveScenario::ParallelShift(0.02)),
        ("Parallel -200bp", CurveScenario::ParallelShift(-0.02)),
        (
            "Steepener +50bp",
            CurveScenario::Steepener {
                pivot: 5.0,
                short_shift: -0.005,
                long_shift: 0.005,
            },
        ),
        (
            "Flattener +50bp",
            CurveScenario::Flattener {
                pivot: 5.0,
                short_shift: 0.005,
                long_shift: -0.005,
            },
        ),
    ]
}

/// Result of running a single scenario
#[derive(Debug, Clone)]
pub struct ScenarioResult {
    pub name: String,
    pub base_price: f64,
    pub shocked_price: f64,
    pub pnl: f64,
    pub pnl_pct: f64,
}

/// Run a bond through all scenarios, return (scenario_name, new_price, pnl)
pub fn run_scenarios(
    bond: &crate::bond::BondSpec,
    settlement: crate::date::Date,
    base_curve: &YieldCurve,
    zspread: f64,
    scenarios: &[(&str, CurveScenario)],
) -> Vec<ScenarioResult> {
    let base_price =
        crate::bond::zspread::dirty_price_with_zspread(bond, settlement, base_curve, zspread);

    scenarios
        .iter()
        .map(|(name, scenario)| {
            let shocked_curve = apply_scenario(base_curve, scenario);
            let shocked_price = crate::bond::zspread::dirty_price_with_zspread(
                bond,
                settlement,
                &shocked_curve,
                zspread,
            );
            ScenarioResult {
                name: name.to_string(),
                base_price,
                shocked_price,
                pnl: shocked_price - base_price,
                pnl_pct: (shocked_price - base_price) / base_price,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::{BondSpec, CouponType};
    use crate::curve::YieldCurve;
    use crate::date::Date;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn ust_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: dated,
            maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        }
    }

    fn us_treasury_curve(ref_date: Date) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
            vec![0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048],
        )
        .unwrap()
    }

    // ---- Parallel +100bp: price decreases for a bond ----

    #[test]
    fn parallel_up_100bp_price_decreases() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        let scenarios = vec![("Parallel +100bp", CurveScenario::ParallelShift(0.01))];
        let results = run_scenarios(&bond, settle, &curve, 0.0, &scenarios);

        assert_eq!(results.len(), 1);
        assert!(
            results[0].pnl < 0.0,
            "Price should decrease when rates rise: pnl={}",
            results[0].pnl
        );
        assert!(
            results[0].shocked_price < results[0].base_price,
            "Shocked price ({}) should be less than base ({})",
            results[0].shocked_price,
            results[0].base_price
        );
    }

    // ---- Parallel -100bp: price increases ----

    #[test]
    fn parallel_down_100bp_price_increases() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        let scenarios = vec![("Parallel -100bp", CurveScenario::ParallelShift(-0.01))];
        let results = run_scenarios(&bond, settle, &curve, 0.0, &scenarios);

        assert!(
            results[0].pnl > 0.0,
            "Price should increase when rates fall: pnl={}",
            results[0].pnl
        );
    }

    // ---- Symmetry: |P&L(+100)| approximately equals |P&L(-100)| (convexity creates asymmetry) ----

    #[test]
    fn approximate_symmetry_with_convexity_bias() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        let scenarios = vec![
            ("Up", CurveScenario::ParallelShift(0.01)),
            ("Down", CurveScenario::ParallelShift(-0.01)),
        ];
        let results = run_scenarios(&bond, settle, &curve, 0.0, &scenarios);

        let pnl_up = results[0].pnl.abs();
        let pnl_down = results[1].pnl.abs();

        // Due to convexity, the gain from rates falling should exceed the loss from rates rising
        assert!(
            pnl_down > pnl_up,
            "Convexity bias: |P&L(-100bp)| ({}) should > |P&L(+100bp)| ({})",
            pnl_down,
            pnl_up
        );

        // But they should be of similar magnitude (within 20%)
        let ratio = pnl_down / pnl_up;
        assert!(
            ratio > 0.8 && ratio < 1.3,
            "P&L ratio should be close to 1 (got {}), showing approximate symmetry",
            ratio
        );
    }

    // ---- Steepener: short bond gains, long bond loses ----

    #[test]
    fn steepener_short_bond_gains_long_bond_loses() {
        let settle = d(2025, 5, 15);
        let short_bond = ust_bond(0.04, settle, d(2027, 5, 15)); // 2Y bond
        let long_bond = ust_bond(0.05, settle, d(2055, 5, 15)); // 30Y bond
        let curve = us_treasury_curve(settle);

        let scenarios = vec![(
            "Steepener",
            CurveScenario::Steepener {
                pivot: 5.0,
                short_shift: -0.01,
                long_shift: 0.01,
            },
        )];

        let short_results = run_scenarios(&short_bond, settle, &curve, 0.0, &scenarios);
        let long_results = run_scenarios(&long_bond, settle, &curve, 0.0, &scenarios);

        // Short bond: rates go down at short end => price goes up => positive P&L
        assert!(
            short_results[0].pnl > 0.0,
            "Short bond should gain in steepener: pnl={}",
            short_results[0].pnl
        );

        // Long bond: rates go up at long end => price goes down => negative P&L
        assert!(
            long_results[0].pnl < 0.0,
            "Long bond should lose in steepener: pnl={}",
            long_results[0].pnl
        );
    }

    // ---- Zero shift: no P&L ----

    #[test]
    fn zero_shift_no_pnl() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        let scenarios = vec![("No shift", CurveScenario::ParallelShift(0.0))];
        let results = run_scenarios(&bond, settle, &curve, 0.0, &scenarios);

        assert!(
            results[0].pnl.abs() < 1e-12,
            "Zero shift should produce zero P&L: pnl={}",
            results[0].pnl
        );
        assert!(
            (results[0].shocked_price - results[0].base_price).abs() < 1e-12,
            "Prices should be equal"
        );
    }

    // ---- Standard scenarios: verify all 6 produce results ----

    #[test]
    fn standard_scenarios_all_produce_results() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        let scenarios = standard_scenarios();
        assert_eq!(scenarios.len(), 6, "Should have 6 standard scenarios");

        let results = run_scenarios(&bond, settle, &curve, 0.0, &scenarios);
        assert_eq!(results.len(), 6, "Should have 6 results");

        for result in &results {
            assert!(result.base_price > 0.0, "Base price should be positive");
            assert!(
                result.shocked_price > 0.0,
                "Shocked price should be positive for {}",
                result.name
            );
            assert!(
                result.pnl.is_finite(),
                "P&L should be finite for {}",
                result.name
            );
            assert!(
                result.pnl_pct.is_finite(),
                "P&L pct should be finite for {}",
                result.name
            );
        }
    }

    // ---- Custom scenario: specific tenor bumps ----

    #[test]
    fn custom_scenario_specific_tenor_bumps() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        // Bump only the 10Y point by 50bp
        let custom_shifts = vec![(2.0, 0.0), (5.0, 0.0), (10.0, 0.005), (30.0, 0.0)];
        let scenarios = vec![("Custom 10Y +50bp", CurveScenario::Custom(custom_shifts))];
        let results = run_scenarios(&bond, settle, &curve, 0.0, &scenarios);

        // Rates went up at the 10Y point (where our bond matures), so price should decrease
        assert!(
            results[0].pnl < 0.0,
            "Custom bump at 10Y should decrease price of 10Y bond: pnl={}",
            results[0].pnl
        );
    }

    // ---- apply_scenario: parallel shift produces correct rates ----

    #[test]
    fn parallel_shift_rates_correct() {
        let settle = d(2025, 5, 15);
        let curve = us_treasury_curve(settle);
        let original_rates = curve.zero_rates().to_vec();

        let shocked = apply_scenario(&curve, &CurveScenario::ParallelShift(0.01));

        for (i, (&orig, &shocked_r)) in
            original_rates.iter().zip(shocked.zero_rates().iter()).enumerate()
        {
            assert!(
                (shocked_r - (orig + 0.01)).abs() < 1e-12,
                "Tenor {}: expected {}, got {}",
                curve.tenors()[i],
                orig + 0.01,
                shocked_r
            );
        }
    }

    // ---- Steepener twist profile: verify shock magnitudes ----

    #[test]
    fn steepener_twist_profile() {
        let settle = d(2025, 5, 15);
        let curve = us_treasury_curve(settle);

        let shocked = apply_scenario(
            &curve,
            &CurveScenario::Steepener {
                pivot: 5.0,
                short_shift: -0.01,
                long_shift: 0.01,
            },
        );

        let original_rates = curve.zero_rates();
        let tenors = curve.tenors();

        // At t=0.5 (short end): shift should be close to short_shift
        let shift_short = shocked.zero_rates()[0] - original_rates[0];
        assert!(
            shift_short < 0.0,
            "Short end should be shifted down: {}",
            shift_short
        );

        // At pivot (t=5.0, index 4): shift should be ~0
        let shift_pivot = shocked.zero_rates()[4] - original_rates[4];
        assert!(
            shift_pivot.abs() < 1e-10,
            "Pivot should have zero shift: {}",
            shift_pivot
        );

        // At t=30 (long end): shift should be close to long_shift
        let shift_long = shocked.zero_rates()[8] - original_rates[8];
        assert!(
            shift_long > 0.0,
            "Long end should be shifted up: {}",
            shift_long
        );

        // Verify it's the full long_shift at the max tenor
        assert!(
            (shift_long - 0.01).abs() < 1e-10,
            "Long end shift should be 0.01, got {}",
            shift_long
        );

        // The short shift at t=0 should be exactly short_shift=-0.01,
        // at t=0.5 it should be -0.01 * (1 - 0.5/5.0) = -0.01 * 0.9 = -0.009
        let expected_short = -0.01 * (1.0 - tenors[0] / 5.0);
        assert!(
            (shift_short - expected_short).abs() < 1e-10,
            "Short end shift at t=0.5 should be {}, got {}",
            expected_short,
            shift_short
        );
    }

    // ---- Flattener: opposite of steepener ----

    #[test]
    fn flattener_opposite_of_steepener() {
        let settle = d(2025, 5, 15);
        let curve = us_treasury_curve(settle);

        let steepener = apply_scenario(
            &curve,
            &CurveScenario::Steepener {
                pivot: 5.0,
                short_shift: -0.005,
                long_shift: 0.005,
            },
        );

        let flattener = apply_scenario(
            &curve,
            &CurveScenario::Flattener {
                pivot: 5.0,
                short_shift: 0.005,
                long_shift: -0.005,
            },
        );

        // For the same magnitudes but opposite signs, the shocked rates should be
        // mirror images around the original rates
        let original_rates = curve.zero_rates();
        for i in 0..original_rates.len() {
            let steep_shift = steepener.zero_rates()[i] - original_rates[i];
            let flat_shift = flattener.zero_rates()[i] - original_rates[i];
            assert!(
                (steep_shift + flat_shift).abs() < 1e-12,
                "Steepener and flattener shifts should be opposite at tenor {}: steep={}, flat={}",
                curve.tenors()[i],
                steep_shift,
                flat_shift
            );
        }
    }

    // ---- AbsoluteLevel scenario ----

    #[test]
    fn absolute_level_scenario() {
        let settle = d(2025, 5, 15);
        let curve = us_treasury_curve(settle);

        // Set all rates to a flat 5%
        let levels = vec![(0.5, 0.05), (1.0, 0.05), (10.0, 0.05), (30.0, 0.05)];
        let shocked = apply_scenario(&curve, &CurveScenario::AbsoluteLevel(levels));

        for &r in shocked.zero_rates() {
            assert!(
                (r - 0.05).abs() < 1e-10,
                "All rates should be 0.05, got {}",
                r
            );
        }
    }

    // ---- With Z-spread ----

    #[test]
    fn scenarios_with_nonzero_zspread() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);
        let zspread = 0.005; // 50bps

        let scenarios = vec![
            ("Up", CurveScenario::ParallelShift(0.01)),
            ("Down", CurveScenario::ParallelShift(-0.01)),
        ];

        let results = run_scenarios(&bond, settle, &curve, zspread, &scenarios);

        // With Z-spread, base price should be lower (higher yield => lower price)
        let base_no_spread =
            crate::bond::zspread::dirty_price_with_zspread(&bond, settle, &curve, 0.0);
        assert!(
            results[0].base_price < base_no_spread,
            "Price with spread ({}) should be less than without ({})",
            results[0].base_price,
            base_no_spread
        );

        // Direction should still hold
        assert!(results[0].pnl < 0.0, "Rates up => price down");
        assert!(results[1].pnl > 0.0, "Rates down => price up");
    }

    // ---- P&L percentage is correct ----

    #[test]
    fn pnl_pct_correct() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = us_treasury_curve(settle);

        let scenarios = vec![("Up 100bp", CurveScenario::ParallelShift(0.01))];
        let results = run_scenarios(&bond, settle, &curve, 0.0, &scenarios);

        let expected_pct = results[0].pnl / results[0].base_price;
        assert!(
            (results[0].pnl_pct - expected_pct).abs() < 1e-12,
            "P&L pct should be pnl/base_price: got {}, expected {}",
            results[0].pnl_pct,
            expected_pct
        );
    }
}
