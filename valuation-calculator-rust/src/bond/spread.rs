use crate::curve::YieldCurve;
use crate::date::Date;
use super::BondSpec;
use super::zspread;
use super::accrued_interest;

/// Spread duration: percentage price sensitivity to a 1bp parallel shift in the Z-spread.
/// Computed numerically: -(P_up - P_down) / (2 * bump * P_0)
pub fn spread_duration(
    bond: &BondSpec,
    settlement: Date,
    curve: &YieldCurve,
    zspread: f64,
) -> f64 {
    let bump = 0.0001; // 1bp
    let p0 = zspread::dirty_price_with_zspread(bond, settlement, curve, zspread);
    let p_up = zspread::dirty_price_with_zspread(bond, settlement, curve, zspread + bump);
    let p_down = zspread::dirty_price_with_zspread(bond, settlement, curve, zspread - bump);
    -(p_up - p_down) / (2.0 * bump * p0)
}

/// Spread DV01: dollar value of 1bp change in Z-spread per $100 face.
/// = spread_duration * dirty_price * 0.0001
pub fn spread_dv01(
    bond: &BondSpec,
    settlement: Date,
    curve: &YieldCurve,
    zspread: f64,
) -> f64 {
    let dirty = zspread::dirty_price_with_zspread(bond, settlement, curve, zspread);
    let sd = spread_duration(bond, settlement, curve, zspread);
    sd * dirty * 0.0001
}

/// Price a bond from a Z-spread over a benchmark curve.
/// Returns (clean_price, dirty_price).
pub fn price_from_spread(
    bond: &BondSpec,
    settlement: Date,
    curve: &YieldCurve,
    zspread: f64,
) -> (f64, f64) {
    let dirty = zspread::dirty_price_with_zspread(bond, settlement, curve, zspread);
    let ai = accrued_interest::accrued_interest(bond, settlement);
    (dirty - ai, dirty)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn corp_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
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

    // ── Spread duration tests ──────────────────────────────────────

    #[test]
    fn spread_duration_is_positive() {
        let settle = d(2025, 5, 15);
        let bond = corp_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let sd = spread_duration(&bond, settle, &curve, 0.01);
        assert!(sd > 0.0, "Spread duration should be positive, got {}", sd);
    }

    #[test]
    fn spread_duration_approx_modified_duration_flat_curve() {
        // On a flat curve, spread duration should be close to modified duration
        // because a parallel shift in z-spread on a flat curve is effectively
        // the same as shifting yield.
        let settle = d(2025, 5, 15);
        let bond = corp_bond(0.05, settle, d(2035, 5, 15));
        let flat_rate = 0.04;
        let curve = flat_curve(settle, flat_rate);

        let sd = spread_duration(&bond, settle, &curve, 0.01);

        // Modified duration for a 10Y 5% semiannual bond should be roughly 7-8
        // Spread duration should be in a similar range
        assert!(sd > 5.0 && sd < 12.0,
            "Spread duration {} should be in a reasonable range for a 10Y bond", sd);

        // Also compute modified duration from the yield for comparison
        let dirty = zspread::dirty_price_with_zspread(&bond, settle, &curve, 0.01);
        let ai = crate::bond::accrued_interest::accrued_interest(&bond, settle);
        let clean = dirty - ai;
        let ytm = crate::bond::ytm_solver::solve_ytm(&bond, clean, settle).unwrap();
        let mod_dur = crate::bond::duration::modified_duration(&bond, ytm, settle);

        // They should be within 20% of each other for a flat curve
        let ratio = sd / mod_dur;
        assert!(ratio > 0.7 && ratio < 1.3,
            "Spread duration ({}) and modified duration ({}) should be close on a flat curve, ratio={}",
            sd, mod_dur, ratio);
    }

    #[test]
    fn spread_duration_increases_with_maturity() {
        let settle = d(2025, 5, 15);
        let curve = flat_curve(settle, 0.04);

        let bond_5y = corp_bond(0.05, settle, d(2030, 5, 15));
        let bond_10y = corp_bond(0.05, settle, d(2035, 5, 15));
        let bond_30y = corp_bond(0.05, settle, d(2055, 5, 15));

        let sd_5y = spread_duration(&bond_5y, settle, &curve, 0.01);
        let sd_10y = spread_duration(&bond_10y, settle, &curve, 0.01);
        let sd_30y = spread_duration(&bond_30y, settle, &curve, 0.01);

        assert!(sd_5y < sd_10y, "5Y SD ({}) should be < 10Y SD ({})", sd_5y, sd_10y);
        assert!(sd_10y < sd_30y, "10Y SD ({}) should be < 30Y SD ({})", sd_10y, sd_30y);
    }

    // ── Spread DV01 tests ──────────────────────────────────────────

    #[test]
    fn spread_dv01_is_positive() {
        let settle = d(2025, 5, 15);
        let bond = corp_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let dv = spread_dv01(&bond, settle, &curve, 0.01);
        assert!(dv > 0.0, "Spread DV01 should be positive, got {}", dv);
    }

    #[test]
    fn spread_dv01_proportional_to_price() {
        // DV01 = SD * dirty * 0.0001, so higher price => higher DV01
        let settle = d(2025, 5, 15);
        let curve = flat_curve(settle, 0.04);

        // Low spread => higher price => higher DV01
        let bond = corp_bond(0.05, settle, d(2035, 5, 15));
        let dv01_low_spread = spread_dv01(&bond, settle, &curve, 0.005);
        let dv01_high_spread = spread_dv01(&bond, settle, &curve, 0.03);

        // With lower spread, price is higher, and DV01 should be higher
        assert!(dv01_low_spread > dv01_high_spread,
            "DV01 at low spread ({}) should be > DV01 at high spread ({})",
            dv01_low_spread, dv01_high_spread);
    }

    // ── price_from_spread round-trip tests ─────────────────────────

    #[test]
    fn price_from_spread_round_trip_with_solve_zspread() {
        let settle = d(2025, 5, 15);
        let bond = corp_bond(0.05, settle, d(2035, 5, 15));
        let curve = flat_curve(settle, 0.04);

        let input_spread = 0.015; // 150bps
        let (clean, _dirty) = price_from_spread(&bond, settle, &curve, input_spread);

        // Now solve back for the Z-spread from the clean price
        let solved_z = zspread::solve_zspread(&bond, clean, settle, &curve).unwrap();

        assert!((solved_z - input_spread).abs() < 1e-8,
            "Round-trip: input spread={}, solved spread={}", input_spread, solved_z);
    }

    #[test]
    fn price_from_spread_round_trip_upward_curve() {
        let settle = d(2025, 5, 15);
        let bond = corp_bond(0.045, settle, d(2035, 5, 15));
        let curve = upward_curve(settle);

        let input_spread = 0.02; // 200bps
        let (clean, _dirty) = price_from_spread(&bond, settle, &curve, input_spread);

        let solved_z = zspread::solve_zspread(&bond, clean, settle, &curve).unwrap();
        assert!((solved_z - input_spread).abs() < 1e-8,
            "Upward curve round-trip: input={}, solved={}", input_spread, solved_z);
    }

    #[test]
    fn price_from_spread_clean_plus_ai_equals_dirty() {
        let settle = d(2025, 8, 20);
        let bond = corp_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let curve = flat_curve(d(2025, 5, 15), 0.04);

        let (clean, dirty) = price_from_spread(&bond, settle, &curve, 0.01);
        let ai = crate::bond::accrued_interest::accrued_interest(&bond, settle);

        assert!((dirty - clean - ai).abs() < 1e-10,
            "dirty ({}) - clean ({}) should equal AI ({})", dirty, clean, ai);
    }
}
