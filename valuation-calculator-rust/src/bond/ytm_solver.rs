use crate::date::Date;
use crate::error::BondError;
use super::BondSpec;
use super::cashflows;
use super::accrued_interest;

const MAX_ITER: u32 = 100;
const PRICE_TOL: f64 = 1e-12;
const YIELD_TOL: f64 = 1e-14;

pub fn solve_ytm(bond: &BondSpec, market_clean_price: f64, settlement: Date) -> Result<f64, BondError> {
    if settlement >= bond.maturity_date {
        return Err(BondError::MaturedBond);
    }

    let cfs = cashflows::generate(bond, settlement);
    if cfs.is_empty() {
        return Err(BondError::MaturedBond);
    }

    let ai = accrued_interest::accrued_interest(bond, settlement);
    let dirty_target = market_clean_price + ai;

    let freq = bond.coupon_freq as f64;
    let n_periods = cfs.len() as f64;
    let annual_coupon = bond.coupon_rate * bond.face_value;

    let initial_guess = if dirty_target > 0.0 && n_periods > 0.0 {
        let approx = (annual_coupon / freq + (bond.face_value - dirty_target) / n_periods)
            / ((bond.face_value + dirty_target) / 2.0)
            * freq;
        approx.clamp(-0.05, 1.0)
    } else {
        0.05
    };

    newton_raphson(dirty_target, &cfs, freq, initial_guess)
}

fn newton_raphson(
    dirty_target: f64,
    cfs: &[super::Cashflow],
    freq: f64,
    initial_guess: f64,
) -> Result<f64, BondError> {
    let mut y = initial_guess;

    for iter in 0..MAX_ITER {
        let mut pv = 0.0_f64;
        let mut dpv = 0.0_f64;

        for cf in cfs {
            let r = 1.0 + y / freq;
            let disc = r.powf(cf.period_fraction);
            pv += cf.amount / disc;
            dpv -= cf.amount * cf.period_fraction / (freq * disc * r);
        }

        let f_val = pv - dirty_target;
        if f_val.abs() < PRICE_TOL {
            return Ok(y);
        }

        if dpv.abs() < 1e-15 {
            return Err(BondError::ConvergenceFailure { iterations: iter, last_price_error: f_val });
        }

        let dy = f_val / dpv;
        y -= dy;

        if y <= -freq {
            y = -freq + 1e-8;
        }

        if dy.abs() < YIELD_TOL {
            return Ok(y);
        }
    }

    Err(BondError::ConvergenceFailure { iterations: MAX_ITER, last_price_error: 0.0 })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn ust_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon, coupon_freq: 2, coupon_type: CouponType::Fixed,
            face_value: 100.0, dated_date: dated, maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
        }
    }

    #[test]
    fn par_bond_ytm_equals_coupon() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let ytm = solve_ytm(&bond, 100.0, d(2025, 5, 15)).unwrap();
        assert!((ytm - 0.05).abs() < 1e-10, "ytm={}", ytm);
    }

    #[test]
    fn discount_bond_ytm_above_coupon() {
        let bond = ust_bond(0.04, d(2025, 5, 15), d(2035, 5, 15));
        let ytm = solve_ytm(&bond, 95.0, d(2025, 5, 15)).unwrap();
        assert!(ytm > 0.04);
    }

    #[test]
    fn premium_bond_ytm_below_coupon() {
        let bond = ust_bond(0.06, d(2025, 5, 15), d(2035, 5, 15));
        let ytm = solve_ytm(&bond, 105.0, d(2025, 5, 15)).unwrap();
        assert!(ytm < 0.06);
    }

    #[test]
    fn ytm_round_trip() {
        let bond = ust_bond(0.045, d(2025, 5, 15), d(2035, 5, 15));
        let target_ytm = 0.05;
        let dp = super::super::pricing::dirty_price_from_yield(&bond, target_ytm, d(2025, 5, 15));
        let solved = solve_ytm(&bond, dp, d(2025, 5, 15)).unwrap();
        assert!((solved - target_ytm).abs() < 1e-10, "solved={}", solved);
    }

    #[test]
    fn ytm_round_trip_between_coupon_dates() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let settle = d(2025, 8, 20);
        let target_ytm = 0.047;
        let dp = super::super::pricing::dirty_price_from_yield(&bond, target_ytm, settle);
        let ai = accrued_interest::accrued_interest(&bond, settle);
        let cp = dp - ai;
        let solved = solve_ytm(&bond, cp, settle).unwrap();
        assert!((solved - target_ytm).abs() < 1e-10);
    }

    #[test]
    fn matured_bond_returns_error() {
        let bond = ust_bond(0.05, d(2020, 5, 15), d(2025, 5, 15));
        assert!(matches!(solve_ytm(&bond, 100.0, d(2025, 6, 1)), Err(BondError::MaturedBond)));
    }

    #[test]
    fn short_bond_2y() {
        let bond = ust_bond(0.0425, d(2026, 4, 30), d(2028, 4, 30));
        let ytm = solve_ytm(&bond, 100.0, d(2026, 4, 30)).unwrap();
        assert!((ytm - 0.0425).abs() < 1e-10);
    }

    #[test]
    fn deep_discount() {
        let bond = ust_bond(0.02, d(2025, 5, 15), d(2055, 5, 15));
        let ytm = solve_ytm(&bond, 50.0, d(2025, 5, 15)).unwrap();
        assert!(ytm > 0.04, "Deep discount ytm={}", ytm);
    }

    #[test]
    fn high_premium() {
        let bond = ust_bond(0.08, d(2025, 5, 15), d(2035, 5, 15));
        let ytm = solve_ytm(&bond, 130.0, d(2025, 5, 15)).unwrap();
        assert!(ytm < 0.06, "High premium YTM={} should be below coupon", ytm);
    }

    #[test]
    fn very_small_coupon() {
        let bond = ust_bond(0.00125, d(2025, 5, 15), d(2035, 5, 15));
        let ytm = solve_ytm(&bond, 95.0, d(2025, 5, 15)).unwrap();
        assert!(ytm > 0.005, "Tiny coupon YTM={}", ytm);
    }

    #[test]
    fn zero_coupon_ytm() {
        let bond = BondSpec {
            coupon_rate: 0.0, coupon_freq: 2, coupon_type: CouponType::Zero,
            face_value: 100.0, dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        };
        let price = 100.0 / 1.025_f64.powi(20);
        let ytm = solve_ytm(&bond, price, d(2025, 5, 15)).unwrap();
        assert!((ytm - 0.05).abs() < 1e-10, "Zero-coupon YTM={}", ytm);
    }

    #[test]
    fn last_coupon_period() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2026, 5, 15));
        let settle = d(2025, 11, 15);
        let cfs = super::super::cashflows::generate(&bond, settle);
        assert_eq!(cfs.len(), 1);

        let ytm = solve_ytm(&bond, 100.0, settle).unwrap();
        assert!(ytm > 0.0, "Last period YTM={}", ytm);
    }

    #[test]
    fn round_trip_multiple_bonds() {
        let bonds = vec![
            ust_bond(0.02, d(2025, 5, 15), d(2027, 5, 15)),
            ust_bond(0.04, d(2025, 5, 15), d(2030, 5, 15)),
            ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15)),
            ust_bond(0.06, d(2025, 5, 15), d(2055, 5, 15)),
        ];
        let yields = [0.03, 0.045, 0.055, 0.04];

        for (bond, &target_ytm) in bonds.iter().zip(yields.iter()) {
            let settle = bond.dated_date;
            let dp = super::super::pricing::dirty_price_from_yield(bond, target_ytm, settle);
            let solved = solve_ytm(bond, dp, settle).unwrap();
            assert!((solved - target_ytm).abs() < 1e-10,
                "Round-trip failed: coupon={}, target={}, solved={}",
                bond.coupon_rate, target_ytm, solved);
        }
    }

    // ── Euro bond (annual coupon) tests ─────────────────────────────

    fn euro_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon, coupon_freq: 1, coupon_type: CouponType::Fixed,
            face_value: 100.0, dated_date: dated, maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
        }
    }

    #[test]
    fn euro_par_bond_ytm_equals_coupon() {
        let bond = euro_bond(0.025, d(2025, 2, 15), d(2035, 2, 15));
        let ytm = solve_ytm(&bond, 100.0, d(2025, 2, 15)).unwrap();
        assert!((ytm - 0.025).abs() < 1e-10, "Euro par YTM={}", ytm);
    }

    #[test]
    fn euro_discount_bond() {
        let bond = euro_bond(0.02, d(2025, 1, 4), d(2035, 1, 4));
        let ytm = solve_ytm(&bond, 92.0, d(2025, 1, 4)).unwrap();
        assert!(ytm > 0.02, "Euro discount YTM={}", ytm);
    }

    #[test]
    fn euro_ytm_round_trip() {
        let bond = euro_bond(0.03, d(2025, 2, 15), d(2035, 2, 15));
        let target = 0.035;
        let dp = super::super::pricing::dirty_price_from_yield(&bond, target, d(2025, 2, 15));
        let solved = solve_ytm(&bond, dp, d(2025, 2, 15)).unwrap();
        assert!((solved - target).abs() < 1e-10, "Euro round-trip: solved={}", solved);
    }

    #[test]
    fn euro_ytm_round_trip_between_dates() {
        let bond = euro_bond(0.025, d(2024, 7, 4), d(2034, 7, 4));
        let settle = d(2025, 3, 15);
        let target = 0.028;
        let dp = super::super::pricing::dirty_price_from_yield(&bond, target, settle);
        let ai = accrued_interest::accrued_interest(&bond, settle);
        let cp = dp - ai;
        let solved = solve_ytm(&bond, cp, settle).unwrap();
        assert!((solved - target).abs() < 1e-10, "Euro between-dates: solved={}", solved);
    }

    #[test]
    fn euro_round_trip_multiple() {
        let bonds = vec![
            euro_bond(0.01, d(2025, 1, 4), d(2027, 1, 4)),
            euro_bond(0.025, d(2025, 2, 15), d(2035, 2, 15)),
            euro_bond(0.04, d(2025, 7, 4), d(2055, 7, 4)),
        ];
        let yields = [0.02, 0.03, 0.035];

        for (bond, &target) in bonds.iter().zip(yields.iter()) {
            let settle = bond.dated_date;
            let dp = super::super::pricing::dirty_price_from_yield(bond, target, settle);
            let solved = solve_ytm(bond, dp, settle).unwrap();
            assert!((solved - target).abs() < 1e-10,
                "Euro round-trip failed: coupon={}, target={}, solved={}",
                bond.coupon_rate, target, solved);
        }
    }
}
