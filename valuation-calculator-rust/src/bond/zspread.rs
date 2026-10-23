use crate::curve::YieldCurve;
use crate::date::Date;
use crate::error::BondError;
use super::{BondSpec, cashflows};

const MAX_ITER: u32 = 100;
const PRICE_TOL: f64 = 1e-12;
const SPREAD_TOL: f64 = 1e-14;

/// Solve for the Z-spread: the constant spread `z` over the benchmark yield curve
/// such that discounting the bond's cashflows at `zero_rate(t_i) + z` reproduces
/// the market dirty price.
///
/// Uses Newton-Raphson iteration.
pub fn solve_zspread(
    bond: &BondSpec,
    market_clean_price: f64,
    settlement: Date,
    curve: &YieldCurve,
) -> Result<f64, BondError> {
    if settlement >= bond.maturity_date {
        return Err(BondError::MaturedBond);
    }

    let cfs = cashflows::generate(bond, settlement);
    if cfs.is_empty() {
        return Err(BondError::MaturedBond);
    }

    let ai = super::accrued_interest::accrued_interest(bond, settlement);
    let dirty_target = market_clean_price + ai;

    // Precompute time and zero rate for each cashflow
    let cf_data: Vec<(f64, f64, f64)> = cfs
        .iter()
        .map(|cf| {
            let t = curve.time_from_reference(cf.date);
            let r = curve.zero_rate(t);
            (cf.amount, t, r)
        })
        .collect();

    // Newton-Raphson: solve for z such that PV(z) = dirty_target
    let mut z = 0.0_f64;

    for iter in 0..MAX_ITER {
        let mut pv = 0.0_f64;
        let mut dpv_dz = 0.0_f64;

        for &(amount, t, r) in &cf_data {
            let disc = (-(r + z) * t).exp();
            pv += amount * disc;
            // d/dz [amount * exp(-(r+z)*t)] = -t * amount * exp(-(r+z)*t)
            dpv_dz -= t * amount * disc;
        }

        let f_val = pv - dirty_target;
        if f_val.abs() < PRICE_TOL {
            return Ok(z);
        }

        if dpv_dz.abs() < 1e-15 {
            return Err(BondError::ConvergenceFailure {
                iterations: iter,
                last_price_error: f_val,
            });
        }

        let dz = f_val / dpv_dz;
        z -= dz;

        if dz.abs() < SPREAD_TOL {
            return Ok(z);
        }
    }

    Err(BondError::ConvergenceFailure {
        iterations: MAX_ITER,
        last_price_error: 0.0,
    })
}

/// Price a bond given a yield curve and a Z-spread.
/// Each cashflow is discounted at `exp(-(r(t_i) + z) * t_i)`.
pub fn dirty_price_with_zspread(
    bond: &BondSpec,
    settlement: Date,
    curve: &YieldCurve,
    zspread: f64,
) -> f64 {
    let cfs = cashflows::generate(bond, settlement);
    cfs.iter()
        .map(|cf| {
            let t = curve.time_from_reference(cf.date);
            let r = curve.zero_rate(t);
            cf.amount * (-(r + zspread) * t).exp()
        })
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
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

    fn flat_curve(ref_date: Date, rate: f64) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![rate; 6],
        )
        .unwrap()
    }

    fn upward_curve(ref_date: Date) -> YieldCurve {
        YieldCurve::new(
            ref_date,
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![0.02, 0.025, 0.03, 0.035, 0.04, 0.045],
        )
        .unwrap()
    }

    // ---- Par bond on flat curve: Z-spread should approximate YTM minus flat rate ----

    #[test]
    fn par_bond_flat_curve_zspread_near_ytm_minus_flat_rate() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let flat_rate = 0.04;
        let curve = flat_curve(settle, flat_rate);

        // A par bond (price=100) has YTM = coupon rate = 0.05.
        // On a flat curve at 0.04, the Z-spread should be approximately
        // YTM - flat_rate, but note that YTM uses semiannual compounding
        // while Z-spread uses continuous compounding, so they won't match exactly.
        let zs = solve_zspread(&bond, 100.0, settle, &curve).unwrap();

        // The Z-spread should be positive (bond yields more than curve)
        assert!(zs > 0.0, "Z-spread should be positive, got {}", zs);

        // Verify via round-trip: pricing with the solved Z-spread should recover dirty price
        let dp = dirty_price_with_zspread(&bond, settle, &curve, zs);
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        let dirty_target = 100.0 + ai;
        assert!(
            (dp - dirty_target).abs() < 1e-8,
            "Round-trip dirty price: got={}, expected={}",
            dp,
            dirty_target
        );
    }

    // ---- Discount bond: Z-spread should be positive ----

    #[test]
    fn discount_bond_positive_zspread() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.03, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        // Bond coupon (3%) is below the curve rate (4%), so the bond trades
        // at a discount. The market price is below the curve-implied price.
        // Price this bond at a yield higher than 4% => discount price
        let market_price = 85.0;
        let zs = solve_zspread(&bond, market_price, settle, &curve).unwrap();

        assert!(
            zs > 0.0,
            "Discount bond Z-spread should be positive, got {}",
            zs
        );
    }

    // ---- Premium bond: Z-spread should be negative ----

    #[test]
    fn premium_bond_negative_zspread() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.06, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        // Curve-implied price: discount at 4% continuously
        let curve_price = dirty_price_with_zspread(&bond, settle, &curve, 0.0);

        // Premium bond: market price is above the curve-implied price
        let premium_price = curve_price + 5.0;
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        let clean_premium = premium_price - ai;

        let zs = solve_zspread(&bond, clean_premium, settle, &curve).unwrap();
        assert!(
            zs < 0.0,
            "Premium bond Z-spread should be negative, got {}",
            zs
        );
    }

    // ---- Round-trip: dirty_price_with_zspread(solved_z) = market dirty price ----

    #[test]
    fn round_trip_zspread() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.045, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.03);

        let market_clean = 97.5;
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        let dirty_target = market_clean + ai;

        let zs = solve_zspread(&bond, market_clean, settle, &curve).unwrap();
        let dp = dirty_price_with_zspread(&bond, settle, &curve, zs);

        assert!(
            (dp - dirty_target).abs() < 1e-8,
            "Round-trip: dp={}, dirty_target={}",
            dp,
            dirty_target
        );
    }

    // ---- Zero Z-spread: pricing with z=0 equals curve-implied price ----

    #[test]
    fn zero_zspread_equals_curve_implied_price() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.05);

        // Price with z=0 should match the "no spread" curve-implied price
        let dp_z0 = dirty_price_with_zspread(&bond, settle, &curve, 0.0);

        // Manually compute: each CF discounted at exp(-r * t) where r = flat rate
        let cfs = cashflows::generate(&bond, settle);
        let manual_pv: f64 = cfs
            .iter()
            .map(|cf| {
                let t = curve.time_from_reference(cf.date);
                let r = curve.zero_rate(t);
                cf.amount * (-r * t).exp()
            })
            .sum();

        assert!(
            (dp_z0 - manual_pv).abs() < 1e-12,
            "z=0 price={}, manual={}",
            dp_z0,
            manual_pv
        );
    }

    // ---- Upward sloping curve: Z-spread makes sense relative to YTM ----

    #[test]
    fn upward_sloping_curve_zspread() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = upward_curve(settle);

        let market_clean = 95.0;
        let zs = solve_zspread(&bond, market_clean, settle, &curve).unwrap();

        // Bond is trading at a discount => Z-spread should be positive
        // (bond requires more yield than the curve alone)
        // First check: what is the curve-implied price at z=0?
        let curve_dp = dirty_price_with_zspread(&bond, settle, &curve, 0.0);
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        let market_dirty = market_clean + ai;

        if market_dirty < curve_dp {
            assert!(
                zs > 0.0,
                "Below-curve price should yield positive Z-spread, got {}",
                zs
            );
        } else {
            assert!(
                zs < 0.0,
                "Above-curve price should yield negative Z-spread, got {}",
                zs
            );
        }

        // Round-trip check
        let dp = dirty_price_with_zspread(&bond, settle, &curve, zs);
        assert!(
            (dp - market_dirty).abs() < 1e-8,
            "Upward curve round-trip: dp={}, target={}",
            dp,
            market_dirty
        );
    }

    // ---- Between coupon dates: settlement-aware discounting works ----

    #[test]
    fn between_coupon_dates_zspread() {
        let settle = d(2025, 8, 20);
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let curve = flat_curve(d(2025, 5, 15), 0.04);

        let market_clean = 97.0;
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        assert!(ai > 0.0, "AI should be positive between coupons: {}", ai);

        let dirty_target = market_clean + ai;
        let zs = solve_zspread(&bond, market_clean, settle, &curve).unwrap();

        // Round-trip check
        let dp = dirty_price_with_zspread(&bond, settle, &curve, zs);
        assert!(
            (dp - dirty_target).abs() < 1e-8,
            "Between-dates round-trip: dp={}, target={}",
            dp,
            dirty_target
        );

        // The Z-spread should be positive since the bond is cheap relative to a 4% curve
        assert!(
            zs > 0.0,
            "Z-spread should be positive for this discount bond: {}",
            zs
        );
    }

    // ---- Additional: matured bond returns error ----

    #[test]
    fn matured_bond_returns_error() {
        let settle = d(2036, 1, 1);
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let curve = flat_curve(d(2025, 5, 15), 0.04);

        let result = solve_zspread(&bond, 100.0, settle, &curve);
        assert!(
            matches!(result, Err(BondError::MaturedBond)),
            "Should return MaturedBond error"
        );
    }

    // ---- Round-trip with various prices ----

    #[test]
    fn round_trip_multiple_prices() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = upward_curve(settle);

        for &clean_price in &[90.0, 95.0, 100.0, 105.0, 110.0] {
            let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
            let dirty_target = clean_price + ai;

            let zs = solve_zspread(&bond, clean_price, settle, &curve).unwrap();
            let dp = dirty_price_with_zspread(&bond, settle, &curve, zs);

            assert!(
                (dp - dirty_target).abs() < 1e-8,
                "price={}: dp={}, target={}, z={}",
                clean_price,
                dp,
                dirty_target,
                zs
            );
        }
    }

    // ---- Annual coupon bond (Euro-style) ----

    #[test]
    fn annual_coupon_bond_zspread() {
        let settle = d(2025, 2, 15);
        let bond = BondSpec {
            coupon_rate: 0.03,
            coupon_freq: 1,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: settle,
            maturity_date: d(2035, 2, 15),
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        };
        let curve = flat_curve(settle, 0.025);

        let market_clean = 98.0;
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        let dirty_target = market_clean + ai;

        let zs = solve_zspread(&bond, market_clean, settle, &curve).unwrap();
        let dp = dirty_price_with_zspread(&bond, settle, &curve, zs);

        assert!(
            (dp - dirty_target).abs() < 1e-8,
            "Annual coupon round-trip: dp={}, target={}",
            dp,
            dirty_target
        );

        // Bond priced below par with coupon > curve rate, so Z-spread should be positive
        assert!(zs > 0.0, "Z-spread for cheap annual bond should be positive: {}", zs);
    }

    // ---- Flat curve: Z-spread = 0 when pricing at the curve-implied price ----

    #[test]
    fn zspread_is_zero_at_curve_implied_price() {
        let settle = d(2025, 5, 15);
        let bond = ust_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        // Get the curve-implied dirty price (z=0)
        let curve_dp = dirty_price_with_zspread(&bond, settle, &curve, 0.0);
        let ai = super::super::accrued_interest::accrued_interest(&bond, settle);
        let curve_clean = curve_dp - ai;

        // Solving Z-spread for the curve-implied price should give z ~= 0
        let zs = solve_zspread(&bond, curve_clean, settle, &curve).unwrap();
        assert!(
            zs.abs() < 1e-10,
            "Z-spread at curve-implied price should be ~0, got {}",
            zs
        );
    }
}
