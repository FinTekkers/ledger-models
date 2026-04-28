/// Approach 2 dispatch: each product family has its own entry point.
/// The GRPC service layer calls the appropriate function based on the RPC.

use crate::bond::{BondSpec, CouponType};
use crate::curve::YieldCurve;
use crate::date::Date;
use crate::daycount::DayCountConvention;

/// Bond valuation result
#[derive(Debug)]
pub struct BondResult {
    pub measures: Vec<(String, f64)>,
    pub errors: Vec<String>,
}

/// Swap valuation result
#[derive(Debug)]
pub struct SwapResult {
    pub npv: f64,
    pub par_rate: f64,
    pub dv01: f64,
    pub pv01: f64,
    pub fixed_leg_pv: f64,
    pub float_leg_pv: f64,
}

/// MBS valuation result
#[derive(Debug)]
pub struct MbsResult {
    pub price: f64,
    pub yield_rate: f64,
    pub wal: f64,
    pub effective_duration: f64,
}

pub fn valuate_bond(
    bond: &BondSpec,
    clean_price: f64,
    settlement: Date,
    benchmark_curve: Option<&YieldCurve>,
    zspread: f64,
) -> BondResult {
    let mut measures = Vec::new();
    let mut errors = Vec::new();

    match crate::bond::ytm_solver::solve_ytm(bond, clean_price, settlement) {
        Ok(ytm) => {
            measures.push(("YTM".to_string(), ytm));
            let dur = crate::bond::duration::macaulay_duration(bond, ytm, settlement);
            measures.push(("MacaulayDuration".to_string(), dur));
            let mod_dur = crate::bond::duration::modified_duration(bond, ytm, settlement);
            measures.push(("ModifiedDuration".to_string(), mod_dur));
            let conv = crate::bond::convexity::convexity(bond, ytm, settlement);
            measures.push(("Convexity".to_string(), conv));
            let dv = crate::bond::dv01::dv01(bond, ytm, settlement);
            measures.push(("DV01".to_string(), dv));
        }
        Err(e) => errors.push(format!("YTM: {}", e)),
    }

    if let Some(curve) = benchmark_curve {
        let spread_dur = crate::bond::spread::spread_duration(bond, settlement, curve, zspread);
        measures.push(("SpreadDuration".to_string(), spread_dur));
        let spread_dv01 = crate::bond::spread::spread_dv01(bond, settlement, curve, zspread);
        measures.push(("SpreadDV01".to_string(), spread_dv01));
    }

    BondResult { measures, errors }
}

pub fn valuate_swap(
    notional: f64,
    fixed_rate: f64,
    fixed_freq: u32,
    float_freq: u32,
    float_spread: f64,
    start_date: Date,
    maturity_date: Date,
    pay_fixed: bool,
    projection_curve: &YieldCurve,
    discount_curve: &YieldCurve,
) -> SwapResult {
    let spec = crate::swap::SwapSpec {
        notional,
        fixed_rate,
        fixed_freq,
        fixed_day_count: DayCountConvention::Thirty360US,
        float_freq,
        float_day_count: DayCountConvention::Actual360,
        start_date,
        maturity_date,
        float_spread,
    };
    let dir = if pay_fixed {
        crate::swap::SwapDirection::PayFixed
    } else {
        crate::swap::SwapDirection::ReceiveFixed
    };

    SwapResult {
        npv: crate::swap::pricing::swap_npv(&spec, dir, projection_curve, discount_curve),
        par_rate: crate::swap::pricing::par_swap_rate(&spec, projection_curve, discount_curve),
        dv01: crate::swap::pricing::swap_dv01(&spec, dir, projection_curve, discount_curve),
        pv01: crate::swap::pricing::pv01(&spec, discount_curve),
        fixed_leg_pv: crate::swap::pricing::fixed_leg_pv(&spec, discount_curve),
        float_leg_pv: crate::swap::pricing::float_leg_pv(&spec, projection_curve, discount_curve),
    }
}

pub fn valuate_mbs(
    original_balance: f64,
    current_balance: f64,
    pass_through_rate: f64,
    wac: f64,
    wam: u32,
    age: u32,
    market_price: f64,
    psa_speed: f64,
    settlement: Date,
) -> MbsResult {
    let spec = crate::mbs::MbsSpec {
        original_balance,
        current_balance,
        pass_through_rate,
        wac,
        wam,
        age,
        settlement,
        factor: current_balance / original_balance,
    };

    let yield_rate =
        crate::mbs::pricing::solve_mbs_yield(&spec, market_price, psa_speed).unwrap_or(0.0);

    MbsResult {
        price: crate::mbs::pricing::mbs_price(&spec, yield_rate, psa_speed),
        yield_rate,
        wal: crate::mbs::pricing::weighted_average_life(&spec, psa_speed),
        effective_duration: crate::mbs::pricing::effective_duration(&spec, yield_rate, psa_speed),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn flat_curve(rate: f64) -> YieldCurve {
        YieldCurve::new(
            d(2025, 1, 1),
            vec![0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            vec![rate; 6],
        )
        .unwrap()
    }

    #[test]
    fn bond_dispatch() {
        let bond = BondSpec {
            coupon_rate: 0.05,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        };
        let result = valuate_bond(&bond, 100.0, d(2025, 1, 1), None, 0.0);
        assert!(!result.measures.is_empty());
        assert!(result.errors.is_empty());
    }

    #[test]
    fn bond_dispatch_with_curve() {
        let bond = BondSpec {
            coupon_rate: 0.05,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: d(2025, 1, 1),
            maturity_date: d(2035, 1, 1),
            day_count: DayCountConvention::ActualActualICMA,
            ex_dividend_days: 0,
        };
        let curve = flat_curve(0.04);
        let result = valuate_bond(&bond, 100.0, d(2025, 1, 1), Some(&curve), 0.01);
        // Should have YTM measures plus spread measures
        let measure_names: Vec<&str> = result.measures.iter().map(|(n, _)| n.as_str()).collect();
        assert!(measure_names.contains(&"YTM"));
        assert!(measure_names.contains(&"SpreadDuration"));
        assert!(measure_names.contains(&"SpreadDV01"));
    }

    #[test]
    fn swap_dispatch() {
        let curve = flat_curve(0.04);
        let result = valuate_swap(
            1_000_000.0,
            0.04,
            2,
            4,
            0.0,
            d(2025, 1, 1),
            d(2030, 1, 1),
            true,
            &curve,
            &curve,
        );
        assert!(result.npv.abs() < 1000.0); // near par at market rate
        assert!(result.par_rate > 0.0);
    }

    #[test]
    fn mbs_dispatch() {
        let result = valuate_mbs(
            1_000_000.0,
            950_000.0,
            0.05,
            0.055,
            348,
            12,
            98.0,
            150.0,
            d(2025, 6, 1),
        );
        assert!(result.wal > 0.0);
        assert!(result.effective_duration > 0.0);
    }
}
