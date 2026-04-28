use crate::bond::*;
use crate::date::Date;
use crate::daycount::DayCountConvention;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Measure {
    DirectedQuantity,
    MarketValue,
    UnadjustedCostBasis,
    CurrentYield,
    YieldToMaturity,
    MacaulayDuration,
    ModifiedDuration,
    PresentValue,
    PresentValueCashflows,
    AccruedInterest,
    Convexity,
    DirtyPrice,
    CleanPrice,
    Dv01,
    ProfitLoss,
    ProfitLossPercent,
}

#[derive(Debug, Clone)]
pub struct ValuationRequest {
    pub security: SecurityInput,
    pub market_price: f64,
    pub quantity: f64,
    pub cost_basis: Option<f64>,
    pub settlement: Date,
    pub measures: Vec<Measure>,
}

#[derive(Debug, Clone)]
pub struct SecurityInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub coupon_type: CouponType,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
}

#[derive(Debug, Clone)]
pub struct CashflowResult {
    pub date: Date,
    pub fv_amount: f64,
    pub pv_amount: f64,
    pub coupon_rate: f64,
}

#[derive(Debug, Clone)]
pub struct ValuationResponse {
    pub results: Vec<(Measure, f64)>,
    pub cashflows: Vec<CashflowResult>,
    pub errors: Vec<String>,
}

impl SecurityInput {
    fn to_bond_spec(&self) -> BondSpec {
        BondSpec {
            coupon_rate: self.coupon_rate,
            coupon_freq: self.coupon_freq,
            coupon_type: self.coupon_type,
            face_value: self.face_value,
            dated_date: self.dated_date,
            maturity_date: self.maturity_date,
            day_count: DayCountConvention::ActualActualICMA,
        }
    }
}

pub fn valuate(req: &ValuationRequest) -> ValuationResponse {
    let bond = req.security.to_bond_spec();
    let settle = req.settlement;
    let mut results = Vec::new();
    let mut cf_results = Vec::new();
    let mut errors = Vec::new();

    if settle >= bond.maturity_date {
        return ValuationResponse {
            results: vec![],
            cashflows: vec![],
            errors: vec!["Bond has matured".to_string()],
        };
    }

    let ai = accrued_interest::accrued_interest(&bond, settle);
    let dirty = req.market_price + ai;

    let ytm = match ytm_solver::solve_ytm(&bond, req.market_price, settle) {
        Ok(y) => Some(y),
        Err(e) => {
            errors.push(format!("YTM solver: {}", e));
            None
        }
    };

    for measure in &req.measures {
        match measure {
            Measure::DirectedQuantity => {
                results.push((*measure, req.quantity));
            }
            Measure::MarketValue => {
                let mv = market_value::market_value(req.market_price, req.quantity);
                results.push((*measure, mv));
            }
            Measure::UnadjustedCostBasis => {
                if let Some(cb) = req.cost_basis {
                    results.push((*measure, cb));
                }
            }
            Measure::AccruedInterest => {
                results.push((*measure, ai));
            }
            Measure::CleanPrice => {
                results.push((*measure, req.market_price));
            }
            Measure::DirtyPrice => {
                results.push((*measure, dirty));
            }
            Measure::CurrentYield => {
                let cy = current_yield::current_yield(&bond, req.market_price);
                results.push((*measure, cy));
            }
            Measure::YieldToMaturity => {
                if let Some(y) = ytm {
                    results.push((*measure, y));
                }
            }
            Measure::PresentValue => {
                if let Some(y) = ytm {
                    let pv = pricing::dirty_price_from_yield(&bond, y, settle);
                    results.push((*measure, pv));
                }
            }
            Measure::MacaulayDuration => {
                if let Some(y) = ytm {
                    let dur = duration::macaulay_duration(&bond, y, settle);
                    results.push((*measure, dur));
                }
            }
            Measure::ModifiedDuration => {
                if let Some(y) = ytm {
                    let dur = duration::modified_duration(&bond, y, settle);
                    results.push((*measure, dur));
                }
            }
            Measure::Convexity => {
                if let Some(y) = ytm {
                    let conv = convexity::convexity(&bond, y, settle);
                    results.push((*measure, conv));
                }
            }
            Measure::Dv01 => {
                if let Some(y) = ytm {
                    let d = dv01::dv01(&bond, y, settle);
                    results.push((*measure, d));
                }
            }
            Measure::ProfitLoss => {
                if let Some(cb) = req.cost_basis {
                    let mv = market_value::market_value(req.market_price, req.quantity);
                    let pl = market_value::profit_loss(mv, cb, req.quantity);
                    results.push((*measure, pl));
                }
            }
            Measure::ProfitLossPercent => {
                if let Some(cb) = req.cost_basis {
                    let mv = market_value::market_value(req.market_price, req.quantity);
                    let pl = market_value::profit_loss(mv, cb, req.quantity);
                    let cost_mv = cb / 100.0 * req.quantity;
                    if cost_mv != 0.0 {
                        results.push((*measure, pl / cost_mv));
                    }
                }
            }
            Measure::PresentValueCashflows => {
                if let Some(y) = ytm {
                    let cfs = cashflows::generate(&bond, settle);
                    let freq = bond.coupon_freq as f64;
                    let r = 1.0 + y / freq;
                    for cf in &cfs {
                        let pv = cf.amount / r.powf(cf.period_fraction);
                        cf_results.push(CashflowResult {
                            date: cf.date,
                            fv_amount: cf.amount,
                            pv_amount: pv,
                            coupon_rate: bond.coupon_rate * 100.0,
                        });
                    }
                }
            }
        }
    }

    ValuationResponse {
        results,
        cashflows: cf_results,
        errors,
    }
}

impl ValuationResponse {
    pub fn get(&self, measure: Measure) -> Option<f64> {
        self.results.iter()
            .find(|(m, _)| *m == measure)
            .map(|(_, v)| *v)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn ust_request(coupon: f64, maturity: Date, price: f64, settle: Date, measures: Vec<Measure>) -> ValuationRequest {
        ValuationRequest {
            security: SecurityInput {
                coupon_rate: coupon,
                coupon_freq: 2,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: d(2025, 5, 15),
                maturity_date: maturity,
            },
            market_price: price,
            quantity: 10_000.0,
            cost_basis: Some(99.0),
            settlement: settle,
            measures,
        }
    }

    #[test]
    fn full_valuation_par_bond() {
        let req = ust_request(0.05, d(2035, 5, 15), 100.0, d(2025, 5, 15), vec![
            Measure::YieldToMaturity,
            Measure::MacaulayDuration,
            Measure::ModifiedDuration,
            Measure::Convexity,
            Measure::Dv01,
            Measure::AccruedInterest,
            Measure::CleanPrice,
            Measure::DirtyPrice,
            Measure::MarketValue,
            Measure::CurrentYield,
            Measure::PresentValue,
        ]);

        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let ytm = resp.get(Measure::YieldToMaturity).unwrap();
        assert!((ytm - 0.05).abs() < 1e-10, "ytm={}", ytm);

        let ai = resp.get(Measure::AccruedInterest).unwrap();
        assert!(ai.abs() < 1e-15, "AI on coupon date={}", ai);

        let cp = resp.get(Measure::CleanPrice).unwrap();
        let dp = resp.get(Measure::DirtyPrice).unwrap();
        assert!((cp - dp).abs() < 1e-10);

        let pv = resp.get(Measure::PresentValue).unwrap();
        assert!((pv - 100.0).abs() < 1e-8, "PV={}", pv);

        let mv = resp.get(Measure::MarketValue).unwrap();
        assert!((mv - 10_000.0).abs() < 1e-8, "MV={}", mv);

        let dur = resp.get(Measure::MacaulayDuration).unwrap();
        assert!(dur > 7.0 && dur < 9.0, "dur={}", dur);

        let dv = resp.get(Measure::Dv01).unwrap();
        assert!(dv > 0.0, "DV01={}", dv);
    }

    #[test]
    fn full_valuation_between_coupon_dates() {
        let req = ust_request(0.05, d(2035, 5, 15), 97.5, d(2025, 8, 20), vec![
            Measure::YieldToMaturity,
            Measure::AccruedInterest,
            Measure::CleanPrice,
            Measure::DirtyPrice,
            Measure::PresentValue,
        ]);

        let resp = valuate(&req);
        assert!(resp.errors.is_empty());

        let ai = resp.get(Measure::AccruedInterest).unwrap();
        assert!(ai > 1.0 && ai < 2.0, "AI between dates={}", ai);

        let cp = resp.get(Measure::CleanPrice).unwrap();
        let dp = resp.get(Measure::DirtyPrice).unwrap();
        assert!((dp - cp - ai).abs() < 1e-10);

        let pv = resp.get(Measure::PresentValue).unwrap();
        assert!((pv - dp).abs() < 1e-8, "PV={} should equal dirty={}", pv, dp);
    }

    #[test]
    fn cashflow_schedule() {
        let req = ust_request(0.05, d(2027, 5, 15), 100.0, d(2025, 5, 15), vec![
            Measure::PresentValueCashflows,
        ]);

        let resp = valuate(&req);
        assert!(resp.errors.is_empty());
        assert_eq!(resp.cashflows.len(), 4, "2Y bond should have 4 cashflows");

        for cf in &resp.cashflows[..3] {
            assert!((cf.fv_amount - 2.5).abs() < 1e-10);
            assert!(cf.pv_amount < cf.fv_amount);
            assert!((cf.coupon_rate - 5.0).abs() < 1e-10);
        }

        let last = &resp.cashflows[3];
        assert!((last.fv_amount - 102.5).abs() < 1e-10);

        let sum_pv: f64 = resp.cashflows.iter().map(|cf| cf.pv_amount).sum();
        assert!((sum_pv - 100.0).abs() < 1e-8, "sum_pv={}", sum_pv);
    }

    #[test]
    fn profit_loss() {
        let req = ust_request(0.05, d(2035, 5, 15), 101.0, d(2025, 5, 15), vec![
            Measure::MarketValue,
            Measure::ProfitLoss,
            Measure::ProfitLossPercent,
        ]);

        let resp = valuate(&req);
        let mv = resp.get(Measure::MarketValue).unwrap();
        let pl = resp.get(Measure::ProfitLoss).unwrap();
        let pl_pct = resp.get(Measure::ProfitLossPercent).unwrap();

        assert!((mv - 10_100.0).abs() < 1e-8);
        // cost_basis=99, qty=10000 → cost MV = 9900, market MV = 10100, PL = 200
        assert!((pl - 200.0).abs() < 1e-8, "PL={}", pl);
        assert!((pl_pct - 200.0 / 9900.0).abs() < 1e-10, "PL%={}", pl_pct);
    }

    #[test]
    fn matured_bond_returns_error() {
        let req = ust_request(0.05, d(2025, 5, 15), 100.0, d(2025, 6, 1), vec![
            Measure::YieldToMaturity,
        ]);
        let resp = valuate(&req);
        assert!(!resp.errors.is_empty());
    }

    #[test]
    fn three_way_invariant_via_calculator() {
        let req = ust_request(0.05, d(2035, 5, 15), 95.0, d(2025, 5, 15), vec![
            Measure::PresentValue,
            Measure::DirtyPrice,
            Measure::PresentValueCashflows,
        ]);

        let resp = valuate(&req);
        let pv = resp.get(Measure::PresentValue).unwrap();
        let dp = resp.get(Measure::DirtyPrice).unwrap();
        let sum_cf_pv: f64 = resp.cashflows.iter().map(|cf| cf.pv_amount).sum();

        assert!((pv - dp).abs() < 1e-8, "PV={} vs dirty={}", pv, dp);
        assert!((sum_cf_pv - dp).abs() < 1e-8, "sum_cf_pv={} vs dirty={}", sum_cf_pv, dp);
    }

    // ── Euro bond (annual coupon) tests ─────────────────────────────

    fn euro_request(coupon: f64, maturity: Date, price: f64, settle: Date, measures: Vec<Measure>) -> ValuationRequest {
        ValuationRequest {
            security: SecurityInput {
                coupon_rate: coupon,
                coupon_freq: 1,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: d(2025, 2, 15),
                maturity_date: maturity,
            },
            market_price: price,
            quantity: 1_000_000.0,
            cost_basis: Some(98.0),
            settlement: settle,
            measures,
        }
    }

    #[test]
    fn euro_full_valuation_par_bund() {
        let req = euro_request(0.025, d(2035, 2, 15), 100.0, d(2025, 2, 15), vec![
            Measure::YieldToMaturity,
            Measure::MacaulayDuration,
            Measure::ModifiedDuration,
            Measure::Convexity,
            Measure::Dv01,
            Measure::AccruedInterest,
            Measure::CleanPrice,
            Measure::DirtyPrice,
            Measure::MarketValue,
            Measure::CurrentYield,
            Measure::PresentValue,
        ]);

        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let ytm = resp.get(Measure::YieldToMaturity).unwrap();
        assert!((ytm - 0.025).abs() < 1e-10, "Bund par YTM={}", ytm);

        let ai = resp.get(Measure::AccruedInterest).unwrap();
        assert!(ai.abs() < 1e-15, "Bund AI on coupon date={}", ai);

        let dur = resp.get(Measure::MacaulayDuration).unwrap();
        assert!(dur > 8.0 && dur < 10.0, "Bund 10Y duration={}", dur);

        let mv = resp.get(Measure::MarketValue).unwrap();
        assert!((mv - 1_000_000.0).abs() < 1e-6, "Bund MV={}", mv);
    }

    #[test]
    fn euro_cashflow_schedule_annual() {
        let req = euro_request(0.03, d(2028, 2, 15), 100.0, d(2025, 2, 15), vec![
            Measure::PresentValueCashflows,
        ]);

        let resp = valuate(&req);
        assert!(resp.errors.is_empty());
        assert_eq!(resp.cashflows.len(), 3, "3Y annual bond = 3 cashflows");

        assert!((resp.cashflows[0].fv_amount - 3.0).abs() < 1e-10);
        assert!((resp.cashflows[1].fv_amount - 3.0).abs() < 1e-10);
        assert!((resp.cashflows[2].fv_amount - 103.0).abs() < 1e-10);

        let sum_pv: f64 = resp.cashflows.iter().map(|cf| cf.pv_amount).sum();
        assert!((sum_pv - 100.0).abs() < 1e-8, "sum_pv={}", sum_pv);
    }

    #[test]
    fn euro_three_way_invariant() {
        let req = euro_request(0.025, d(2035, 2, 15), 95.0, d(2025, 2, 15), vec![
            Measure::PresentValue,
            Measure::DirtyPrice,
            Measure::PresentValueCashflows,
        ]);

        let resp = valuate(&req);
        let pv = resp.get(Measure::PresentValue).unwrap();
        let dp = resp.get(Measure::DirtyPrice).unwrap();
        let sum_cf_pv: f64 = resp.cashflows.iter().map(|cf| cf.pv_amount).sum();

        assert!((pv - dp).abs() < 1e-8);
        assert!((sum_cf_pv - dp).abs() < 1e-8);
    }

    #[test]
    fn euro_between_coupon_dates() {
        let req = ValuationRequest {
            security: SecurityInput {
                coupon_rate: 0.025,
                coupon_freq: 1,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: d(2024, 7, 4),
                maturity_date: d(2034, 7, 4),
            },
            market_price: 96.0,
            quantity: 500_000.0,
            cost_basis: None,
            settlement: d(2025, 3, 15),
            measures: vec![
                Measure::YieldToMaturity,
                Measure::AccruedInterest,
                Measure::DirtyPrice,
                Measure::MacaulayDuration,
                Measure::Dv01,
            ],
        };

        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let ai = resp.get(Measure::AccruedInterest).unwrap();
        assert!(ai > 1.0 && ai < 2.5, "Euro mid-period AI={}", ai);

        let ytm = resp.get(Measure::YieldToMaturity).unwrap();
        assert!(ytm > 0.025, "Euro discount YTM={} should > coupon", ytm);

        let dv = resp.get(Measure::Dv01).unwrap();
        assert!(dv > 0.0, "Euro DV01={}", dv);
    }

    #[test]
    fn euro_profit_loss() {
        let req = euro_request(0.025, d(2035, 2, 15), 102.0, d(2025, 2, 15), vec![
            Measure::MarketValue,
            Measure::ProfitLoss,
        ]);

        let resp = valuate(&req);
        let mv = resp.get(Measure::MarketValue).unwrap();
        let pl = resp.get(Measure::ProfitLoss).unwrap();

        // price=102, qty=1M → MV=1,020,000. cost=98, → cost_MV=980,000. PL=40,000
        assert!((mv - 1_020_000.0).abs() < 1e-6);
        assert!((pl - 40_000.0).abs() < 1e-6, "Euro PL={}", pl);
    }
}
