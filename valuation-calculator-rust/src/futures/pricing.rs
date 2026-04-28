//! Bond futures pricing functions.
//!
//! Provides invoice price, basis, implied repo rate, and theoretical
//! futures price calculations for bond futures contracts.

/// Invoice price: the total amount the buyer pays on delivery.
///
/// This is the futures settlement price multiplied by the conversion factor
/// of the delivered bond, plus the accrued interest on the delivered bond
/// at the delivery date.
///
/// `futures_price` and `accrued_interest` are expressed per 100 face value.
/// `conversion_factor` is a unitless ratio (typically close to 1.0).
pub fn invoice_price(
    futures_price: f64,
    conversion_factor: f64,
    accrued_interest: f64,
) -> f64 {
    futures_price * conversion_factor + accrued_interest
}

/// Basis: the difference between the spot clean price and the futures-implied
/// price of a specific deliverable bond.
///
/// The basis should converge toward zero as the contract approaches delivery.
/// A positive basis is typical for the cheapest-to-deliver bond.
pub fn basis(
    spot_clean_price: f64,
    futures_price: f64,
    conversion_factor: f64,
) -> f64 {
    spot_clean_price - futures_price * conversion_factor
}

/// Implied repo rate: the annualized rate of return from a cash-and-carry
/// arbitrage trade.
///
/// The strategy is: buy the bond at the spot dirty price, sell the futures
/// contract, and deliver the bond at expiry to receive the invoice price
/// plus any interim coupon income.
///
/// Uses money-market (Act/360) convention for annualization.
///
/// # Arguments
/// * `spot_dirty_price` - current dirty price of the bond (per 100 face)
/// * `futures_price` - current futures price (per 100 face)
/// * `conversion_factor` - CF for this bond against the contract
/// * `ai_at_delivery` - accrued interest at the delivery date
/// * `coupon_income` - any coupon payments received between now and delivery
/// * `days_to_delivery` - calendar days until delivery
///
/// # Panics
/// Panics if `days_to_delivery` is zero.
pub fn implied_repo_rate(
    spot_dirty_price: f64,
    futures_price: f64,
    conversion_factor: f64,
    ai_at_delivery: f64,
    coupon_income: f64,
    days_to_delivery: u32,
) -> f64 {
    assert!(days_to_delivery > 0, "days_to_delivery must be positive");
    let income = futures_price * conversion_factor + ai_at_delivery + coupon_income;
    let cost = spot_dirty_price;
    (income - cost) / cost * (360.0 / days_to_delivery as f64)
}

/// Theoretical futures price from the spot price of the CTD bond using
/// the cost-of-carry model.
///
/// F = (S * (1 + r * t) - coupon_income - AI_delivery) / CF
///
/// where:
/// - S = spot dirty price
/// - r = repo/financing rate (annualized, Act/360)
/// - t = time to delivery in years (days / 360)
/// - CF = conversion factor
/// - AI_delivery = accrued interest at delivery
/// - coupon_income = coupons received between now and delivery
///
/// # Arguments
/// * `spot_dirty_price` - current dirty price of the CTD bond
/// * `repo_rate` - financing rate (annualized, Act/360)
/// * `days_to_delivery` - calendar days until delivery
/// * `conversion_factor` - CF for the CTD bond
/// * `ai_at_delivery` - accrued interest on the CTD at delivery
/// * `coupon_income` - coupons received between now and delivery
pub fn theoretical_futures_price(
    spot_dirty_price: f64,
    repo_rate: f64,
    days_to_delivery: u32,
    conversion_factor: f64,
    ai_at_delivery: f64,
    coupon_income: f64,
) -> f64 {
    let t = days_to_delivery as f64 / 360.0;
    let carry_cost = spot_dirty_price * (1.0 + repo_rate * t);
    (carry_cost - coupon_income - ai_at_delivery) / conversion_factor
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invoice_price_basic() {
        // futures price 120, CF 0.9, AI 1.5
        let ip = invoice_price(120.0, 0.9, 1.5);
        let expected = 120.0 * 0.9 + 1.5;
        assert!(
            (ip - expected).abs() < 1e-12,
            "invoice_price={}, expected={}",
            ip,
            expected
        );
    }

    #[test]
    fn invoice_price_with_cf_one() {
        // CF = 1.0 means invoice price = futures price + AI
        let ip = invoice_price(110.0, 1.0, 2.0);
        assert!((ip - 112.0).abs() < 1e-12);
    }

    #[test]
    fn basis_at_convergence() {
        // At delivery, basis should be ~0 when spot clean = futures * CF
        let futures = 115.0;
        let cf = 0.85;
        let spot_clean = futures * cf; // perfect convergence
        let b = basis(spot_clean, futures, cf);
        assert!(b.abs() < 1e-12, "basis at convergence should be ~0, got {}", b);
    }

    #[test]
    fn basis_positive_for_cheap_bond() {
        // Spot clean > futures * CF means positive basis
        let b = basis(100.0, 110.0, 0.88);
        let expected = 100.0 - 110.0 * 0.88;
        assert!(
            (b - expected).abs() < 1e-12,
            "basis={}, expected={}",
            b,
            expected
        );
    }

    #[test]
    fn implied_repo_rate_positive_carry() {
        // Buy bond at 99 dirty, futures * CF + AI + coupon = 100 => profit
        let irr = implied_repo_rate(99.0, 100.0, 0.95, 1.0, 0.5, 90);
        // income = 100 * 0.95 + 1.0 + 0.5 = 96.5
        // (96.5 - 99.0) / 99.0 * (360/90) = -2.5 / 99.0 * 4
        let expected = (96.5 - 99.0) / 99.0 * (360.0 / 90.0);
        assert!(
            (irr - expected).abs() < 1e-10,
            "irr={}, expected={}",
            irr,
            expected
        );
    }

    #[test]
    fn implied_repo_rate_typical_positive() {
        // A more typical scenario where carry is profitable
        let spot_dirty = 101.0;
        let futures = 120.0;
        let cf = 0.85;
        let ai_delivery = 0.5;
        let coupon = 2.5;
        let days = 90;
        let irr = implied_repo_rate(spot_dirty, futures, cf, ai_delivery, coupon, days);
        // income = 120 * 0.85 + 0.5 + 2.5 = 105.0
        // (105.0 - 101.0) / 101.0 * 4 = 0.1584...
        let income = futures * cf + ai_delivery + coupon;
        let expected = (income - spot_dirty) / spot_dirty * (360.0 / days as f64);
        assert!(
            (irr - expected).abs() < 1e-10,
            "irr={}, expected={}",
            irr,
            expected
        );
        assert!(irr > 0.0, "typical carry should be positive: {}", irr);
    }

    #[test]
    fn theoretical_futures_price_round_trip() {
        // If we compute the theoretical price and then compute the implied
        // repo rate from it, we should recover the original repo rate.
        let spot_dirty = 102.5;
        let repo_rate = 0.05;
        let days = 60;
        let cf = 0.92;
        let ai_delivery = 0.8;
        let coupon = 0.0;

        let theo_price = theoretical_futures_price(
            spot_dirty,
            repo_rate,
            days,
            cf,
            ai_delivery,
            coupon,
        );

        let irr = implied_repo_rate(spot_dirty, theo_price, cf, ai_delivery, coupon, days);
        assert!(
            (irr - repo_rate).abs() < 1e-10,
            "round-trip repo rate: irr={}, original={}",
            irr,
            repo_rate
        );
    }

    #[test]
    fn theoretical_price_increases_with_repo_rate() {
        let spot_dirty = 100.0;
        let cf = 0.9;
        let ai_del = 1.0;
        let coupon = 0.0;
        let days = 90;

        let p1 = theoretical_futures_price(spot_dirty, 0.02, days, cf, ai_del, coupon);
        let p2 = theoretical_futures_price(spot_dirty, 0.05, days, cf, ai_del, coupon);
        assert!(
            p2 > p1,
            "Higher repo rate should mean higher futures price: p1={}, p2={}",
            p1,
            p2
        );
    }

    #[test]
    fn theoretical_price_decreases_with_coupon_income() {
        // Coupon income reduces the futures price (carry benefit)
        let spot_dirty = 100.0;
        let cf = 0.9;
        let ai_del = 1.0;
        let days = 90;
        let repo = 0.04;

        let p_no_coupon = theoretical_futures_price(spot_dirty, repo, days, cf, ai_del, 0.0);
        let p_with_coupon = theoretical_futures_price(spot_dirty, repo, days, cf, ai_del, 2.5);
        assert!(
            p_with_coupon < p_no_coupon,
            "Coupon income should lower futures price: no_coupon={}, with_coupon={}",
            p_no_coupon,
            p_with_coupon
        );
    }

    #[test]
    fn theoretical_price_with_zero_days() {
        // At delivery (0 days), futures price = (spot_dirty - coupon - AI) / CF
        // But since days=0, carry cost = spot_dirty * (1+0) = spot_dirty
        let spot_dirty = 101.0;
        let cf = 0.95;
        let ai_del = 1.0;
        let coupon = 0.0;
        let p = theoretical_futures_price(spot_dirty, 0.05, 0, cf, ai_del, coupon);
        let expected = (spot_dirty - ai_del) / cf;
        assert!(
            (p - expected).abs() < 1e-10,
            "At delivery: p={}, expected={}",
            p,
            expected
        );
    }
}
