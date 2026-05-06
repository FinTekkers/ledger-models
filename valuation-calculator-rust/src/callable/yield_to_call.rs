use crate::bond::BondSpec;
use crate::date::Date;
use crate::error::BondError;
use super::CallableSpec;

/// Yield to call: the yield assuming the bond is called on a specific call date.
///
/// Treats the bond as a shorter instrument maturing on the call date with
/// redemption value equal to the call price. This is computed by creating a
/// temporary `BondSpec` with `maturity_date = call_date` and
/// `face_value = call_price`, then using the standard YTM solver.
pub fn yield_to_call(
    spec: &CallableSpec,
    call_index: usize,
    market_clean_price: f64,
    settlement: Date,
) -> Result<f64, BondError> {
    if call_index >= spec.call_schedule.len() {
        return Err(BondError::InvalidInput(format!(
            "call_index {} out of range (schedule has {} entries)",
            call_index,
            spec.call_schedule.len()
        )));
    }

    let call = &spec.call_schedule[call_index];

    if call.date <= settlement {
        return Err(BondError::InvalidInput(
            "call date must be after settlement".to_string(),
        ));
    }

    // Create a modified bond that matures on the call date with face = call_price.
    // The coupon rate stays the same (applied to the original face value),
    // but the final redemption is call_price instead of face_value.
    let modified = BondSpec {
        maturity_date: call.date,
        face_value: call.call_price,
        ..spec.bond.clone()
    };

    crate::bond::ytm_solver::solve_ytm(&modified, market_clean_price, settlement)
}

/// Yield to put: the yield assuming the bond is put on a specific put date.
///
/// Treats the bond as a shorter instrument maturing on the put date with
/// redemption value equal to the put price.
pub fn yield_to_put(
    spec: &CallableSpec,
    put_index: usize,
    market_clean_price: f64,
    settlement: Date,
) -> Result<f64, BondError> {
    if put_index >= spec.put_schedule.len() {
        return Err(BondError::InvalidInput(format!(
            "put_index {} out of range (schedule has {} entries)",
            put_index,
            spec.put_schedule.len()
        )));
    }

    let put = &spec.put_schedule[put_index];

    if put.date <= settlement {
        return Err(BondError::InvalidInput(
            "put date must be after settlement".to_string(),
        ));
    }

    let modified = BondSpec {
        maturity_date: put.date,
        face_value: put.put_price,
        ..spec.bond.clone()
    };

    crate::bond::ytm_solver::solve_ytm(&modified, market_clean_price, settlement)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bond::CouponType;
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

    // ---- Premium callable: YTC < YTM (issuer likely to call) ----

    #[test]
    fn premium_callable_ytc_less_than_ytm() {
        // A bond trading at a premium (price > par) is likely to be called.
        // YTC should be lower than YTM because the investor gets the call price
        // (which is lower than what they'd receive at maturity if held longer).
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.07, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                super::super::CallDate { date: d(2028, 5, 15), call_price: 103.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 110.0; // premium

        let ytm = crate::bond::ytm_solver::solve_ytm(
            &spec.bond, market_price, settle,
        ).unwrap();

        let ytc = yield_to_call(&spec, 0, market_price, settle).unwrap();

        assert!(
            ytc < ytm,
            "YTC ({}) should be less than YTM ({}) for a premium callable bond",
            ytc, ytm
        );
    }

    // ---- Discount callable: YTC > YTM ----

    #[test]
    fn discount_callable_ytc_greater_than_ytm() {
        // A bond trading at a discount has no call incentive.
        // YTC > YTM because calling early at premium prices
        // on a short horizon amplifies the investor's return.
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.04, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                super::super::CallDate { date: d(2028, 5, 15), call_price: 102.0 },
            ],
            put_schedule: vec![],
        };

        let market_price = 90.0; // discount

        let ytm = crate::bond::ytm_solver::solve_ytm(
            &spec.bond, market_price, settle,
        ).unwrap();

        let ytc = yield_to_call(&spec, 0, market_price, settle).unwrap();

        assert!(
            ytc > ytm,
            "YTC ({}) should be greater than YTM ({}) for a discount callable bond",
            ytc, ytm
        );
    }

    // ---- Call at par (100): standard case ----

    #[test]
    fn call_at_par() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![
                super::super::CallDate { date: d(2030, 5, 15), call_price: 100.0 },
            ],
            put_schedule: vec![],
        };

        // At par price, YTC should equal coupon rate (since the "modified bond"
        // also has face=100 and price=100).
        let ytc = yield_to_call(&spec, 0, 100.0, settle).unwrap();
        assert!(
            (ytc - 0.06).abs() < 1e-6,
            "YTC at par should equal coupon rate, got {}",
            ytc
        );
    }

    // ---- Call at premium (103): verify correct redemption price used ----

    #[test]
    fn call_at_premium_price() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.06, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond: bond.clone(),
            call_schedule: vec![
                super::super::CallDate { date: d(2030, 5, 15), call_price: 103.0 },
            ],
            put_schedule: vec![],
        };

        // If we buy at par (100), the call at 103 means we get 3 extra points
        // over 5 years, so YTC should be above the coupon rate.
        let ytc = yield_to_call(&spec, 0, 100.0, settle).unwrap();
        assert!(
            ytc > 0.06,
            "YTC ({}) should be above coupon rate when call price (103) > market price (100)",
            ytc
        );

        // Compare to call at 100: call at 103 should give higher YTC
        let spec_at_par = CallableSpec {
            bond,
            call_schedule: vec![
                super::super::CallDate { date: d(2030, 5, 15), call_price: 100.0 },
            ],
            put_schedule: vec![],
        };
        let ytc_par = yield_to_call(&spec_at_par, 0, 100.0, settle).unwrap();
        assert!(
            ytc > ytc_par,
            "YTC at call_price=103 ({}) should exceed YTC at call_price=100 ({})",
            ytc, ytc_par
        );
    }

    // ---- Yield to put: basic test ----

    #[test]
    fn yield_to_put_basic() {
        let settle = d(2025, 5, 15);
        let bond = corporate_bond(0.05, settle, d(2035, 5, 15));

        let spec = CallableSpec {
            bond,
            call_schedule: vec![],
            put_schedule: vec![
                super::super::PutDate { date: d(2028, 5, 15), put_price: 100.0 },
            ],
        };

        let ytp = yield_to_put(&spec, 0, 100.0, settle).unwrap();
        // At par with put at par, YTP should equal coupon rate
        assert!(
            (ytp - 0.05).abs() < 1e-6,
            "YTP at par should equal coupon rate, got {}",
            ytp
        );
    }

    // ---- Error cases ----

    #[test]
    fn call_index_out_of_range() {
        let spec = CallableSpec {
            bond: corporate_bond(0.05, d(2025, 5, 15), d(2035, 5, 15)),
            call_schedule: vec![],
            put_schedule: vec![],
        };

        let result = yield_to_call(&spec, 0, 100.0, d(2025, 5, 15));
        assert!(matches!(result, Err(BondError::InvalidInput(_))));
    }

    #[test]
    fn past_call_date_returns_error() {
        let spec = CallableSpec {
            bond: corporate_bond(0.05, d(2020, 5, 15), d(2035, 5, 15)),
            call_schedule: vec![
                super::super::CallDate { date: d(2023, 5, 15), call_price: 102.0 },
            ],
            put_schedule: vec![],
        };

        let result = yield_to_call(&spec, 0, 100.0, d(2025, 5, 15));
        assert!(matches!(result, Err(BondError::InvalidInput(_))));
    }
}
