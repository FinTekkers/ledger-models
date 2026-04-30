use crate::error::BondError;
use super::MbsSpec;
use super::cashflows;

/// Price an MBS by discounting projected cashflows at a given yield.
/// Uses monthly compounding (standard for MBS).
///
/// price = sum CF_i / (1 + yield/12)^i
/// Returned as % of current face (not original face).
pub fn mbs_price(
    spec: &MbsSpec,
    yield_rate: f64,
    psa_speed: f64,
) -> f64 {
    let cfs = cashflows::generate_mbs_cashflows(spec, psa_speed);
    let monthly_yield = yield_rate / 12.0;

    let mut pv = 0.0;
    for (i, cf) in cfs.iter().enumerate() {
        let disc = (1.0 + monthly_yield).powi(-((i + 1) as i32));
        pv += cf.total_cashflow * disc;
    }

    // Return as % of current balance
    pv / spec.current_balance * 100.0
}

/// Solve for yield given a market price and PSA speed (Newton-Raphson)
pub fn solve_mbs_yield(
    spec: &MbsSpec,
    market_price: f64, // % of current face
    psa_speed: f64,
) -> Result<f64, BondError> {
    let target_pv = market_price / 100.0 * spec.current_balance;
    let cfs = cashflows::generate_mbs_cashflows(spec, psa_speed);

    let mut y: f64 = 0.05; // initial guess
    for iter in 0..100 {
        let monthly_y = y / 12.0;
        let mut pv: f64 = 0.0;
        let mut dpv: f64 = 0.0;

        for (i, cf) in cfs.iter().enumerate() {
            let n = (i + 1) as f64;
            let disc = (1.0 + monthly_y).powf(-n);
            pv += cf.total_cashflow * disc;
            dpv -= n / 12.0 * cf.total_cashflow * disc / (1.0 + monthly_y);
        }

        let f = pv - target_pv;
        if f.abs() < 1e-8 {
            return Ok(y);
        }
        if dpv.abs() < 1e-15 {
            return Err(BondError::ConvergenceFailure {
                iterations: iter as u32,
                last_price_error: f,
            });
        }
        y -= f / dpv;
    }
    Err(BondError::ConvergenceFailure {
        iterations: 100,
        last_price_error: 0.0,
    })
}

/// Weighted Average Life (WAL): average time to receive principal.
/// WAL = sum (month_i * principal_i) / total_principal / 12
/// Expressed in years.
pub fn weighted_average_life(spec: &MbsSpec, psa_speed: f64) -> f64 {
    let cfs = cashflows::generate_mbs_cashflows(spec, psa_speed);
    let mut weighted_sum = 0.0;
    let mut total_principal = 0.0;

    for (i, cf) in cfs.iter().enumerate() {
        let month = (i + 1) as f64;
        weighted_sum += month * cf.total_principal;
        total_principal += cf.total_principal;
    }

    if total_principal == 0.0 {
        return 0.0;
    }
    weighted_sum / total_principal / 12.0 // convert months to years
}

/// WAL sensitivity to prepayment speed: dWAL/dPSA
pub fn wal_sensitivity(spec: &MbsSpec, psa_speed: f64) -> f64 {
    let bump = 10.0; // 10 PSA
    let wal_up = weighted_average_life(spec, psa_speed + bump);
    let wal_down = weighted_average_life(spec, (psa_speed - bump).max(0.0));
    (wal_up - wal_down) / (2.0 * bump)
}

/// Effective duration: price sensitivity to yield changes,
/// accounting for prepayment behavior.
/// Since we use a fixed PSA, this is just numerical duration.
pub fn effective_duration(spec: &MbsSpec, yield_rate: f64, psa_speed: f64) -> f64 {
    let bump = 0.0001; // 1bp
    let p0 = mbs_price(spec, yield_rate, psa_speed);
    let p_up = mbs_price(spec, yield_rate + bump, psa_speed);
    let p_down = mbs_price(spec, yield_rate - bump, psa_speed);
    -(p_up - p_down) / (2.0 * bump * p0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::date::Date;

    fn test_spec() -> MbsSpec {
        MbsSpec {
            original_balance: 1_000_000.0,
            current_balance: 1_000_000.0,
            pass_through_rate: 0.055, // 5.5%
            wac: 0.06,                // 6% gross coupon
            wam: 360,                 // 30 years
            age: 0,
            settlement: Date::new(2025, 1, 15),
            factor: 1.0,
        }
    }

    fn seasoned_spec() -> MbsSpec {
        MbsSpec {
            original_balance: 1_000_000.0,
            current_balance: 900_000.0,
            pass_through_rate: 0.055,
            wac: 0.06,
            wam: 300, // 25 years remaining
            age: 60,  // 5 years seasoned
            settlement: Date::new(2025, 1, 15),
            factor: 0.9,
        }
    }

    #[test]
    fn par_pricing_at_pass_through_rate() {
        // At the pass-through rate yield, price should be approximately 100
        // for a new pool. Not exactly par because WAC != pass-through rate
        // (servicing spread), but close.
        let spec = test_spec();
        let price = mbs_price(&spec, spec.pass_through_rate, 100.0);
        assert!(
            (price - 100.0).abs() < 5.0,
            "Price at pass-through yield should be near 100, got {:.4}",
            price
        );
    }

    #[test]
    fn yield_round_trip() {
        // Price at a known yield, then solve back to that yield
        let spec = test_spec();
        let target_yield = 0.065;
        let price = mbs_price(&spec, target_yield, 100.0);
        let solved_yield = solve_mbs_yield(&spec, price, 100.0).unwrap();
        assert!(
            (solved_yield - target_yield).abs() < 1e-6,
            "Yield round-trip failed: expected {:.6}, got {:.6}",
            target_yield,
            solved_yield
        );
    }

    #[test]
    fn yield_round_trip_seasoned() {
        let spec = seasoned_spec();
        let target_yield = 0.058;
        let price = mbs_price(&spec, target_yield, 150.0);
        let solved_yield = solve_mbs_yield(&spec, price, 150.0).unwrap();
        assert!(
            (solved_yield - target_yield).abs() < 1e-6,
            "Seasoned yield round-trip failed: expected {:.6}, got {:.6}",
            target_yield,
            solved_yield
        );
    }

    #[test]
    fn wal_zero_psa_approx_half_wam() {
        // WAL at 0 PSA should be roughly half the WAM (for level-pay mortgage)
        // For a 30-year level-pay at 6%, WAL is around 12-13 years
        let spec = test_spec();
        let wal = weighted_average_life(&spec, 0.0);
        let half_wam = spec.wam as f64 / 12.0 / 2.0; // 15 years
        assert!(
            wal > half_wam * 0.7 && wal < half_wam * 1.1,
            "WAL at 0 PSA ({:.2} years) should be near half WAM ({:.1} years)",
            wal,
            half_wam
        );
    }

    #[test]
    fn wal_100_psa_shorter_than_0_psa() {
        let spec = test_spec();
        let wal_0 = weighted_average_life(&spec, 0.0);
        let wal_100 = weighted_average_life(&spec, 100.0);
        assert!(
            wal_100 < wal_0,
            "WAL at 100 PSA ({:.2}) should be shorter than 0 PSA ({:.2})",
            wal_100,
            wal_0
        );
    }

    #[test]
    fn wal_400_psa_much_shorter() {
        let spec = test_spec();
        let wal_100 = weighted_average_life(&spec, 100.0);
        let wal_400 = weighted_average_life(&spec, 400.0);
        assert!(
            wal_400 < wal_100 * 0.7,
            "WAL at 400 PSA ({:.2}) should be much shorter than 100 PSA ({:.2})",
            wal_400,
            wal_100
        );
    }

    #[test]
    fn wal_sensitivity_negative() {
        // Faster prepay -> shorter WAL, so dWAL/dPSA should be negative
        let spec = test_spec();
        let sens = wal_sensitivity(&spec, 100.0);
        assert!(
            sens < 0.0,
            "WAL sensitivity should be negative, got {:.6}",
            sens
        );
    }

    #[test]
    fn effective_duration_positive() {
        let spec = test_spec();
        let dur = effective_duration(&spec, 0.055, 100.0);
        assert!(
            dur > 0.0,
            "Effective duration should be positive, got {:.4}",
            dur
        );
        // Duration for a 30-year MBS at 100 PSA should be reasonable (3-10 years)
        assert!(
            dur > 2.0 && dur < 15.0,
            "Duration {:.2} should be in reasonable range (2-15 years)",
            dur
        );
    }

    #[test]
    fn higher_psa_lower_duration() {
        let spec = test_spec();
        let dur_100 = effective_duration(&spec, 0.055, 100.0);
        let dur_400 = effective_duration(&spec, 0.055, 400.0);
        assert!(
            dur_400 < dur_100,
            "Duration at 400 PSA ({:.2}) should be less than 100 PSA ({:.2})",
            dur_400,
            dur_100
        );
    }

    #[test]
    fn higher_yield_lower_price() {
        let spec = test_spec();
        let p1 = mbs_price(&spec, 0.04, 100.0);
        let p2 = mbs_price(&spec, 0.06, 100.0);
        let p3 = mbs_price(&spec, 0.08, 100.0);
        assert!(
            p1 > p2 && p2 > p3,
            "Higher yield should give lower price: {:.2}, {:.2}, {:.2}",
            p1,
            p2,
            p3
        );
    }

    #[test]
    fn price_positive() {
        let spec = test_spec();
        for &speed in &[0.0, 100.0, 200.0, 400.0] {
            let price = mbs_price(&spec, 0.055, speed);
            assert!(
                price > 0.0,
                "Price should be positive at {} PSA, got {:.4}",
                speed,
                price
            );
        }
    }

    #[test]
    fn wal_ordering_across_speeds() {
        let spec = test_spec();
        let wal_0 = weighted_average_life(&spec, 0.0);
        let wal_50 = weighted_average_life(&spec, 50.0);
        let wal_100 = weighted_average_life(&spec, 100.0);
        let wal_200 = weighted_average_life(&spec, 200.0);
        let wal_400 = weighted_average_life(&spec, 400.0);
        assert!(
            wal_0 > wal_50 && wal_50 > wal_100 && wal_100 > wal_200 && wal_200 > wal_400,
            "WAL should decrease with increasing PSA: {:.2}, {:.2}, {:.2}, {:.2}, {:.2}",
            wal_0,
            wal_50,
            wal_100,
            wal_200,
            wal_400
        );
    }
}
