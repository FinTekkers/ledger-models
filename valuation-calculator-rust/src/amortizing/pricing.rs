use crate::date::Date;
use crate::error::BondError;
use super::AmortizingBondSpec;
use super::cashflows;

/// Price an amortizing bond by discounting cashflows at a given yield.
/// Returns price as % of ORIGINAL face value.
pub fn amortizing_price(spec: &AmortizingBondSpec, yield_rate: f64, settlement: Date) -> f64 {
    let cfs = cashflows::generate(spec, settlement);
    let freq = spec.coupon_freq as f64;
    let r = 1.0 + yield_rate / freq;

    let mut pv = 0.0;
    for (i, cf) in cfs.iter().enumerate() {
        let n = (i + 1) as f64;
        pv += cf.total / r.powf(n);
    }

    pv / spec.face_value * 100.0
}

/// Solve for yield given a market price (Newton-Raphson)
pub fn solve_yield(
    spec: &AmortizingBondSpec,
    market_price: f64, // % of original face
    settlement: Date,
) -> Result<f64, BondError> {
    let cfs = cashflows::generate(spec, settlement);
    let target_pv = market_price / 100.0 * spec.face_value;
    let freq = spec.coupon_freq as f64;

    let mut y = 0.05;
    for iter in 0..100 {
        let r = 1.0 + y / freq;
        let mut pv = 0.0;
        let mut dpv = 0.0;

        for (i, cf) in cfs.iter().enumerate() {
            let n = (i + 1) as f64;
            let disc = r.powf(-n);
            pv += cf.total * disc;
            dpv -= n / freq * cf.total * disc / r;
        }

        let f = pv - target_pv;
        if f.abs() < 1e-10 {
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

/// Weighted average life (WAL): average time to principal repayment, in years.
pub fn weighted_average_life(spec: &AmortizingBondSpec, settlement: Date) -> f64 {
    let cfs = cashflows::generate(spec, settlement);
    let freq = spec.coupon_freq as f64;
    let mut weighted = 0.0;
    let mut total_principal = 0.0;

    for (i, cf) in cfs.iter().enumerate() {
        let t = (i + 1) as f64 / freq; // time in years
        weighted += t * cf.principal;
        total_principal += cf.principal;
    }

    if total_principal == 0.0 {
        return 0.0;
    }
    weighted / total_principal
}

/// Modified duration (numerical)
pub fn modified_duration(spec: &AmortizingBondSpec, yield_rate: f64, settlement: Date) -> f64 {
    let bump = 0.0001;
    let p0 = amortizing_price(spec, yield_rate, settlement);
    let p_up = amortizing_price(spec, yield_rate + bump, settlement);
    let p_down = amortizing_price(spec, yield_rate - bump, settlement);
    -(p_up - p_down) / (2.0 * bump * p0)
}

/// Dollar duration: price sensitivity per 1bp yield change, scaled by price.
pub fn dollar_duration(spec: &AmortizingBondSpec, yield_rate: f64, settlement: Date) -> f64 {
    let price = amortizing_price(spec, yield_rate, settlement);
    modified_duration(spec, yield_rate, settlement) * price / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::amortizing::{AmortizingBondSpec, SinkingSchedule};
    use crate::date::Date;
    use crate::daycount::DayCountConvention;

    fn make_spec(schedule: SinkingSchedule) -> AmortizingBondSpec {
        AmortizingBondSpec {
            coupon_rate: 0.06,
            coupon_freq: 2,
            face_value: 1000.0,
            dated_date: Date::new(2025, 1, 15),
            maturity_date: Date::new(2030, 1, 15),
            day_count: DayCountConvention::Thirty360US,
            schedule,
        }
    }

    fn settlement() -> Date {
        Date::new(2025, 1, 15)
    }

    // --- Par pricing ---

    #[test]
    fn level_principal_par_price_approx_100() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let price = amortizing_price(&spec, spec.coupon_rate, settlement());
        // For amortizing bonds, price at coupon rate is approximately par
        assert!(
            (price - 100.0).abs() < 1.0,
            "price at coupon rate should be near 100, got {}",
            price
        );
    }

    #[test]
    fn level_payment_par_price_approx_100() {
        let spec = make_spec(SinkingSchedule::LevelPayment);
        let price = amortizing_price(&spec, spec.coupon_rate, settlement());
        assert!(
            (price - 100.0).abs() < 1.0,
            "price at coupon rate should be near 100, got {}",
            price
        );
    }

    // --- Yield round-trip ---

    #[test]
    fn level_principal_yield_round_trip() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let target_yield = 0.07;
        let price = amortizing_price(&spec, target_yield, settlement());
        let solved = solve_yield(&spec, price, settlement()).unwrap();
        assert!(
            (solved - target_yield).abs() < 1e-6,
            "solved yield {} != target {}",
            solved,
            target_yield
        );
    }

    #[test]
    fn level_payment_yield_round_trip() {
        let spec = make_spec(SinkingSchedule::LevelPayment);
        let target_yield = 0.05;
        let price = amortizing_price(&spec, target_yield, settlement());
        let solved = solve_yield(&spec, price, settlement()).unwrap();
        assert!(
            (solved - target_yield).abs() < 1e-6,
            "solved yield {} != target {}",
            solved,
            target_yield
        );
    }

    #[test]
    fn pro_rata_yield_round_trip() {
        let spec = make_spec(SinkingSchedule::ProRata(0.05));
        let target_yield = 0.08;
        let price = amortizing_price(&spec, target_yield, settlement());
        let solved = solve_yield(&spec, price, settlement()).unwrap();
        assert!(
            (solved - target_yield).abs() < 1e-6,
            "solved yield {} != target {}",
            solved,
            target_yield
        );
    }

    // --- WAL tests ---

    #[test]
    fn wal_less_than_maturity() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let wal = weighted_average_life(&spec, settlement());
        let maturity_years = 5.0; // 2025 to 2030
        assert!(
            wal < maturity_years,
            "WAL {} should be less than maturity {}",
            wal,
            maturity_years
        );
        assert!(wal > 0.0, "WAL should be positive");
    }

    #[test]
    fn wal_level_principal_approx_half_life() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let wal = weighted_average_life(&spec, settlement());
        let maturity_years = 5.0;
        // For level principal, WAL is approximately (n+1)/(2n) * maturity
        // which is close to half the life
        let expected_approx = maturity_years / 2.0;
        assert!(
            (wal - expected_approx).abs() < 1.0,
            "WAL {} should be approximately {} for level principal",
            wal,
            expected_approx
        );
    }

    #[test]
    fn level_payment_wal_less_than_level_principal_wal() {
        let spec_lp = make_spec(SinkingSchedule::LevelPrincipal);
        let spec_lv = make_spec(SinkingSchedule::LevelPayment);
        let wal_lp = weighted_average_life(&spec_lp, settlement());
        let wal_lv = weighted_average_life(&spec_lv, settlement());
        assert!(
            wal_lv < wal_lp,
            "level payment WAL {} should be less than level principal WAL {}",
            wal_lv,
            wal_lp
        );
    }

    // --- Duration tests ---

    #[test]
    fn modified_duration_positive() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let md = modified_duration(&spec, 0.06, settlement());
        assert!(
            md > 0.0,
            "modified duration should be positive, got {}",
            md
        );
    }

    #[test]
    fn amortizing_duration_less_than_bullet() {
        // Compare against a bullet bond's approximate modified duration
        // A 5-year bullet at 6% semiannual has Macaulay duration ~4.4 years,
        // modified duration ~4.27
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let md = modified_duration(&spec, 0.06, settlement());
        let bullet_approx_md = 4.3;
        assert!(
            md < bullet_approx_md,
            "amortizing duration {} should be less than bullet {}",
            md,
            bullet_approx_md
        );
    }

    #[test]
    fn dollar_duration_positive() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let dd = dollar_duration(&spec, 0.06, settlement());
        assert!(dd > 0.0, "dollar duration should be positive, got {}", dd);
    }
}
