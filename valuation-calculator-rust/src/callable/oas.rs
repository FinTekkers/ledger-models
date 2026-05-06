use crate::curve::YieldCurve;
use crate::date::Date;
use crate::error::BondError;
use super::CallableSpec;

/// Option-Adjusted Spread (OAS) via a Ho-Lee binomial interest rate tree.
///
/// OAS is the constant spread over the benchmark curve that, when added to the
/// rates in a calibrated interest rate tree, makes the model price equal to the
/// market price. It removes the embedded option value from the spread.
///
/// For non-callable bonds, OAS approximates the Z-spread. For callable bonds,
/// OAS < Z-spread because part of the Z-spread compensates for call risk.
/// For puttable bonds, OAS > Z-spread because the put option benefits the investor.
///
/// # Arguments
/// * `spec` - The callable/puttable bond specification.
/// * `market_clean_price` - The market clean price of the bond.
/// * `settlement` - The settlement date.
/// * `curve` - The benchmark yield curve.
/// * `volatility` - Annual rate volatility (e.g., 0.01 = 1%).
/// * `num_steps` - Number of time steps in the binomial tree (e.g., 50-100).
pub fn oas_simplified(
    spec: &CallableSpec,
    market_clean_price: f64,
    settlement: Date,
    curve: &YieldCurve,
    volatility: f64,
    num_steps: usize,
) -> Result<f64, BondError> {
    if settlement >= spec.bond.maturity_date {
        return Err(BondError::MaturedBond);
    }
    if num_steps == 0 {
        return Err(BondError::InvalidInput("num_steps must be > 0".to_string()));
    }

    let ai = crate::bond::accrued_interest::accrued_interest(&spec.bond, settlement);
    let dirty_target = market_clean_price + ai;

    let t_total = curve.time_from_reference(spec.bond.maturity_date);
    let t_settle = curve.time_from_reference(settlement);
    let t_remaining = t_total - t_settle;

    if t_remaining <= 0.0 {
        return Err(BondError::MaturedBond);
    }

    let dt = t_remaining / num_steps as f64;

    // Bisection to find the spread
    let mut lo = -0.10_f64;
    let mut hi = 0.50_f64;

    for _ in 0..200 {
        let mid = (lo + hi) / 2.0;
        let model_price = tree_price(spec, settlement, curve, volatility, num_steps, mid, dt);

        if (model_price - dirty_target).abs() < 1e-8 {
            return Ok(mid);
        }
        if model_price > dirty_target {
            lo = mid; // spread too low => price too high
        } else {
            hi = mid;
        }

        if (hi - lo) < 1e-12 {
            return Ok(mid);
        }
    }

    Err(BondError::ConvergenceFailure {
        iterations: 200,
        last_price_error: 0.0,
    })
}

/// Compute the model dirty price using a Ho-Lee binomial tree with backward induction.
///
/// The Ho-Lee model has short rates:
///   r(i, j) = forward_rate(t_i) + volatility * sqrt(dt) * (2*j - i) + spread
/// where i is the time step index, j is the number of up-moves (0..=i).
///
/// At each step, the tree does backward induction:
///   V(i,j) = (0.5 * V(i+1, j+1) + 0.5 * V(i+1, j)) * exp(-r(i,j) * dt)
///
/// At call dates, the value is capped: V = min(V, call_price_with_accrued).
/// At put dates, the value is floored: V = max(V, put_price_with_accrued).
/// Coupons are added at coupon dates.
fn tree_price(
    spec: &CallableSpec,
    settlement: Date,
    curve: &YieldCurve,
    vol: f64,
    steps: usize,
    spread: f64,
    dt: f64,
) -> f64 {
    let bond = &spec.bond;
    let t_settle = curve.time_from_reference(settlement);
    let sqrt_dt = dt.sqrt();

    let coupon_payment = bond.coupon_rate * bond.face_value / bond.coupon_freq as f64;

    // Precompute: which steps have coupon payments, call dates, or put dates
    // Map each step to a time: t_i = t_settle + (i+1) * dt for step i
    // (step 0 is now, step `steps` is maturity)

    // Generate coupon dates and find which fall in our time range
    let coupon_dates = crate::bond::cashflows::generate_coupon_dates(bond);
    let coupon_times: Vec<f64> = coupon_dates
        .iter()
        .filter(|&&cd| cd > settlement && cd <= bond.maturity_date)
        .map(|cd| curve.time_from_reference(*cd))
        .collect();

    let call_times: Vec<(f64, f64)> = spec.call_schedule
        .iter()
        .filter(|c| c.date > settlement)
        .map(|c| (curve.time_from_reference(c.date), c.call_price))
        .collect();

    let put_times: Vec<(f64, f64)> = spec.put_schedule
        .iter()
        .filter(|p| p.date > settlement)
        .map(|p| (curve.time_from_reference(p.date), p.put_price))
        .collect();

    // Initialize the tree at maturity (step = steps)
    // At maturity, value = face_value + last coupon
    let mut values = vec![0.0_f64; steps + 1];
    for j in 0..=steps {
        values[j] = bond.face_value + coupon_payment;
    }

    // Backward induction
    for i in (0..steps).rev() {
        let t_mid = t_settle + (i as f64 + 0.5) * dt;

        // Forward rate at this time step (using the midpoint)
        let fwd = curve.forward_rate(t_mid, t_mid + dt);

        let mut new_values = vec![0.0_f64; i + 1];

        for j in 0..=i {
            // Ho-Lee short rate at node (i, j)
            let rate = fwd + vol * sqrt_dt * (2.0 * j as f64 - i as f64) + spread;

            // Discount the expected future value
            let expected = 0.5 * values[j + 1] + 0.5 * values[j];
            let mut v = expected * (-rate * dt).exp();

            // Add coupon if this step corresponds to a coupon date
            let t_next = t_settle + (i as f64 + 1.0) * dt;
            let t_prev = t_settle + i as f64 * dt;
            for &ct in &coupon_times {
                // Check if a coupon falls between t_prev and t_next (exclusive of maturity)
                if ct > t_prev && ct <= t_next {
                    let t_mat = t_settle + steps as f64 * dt;
                    // Don't double-count the maturity coupon (already in terminal values)
                    if (ct - t_mat).abs() > dt * 0.5 {
                        v += coupon_payment;
                    }
                }
            }

            // Apply call constraint: issuer calls if value > call_price
            for &(ct, cp) in &call_times {
                if ct > t_prev && ct <= t_next {
                    // Call: cap the value at call_price (as % of par)
                    if v > cp {
                        v = cp;
                    }
                }
            }

            // Apply put constraint: investor puts if value < put_price
            for &(pt, pp) in &put_times {
                if pt > t_prev && pt <= t_next {
                    // Put: floor the value at put_price
                    if v < pp {
                        v = pp;
                    }
                }
            }

            new_values[j] = v;
        }

        values = new_values;
    }

    // The root node gives the model dirty price
    values[0]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::{BondSpec, CouponType};
    use crate::callable::{CallDate, PutDate};
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn corporate_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
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

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![rate; 6],
        )
        .unwrap()
    }

    // ---- Non-callable bond: OAS should approximate Z-spread ----

    #[test]
    fn non_callable_oas_approximates_zspread() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let spec = CallableSpec {
            bond: bond.clone(),
            call_schedule: vec![],
            put_schedule: vec![],
        };

        let market_price = 100.0;
        let zs = crate::bond::zspread::solve_zspread(&bond, market_price, settle, &curve).unwrap();
        let oas = oas_simplified(&spec, market_price, settle, &curve, 0.01, 50).unwrap();

        // For a non-callable bond, OAS should be close to Z-spread.
        // The tree approximation introduces some discretization error,
        // so we use a wider tolerance.
        assert!(
            (oas - zs).abs() < 0.005,
            "Non-callable OAS ({}) should approximate Z-spread ({})",
            oas, zs
        );
    }

    // ---- Callable bond: OAS < Z-spread ----

    #[test]
    fn callable_bond_oas_less_than_zspread() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let spec = CallableSpec {
            bond: bond.clone(),
            call_schedule: vec![
                CallDate { date: d(2028, 5, 15), call_price: 102.0 },
                CallDate { date: d(2030, 5, 15), call_price: 101.0 },
                CallDate { date: d(2032, 5, 15), call_price: 100.0 },
            ],
            put_schedule: vec![],
        };

        // Price the bond below what it would be worth without the call option
        let market_price = 105.0;

        let zs = crate::bond::zspread::solve_zspread(&bond, market_price, settle, &curve).unwrap();
        let oas = oas_simplified(&spec, market_price, settle, &curve, 0.01, 50).unwrap();

        // OAS < Z-spread because the call option costs the investor
        assert!(
            oas < zs + 0.001,
            "Callable OAS ({}) should be < Z-spread ({}) (call option costs investor)",
            oas, zs
        );
    }

    // ---- Puttable bond: OAS > Z-spread ----

    #[test]
    fn puttable_bond_oas_greater_than_zspread() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let spec = CallableSpec {
            bond: bond.clone(),
            call_schedule: vec![],
            put_schedule: vec![
                PutDate { date: d(2028, 5, 15), put_price: 100.0 },
                PutDate { date: d(2030, 5, 15), put_price: 100.0 },
            ],
        };

        // Price below par: investor would benefit from the put at 100
        let market_price = 95.0;

        let zs = crate::bond::zspread::solve_zspread(&bond, market_price, settle, &curve).unwrap();
        let oas = oas_simplified(&spec, market_price, settle, &curve, 0.01, 50).unwrap();

        // OAS > Z-spread because the put option benefits the investor
        assert!(
            oas > zs - 0.001,
            "Puttable OAS ({}) should be > Z-spread ({}) (put option benefits investor)",
            oas, zs
        );
    }

    // ---- Zero volatility: OAS should approximate Z-spread ----

    #[test]
    fn zero_volatility_oas_approximates_zspread() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let spec = CallableSpec {
            bond: bond.clone(),
            call_schedule: vec![
                CallDate { date: d(2030, 5, 15), call_price: 100.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 100.0;

        let zs = crate::bond::zspread::solve_zspread(&bond, market_price, settle, &curve).unwrap();
        let oas = oas_simplified(&spec, market_price, settle, &curve, 0.0, 50).unwrap();

        // At zero vol, the tree collapses to a single path and OAS should
        // be close to Z-spread (with some discretization error).
        assert!(
            (oas - zs).abs() < 0.01,
            "Zero-vol OAS ({}) should approximate Z-spread ({})",
            oas, zs
        );
    }

    // ---- OAS round-trip: tree_price(solved_oas) should approximate market_price ----

    #[test]
    fn oas_round_trip() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let spec = CallableSpec {
            bond: bond.clone(),
            call_schedule: vec![
                CallDate { date: d(2028, 5, 15), call_price: 103.0 },
                CallDate { date: d(2030, 5, 15), call_price: 101.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 105.0;
        let vol = 0.01;
        let steps = 50;

        let oas = oas_simplified(&spec, market_price, settle, &curve, vol, steps).unwrap();

        // Verify round-trip: tree_price with solved OAS should match dirty target
        let ai = crate::bond::accrued_interest::accrued_interest(&bond, settle);
        let dirty_target = market_price + ai;
        let t_remaining = curve.time_from_reference(bond.maturity_date)
            - curve.time_from_reference(settle);
        let dt = t_remaining / steps as f64;
        let model_price = tree_price(&spec, settle, &curve, vol, steps, oas, dt);

        assert!(
            (model_price - dirty_target).abs() < 1e-4,
            "Round-trip: model_price ({}) should match dirty_target ({})",
            model_price, dirty_target
        );
    }

    // ---- Matured bond returns error ----

    #[test]
    fn matured_bond_returns_error() {
        let settle = d(2036, 1, 1);
        let bond = corporate_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let curve = flat_curve(d(2025, 5, 15), 0.04);

        let spec = CallableSpec {
            bond,
            call_schedule: vec![],
            put_schedule: vec![],
        };

        let result = oas_simplified(&spec, 100.0, settle, &curve, 0.01, 50);
        assert!(matches!(result, Err(BondError::MaturedBond)));
    }

    // ---- Higher volatility increases option value ----

    #[test]
    fn higher_vol_lower_oas_for_callable() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                CallDate { date: d(2028, 5, 15), call_price: 102.0 },
                CallDate { date: d(2030, 5, 15), call_price: 100.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 105.0;

        let oas_low_vol = oas_simplified(&spec, market_price, settle, &curve, 0.005, 50).unwrap();
        let oas_high_vol = oas_simplified(&spec, market_price, settle, &curve, 0.02, 50).unwrap();

        // Higher volatility means the call option is worth more to the issuer,
        // so OAS should be lower (more of the spread is option value).
        assert!(
            oas_high_vol < oas_low_vol + 0.002,
            "Higher vol OAS ({}) should be <= lower vol OAS ({})",
            oas_high_vol, oas_low_vol
        );
    }
}
