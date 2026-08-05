use crate::date::{Date, add_months, is_end_of_month, days_in_month};
use super::{BondSpec, Cashflow, CouponType};

pub fn generate_coupon_dates(bond: &BondSpec) -> Vec<Date> {
    let months_per_period = 12 / bond.coupon_freq as i32;
    let eom = is_end_of_month(&bond.maturity_date);
    let mut dates = Vec::new();
    let mut date = bond.maturity_date;

    loop {
        dates.push(date);
        date = add_months(&date, -months_per_period);
        if eom {
            let max_day = days_in_month(date.year, date.month);
            date = Date::new(date.year, date.month, max_day);
        }
        if date <= bond.dated_date {
            if date < bond.dated_date {
                dates.push(bond.dated_date);
            } else {
                dates.push(date);
            }
            break;
        }
    }

    dates.reverse();
    dates
}

pub fn prev_and_next_coupon(coupon_dates: &[Date], settlement: Date) -> (Date, Date) {
    for window in coupon_dates.windows(2) {
        let prev = window[0];
        let next = window[1];
        if settlement >= prev && settlement < next {
            return (prev, next);
        }
    }
    let last = *coupon_dates.last().unwrap();
    let second_last = coupon_dates[coupon_dates.len() - 2];
    (second_last, last)
}

pub fn generate(bond: &BondSpec, settlement: Date) -> Vec<Cashflow> {
    let coupon_dates = generate_coupon_dates(bond);
    let (prev_coupon, next_coupon) = prev_and_next_coupon(&coupon_dates, settlement);

    let coupon_payment = match bond.coupon_type {
        CouponType::Fixed => bond.coupon_rate * bond.face_value / bond.coupon_freq as f64,
        CouponType::Zero => 0.0,
    };

    let remaining: Vec<Date> = coupon_dates
        .iter()
        .copied()
        .filter(|&d| d > settlement)
        .collect();

    let w = bond.day_count.accrual_fraction(settlement, next_coupon, prev_coupon, next_coupon);

    remaining
        .iter()
        .enumerate()
        .map(|(i, &date)| {
            let mut amount = coupon_payment;
            if date == bond.maturity_date {
                amount += bond.face_value;
            }
            Cashflow {
                date,
                amount,
                period_fraction: w + i as f64,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::daycount::DayCountConvention;

    fn d(y: i32, m: u32, d: u32) -> Date { Date::new(y, m, d) }

    fn ust_bond(coupon: f64, dated: Date, maturity: Date) -> BondSpec {
        BondSpec {
            coupon_rate: coupon,
            coupon_freq: 2,
            coupon_type: CouponType::Fixed,
            face_value: 100.0,
            dated_date: dated,
            maturity_date: maturity,
            day_count: DayCountConvention::ActualActualICMA,
        }
    }

    #[test]
    fn coupon_dates_2y_note() {
        let bond = ust_bond(0.0425, d(2026, 4, 30), d(2028, 4, 30));
        let dates = generate_coupon_dates(&bond);
        assert_eq!(dates.first(), Some(&d(2026, 4, 30)));
        assert_eq!(dates.last(), Some(&d(2028, 4, 30)));
        assert_eq!(dates.len(), 5);
    }

    #[test]
    fn coupon_dates_end_of_month() {
        let bond = ust_bond(0.05, d(2025, 2, 28), d(2027, 8, 31));
        let dates = generate_coupon_dates(&bond);
        for date in &dates {
            assert!(is_end_of_month(date), "Expected EOM: {}", date);
        }
    }

    #[test]
    fn cashflows_on_coupon_date() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2027, 5, 15));
        let cfs = generate(&bond, d(2025, 5, 15));
        assert_eq!(cfs.len(), 4);
        assert!((cfs[0].amount - 2.5).abs() < 1e-12);
        assert!((cfs[3].amount - 102.5).abs() < 1e-12);
        assert!((cfs[0].period_fraction - 1.0).abs() < 1e-10);
    }

    #[test]
    fn cashflows_between_coupon_dates() {
        let bond = ust_bond(0.05, d(2025, 5, 15), d(2035, 5, 15));
        let cfs = generate(&bond, d(2025, 8, 20));
        assert_eq!(cfs.len(), 20);
        let expected_w = 87.0 / 184.0;
        assert!((cfs[0].period_fraction - expected_w).abs() < 1e-10);
    }

    #[test]
    fn zero_coupon_bond() {
        let bond = BondSpec {
            coupon_rate: 0.0,
            coupon_freq: 2,
            coupon_type: CouponType::Zero,
            face_value: 100.0,
            dated_date: d(2025, 5, 15),
            maturity_date: d(2026, 5, 15),
            day_count: DayCountConvention::ActualActualICMA,
        };
        let cfs = generate(&bond, d(2025, 5, 15));
        let non_zero: Vec<_> = cfs.iter().filter(|cf| cf.amount > 0.0).collect();
        assert_eq!(non_zero.len(), 1);
        assert!((non_zero[0].amount - 100.0).abs() < 1e-12);
    }
}
