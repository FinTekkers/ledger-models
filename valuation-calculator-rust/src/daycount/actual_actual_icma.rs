use crate::date::Date;

pub fn accrual_fraction(start: Date, end: Date, period_start: Date, period_end: Date) -> f64 {
    let accrued_days = end.days_since(&start) as f64;
    let period_days = period_end.days_since(&period_start) as f64;
    if period_days == 0.0 {
        return 0.0;
    }
    accrued_days / period_days
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, d: u32) -> Date { Date::new(y, m, d) }

    #[test]
    fn full_period_equals_one() {
        let start = d(2025, 5, 15);
        let end = d(2025, 11, 15);
        let frac = accrual_fraction(start, end, start, end);
        assert!((frac - 1.0).abs() < 1e-15);
    }

    #[test]
    fn zero_days_accrued() {
        let start = d(2025, 5, 15);
        let period_end = d(2025, 11, 15);
        assert!((accrual_fraction(start, start, start, period_end)).abs() < 1e-15);
    }

    #[test]
    fn half_period() {
        let ps = d(2025, 5, 15);
        let pe = d(2025, 11, 15);
        let mid = d(2025, 8, 15);
        let frac = accrual_fraction(ps, mid, ps, pe);
        assert_eq!(pe.days_since(&ps), 184);
        assert_eq!(mid.days_since(&ps), 92);
        assert!((frac - 92.0 / 184.0).abs() < 1e-15);
    }

    #[test]
    fn example_from_plan() {
        let last = d(2025, 5, 15);
        let settle = d(2025, 8, 20);
        let next = d(2025, 11, 15);
        let frac = accrual_fraction(last, settle, last, next);
        assert_eq!(settle.days_since(&last), 97);
        assert!((frac - 97.0 / 184.0).abs() < 1e-15);
    }

    #[test]
    fn leap_year_period() {
        let ps = d(2024, 11, 15);
        let pe = d(2025, 5, 15);
        let settle = d(2025, 2, 28);
        let frac = accrual_fraction(ps, settle, ps, pe);
        assert_eq!(pe.days_since(&ps), 181);
        let expected = settle.days_since(&ps) as f64 / 181.0;
        assert!((frac - expected).abs() < 1e-15);
    }
}
