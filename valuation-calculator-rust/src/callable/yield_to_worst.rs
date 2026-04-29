use crate::date::Date;
use crate::error::BondError;
use super::CallableSpec;

/// Yield to worst: the minimum of YTM and all yield-to-call / yield-to-put values.
///
/// This is the standard yield quoted for callable bonds. It represents the
/// worst-case return for the investor, considering all possible exercise dates.
///
/// For callable bonds trading at a premium, YTW typically equals the
/// yield-to-first-call. For bonds trading at a discount, YTW equals YTM.
pub fn yield_to_worst(
    spec: &CallableSpec,
    market_clean_price: f64,
    settlement: Date,
) -> Result<f64, BondError> {
    let mut worst = f64::MAX;

    // YTM (held to maturity)
    let ytm = crate::bond::ytm_solver::solve_ytm(
        &spec.bond, market_clean_price, settlement,
    )?;
    worst = worst.min(ytm);

    // All future call dates
    for (i, call) in spec.call_schedule.iter().enumerate() {
        if call.date <= settlement {
            continue;
        }
        if let Ok(ytc) = super::yield_to_call::yield_to_call(
            spec, i, market_clean_price, settlement,
        ) {
            worst = worst.min(ytc);
        }
    }

    // All future put dates
    // For puts, the investor would exercise if the put yield is favorable.
    // The yield-to-worst still considers the minimum across all scenarios.
    for (i, put) in spec.put_schedule.iter().enumerate() {
        if put.date <= settlement {
            continue;
        }
        if let Ok(ytp) = super::yield_to_call::yield_to_put(
            spec, i, market_clean_price, settlement,
        ) {
            worst = worst.min(ytp);
        }
    }

    Ok(worst)
}

/// Returns the call date that produces the yield-to-worst.
///
/// Returns `None` if YTM is the worst-case (i.e., no call/put date
/// produces a lower yield than holding to maturity).
pub fn worst_call_date(
    spec: &CallableSpec,
    market_clean_price: f64,
    settlement: Date,
) -> Option<Date> {
    let ytm = match crate::bond::ytm_solver::solve_ytm(
        &spec.bond, market_clean_price, settlement,
    ) {
        Ok(y) => y,
        Err(_) => return None,
    };

    let mut worst_yield = ytm;
    let mut worst_date: Option<Date> = None;

    for (i, call) in spec.call_schedule.iter().enumerate() {
        if call.date <= settlement {
            continue;
        }
        if let Ok(ytc) = super::yield_to_call::yield_to_call(
            spec, i, market_clean_price, settlement,
        ) {
            if ytc < worst_yield {
                worst_yield = ytc;
                worst_date = Some(call.date);
            }
        }
    }

    for (i, put) in spec.put_schedule.iter().enumerate() {
        if put.date <= settlement {
            continue;
        }
        if let Ok(ytp) = super::yield_to_call::yield_to_put(
            spec, i, market_clean_price, settlement,
        ) {
            if ytp < worst_yield {
                worst_yield = ytp;
                worst_date = Some(put.date);
            }
        }
    }

    worst_date
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::{BondSpec, CouponType};
    use crate::callable::{CallDate, PutDate};
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, day: u32) -> Date {
        Date::new(y, m, day)
    }

    fn corporate_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
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

    // ---- Premium bond with declining call schedule: YTW = earliest call ----

    #[test]
    fn premium_bond_ytw_equals_earliest_call() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.08, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                CallDate { date: d(2028, 5, 15), call_price: 105.0 },
                CallDate { date: d(2030, 5, 15), call_price: 103.0 },
                CallDate { date: d(2032, 5, 15), call_price: 101.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 112.0; // premium

        let ytw = yield_to_worst(&spec, market_price, settle).unwrap();
        let ytm = crate::bond::ytm_solver::solve_ytm(
            &spec.bond, market_price, settle,
        ).unwrap();

        // For a premium bond, YTW should be less than YTM
        assert!(
            ytw < ytm,
            "YTW ({}) should be less than YTM ({}) for premium callable bond",
            ytw, ytm
        );

        // YTW should come from one of the call dates
        let worst_date = worst_call_date(&spec, market_price, settle);
        assert!(worst_date.is_some(), "Worst date should exist for premium callable");
    }

    // ---- Discount bond: YTW = YTM ----

    #[test]
    fn discount_bond_ytw_equals_ytm() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.04, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                CallDate { date: d(2028, 5, 15), call_price: 102.0 },
                CallDate { date: d(2030, 5, 15), call_price: 101.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 85.0; // deep discount

        let ytw = yield_to_worst(&spec, market_price, settle).unwrap();
        let ytm = crate::bond::ytm_solver::solve_ytm(
            &spec.bond, market_price, settle,
        ).unwrap();

        // For a discount bond, no call makes it worse, so YTW = YTM
        assert!(
            (ytw - ytm).abs() < 1e-10,
            "YTW ({}) should equal YTM ({}) for discount bond (no call incentive)",
            ytw, ytm
        );

        // worst_call_date should be None
        let worst_date = worst_call_date(&spec, market_price, settle);
        assert!(worst_date.is_none(), "Worst date should be None for discount bond");
    }

    // ---- Multiple call dates: verify all are checked ----

    #[test]
    fn multiple_call_dates_all_checked() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.07, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                CallDate { date: d(2027, 5, 15), call_price: 105.0 },
                CallDate { date: d(2029, 5, 15), call_price: 103.0 },
                CallDate { date: d(2031, 5, 15), call_price: 101.0 },
                CallDate { date: d(2033, 5, 15), call_price: 100.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 108.0;

        let ytw = yield_to_worst(&spec, market_price, settle).unwrap();

        // Check each individual yield-to-call
        for i in 0..spec.call_schedule.len() {
            let ytc = super::super::yield_to_call::yield_to_call(
                &spec, i, market_price, settle,
            ).unwrap();
            assert!(
                ytw <= ytc + 1e-10,
                "YTW ({}) should be <= YTC({}) = {}",
                ytw, i, ytc
            );
        }
    }

    // ---- Bond with both calls and puts ----

    #[test]
    fn bond_with_calls_and_puts() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                CallDate { date: d(2028, 5, 15), call_price: 103.0 },
            ],
            put_schedule: vec![
                PutDate { date: d(2030, 5, 15), put_price: 100.0 },
            ],
        };

        let market_price = 100.0;

        let ytw = yield_to_worst(&spec, market_price, settle).unwrap();
        let ytm = crate::bond::ytm_solver::solve_ytm(
            &spec.bond, market_price, settle,
        ).unwrap();

        // YTW should be <= YTM (it's the minimum across all scenarios)
        assert!(
            ytw <= ytm + 1e-10,
            "YTW ({}) should be <= YTM ({})",
            ytw, ytm
        );
    }

    // ---- Past call dates are ignored ----

    #[test]
    fn past_call_dates_are_ignored() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, d(2020, 5, 15), d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                // Past call dates
                CallDate { date: d(2022, 5, 15), call_price: 105.0 },
                CallDate { date: d(2024, 5, 15), call_price: 103.0 },
                // Future call date
                CallDate { date: d(2028, 5, 15), call_price: 101.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 100.0;

        // Should not error, past dates should be skipped
        let ytw = yield_to_worst(&spec, market_price, settle).unwrap();
        assert!(ytw.is_finite(), "YTW should be finite");
    }

    // ---- Only past call dates means YTW = YTM ----

    #[test]
    fn only_past_calls_ytw_equals_ytm() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, d(2020, 5, 15), d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                CallDate { date: d(2022, 5, 15), call_price: 105.0 },
                CallDate { date: d(2024, 5, 15), call_price: 103.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 100.0;

        let ytw = yield_to_worst(&spec, market_price, settle).unwrap();
        let ytm = crate::bond::ytm_solver::solve_ytm(
            &spec.bond, market_price, settle,
        ).unwrap();

        assert!(
            (ytw - ytm).abs() < 1e-10,
            "With only past calls, YTW ({}) should equal YTM ({})",
            ytw, ytm
        );
    }

    // ---- worst_call_date returns correct date ----

    #[test]
    fn worst_call_date_returns_correct_date() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.08, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                CallDate { date: d(2028, 5, 15), call_price: 105.0 },
                CallDate { date: d(2030, 5, 15), call_price: 102.0 },
                CallDate { date: d(2032, 5, 15), call_price: 100.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 115.0; // high premium

        let worst = worst_call_date(&spec, market_price, settle);
        assert!(worst.is_some());

        // The worst date should be one of the call dates
        let wd = worst.unwrap();
        assert!(
            spec.call_schedule.iter().any(|c| c.date == wd),
            "Worst date {:?} should be in the call schedule",
            wd
        );
    }
}
