/// Approach 3: single entry point with oneof dispatch.
/// The GRPC handler calls `dispatch_valuation` which routes to the appropriate module.
///
/// This module defines pure Rust input types for all 15 product variants and
/// a unified `ValuationResult`. It does NOT depend on generated proto types.

use crate::date::Date;
use crate::curve::YieldCurve;
use crate::daycount::DayCountConvention;

// ═══════════════════════════════════════════════════════════════
// Result types
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// Product input enum — matches the proto oneof
// ═══════════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub enum ProductInput {
    Bond(BondInput),
    CallableBond(CallableBondInput),
    Swap(SwapInput),
    Mbs(MbsInput),
    MoneyMarket(MoneyMarketInput),
    Repo(RepoInput),
    Tips(TipsInput),
    Frn(FrnInput),
    Loan(LoanInput),
    Futures(FuturesInput),
    Muni(MuniInput),
    XccySwap(XccySwapInput),
    AmortizingBond(AmortizingBondInput),
    Scenario(ScenarioInput),
    KeyRateDuration(KrdInput),
}

// ═══════════════════════════════════════════════════════════════
// Product-specific input structs
// ═══════════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub struct BondInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub clean_price: f64,
    pub settlement: Date,
    pub day_count: DayCountConvention,
    pub benchmark_curve: Option<YieldCurve>,
    pub z_spread: f64,
}

#[derive(Debug, Clone)]
pub struct CallableBondInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub clean_price: f64,
    pub settlement: Date,
    pub call_schedule: Vec<(Date, f64)>,
    pub put_schedule: Vec<(Date, f64)>,
    pub volatility: f64,
    pub tree_steps: usize,
    pub benchmark_curve: Option<YieldCurve>,
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

#[derive(Debug, Clone)]
pub struct TipsInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub clean_price: f64,
    pub settlement: Date,
    pub base_cpi: f64,
    pub current_cpi: f64,
    pub nominal_yield: Option<f64>,
}

#[derive(Debug, Clone)]
pub struct FrnInput {
    pub coupon_freq: u32,
    pub face_value: f64,
    pub spread: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub clean_price: f64,
    pub settlement: Date,
    pub projection_curve: YieldCurve,
    pub discount_curve: YieldCurve,
}

#[derive(Debug, Clone)]
pub struct LoanInput {
    pub face_value: f64,
    pub spread: f64,
    pub payment_freq: u32,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub market_price: f64,
    pub settlement: Date,
    pub is_amortizing: bool,
    pub amort_entries: Vec<(Date, f64)>,
    pub projection_curve: YieldCurve,
    pub discount_curve: YieldCurve,
}

#[derive(Debug, Clone)]
pub struct FuturesInput {
    pub futures_price: f64,
    pub contract_size: f64,
    pub expiry_date: Date,
    pub delivery_date: Date,
    pub ctd_coupon: f64,
    pub ctd_maturity: Date,
    pub ctd_clean_price: f64,
    pub ctd_settlement: Date,
    pub volatility: f64,
}

#[derive(Debug, Clone)]
pub struct MuniInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub clean_price: f64,
    pub settlement: Date,
    pub federal_rate: f64,
    pub state_rate: f64,
    pub local_rate: f64,
    pub agi_surcharge: f64,
    pub is_in_state: bool,
    pub call_schedule: Vec<(Date, f64)>,
}

#[derive(Debug, Clone)]
pub struct XccySwapInput {
    pub domestic_notional: f64,
    pub foreign_notional: f64,
    pub domestic_fixed_rate: f64,
    pub foreign_fixed_rate: f64,
    pub domestic_freq: u32,
    pub foreign_freq: u32,
    pub start_date: Date,
    pub maturity_date: Date,
    pub spot_fx: f64,
    pub basis_spread: f64,
    pub exchange_notional: bool,
    pub domestic_curve: YieldCurve,
    pub foreign_curve: YieldCurve,
}

#[derive(Debug, Clone)]
pub struct AmortizingBondInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub market_price: f64,
    pub settlement: Date,
    pub schedule_type: String,
    pub pro_rata_fraction: f64,
    pub custom_entries: Vec<(Date, f64)>,
}

#[derive(Debug, Clone)]
pub struct ScenarioInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub settlement: Date,
    pub benchmark_curve: YieldCurve,
    pub z_spread: f64,
    pub scenarios: Vec<(String, f64)>,
}

#[derive(Debug, Clone)]
pub struct KrdInput {
    pub coupon_rate: f64,
    pub coupon_freq: u32,
    pub face_value: f64,
    pub dated_date: Date,
    pub maturity_date: Date,
    pub settlement: Date,
    pub benchmark_curve: YieldCurve,
    pub z_spread: f64,
    pub key_tenors: Vec<f64>,
}

// ═══════════════════════════════════════════════════════════════
// Main dispatch
// ═══════════════════════════════════════════════════════════════

/// Route a `ProductInput` to the appropriate product handler.
pub fn dispatch_valuation(input: &ProductInput, _settlement: Date) -> ValuationResult {
    match input {
        ProductInput::Bond(b) => valuate_bond(b),
        ProductInput::CallableBond(c) => valuate_callable(c),
        ProductInput::Swap(s) => valuate_swap(s),
        ProductInput::Mbs(m) => valuate_mbs(m),
        ProductInput::MoneyMarket(mm) => valuate_money_market(mm),
        ProductInput::Repo(r) => valuate_repo(r),
        ProductInput::Tips(t) => valuate_tips(t),
        ProductInput::Frn(f) => valuate_frn(f),
        ProductInput::Loan(l) => valuate_loan(l),
        ProductInput::Futures(f) => valuate_futures(f),
        ProductInput::Muni(m) => valuate_muni(m),
        ProductInput::XccySwap(x) => valuate_xccy(x),
        ProductInput::AmortizingBond(a) => valuate_amortizing(a),
        ProductInput::Scenario(s) => valuate_scenario(s),
        ProductInput::KeyRateDuration(k) => valuate_krd(k),
    }
}

// ═══════════════════════════════════════════════════════════════
// Product handlers
// ═══════════════════════════════════════════════════════════════

fn valuate_bond(input: &BondInput) -> ValuationResult {
    use crate::bond::*;

    let bond = BondSpec {
        coupon_rate: input.coupon_rate,
        coupon_freq: input.coupon_freq,
        coupon_type: CouponType::Fixed,
        face_value: input.face_value,
        dated_date: input.dated_date,
        maturity_date: input.maturity_date,
        day_count: input.day_count,
        ex_dividend_days: 0,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    let ai = accrued_interest::accrued_interest(&bond, input.settlement);
    measures.push(("AccruedInterest".into(), ai));
    measures.push(("CleanPrice".into(), input.clean_price));
    measures.push(("DirtyPrice".into(), input.clean_price + ai));
    measures.push(("CurrentYield".into(), current_yield::current_yield(&bond, input.clean_price)));
    measures.push(("MarketValue".into(), market_value::market_value(input.clean_price, input.face_value)));

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

        if let Ok(zs) = zspread::solve_zspread(&bond, input.clean_price, input.settlement, curve) {
            measures.push(("ZSpread".into(), zs));
        }
    }

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_callable(input: &CallableBondInput) -> ValuationResult {
    use crate::bond::*;
    use crate::callable::*;

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

    let spec = CallableSpec {
        bond: bond.clone(),
        call_schedule: input.call_schedule.iter()
            .map(|&(date, price)| CallDate { date, call_price: price })
            .collect(),
        put_schedule: input.put_schedule.iter()
            .map(|&(date, price)| PutDate { date, put_price: price })
            .collect(),
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    // Standard bond analytics
    let ai = accrued_interest::accrued_interest(&bond, input.settlement);
    measures.push(("AccruedInterest".into(), ai));
    measures.push(("CleanPrice".into(), input.clean_price));
    measures.push(("DirtyPrice".into(), input.clean_price + ai));

    match ytm_solver::solve_ytm(&bond, input.clean_price, input.settlement) {
        Ok(ytm) => measures.push(("YieldToMaturity".into(), ytm)),
        Err(e) => errors.push(format!("YTM: {}", e)),
    }

    // Yield to worst
    match yield_to_worst::yield_to_worst(&spec, input.clean_price, input.settlement) {
        Ok(ytw) => {
            measures.push(("YieldToWorst".into(), ytw));
            if let Some(wd) = yield_to_worst::worst_call_date(&spec, input.clean_price, input.settlement) {
                // Encode worst date as fractional year for numeric output
                let t = (wd.year as f64) + (wd.month as f64 - 1.0) / 12.0 + (wd.day as f64 - 1.0) / 365.0;
                measures.push(("WorstCallDateYear".into(), t));
            }
        }
        Err(e) => errors.push(format!("YTW: {}", e)),
    }

    // Individual yield-to-call values
    for (i, &(date, _price)) in input.call_schedule.iter().enumerate() {
        if date <= input.settlement { continue; }
        if let Ok(ytc) = yield_to_call::yield_to_call(&spec, i, input.clean_price, input.settlement) {
            measures.push((format!("YieldToCall_{}", i), ytc));
        }
    }

    // OAS if benchmark curve and volatility are provided
    if let Some(ref curve) = input.benchmark_curve {
        if input.volatility > 0.0 && input.tree_steps > 0 {
            match oas::oas_simplified(&spec, input.clean_price, input.settlement, curve, input.volatility, input.tree_steps) {
                Ok(oas_val) => measures.push(("OAS".into(), oas_val)),
                Err(e) => errors.push(format!("OAS: {}", e)),
            }
        }
    }

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_swap(input: &SwapInput) -> ValuationResult {
    use crate::swap::*;

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

fn valuate_tips(input: &TipsInput) -> ValuationResult {
    use crate::bond::{BondSpec, CouponType};
    use crate::tips::*;

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

    let tips = TipsSpec {
        bond,
        base_cpi: input.base_cpi,
        base_cpi_date: input.dated_date,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    let ratio = index_ratio::index_ratio(input.current_cpi, input.base_cpi);
    measures.push(("IndexRatio".into(), ratio));

    let adj_principal = index_ratio::adjusted_principal(input.face_value, input.current_cpi, input.base_cpi);
    measures.push(("AdjustedPrincipal".into(), adj_principal));

    let ai = pricing::tips_accrued_interest(&tips, input.settlement, input.current_cpi);
    measures.push(("AccruedInterest".into(), ai));

    match pricing::solve_real_yield(&tips, input.clean_price, input.settlement, input.current_cpi) {
        Ok(real_yield) => {
            measures.push(("RealYield".into(), real_yield));
            measures.push(("Duration".into(), pricing::tips_duration(&tips, real_yield, input.settlement, input.current_cpi)));

            if let Some(nominal_y) = input.nominal_yield {
                measures.push(("BreakevenInflation".into(), pricing::breakeven_inflation(nominal_y, real_yield)));
                measures.push(("BreakevenInflationExact".into(), pricing::breakeven_inflation_exact(nominal_y, real_yield)));
            }
        }
        Err(e) => errors.push(format!("{}", e)),
    }

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_frn(input: &FrnInput) -> ValuationResult {
    use crate::bond::{BondSpec, CouponType, frn};

    let bond = BondSpec {
        coupon_rate: 0.0,
        coupon_freq: input.coupon_freq,
        coupon_type: CouponType::Floating { spread: input.spread },
        face_value: input.face_value,
        dated_date: input.dated_date,
        maturity_date: input.maturity_date,
        day_count: DayCountConvention::Actual365Fixed,
        ex_dividend_days: 0,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    // Solve for discount margin
    match frn::solve_discount_margin(&bond, input.clean_price, input.settlement, &input.projection_curve, &input.discount_curve) {
        Ok(dm) => {
            measures.push(("DiscountMargin".into(), dm));
            measures.push(("DirtyPrice".into(), frn::frn_dirty_price(&bond, input.settlement, &input.projection_curve, &input.discount_curve, dm)));
        }
        Err(e) => errors.push(format!("{}", e)),
    }

    let cfs = frn::generate_projected_cashflows(&bond, input.settlement, &input.projection_curve);
    measures.push(("ProjectedCashflowCount".into(), cfs.len() as f64));

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_loan(input: &LoanInput) -> ValuationResult {
    use crate::bond::{BondSpec, CouponType, frn};

    // Model a loan as a floating-rate bond with the given spread.
    // For amortizing loans, we approximate using a bullet FRN and adjust WAL.
    let bond = BondSpec {
        coupon_rate: 0.0,
        coupon_freq: input.payment_freq,
        coupon_type: CouponType::Floating { spread: input.spread },
        face_value: input.face_value,
        dated_date: input.dated_date,
        maturity_date: input.maturity_date,
        day_count: DayCountConvention::Actual360,
        ex_dividend_days: 0,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    // Discount margin
    match frn::solve_discount_margin(&bond, input.market_price, input.settlement, &input.projection_curve, &input.discount_curve) {
        Ok(dm) => measures.push(("DiscountMargin".into(), dm)),
        Err(e) => errors.push(format!("{}", e)),
    }

    // Carrying value (dirty price at DM=0)
    let carrying = frn::frn_dirty_price(&bond, input.settlement, &input.projection_curve, &input.discount_curve, 0.0);
    measures.push(("CarryingValue".into(), carrying));

    // WAL: for non-amortizing, WAL = time to maturity; for amortizing, compute from schedule
    let maturity_years = input.maturity_date.days_since(&input.settlement) as f64 / 365.25;
    if input.is_amortizing && !input.amort_entries.is_empty() {
        let mut weighted = 0.0;
        let mut total_principal = 0.0;
        for &(date, fraction) in &input.amort_entries {
            let t = date.days_since(&input.settlement) as f64 / 365.25;
            let principal = input.face_value * fraction;
            weighted += t * principal;
            total_principal += principal;
        }
        if total_principal > 0.0 {
            measures.push(("WAL".into(), weighted / total_principal));
        } else {
            measures.push(("WAL".into(), maturity_years));
        }
    } else {
        measures.push(("WAL".into(), maturity_years));
    }

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_futures(input: &FuturesInput) -> ValuationResult {
    use crate::bond::{BondSpec, CouponType};

    let ctd_bond = BondSpec {
        coupon_rate: input.ctd_coupon,
        coupon_freq: 2,
        coupon_type: CouponType::Fixed,
        face_value: 100.0,
        dated_date: input.ctd_settlement,
        maturity_date: input.ctd_maturity,
        day_count: DayCountConvention::ActualActualICMA,
        ex_dividend_days: 0,
    };

    let mut measures = Vec::new();

    // Conversion factor: approximate as price of CTD at 6% yield / 100
    let cf = crate::bond::pricing::dirty_price_from_yield(&ctd_bond, 0.06, input.delivery_date) / 100.0;
    measures.push(("ConversionFactor".into(), cf));

    // Invoice price: futures price * CF + accrued interest at delivery
    let ai_delivery = crate::bond::accrued_interest::accrued_interest(&ctd_bond, input.delivery_date);
    let invoice = input.futures_price * cf + ai_delivery;
    measures.push(("InvoicePrice".into(), invoice));

    // Basis: CTD clean price - futures price * CF
    let basis = input.ctd_clean_price - input.futures_price * cf;
    measures.push(("Basis".into(), basis));

    // Implied repo rate: (invoice - ctd_dirty) / ctd_dirty * (365 / days)
    let ai_settle = crate::bond::accrued_interest::accrued_interest(&ctd_bond, input.ctd_settlement);
    let ctd_dirty = input.ctd_clean_price + ai_settle;
    let days_to_delivery = input.delivery_date.days_since(&input.ctd_settlement) as f64;
    if days_to_delivery > 0.0 && ctd_dirty > 0.0 {
        let implied_repo = (invoice - ctd_dirty) / ctd_dirty * (365.0 / days_to_delivery);
        measures.push(("ImpliedRepoRate".into(), implied_repo));
    }

    // Convexity adjustment: approximate as -0.5 * vol^2 * t^2
    let t_expiry = input.expiry_date.days_since(&input.ctd_settlement) as f64 / 365.25;
    let conv_adj = -0.5 * input.volatility * input.volatility * t_expiry * t_expiry;
    measures.push(("ConvexityAdjustment".into(), conv_adj));

    ValuationResult { measures, cashflows: vec![], errors: vec![] }
}

fn valuate_muni(input: &MuniInput) -> ValuationResult {
    use crate::bond::*;
    use crate::muni::*;
    use crate::muni::tax_equivalent::*;

    let bond = BondSpec {
        coupon_rate: input.coupon_rate,
        coupon_freq: input.coupon_freq,
        coupon_type: CouponType::Fixed,
        face_value: input.face_value,
        dated_date: input.dated_date,
        maturity_date: input.maturity_date,
        day_count: DayCountConvention::Thirty360US,
        ex_dividend_days: 0,
    };

    let tax_rates = TaxRates {
        federal_rate: input.federal_rate,
        state_rate: input.state_rate,
        local_rate: input.local_rate,
        agi_surcharge: input.agi_surcharge,
        state_deductible: false,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    // Standard bond analytics
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

            // Muni-specific: tax-equivalent yield
            measures.push(("TaxEquivalentYield".into(), tax_equivalent_yield(ytm, &tax_rates, input.is_in_state)));
            measures.push(("AfterTaxYield".into(), after_tax_yield(ytm, &tax_rates)));

            // De minimis check
            let years_to_maturity = input.maturity_date.days_since(&input.settlement) as f64 / 365.25;
            measures.push(("DeMinimisThreshold".into(), de_minimis_threshold(input.face_value, years_to_maturity)));
            measures.push(("IsDeMinimis".into(), if is_de_minimis(input.clean_price, input.face_value, years_to_maturity) { 1.0 } else { 0.0 }));
        }
        Err(e) => errors.push(format!("{}", e)),
    }

    // Yield-to-worst if call schedule present
    if !input.call_schedule.is_empty() {
        let call_dates: Vec<crate::callable::CallDate> = input.call_schedule.iter()
            .map(|&(date, price)| crate::callable::CallDate { date, call_price: price })
            .collect();

        let callable_spec = crate::callable::CallableSpec {
            bond: bond.clone(),
            call_schedule: call_dates,
            put_schedule: vec![],
        };

        match crate::callable::yield_to_worst::yield_to_worst(&callable_spec, input.clean_price, input.settlement) {
            Ok(ytw) => measures.push(("YieldToWorst".into(), ytw)),
            Err(e) => errors.push(format!("YTW: {}", e)),
        }
    }

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_xccy(input: &XccySwapInput) -> ValuationResult {
    use crate::xccy::*;

    let spec = XccySwapSpec {
        domestic_notional: input.domestic_notional,
        foreign_notional: input.foreign_notional,
        domestic_fixed_rate: input.domestic_fixed_rate,
        foreign_fixed_rate: input.foreign_fixed_rate,
        domestic_freq: input.domestic_freq,
        foreign_freq: input.foreign_freq,
        domestic_day_count: DayCountConvention::Thirty360US,
        foreign_day_count: DayCountConvention::Thirty360US,
        start_date: input.start_date,
        maturity_date: input.maturity_date,
        exchange_notional: input.exchange_notional,
        basis_spread: input.basis_spread,
    };

    let mut measures = Vec::new();
    measures.push(("NPV".into(), pricing::xccy_npv(&spec, &input.domestic_curve, &input.foreign_curve, input.spot_fx)));
    measures.push(("BasisSpread".into(), pricing::solve_basis_spread(&spec, &input.domestic_curve, &input.foreign_curve, input.spot_fx)));
    measures.push(("DV01".into(), pricing::xccy_dv01(&spec, &input.domestic_curve, &input.foreign_curve, input.spot_fx)));
    measures.push(("FXDelta".into(), pricing::fx_delta(&spec, &input.domestic_curve, &input.foreign_curve, input.spot_fx)));
    measures.push(("DomesticLegPV".into(), pricing::domestic_leg_pv(&spec, &input.domestic_curve)));
    measures.push(("ForeignLegPV".into(), pricing::foreign_leg_pv(&spec, &input.foreign_curve)));

    ValuationResult { measures, cashflows: vec![], errors: vec![] }
}

fn valuate_amortizing(input: &AmortizingBondInput) -> ValuationResult {
    use crate::amortizing::*;

    let schedule = match input.schedule_type.as_str() {
        "level_principal" => SinkingSchedule::LevelPrincipal,
        "level_payment" => SinkingSchedule::LevelPayment,
        "pro_rata" => SinkingSchedule::ProRata(input.pro_rata_fraction),
        "custom" => {
            let entries: Vec<SinkingEntry> = input.custom_entries.iter()
                .map(|&(date, amount)| SinkingEntry { date, principal_amount: amount })
                .collect();
            SinkingSchedule::Custom(entries)
        }
        _ => SinkingSchedule::LevelPrincipal, // default
    };

    let spec = AmortizingBondSpec {
        coupon_rate: input.coupon_rate,
        coupon_freq: input.coupon_freq,
        face_value: input.face_value,
        dated_date: input.dated_date,
        maturity_date: input.maturity_date,
        day_count: DayCountConvention::Thirty360US,
        schedule,
    };

    let mut measures = Vec::new();
    let mut errors = Vec::new();

    measures.push(("Price".into(), pricing::amortizing_price(&spec, input.coupon_rate, input.settlement)));
    measures.push(("WAL".into(), pricing::weighted_average_life(&spec, input.settlement)));

    match pricing::solve_yield(&spec, input.market_price, input.settlement) {
        Ok(y) => {
            measures.push(("Yield".into(), y));
            measures.push(("ModifiedDuration".into(), pricing::modified_duration(&spec, y, input.settlement)));
        }
        Err(e) => errors.push(format!("{}", e)),
    }

    ValuationResult { measures, cashflows: vec![], errors }
}

fn valuate_scenario(input: &ScenarioInput) -> ValuationResult {
    use crate::bond::{BondSpec, CouponType};
    use crate::risk::scenario::*;

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

    let scenarios: Vec<(&str, CurveScenario)> = input.scenarios.iter()
        .map(|(name, shift_bp)| (name.as_str(), CurveScenario::ParallelShift(shift_bp / 10000.0)))
        .collect();

    let results = run_scenarios(&bond, input.settlement, &input.benchmark_curve, input.z_spread, &scenarios);

    let mut measures = Vec::new();

    if let Some(first) = results.first() {
        measures.push(("BasePrice".into(), first.base_price));
    }

    for result in &results {
        measures.push((format!("{}_ShockedPrice", result.name), result.shocked_price));
        measures.push((format!("{}_PnL", result.name), result.pnl));
        measures.push((format!("{}_PnLPct", result.name), result.pnl_pct));
    }

    ValuationResult { measures, cashflows: vec![], errors: vec![] }
}

fn valuate_krd(input: &KrdInput) -> ValuationResult {
    use crate::bond::{BondSpec, CouponType};
    use crate::risk::key_rate;

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

    let result = key_rate::key_rate_durations(
        &bond, input.settlement, &input.benchmark_curve, input.z_spread, &input.key_tenors,
    );

    let parallel = key_rate::parallel_shift_duration(
        &bond, input.settlement, &input.benchmark_curve, input.z_spread,
    );

    let mut measures = Vec::new();

    for (i, &tenor) in result.tenors.iter().enumerate() {
        measures.push((format!("KRD_{:.1}Y", tenor), result.krd[i]));
        measures.push((format!("KRDv01_{:.1}Y", tenor), result.krdv01[i]));
    }

    measures.push(("TotalKRD".into(), result.total_duration));
    measures.push(("TotalKRDv01".into(), result.total_dv01));
    measures.push(("ParallelShiftDuration".into(), parallel));

    ValuationResult { measures, cashflows: vec![], errors: vec![] }
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    fn flat_curve(rate: f64) -> YieldCurve {
        YieldCurve::new(d(2025, 1, 1), vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0], vec![rate; 6]).unwrap()
    }

    fn us_treasury_curve() -> YieldCurve {
        YieldCurve::new(
            d(2025, 5, 15),
            vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
            vec![0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048],
        ).unwrap()
    }

    fn get_measure(result: &ValuationResult, name: &str) -> Option<f64> {
        result.measures.iter().find(|(k, _)| k == name).map(|(_, v)| *v)
    }

    // ── 1. Bond ──

    #[test]
    fn dispatch_bond() {
        let input = ProductInput::Bond(BondInput {
            coupon_rate: 0.05, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2025, 1, 1), maturity_date: d(2035, 1, 1),
            clean_price: 100.0, settlement: d(2025, 1, 1),
            day_count: DayCountConvention::ActualActualICMA,
            benchmark_curve: Some(flat_curve(0.04)), z_spread: 0.0,
        });
        let result = dispatch_valuation(&input, d(2025, 1, 1));
        assert!(result.errors.is_empty(), "errors: {:?}", result.errors);
        let ytm = get_measure(&result, "YieldToMaturity").unwrap();
        assert!((ytm - 0.05).abs() < 1e-6, "YTM={}", ytm);
        assert!(get_measure(&result, "ModifiedDuration").unwrap() > 0.0);
        assert!(get_measure(&result, "DV01").unwrap() > 0.0);
        assert!(get_measure(&result, "SpreadDuration").is_some());
        assert!(get_measure(&result, "ZSpread").is_some());
    }

    // ── 2. Callable Bond ──

    #[test]
    fn dispatch_callable_bond() {
        let input = ProductInput::CallableBond(CallableBondInput {
            coupon_rate: 0.07, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            clean_price: 110.0, settlement: d(2025, 5, 15),
            call_schedule: vec![
                (d(2028, 5, 15), 103.0),
                (d(2030, 5, 15), 101.0),
            ],
            put_schedule: vec![],
            volatility: 0.01, tree_steps: 50,
            benchmark_curve: Some(flat_curve(0.04)),
        });
        let result = dispatch_valuation(&input, d(2025, 5, 15));
        assert!(result.errors.is_empty(), "errors: {:?}", result.errors);
        let ytw = get_measure(&result, "YieldToWorst").unwrap();
        let ytm = get_measure(&result, "YieldToMaturity").unwrap();
        assert!(ytw <= ytm + 1e-8, "YTW ({}) should be <= YTM ({})", ytw, ytm);
        assert!(get_measure(&result, "OAS").is_some());
    }

    // ── 3. Swap ──

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
        let npv = get_measure(&result, "NPV").unwrap();
        assert!(npv.abs() < 1000.0, "NPV should be near zero at par rate, got {}", npv);
        assert!(get_measure(&result, "ParSwapRate").is_some());
        assert!(get_measure(&result, "PV01").is_some());
    }

    // ── 4. MBS ──

    #[test]
    fn dispatch_mbs() {
        let input = ProductInput::Mbs(MbsInput {
            original_balance: 1_000_000.0, current_balance: 950_000.0,
            pass_through_rate: 0.05, wac: 0.055, wam: 348, age: 12,
            market_price: 98.0, psa_speed: 150.0, settlement: d(2025, 6, 1),
        });
        let result = dispatch_valuation(&input, d(2025, 6, 1));
        let wal = get_measure(&result, "WAL").unwrap();
        assert!(wal > 0.0, "WAL should be positive");
        assert!(get_measure(&result, "WALSensitivity").is_some());
    }

    // ── 5. Money Market ──

    #[test]
    fn dispatch_money_market() {
        let input = ProductInput::MoneyMarket(MoneyMarketInput {
            face_value: 100.0, issue_date: d(2025, 1, 1), maturity_date: d(2025, 4, 1),
            market_price: 98.75, settlement: d(2025, 1, 1), is_discount: true,
        });
        let result = dispatch_valuation(&input, d(2025, 1, 1));
        assert!(result.errors.is_empty());
        let dr = get_measure(&result, "DiscountRate").unwrap();
        assert!(dr > 0.0, "Discount rate should be positive");
        assert!(get_measure(&result, "BondEquivalentYield").is_some());
    }

    // ── 6. Repo ──

    #[test]
    fn dispatch_repo() {
        let input = ProductInput::Repo(RepoInput {
            collateral_dirty_price: 101.5, collateral_face: 1_000_000.0,
            haircut: 0.02, repo_rate: 0.05, start_date: d(2025, 1, 1), end_date: d(2025, 2, 1),
        });
        let result = dispatch_valuation(&input, d(2025, 1, 1));
        assert!(result.errors.is_empty());
        let loan = get_measure(&result, "LoanAmount").unwrap();
        assert!(loan > 0.0, "Loan amount should be positive");
        assert!(get_measure(&result, "RepurchasePrice").is_some());
    }

    // ── 7. TIPS ──

    #[test]
    fn dispatch_tips() {
        let input = ProductInput::Tips(TipsInput {
            coupon_rate: 0.02, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            clean_price: 100.0, settlement: d(2025, 5, 15),
            base_cpi: 100.0, current_cpi: 103.0,
            nominal_yield: Some(0.05),
        });
        let result = dispatch_valuation(&input, d(2025, 5, 15));
        assert!(result.errors.is_empty(), "errors: {:?}", result.errors);
        let ratio = get_measure(&result, "IndexRatio").unwrap();
        assert!((ratio - 1.03).abs() < 1e-6, "ratio={}", ratio);
        assert!(get_measure(&result, "RealYield").is_some());
        assert!(get_measure(&result, "BreakevenInflation").is_some());
    }

    // ── 8. FRN ──

    #[test]
    fn dispatch_frn() {
        let ref_date = d(2025, 6, 15);
        let curve = YieldCurve::new(ref_date, vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0], vec![0.04; 6]).unwrap();
        let input = ProductInput::Frn(FrnInput {
            coupon_freq: 4, face_value: 100.0, spread: 0.003,
            dated_date: ref_date, maturity_date: d(2027, 6, 15),
            clean_price: 100.0, settlement: ref_date,
            projection_curve: curve.clone(), discount_curve: curve,
        });
        let result = dispatch_valuation(&input, ref_date);
        assert!(result.errors.is_empty(), "errors: {:?}", result.errors);
        assert!(get_measure(&result, "DiscountMargin").is_some());
        let cf_count = get_measure(&result, "ProjectedCashflowCount").unwrap();
        assert!(cf_count > 0.0, "Should have projected cashflows");
    }

    // ── 9. Loan ──

    #[test]
    fn dispatch_loan() {
        let ref_date = d(2025, 6, 15);
        let curve = YieldCurve::new(ref_date, vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0], vec![0.04; 6]).unwrap();
        let input = ProductInput::Loan(LoanInput {
            face_value: 1_000_000.0, spread: 0.02, payment_freq: 4,
            dated_date: ref_date, maturity_date: d(2030, 6, 15),
            market_price: 99.0, settlement: ref_date,
            is_amortizing: false, amort_entries: vec![],
            projection_curve: curve.clone(), discount_curve: curve,
        });
        let result = dispatch_valuation(&input, ref_date);
        assert!(!result.measures.is_empty(), "Should produce measures");
        let wal = get_measure(&result, "WAL").unwrap();
        assert!(wal > 0.0, "WAL should be positive, got {}", wal);
        assert!(get_measure(&result, "CarryingValue").is_some());
    }

    // ── 10. Futures ──

    #[test]
    fn dispatch_futures() {
        let input = ProductInput::Futures(FuturesInput {
            futures_price: 120.0, contract_size: 100_000.0,
            expiry_date: d(2025, 9, 19), delivery_date: d(2025, 10, 1),
            ctd_coupon: 0.05, ctd_maturity: d(2035, 5, 15),
            ctd_clean_price: 105.0, ctd_settlement: d(2025, 6, 1),
            volatility: 0.01,
        });
        let result = dispatch_valuation(&input, d(2025, 6, 1));
        assert!(result.errors.is_empty());
        let cf = get_measure(&result, "ConversionFactor").unwrap();
        assert!(cf > 0.0, "CF should be positive, got {}", cf);
        assert!(get_measure(&result, "InvoicePrice").is_some());
        assert!(get_measure(&result, "Basis").is_some());
        assert!(get_measure(&result, "ImpliedRepoRate").is_some());
    }

    // ── 11. Muni ──

    #[test]
    fn dispatch_muni() {
        let input = ProductInput::Muni(MuniInput {
            coupon_rate: 0.04, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            clean_price: 100.0, settlement: d(2025, 5, 15),
            federal_rate: 0.37, state_rate: 0.10, local_rate: 0.038,
            agi_surcharge: 0.038, is_in_state: true,
            call_schedule: vec![(d(2030, 5, 15), 100.0)],
        });
        let result = dispatch_valuation(&input, d(2025, 5, 15));
        assert!(result.errors.is_empty(), "errors: {:?}", result.errors);
        let tey = get_measure(&result, "TaxEquivalentYield").unwrap();
        let ytm = get_measure(&result, "YieldToMaturity").unwrap();
        assert!(tey > ytm, "TEY ({}) should exceed YTM ({})", tey, ytm);
        assert!(get_measure(&result, "YieldToWorst").is_some());
    }

    // ── 12. XCCY Swap ──

    #[test]
    fn dispatch_xccy_swap() {
        let ref_date = d(2025, 1, 15);
        let dom_curve = flat_curve(0.04);
        let for_curve = flat_curve(0.03);
        let input = ProductInput::XccySwap(XccySwapInput {
            domestic_notional: 10_000_000.0, foreign_notional: 9_000_000.0,
            domestic_fixed_rate: 0.04, foreign_fixed_rate: 0.03,
            domestic_freq: 2, foreign_freq: 2,
            start_date: ref_date, maturity_date: d(2030, 1, 15),
            spot_fx: 1.10, basis_spread: 0.0, exchange_notional: true,
            domestic_curve: dom_curve, foreign_curve: for_curve,
        });
        let result = dispatch_valuation(&input, ref_date);
        assert!(result.errors.is_empty());
        assert!(get_measure(&result, "NPV").is_some());
        assert!(get_measure(&result, "BasisSpread").is_some());
        assert!(get_measure(&result, "FXDelta").is_some());
    }

    // ── 13. Amortizing Bond ──

    #[test]
    fn dispatch_amortizing_bond() {
        let input = ProductInput::AmortizingBond(AmortizingBondInput {
            coupon_rate: 0.06, coupon_freq: 2, face_value: 1000.0,
            dated_date: d(2025, 1, 15), maturity_date: d(2030, 1, 15),
            market_price: 100.0, settlement: d(2025, 1, 15),
            schedule_type: "level_principal".into(),
            pro_rata_fraction: 0.0, custom_entries: vec![],
        });
        let result = dispatch_valuation(&input, d(2025, 1, 15));
        assert!(result.errors.is_empty(), "errors: {:?}", result.errors);
        let wal = get_measure(&result, "WAL").unwrap();
        assert!(wal > 0.0 && wal < 5.0, "WAL={}", wal);
        assert!(get_measure(&result, "Yield").is_some());
        assert!(get_measure(&result, "ModifiedDuration").is_some());
    }

    // ── 14. Scenario ──

    #[test]
    fn dispatch_scenario() {
        let curve = us_treasury_curve();
        let input = ProductInput::Scenario(ScenarioInput {
            coupon_rate: 0.05, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            settlement: d(2025, 5, 15),
            benchmark_curve: curve, z_spread: 0.0,
            scenarios: vec![
                ("Up100".into(), 100.0),
                ("Down100".into(), -100.0),
            ],
        });
        let result = dispatch_valuation(&input, d(2025, 5, 15));
        assert!(result.errors.is_empty());
        assert!(get_measure(&result, "BasePrice").is_some());
        let up_pnl = get_measure(&result, "Up100_PnL").unwrap();
        let down_pnl = get_measure(&result, "Down100_PnL").unwrap();
        assert!(up_pnl < 0.0, "Rates up => negative PnL, got {}", up_pnl);
        assert!(down_pnl > 0.0, "Rates down => positive PnL, got {}", down_pnl);
    }

    // ── 15. Key Rate Duration ──

    #[test]
    fn dispatch_krd() {
        let curve = us_treasury_curve();
        let input = ProductInput::KeyRateDuration(KrdInput {
            coupon_rate: 0.045, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2025, 5, 15), maturity_date: d(2035, 5, 15),
            settlement: d(2025, 5, 15),
            benchmark_curve: curve, z_spread: 0.0,
            key_tenors: vec![0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0],
        });
        let result = dispatch_valuation(&input, d(2025, 5, 15));
        assert!(result.errors.is_empty());
        let total = get_measure(&result, "TotalKRD").unwrap();
        let parallel = get_measure(&result, "ParallelShiftDuration").unwrap();
        assert!(total > 0.0, "Total KRD should be positive");
        assert!((total - parallel).abs() < 0.1, "Total KRD ({}) should approximate parallel duration ({})", total, parallel);

        // 10Y bond should have max KRD at the 10Y tenor
        let krd_10y = get_measure(&result, "KRD_10.0Y").unwrap();
        assert!(krd_10y > 0.0, "KRD at 10Y should be positive");
    }

    // ── Error path: matured bond ──

    #[test]
    fn dispatch_bond_matured() {
        let input = ProductInput::Bond(BondInput {
            coupon_rate: 0.05, coupon_freq: 2, face_value: 100.0,
            dated_date: d(2020, 1, 1), maturity_date: d(2025, 1, 1),
            clean_price: 100.0, settlement: d(2025, 6, 1),
            day_count: DayCountConvention::ActualActualICMA,
            benchmark_curve: None, z_spread: 0.0,
        });
        let result = dispatch_valuation(&input, d(2025, 6, 1));
        assert!(!result.errors.is_empty(), "Matured bond should produce errors");
    }

    // ── Amortizing loan with entries ──

    #[test]
    fn dispatch_loan_amortizing() {
        let ref_date = d(2025, 6, 15);
        let curve = YieldCurve::new(ref_date, vec![0.25, 0.5, 1.0, 2.0, 5.0, 10.0], vec![0.04; 6]).unwrap();
        let input = ProductInput::Loan(LoanInput {
            face_value: 1_000_000.0, spread: 0.02, payment_freq: 4,
            dated_date: ref_date, maturity_date: d(2030, 6, 15),
            market_price: 99.0, settlement: ref_date,
            is_amortizing: true,
            amort_entries: vec![
                (d(2026, 6, 15), 0.10),
                (d(2027, 6, 15), 0.10),
                (d(2028, 6, 15), 0.10),
                (d(2029, 6, 15), 0.10),
                (d(2030, 6, 15), 0.60),
            ],
            projection_curve: curve.clone(), discount_curve: curve,
        });
        let result = dispatch_valuation(&input, ref_date);
        let wal = get_measure(&result, "WAL").unwrap();
        // With front-loaded amortization, WAL should be less than maturity
        assert!(wal < 5.0, "Amortizing loan WAL should be < 5Y maturity, got {}", wal);
        assert!(wal > 0.0, "WAL should be positive");
    }
}
