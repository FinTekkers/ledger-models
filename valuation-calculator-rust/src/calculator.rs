use crate::bond::*;
use crate::curve::YieldCurve;
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
    ZSpread,
    SpreadDuration,
    SpreadDv01,
}

/// Pricing mode for valuation requests.
#[derive(Debug, Clone)]
pub enum PricingMode {
    /// Outright clean price (Treasuries, HY corporates)
    Price(f64),
    /// Z-spread over a benchmark curve (IG corporates)
    SpreadToBenchmark { spread: f64, curve: YieldCurve },
}

#[derive(Debug, Clone)]
pub struct ValuationRequest {
    pub security: SecurityInput,
    pub market_price: f64,
    pub quantity: f64,
    pub cost_basis: Option<f64>,
    pub settlement: Date,
    pub measures: Vec<Measure>,
    pub benchmark_curve: Option<YieldCurve>,
    /// Optional pricing mode. If `Some(SpreadToBenchmark { .. })`, the clean
    /// price is derived from the spread and the market_price field is ignored.
    /// If `None`, `market_price` is used directly (backward compatible).
    pub pricing_mode: Option<PricingMode>,
}

#[derive(Debug, Clone)]
pub struct SecurityInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub coupon_type: CouponType,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    /// Day count convention. Defaults to `ActualActualICMA` for Treasuries.
    /// Corporate bonds typically use `Thirty360US`.
    pub day_count: Option<DayCountConvention>,
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
            day_count: self.day_count.unwrap_or(DayCountConvention::ActualActualICMA),
            ex_dividend_days: 0,
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

    // Resolve effective clean price and benchmark info from pricing mode
    let (market_price, benchmark_info): (f64, Option<(&YieldCurve, f64)>) = match &req.pricing_mode {
        Some(PricingMode::SpreadToBenchmark { spread: s, curve }) => {
            let (clean, _dirty) = spread::price_from_spread(&bond, settle, curve, *s);
            (clean, Some((curve, *s)))
        }
        _ => {
            // Use market_price directly; benchmark curve (if any) has z=0 for ZSpread solving
            let bench = req.benchmark_curve.as_ref().map(|c| (c, 0.0_f64));
            (req.market_price, bench)
        }
    };

    let ai = accrued_interest::accrued_interest(&bond, settle);
    let dirty = market_price + ai;

    let ytm = match ytm_solver::solve_ytm(&bond, market_price, settle) {
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
                let mv = market_value::market_value(market_price, req.quantity);
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
                results.push((*measure, market_price));
            }
            Measure::DirtyPrice => {
                results.push((*measure, dirty));
            }
            Measure::CurrentYield => {
                let cy = current_yield::current_yield(&bond, market_price);
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
                    let mv = market_value::market_value(market_price, req.quantity);
                    let pl = market_value::profit_loss(mv, cb, req.quantity);
                    results.push((*measure, pl));
                }
            }
            Measure::ProfitLossPercent => {
                if let Some(cb) = req.cost_basis {
                    let mv = market_value::market_value(market_price, req.quantity);
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
            Measure::ZSpread => {
                // If we already have benchmark info from SpreadToBenchmark mode,
                // use that spread directly. Otherwise, solve from the curve.
                if let Some((curve, z)) = &benchmark_info {
                    if *z != 0.0 {
                        // Spread was provided via PricingMode::SpreadToBenchmark
                        results.push((*measure, *z));
                    } else {
                        // benchmark_curve was provided but no spread — solve for it
                        match zspread::solve_zspread(&bond, market_price, settle, curve) {
                            Ok(z_solved) => results.push((*measure, z_solved)),
                            Err(e) => errors.push(format!("Z-spread solver: {}", e)),
                        }
                    }
                } else if let Some(ref curve) = req.benchmark_curve {
                    match zspread::solve_zspread(&bond, market_price, settle, curve) {
                        Ok(z) => results.push((*measure, z)),
                        Err(e) => errors.push(format!("Z-spread solver: {}", e)),
                    }
                } else {
                    errors.push("Z-spread requires a benchmark curve".to_string());
                }
            }
            Measure::SpreadDuration => {
                if let Some((curve, z)) = &benchmark_info {
                    let sd = spread::spread_duration(&bond, settle, curve, *z);
                    results.push((*measure, sd));
                } else {
                    errors.push("SpreadDuration requires a benchmark curve".to_string());
                }
            }
            Measure::SpreadDv01 => {
                if let Some((curve, z)) = &benchmark_info {
                    let sd = spread::spread_dv01(&bond, settle, curve, *z);
                    results.push((*measure, sd));
                } else {
                    errors.push("SpreadDv01 requires a benchmark curve".to_string());
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
                day_count: None,
            },
            market_price: price,
            quantity: 10_000.0,
            cost_basis: Some(99.0),
            settlement: settle,
            measures,
            benchmark_curve: None,
            pricing_mode: None,
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
                day_count: None,
            },
            market_price: price,
            quantity: 1_000_000.0,
            cost_basis: Some(98.0),
            settlement: settle,
            measures,
            benchmark_curve: None,
            pricing_mode: None,
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
                day_count: None,
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
            benchmark_curve: None,
            pricing_mode: None,
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

    // ── Investment Grade corporate bond tests ───────────────────

    fn treasury_curve() -> crate::curve::YieldCurve {
        crate::curve::YieldCurve::new(
            d(2025, 4, 15),
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![0.035, 0.038, 0.040, 0.042, 0.043, 0.044],
        )
        .unwrap()
    }

    fn ig_corporate_request() -> ValuationRequest {
        // 5% semiannual corporate, 30/360 US, 10Y
        ValuationRequest {
            security: SecurityInput {
                coupon_rate: 0.05,
                coupon_freq: 2,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: d(2025, 4, 15),
                maturity_date: d(2035, 4, 15),
                day_count: Some(DayCountConvention::Thirty360US),
            },
            market_price: 0.0, // will be derived from spread
            quantity: 1_000_000.0,
            cost_basis: Some(99.0),
            settlement: d(2025, 4, 15),
            pricing_mode: Some(PricingMode::SpreadToBenchmark {
                spread: 0.015, // 150bps over Treasuries
                curve: treasury_curve(),
            }),
            benchmark_curve: None,
            measures: vec![
                Measure::CleanPrice,
                Measure::DirtyPrice,
                Measure::YieldToMaturity,
                Measure::SpreadDuration,
                Measure::SpreadDv01,
                Measure::MarketValue,
                Measure::ZSpread,
            ],
        }
    }

    #[test]
    fn ig_corporate_spread_duration_positive() {
        let req = ig_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let sd = resp.get(Measure::SpreadDuration).unwrap();
        assert!(sd > 0.0, "IG spread duration should be positive, got {}", sd);
    }

    #[test]
    fn ig_corporate_clean_price_derived() {
        let req = ig_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let cp = resp.get(Measure::CleanPrice).unwrap();
        assert!(cp > 50.0 && cp < 150.0,
            "IG clean price should be reasonable, got {}", cp);
        // Price should not be 0 (the market_price field value)
        assert!(cp.abs() > 1e-6, "IG clean price should not be zero");
    }

    #[test]
    fn ig_corporate_zspread_equals_input_spread() {
        let req = ig_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let zs = resp.get(Measure::ZSpread).unwrap();
        assert!((zs - 0.015).abs() < 1e-8,
            "ZSpread should match input spread 150bps, got {}", zs);
    }

    #[test]
    fn ig_corporate_ytm_above_treasury_yield() {
        let req = ig_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let ytm = resp.get(Measure::YieldToMaturity).unwrap();
        // 10Y Treasury zero rate is ~4.3%, so YTM should be above that
        assert!(ytm > 0.043, "IG YTM ({}) should be above Treasury yield", ytm);
    }

    #[test]
    fn ig_corporate_spread_dv01_positive() {
        let req = ig_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let sdv01 = resp.get(Measure::SpreadDv01).unwrap();
        assert!(sdv01 > 0.0, "IG spread DV01 should be positive, got {}", sdv01);
    }

    #[test]
    fn ig_corporate_price_from_spread_round_trip() {
        // Verify that price_from_spread -> solve_zspread gives back the original spread
        let curve = treasury_curve();
        let settle = d(2025, 4, 15);
        let bond = crate::bond::BondSpec {
            coupon_rate: 0.05,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: d(2025, 4, 15),
            maturity_date: d(2035, 4, 15),
            day_count: DayCountConvention::Thirty360US,
            ex_dividend_days: 0,
        };

        let input_spread = 0.015;
        let (clean, _dirty) = crate::bond::spread::price_from_spread(&bond, settle, &curve, input_spread);
        let solved = crate::bond::zspread::solve_zspread(&bond, clean, settle, &curve).unwrap();

        assert!((solved - input_spread).abs() < 1e-8,
            "Round-trip: input={}, solved={}", input_spread, solved);
    }

    // ── High Yield corporate bond tests ────────────────────────

    fn hy_corporate_request() -> ValuationRequest {
        // 7% semiannual HY, 30/360 US, 5Y, priced at 92
        ValuationRequest {
            security: SecurityInput {
                coupon_rate: 0.07,
                coupon_freq: 2,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: d(2025, 6, 1),
                maturity_date: d(2030, 6, 1),
                day_count: Some(DayCountConvention::Thirty360US),
            },
            market_price: 92.0,
            quantity: 500_000.0,
            cost_basis: Some(95.0),
            settlement: d(2025, 6, 1),
            pricing_mode: None, // outright price
            benchmark_curve: None,
            measures: vec![
                Measure::YieldToMaturity,
                Measure::MacaulayDuration,
                Measure::ModifiedDuration,
                Measure::Dv01,
                Measure::MarketValue,
                Measure::ProfitLoss,
                Measure::CurrentYield,
            ],
        }
    }

    #[test]
    fn hy_corporate_ytm_above_coupon_rate() {
        let req = hy_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let ytm = resp.get(Measure::YieldToMaturity).unwrap();
        // Priced below par, so YTM should be above coupon rate
        assert!(ytm > 0.07, "HY YTM ({}) should be above coupon rate 7%", ytm);
    }

    #[test]
    fn hy_corporate_duration_reasonable_for_5y() {
        let req = hy_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let mac_dur = resp.get(Measure::MacaulayDuration).unwrap();
        // 5Y bond with 7% coupon, duration should be roughly 4-5 years
        assert!(mac_dur > 3.0 && mac_dur < 5.5,
            "HY 5Y Macaulay duration ({}) should be 3-5.5", mac_dur);

        let mod_dur = resp.get(Measure::ModifiedDuration).unwrap();
        assert!(mod_dur > 0.0 && mod_dur < mac_dur,
            "HY modified duration ({}) should be positive and < Macaulay ({})", mod_dur, mac_dur);
    }

    #[test]
    fn hy_corporate_negative_pl() {
        let req = hy_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let pl = resp.get(Measure::ProfitLoss).unwrap();
        // cost_basis = 95, market = 92, quantity = 500,000
        // PL = (92/100 * 500000) - (95/100 * 500000) = 460000 - 475000 = -15000
        assert!(pl < 0.0, "HY P&L should be negative (cost 95, market 92), got {}", pl);
        assert!((pl - (-15_000.0)).abs() < 1e-6, "HY PL={}, expected=-15000", pl);
    }

    #[test]
    fn hy_corporate_market_value() {
        let req = hy_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let mv = resp.get(Measure::MarketValue).unwrap();
        // price=92, qty=500,000 → MV = 92/100 * 500,000 = 460,000
        assert!((mv - 460_000.0).abs() < 1e-6, "HY MV={}, expected=460000", mv);
    }

    #[test]
    fn hy_corporate_current_yield() {
        let req = hy_corporate_request();
        let resp = valuate(&req);
        assert!(resp.errors.is_empty(), "errors: {:?}", resp.errors);

        let cy = resp.get(Measure::CurrentYield).unwrap();
        // Current yield = annual coupon / clean price = 7.0 / 92.0 ≈ 0.0761
        assert!(cy > 0.07, "HY current yield ({}) should be above coupon rate", cy);
    }

    #[test]
    fn spread_measures_require_benchmark_curve() {
        // Requesting SpreadDuration without a benchmark curve should produce an error
        let req = ValuationRequest {
            security: SecurityInput {
                coupon_rate: 0.05,
                coupon_freq: 2,
                coupon_type: CouponType::Fixed,
                face_value: 100.0,
                dated_date: d(2025, 5, 15),
                maturity_date: d(2035, 5, 15),
                day_count: None,
            },
            market_price: 100.0,
            quantity: 10_000.0,
            cost_basis: None,
            settlement: d(2025, 5, 15),
            measures: vec![Measure::SpreadDuration, Measure::SpreadDv01],
            benchmark_curve: None,
            pricing_mode: None,
        };

        let resp = valuate(&req);
        assert_eq!(resp.errors.len(), 2, "Should have 2 errors for missing curve: {:?}", resp.errors);
        assert!(resp.errors[0].contains("SpreadDuration"));
        assert!(resp.errors[1].contains("SpreadDv01"));
    }
}
