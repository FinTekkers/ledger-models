use crate::date::Date;
use super::TipsSpec;
use crate::bond::cashflows as bond_cf;
use crate::bond::Cashflow;

/// Generate inflation-adjusted cashflows for a TIPS.
///
/// Each coupon = (real_coupon_rate / freq) * adjusted_principal
/// Final payment = coupon + max(adjusted_principal, face_value)
///
/// For simplicity, we assume a single CPI level for all future cashflows
/// (the current observation). In practice, each cashflow would use the
/// CPI observation for its specific date.
pub fn generate_tips_cashflows(
    tips: &TipsSpec,
    settlement: Date,
    current_cpi: f64,
) -> Vec<Cashflow> {
    let bond = &tips.bond;
    let ratio = super::index_ratio::index_ratio(current_cpi, tips.base_cpi);
    let adj_principal = bond.face_value * ratio;
    let floored_principal = bond.face_value * ratio.max(1.0);

    // Generate the standard bond cashflow structure for timing/period_fractions
    let base_cfs = bond_cf::generate(bond, settlement);

    let coupon_per_period = bond.coupon_rate * adj_principal / bond.coupon_freq as f64;

    base_cfs.iter().map(|cf| {
        let is_maturity = cf.date == bond.maturity_date;
        let amount = if is_maturity {
            coupon_per_period + floored_principal
        } else {
            coupon_per_period
        };
        Cashflow {
            date: cf.date,
            amount,
            period_fraction: cf.period_fraction,
        }
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::{BondSpec, CouponType};
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn make_tips(coupon: f64, dated: Date, maturity: Date, base_cpi: f64) -> TipsSpec {
        TipsSpec {
            bond: BondSpec {
                coupon_rate: coupon,
                coupon_freq: 2,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: dated,
                maturity_date: maturity,
                day_count: DayCountConvention::ActualActualICMA,
                ex_dividend_days: 0,
            },
            base_cpi,
            base_cpi_date: dated,
        }
    }

    #[test]
    fn zero_inflation_matches_nominal() {
        // When ratio = 1.0, TIPS behaves exactly like a nominal bond
        let tips = make_tips(0.02, d(2025, 5, 15), d(2027, 5, 15), 100.0);
        let cfs = generate_tips_cashflows(&tips, d(2025, 5, 15), 100.0);

        // 4 semiannual periods for 2-year bond
        assert_eq!(cfs.len(), 4);

        // Coupon = 0.02 * 100 / 2 = 1.0
        assert!((cfs[0].amount - 1.0).abs() < 1e-12, "coupon={}", cfs[0].amount);

        // Maturity = coupon + principal = 1.0 + 100.0 = 101.0
        assert!((cfs[3].amount - 101.0).abs() < 1e-12, "maturity cf={}", cfs[3].amount);
    }

    #[test]
    fn inflation_scales_cashflows() {
        // 5% inflation: CPI = 105, base = 100, ratio = 1.05
        let tips = make_tips(0.02, d(2025, 5, 15), d(2027, 5, 15), 100.0);
        let cfs = generate_tips_cashflows(&tips, d(2025, 5, 15), 105.0);

        // adj_principal = 100 * 1.05 = 105
        // coupon = 0.02 * 105 / 2 = 1.05
        assert!((cfs[0].amount - 1.05).abs() < 1e-12, "coupon={}", cfs[0].amount);

        // maturity = 1.05 + 105 = 106.05
        assert!((cfs[3].amount - 106.05).abs() < 1e-12, "maturity cf={}", cfs[3].amount);
    }

    #[test]
    fn deflation_floor_at_maturity() {
        // Deflation: CPI = 95, base = 100, ratio = 0.95
        // Interim coupons use raw ratio (adj_principal = 95)
        // Maturity uses floored principal (100)
        let tips = make_tips(0.02, d(2025, 5, 15), d(2027, 5, 15), 100.0);
        let cfs = generate_tips_cashflows(&tips, d(2025, 5, 15), 95.0);

        // coupon = 0.02 * 95 / 2 = 0.95 (raw, no floor)
        assert!((cfs[0].amount - 0.95).abs() < 1e-12, "coupon={}", cfs[0].amount);

        // maturity = coupon + floored_principal = 0.95 + 100.0 = 100.95
        assert!((cfs[3].amount - 100.95).abs() < 1e-12, "maturity cf={}", cfs[3].amount);
    }

    #[test]
    fn high_inflation_cashflows() {
        // 50% inflation: ratio = 1.5
        let tips = make_tips(0.01, d(2025, 5, 15), d(2027, 5, 15), 100.0);
        let cfs = generate_tips_cashflows(&tips, d(2025, 5, 15), 150.0);

        // adj_principal = 150
        // coupon = 0.01 * 150 / 2 = 0.75
        assert!((cfs[0].amount - 0.75).abs() < 1e-12);

        // maturity = 0.75 + 150 = 150.75
        assert!((cfs[3].amount - 150.75).abs() < 1e-12);
    }

    #[test]
    fn period_fractions_preserved() {
        let tips = make_tips(0.02, d(2025, 5, 15), d(2035, 5, 15), 100.0);
        let settle = d(2025, 8, 20);
        let cfs = generate_tips_cashflows(&tips, settle, 103.0);
        let base_cfs = crate::bond::cashflows::generate(&tips.bond, settle);

        assert_eq!(cfs.len(), base_cfs.len());
        for (tips_cf, base_cf) in cfs.iter().zip(base_cfs.iter()) {
            assert_eq!(tips_cf.date, base_cf.date);
            assert!((tips_cf.period_fraction - base_cf.period_fraction).abs() < 1e-15);
        }
    }
}
