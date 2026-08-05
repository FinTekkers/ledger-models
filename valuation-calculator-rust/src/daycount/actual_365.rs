use crate::date::Date;

pub fn accrual_fraction(start: Date, end: Date) -> f64 {
    let days = end.days_since(&start) as f64;
    days / 365.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> Date { Date::new(y, m, day) }

    #[test]
    fn full_year() {
        let frac = accrual_fraction(d(2025, 1, 1), d(2026, 1, 1));
        assert!((frac - 365.0 / 365.0).abs() < 1e-15);
    }

    #[test]
    fn leap_year_full_year() {
        // 2024 is a leap year — 366 days / 365 > 1.0
        let frac = accrual_fraction(d(2024, 1, 1), d(2025, 1, 1));
        assert!((frac - 366.0 / 365.0).abs() < 1e-15);
        assert!(frac > 1.0);
    }

    #[test]
    fn half_year() {
        let frac = accrual_fraction(d(2025, 1, 15), d(2025, 7, 15));
        let days = d(2025, 7, 15).days_since(&d(2025, 1, 15)) as f64;
        assert!((frac - days / 365.0).abs() < 1e-15);
    }

    #[test]
    fn zero_days() {
        let frac = accrual_fraction(d(2025, 5, 15), d(2025, 5, 15));
        assert!(frac.abs() < 1e-15);
    }

    #[test]
    fn one_day() {
        let frac = accrual_fraction(d(2025, 5, 15), d(2025, 5, 16));
        assert!((frac - 1.0 / 365.0).abs() < 1e-15);
    }
}
