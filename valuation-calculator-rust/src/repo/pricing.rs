use super::RepoSpec;

/// Market value of collateral: dirty_price / 100 * face_value
pub fn collateral_market_value(spec: &RepoSpec) -> f64 {
    spec.collateral_dirty_price / 100.0 * spec.collateral_face
}

/// Haircut-adjusted collateral value: MV * (1 - haircut)
/// This is the maximum amount the borrower can receive
pub fn loan_amount(spec: &RepoSpec) -> f64 {
    collateral_market_value(spec) * (1.0 - spec.haircut)
}

/// Repo interest: loan_amount * repo_rate * days/360 (Act/360 convention)
pub fn repo_interest(spec: &RepoSpec) -> f64 {
    let days = spec.end_date.days_since(&spec.start_date) as f64;
    loan_amount(spec) * spec.repo_rate * days / 360.0
}

/// Repurchase price: loan_amount + repo_interest
/// (the amount paid to get collateral back)
pub fn repurchase_price(spec: &RepoSpec) -> f64 {
    loan_amount(spec) + repo_interest(spec)
}

/// Margin ratio: collateral_MV / loan_amount
/// Should be > 1.0 (the excess is the margin)
pub fn margin_ratio(spec: &RepoSpec) -> f64 {
    let mv = collateral_market_value(spec);
    let loan = loan_amount(spec);
    if loan == 0.0 { return 0.0; }
    mv / loan
}

/// Dollar margin: collateral_MV - loan_amount
pub fn dollar_margin(spec: &RepoSpec) -> f64 {
    collateral_market_value(spec) - loan_amount(spec)
}

/// Implied repo rate from a known loan amount and repurchase price
/// rate = (repurchase - loan) / loan * (360 / days)
pub fn implied_rate(loan: f64, repurchase: f64, days: u32) -> f64 {
    if loan == 0.0 || days == 0 { return 0.0; }
    (repurchase - loan) / loan * (360.0 / days as f64)
}

/// Break-even collateral price: if collateral drops below this,
/// a margin call is triggered.
/// break_even = loan_amount / face_value * 100
/// (the dirty price at which collateral MV = loan amount)
pub fn break_even_price(spec: &RepoSpec) -> f64 {
    let loan = loan_amount(spec);
    loan / spec.collateral_face * 100.0
}

/// Net financing cost: repo_interest minus any coupon income received
/// during the repo term. If coupon_income > 0, the effective
/// financing cost is lower.
pub fn net_financing_cost(spec: &RepoSpec, coupon_income: f64) -> f64 {
    repo_interest(spec) - coupon_income
}

/// Effective repo rate accounting for coupon income
pub fn effective_repo_rate(spec: &RepoSpec, coupon_income: f64) -> f64 {
    let days = spec.end_date.days_since(&spec.start_date) as f64;
    let loan = loan_amount(spec);
    if loan == 0.0 || days == 0.0 { return 0.0; }
    let net_cost = net_financing_cost(spec, coupon_income);
    net_cost / loan * (360.0 / days)
}

/// Reverse repo: from the lender's perspective, the return earned.
/// Economically identical to repo but viewed from the other side.
/// The lender earns the repo rate on the loan amount.
pub fn reverse_repo_income(spec: &RepoSpec) -> f64 {
    repo_interest(spec)  // same calculation, different perspective
}

/// Special repo rate: when specific collateral is in high demand,
/// the repo rate drops below general collateral (GC) rates.
/// Specialness = GC_rate - special_rate
pub fn specialness(gc_rate: f64, special_rate: f64) -> f64 {
    gc_rate - special_rate
}

/// Dollar value of specialness over the repo term
pub fn specialness_value(spec: &RepoSpec, gc_rate: f64) -> f64 {
    let days = spec.end_date.days_since(&spec.start_date) as f64;
    let loan = loan_amount(spec);
    let special = specialness(gc_rate, spec.repo_rate);
    loan * special * days / 360.0
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::date::Date;
    use crate::repo::{RepoSpec, RepoType};

    /// Helper to build a standard 30-day term repo spec
    fn term_repo(dirty_price: f64, face: f64, haircut: f64, rate: f64) -> RepoSpec {
        RepoSpec {
            collateral_dirty_price: dirty_price,
            collateral_face: face,
            haircut,
            repo_rate: rate,
            start_date: Date::new(2025, 6, 1),
            end_date: Date::new(2025, 7, 1),   // 30 days
            repo_type: RepoType::Term,
        }
    }

    #[test]
    fn test_collateral_market_value() {
        // dirty=101.5, face=1,000,000 -> MV = 1,015,000
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let mv = collateral_market_value(&spec);
        assert!((mv - 1_015_000.0).abs() < 1e-6);
    }

    #[test]
    fn test_loan_amount_with_haircut() {
        // MV = 1,015,000, haircut = 2%
        // loan = 1,015,000 * 0.98 = 994,700
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let loan = loan_amount(&spec);
        assert!((loan - 994_700.0).abs() < 1e-6);
    }

    #[test]
    fn test_repo_interest() {
        // loan = 994,700, rate = 5%, days = 30
        // interest = 994,700 * 0.05 * 30/360 = 4,144.583333...
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let interest = repo_interest(&spec);
        let expected = 994_700.0 * 0.05 * 30.0 / 360.0;
        assert!((interest - expected).abs() < 1e-6);
    }

    #[test]
    fn test_repurchase_price() {
        // repurchase = loan + interest
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let loan = loan_amount(&spec);
        let interest = repo_interest(&spec);
        let repurchase = repurchase_price(&spec);
        assert!((repurchase - (loan + interest)).abs() < 1e-6);
    }

    #[test]
    fn test_margin_ratio() {
        // With 2% haircut: ratio = 1 / (1 - 0.02) = 1.020408...
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let ratio = margin_ratio(&spec);
        let expected = 1.0 / (1.0 - 0.02);
        assert!((ratio - expected).abs() < 1e-6);
    }

    #[test]
    fn test_margin_ratio_greater_than_one() {
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        assert!(margin_ratio(&spec) > 1.0);
    }

    #[test]
    fn test_implied_rate_roundtrip() {
        // Compute repurchase from spec, then recover rate via implied_rate
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let loan = loan_amount(&spec);
        let repurchase = repurchase_price(&spec);
        let days = spec.end_date.days_since(&spec.start_date) as u32;
        let recovered_rate = implied_rate(loan, repurchase, days);
        assert!((recovered_rate - 0.05).abs() < 1e-10);
    }

    #[test]
    fn test_break_even_price() {
        // break_even = loan / face * 100
        // loan = 994,700, face = 1,000,000
        // break_even = 99.47
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let be = break_even_price(&spec);
        let expected = 994_700.0 / 1_000_000.0 * 100.0;
        assert!((be - expected).abs() < 1e-6);
        // Break-even should be below the current dirty price
        assert!(be < spec.collateral_dirty_price);
    }

    #[test]
    fn test_net_financing_cost_with_coupon() {
        // Coupon income reduces effective financing cost
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let interest = repo_interest(&spec);
        let coupon_income = 2_000.0;
        let net = net_financing_cost(&spec, coupon_income);
        assert!((net - (interest - coupon_income)).abs() < 1e-6);
        // Net cost < gross interest when coupon received
        assert!(net < interest);
    }

    #[test]
    fn test_effective_rate_less_than_repo_rate_with_coupon() {
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let eff = effective_repo_rate(&spec, 2_000.0);
        assert!(eff < spec.repo_rate);
    }

    #[test]
    fn test_effective_rate_equals_repo_rate_no_coupon() {
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let eff = effective_repo_rate(&spec, 0.0);
        assert!((eff - spec.repo_rate).abs() < 1e-10);
    }

    #[test]
    fn test_specialness() {
        // GC = 5%, special = 3% -> specialness = 2%
        let s = specialness(0.05, 0.03);
        assert!((s - 0.02).abs() < 1e-10);
    }

    #[test]
    fn test_specialness_value() {
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.03); // special rate = 3%
        let gc_rate = 0.05;
        let sv = specialness_value(&spec, gc_rate);
        let loan = loan_amount(&spec);
        let days = 30.0;
        let expected = loan * 0.02 * days / 360.0;
        assert!((sv - expected).abs() < 1e-6);
    }

    #[test]
    fn test_overnight_repo() {
        // 1-day term
        let spec = RepoSpec {
            collateral_dirty_price: 100.0,
            collateral_face: 10_000_000.0,
            haircut: 0.01,
            repo_rate: 0.0525,
            start_date: Date::new(2025, 6, 2),
            end_date: Date::new(2025, 6, 3),
            repo_type: RepoType::Overnight,
        };
        let loan = loan_amount(&spec);
        let mv = collateral_market_value(&spec);
        assert!((mv - 10_000_000.0).abs() < 1e-6);
        assert!((loan - 9_900_000.0).abs() < 1e-6);

        let interest = repo_interest(&spec);
        let expected_interest = 9_900_000.0 * 0.0525 * 1.0 / 360.0;
        assert!((interest - expected_interest).abs() < 1e-6);
    }

    #[test]
    fn test_zero_haircut() {
        // No haircut: loan = full MV
        let spec = term_repo(101.5, 1_000_000.0, 0.0, 0.05);
        let mv = collateral_market_value(&spec);
        let loan = loan_amount(&spec);
        assert!((loan - mv).abs() < 1e-6);
    }

    #[test]
    fn test_high_haircut_equity_repo() {
        // 50% haircut (typical for equity repo): loan = half MV
        let spec = term_repo(100.0, 1_000_000.0, 0.50, 0.08);
        let mv = collateral_market_value(&spec);
        let loan = loan_amount(&spec);
        assert!((loan - mv * 0.5).abs() < 1e-6);
        // Margin ratio should be 2.0
        let ratio = margin_ratio(&spec);
        assert!((ratio - 2.0).abs() < 1e-6);
    }

    #[test]
    fn test_dollar_margin() {
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let dm = dollar_margin(&spec);
        let mv = collateral_market_value(&spec);
        let loan = loan_amount(&spec);
        assert!((dm - (mv - loan)).abs() < 1e-6);
        assert!(dm > 0.0);
    }

    #[test]
    fn test_reverse_repo_income_equals_repo_interest() {
        let spec = term_repo(101.5, 1_000_000.0, 0.02, 0.05);
        let interest = repo_interest(&spec);
        let income = reverse_repo_income(&spec);
        assert!((interest - income).abs() < 1e-10);
    }

    #[test]
    fn test_implied_rate_zero_loan() {
        assert_eq!(implied_rate(0.0, 100.0, 30), 0.0);
    }

    #[test]
    fn test_implied_rate_zero_days() {
        assert_eq!(implied_rate(100.0, 105.0, 0), 0.0);
    }

    #[test]
    fn test_margin_ratio_zero_loan() {
        // haircut = 1.0 -> loan = 0
        let spec = term_repo(101.5, 1_000_000.0, 1.0, 0.05);
        assert_eq!(margin_ratio(&spec), 0.0);
    }
}
