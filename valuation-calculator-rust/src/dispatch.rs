/// Approach 3: single entry point with oneof dispatch.
/// The GRPC handler calls `dispatch_valuation` which routes to the appropriate module.

use crate::date::Date;
use crate::curve::YieldCurve;

/// Unified valuation result
#[derive(Debug, Clone)]
pub struct ValuationResult {
    pub measures: Vec<(String, f64)>,
    pub cashflows: Vec<CashflowEntry>,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct CashflowEntry {
    pub period: u32,
    pub amount: f64,
    pub pv: f64,
}

/// Product input enum matching the proto oneof
#[derive(Debug, Clone)]
pub enum ProductInput {
    Bond(BondInput),
    Swap(SwapInput),
    Mbs(MbsInput),
    MoneyMarket(MoneyMarketInput),
    Repo(RepoInput),
}

#[derive(Debug, Clone)]
pub struct BondInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub clean_price: f64,
    pub settlement: Date,
    pub benchmark_curve: Option<YieldCurve>,
    pub z_spread: f64,
}

#[derive(Debug, Clone)]
pub struct SwapInput {
    pub notional: f64,
    pub fixed_rate: f64,
    pub fixed_freq: u32,
    pub float_freq: u32,
    pub float_spread: f64,
    pub start_date: Date,
    pub maturity_date: Date,
    pub pay_fixed: bool,
    pub projection_curve: YieldCurve,
    pub discount_curve: YieldCurve,
}

#[derive(Debug, Clone)]
pub struct MbsInput {
    pub original_balance: f64,
    pub current_balance: f64,
    pub pass_through_rate: f64,
    pub wac: f64,
    pub wam: u32,
    pub age: u32,
    pub market_price: f64,
    pub psa_speed: f64,
    pub settlement: Date,
}

#[derive(Debug, Clone)]
pub struct MoneyMarketInput {
    pub face_value: f64,
    pub issue_date: Date,
    pub maturity_date: Date,
    pub market_price: f64,
    pub settlement: Date,
    pub is_discount: bool,
}

#[derive(Debug, Clone)]
pub struct RepoInput {
    pub collateral_dirty_price: f64,
    pub collateral_face: f64,
    pub haircut: f64,
    pub repo_rate: f64,
    pub start_date: Date,
    pub end_date: Date,
}

/// Main dispatch function -- routes to the appropriate product handler
pub fn dispatch_valuation(input: &ProductInput, _settlement: Date) -> ValuationResult {
    match input {
        ProductInput::Bond(b) => valuate_bond(b),
        ProductInput::Swap(s) => valuate_swap(s),
        ProductInput::Mbs(m) => valuate_mbs(m),
        ProductInput::MoneyMarket(mm) => valuate_money_market(mm),
        ProductInput::Repo(r) => valuate_repo(r),
    }
}

fn valuate_bond(input: &BondInput) -> ValuationResult {
    use crate::bond::*;
    use crate::daycount::DayCountConvention;

    let bond = BondSpec {
        coupon_rate: input.coupon_rate,
        coupon_freq: input.coupon_freq,
        coupon_type: CouponType::Fixed,
        face_value: input.face_value,
        dated_date: input.dated_date,
        maturity_date: input.maturity_date,
        day_count: DayCountConvention::ActualActualICMA,
        ex_dividend_days: 0,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    let ai = accrued_interest::accrued_interest(&bond, input.settlement);
    measures.push(("AccruedInterest".into(), ai));
    measures.push(("CleanPrice".into(), input.clean_price));
    measures.push(("DirtyPrice".into(), input.clean_price + ai));

    match ytm_solver::solve_ytm(&bond, input.clean_price, input.settlement) {
        Ok(ytm) => {
            measures.push(("YieldToMaturity".into(), ytm));
            measures.push(("MacaulayDuration".into(), duration::macaulay_duration(&bond, ytm, input.settlement)));
            measures.push(("ModifiedDuration".into(), duration::modified_duration(&bond, ytm, input.settlement)));
            measures.push(("Convexity".into(), convexity::convexity(&bond, ytm, input.settlement)));
            measures.push(("DV01".into(), dv01::dv01(&bond, ytm, input.settlement)));
        }
        Err(e) => errors.push(format!("{}", e)),
    }

    if let Some(ref curve) = input.benchmark_curve {
        measures.push(("SpreadDuration".into(), spread::spread_duration(&bond, input.settlement, curve, input.z_spread)));
        measures.push(("SpreadDV01".into(), spread::spread_dv01(&bond, input.settlement, curve, input.z_spread)));
    }

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_swap(input: &SwapInput) -> ValuationResult {
    use crate::swap::*;
    use crate::daycount::DayCountConvention;

    let spec = SwapSpec {
        notional: input.notional,
        fixed_rate: input.fixed_rate,
        fixed_freq: input.fixed_freq,
        fixed_day_count: DayCountConvention::Thirty360US,
        float_freq: input.float_freq,
        float_day_count: DayCountConvention::Actual360,
        start_date: input.start_date,
        maturity_date: input.maturity_date,
        float_spread: input.float_spread,
    };
    let dir = if input.pay_fixed { SwapDirection::PayFixed } else { SwapDirection::ReceiveFixed };

    let mut measures = Vec::new();
    measures.push(("NPV".into(), pricing::swap_npv(&spec, dir, &input.projection_curve, &input.discount_curve)));
    measures.push(("ParSwapRate".into(), pricing::par_swap_rate(&spec, &input.projection_curve, &input.discount_curve)));
    measures.push(("DV01".into(), pricing::swap_dv01(&spec, dir, &input.projection_curve, &input.discount_curve)));
    measures.push(("PV01".into(), pricing::pv01(&spec, &input.discount_curve)));
    measures.push(("FixedLegPV".into(), pricing::fixed_leg_pv(&spec, &input.discount_curve)));
    measures.push(("FloatLegPV".into(), pricing::float_leg_pv(&spec, &input.projection_curve, &input.discount_curve)));

    ValuationResult { measures, cashflows: vec![], errors: vec![] }
}

fn valuate_mbs(input: &MbsInput) -> ValuationResult {
    let spec = crate::mbs::MbsSpec {
        original_balance: input.original_balance,
        current_balance: input.current_balance,
        pass_through_rate: input.pass_through_rate,
        wac: input.wac,
        wam: input.wam,
        age: input.age,
        settlement: input.settlement,
        factor: input.current_balance / input.original_balance,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    match crate::mbs::pricing::solve_mbs_yield(&spec, input.market_price, input.psa_speed) {
        Ok(y) => {
            measures.push(("Yield".into(), y));
            measures.push(("Price".into(), crate::mbs::pricing::mbs_price(&spec, y, input.psa_speed)));
            measures.push(("EffectiveDuration".into(), crate::mbs::pricing::effective_duration(&spec, y, input.psa_speed)));
        }
        Err(e) => errors.push(format!("{}", e)),
    }
    measures.push(("WAL".into(), crate::mbs::pricing::weighted_average_life(&spec, input.psa_speed)));
    measures.push(("WALSensitivity".into(), crate::mbs::pricing::wal_sensitivity(&spec, input.psa_speed)));

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_money_market(input: &MoneyMarketInput) -> ValuationResult {
    let days = input.maturity_date.days_since(&input.settlement) as u32;
    let face = input.face_value;
    let price = input.market_price;

    let mut measures = Vec::new();
    measures.push(("DiscountRate".into(), crate::money_market::quotes::discount_rate(price, face, days)));
    measures.push(("MoneyMarketYield".into(), crate::money_market::quotes::money_market_yield(price, face, days)));
    measures.push(("BondEquivalentYield".into(), crate::money_market::quotes::bond_equivalent_yield(price, face, days)));
    measures.push(("EffectiveAnnualYield".into(), crate::money_market::quotes::effective_annual_yield(price, face, days)));
    measures.push(("DollarDiscount".into(), crate::money_market::pricing::dollar_discount(price, face)));
    measures.push(("HPR".into(), crate::money_market::pricing::holding_period_return(price, face)));

    ValuationResult { measures, cashflows: vec![], errors: vec![] }
}

fn valuate_repo(input: &RepoInput) -> ValuationResult {
    let spec = crate::repo::RepoSpec {
        collateral_dirty_price: input.collateral_dirty_price,
        collateral_face: input.collateral_face,
        haircut: input.haircut,
        repo_rate: input.repo_rate,
        start_date: input.start_date,
        end_date: input.end_date,
        repo_type: crate::repo::RepoType::Term,
    };

    let mut measures = Vec::new();
    measures.push(("CollateralMV".into(), crate::repo::pricing::collateral_market_value(&spec)));
    measures.push(("LoanAmount".into(), crate::repo::pricing::loan_amount(&spec)));
    measures.push(("RepoInterest".into(), crate::repo::pricing::repo_interest(&spec)));
    measures.push(("RepurchasePrice".into(), crate::repo::pricing::repurchase_price(&spec)));
    measures.push(("MarginRatio".into(), crate::repo::pricing::margin_ratio(&spec)));
    measures.push(("BreakEvenPrice".into(), crate::repo::pricing::break_even_price(&spec)));

    ValuationResult { measures, cashflows: vec![], errors: vec![] }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn flat_curve(rate: f64) -> YieldCurve {
        YieldCurve::new(d(2025, 1, 1), vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0], vec![rate; 6]).unwrap()
    }

    #[test]
    fn dispatch_bond() {
        let input = ProductInput::Bond(BondInput {
            coupon_rate: 0.05, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2025, 1, 1), maturity_date: d(2035, 1, 1),
            clean_price: 100.0, settlement: d(2025, 1, 1),
            benchmark_curve: Some(flat_curve(0.04)), z_spread: 0.0,
        });
        let result = dispatch_valuation(&input, d(2025, 1, 1));
        assert!(result.errors.is_empty());
        let ytm = result.measures.iter().find(|(k,_)| k == "YieldToMaturity").unwrap().1;
        assert!((ytm - 0.05).abs() < 1e-6);
    }

    #[test]
    fn dispatch_swap() {
        let curve = flat_curve(0.04);
        let input = ProductInput::Swap(SwapInput {
            notional: 1_000_000.0, fixed_rate: 0.04, fixed_freq: 2, float_freq: 4,
            float_spread: 0.0, start_date: d(2025, 1, 1), maturity_date: d(2030, 1, 1),
            pay_fixed: true, projection_curve: curve.clone(), discount_curve: curve,
        });
        let result = dispatch_valuation(&input, d(2025, 1, 1));
        assert!(result.errors.is_empty());
        let npv = result.measures.iter().find(|(k,_)| k == "NPV").unwrap().1;
        assert!(npv.abs() < 1000.0);
    }

    #[test]
    fn dispatch_money_market() {
        let input = ProductInput::MoneyMarket(MoneyMarketInput {
            face_value: 100.0, issue_date: d(2025, 1, 1), maturity_date: d(2025, 4, 1),
            market_price: 98.75, settlement: d(2025, 1, 1), is_discount: true,
        });
        let result = dispatch_valuation(&input, d(2025, 1, 1));
        let dr = result.measures.iter().find(|(k,_)| k == "DiscountRate").unwrap().1;
        assert!(dr > 0.0);
    }

    #[test]
    fn dispatch_repo() {
        let input = ProductInput::Repo(RepoInput {
            collateral_dirty_price: 101.5, collateral_face: 1_000_000.0,
            haircut: 0.02, repo_rate: 0.05, start_date: d(2025, 1, 1), end_date: d(2025, 2, 1),
        });
        let result = dispatch_valuation(&input, d(2025, 1, 1));
        let loan = result.measures.iter().find(|(k,_)| k == "LoanAmount").unwrap().1;
        assert!(loan > 0.0);
    }

    #[test]
    fn dispatch_mbs() {
        let input = ProductInput::Mbs(MbsInput {
            original_balance: 1_000_000.0, current_balance: 950_000.0,
            pass_through_rate: 0.05, wac: 0.055, wam: 348, age: 12,
            market_price: 98.0, psa_speed: 150.0, settlement: d(2025, 6, 1),
        });
        let result = dispatch_valuation(&input, d(2025, 6, 1));
        let wal = result.measures.iter().find(|(k,_)| k == "WAL").unwrap().1;
        assert!(wal > 0.0);
    }
}
