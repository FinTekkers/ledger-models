use crate::date::Date;

pub fn accrual_fraction(start: Date, end: Date) -> f64 {
    let days = end.days_since(&start) as f64;
    days / 360.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    #[test]
    fn full_year() {
        // 365 days / 360 > 1.0 (Act/360 always overshoots for a full non-leap year)
        let frac = accrual_fraction(d(2025, 1, 1), d(2026, 1, 1));
        assert!((frac - 365.0 / 360.0).abs() < 1e-15);
        assert!(frac > 1.0);
    }

    #[test]
    fn half_year() {
        let start = d(2025, 1, 15);
        let end = d(2025, 7, 15);
        let days = end.days_since(&start) as f64;
        let frac = accrual_fraction(start, end);
        assert!((frac - days / 360.0).abs() < 1e-15);
    }

    #[test]
    fn zero_days() {
        let frac = accrual_fraction(d(2025, 5, 15), d(2025, 5, 15));
        assert!(frac.abs() < 1e-15);
    }

    #[test]
    fn one_day() {
        let frac = accrual_fraction(d(2025, 5, 15), d(2025, 5, 16));
        assert!((frac - 1.0 / 360.0).abs() < 1e-15);
    }

    #[test]
    fn leap_year() {
        // 2024 is a leap year — 366 days / 360
        let frac = accrual_fraction(d(2024, 1, 1), d(2025, 1, 1));
        assert!((frac - 366.0 / 360.0).abs() < 1e-15);
        assert!(frac > 1.0);
    }
}
