//! A calendar period of years, months and days between two dates.
//!
//! Mirrors Java's `java.time.Period` (and its `Period.between` /
//! `LocalDate.plus(Period)` arithmetic), not the JS `Tenor` class, which also
//! carries a tenor type. `BondSecurity::original_tenor()` stays an ACT/ACT
//! decimal-year count; this type is for calendar terms such as a bill's
//! per-issuance tenor (LM-386, docs/adr/frn_reference_rate_fixings.md).

use chrono::{Datelike, Duration, Months, NaiveDate};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Tenor {
    pub years: i32,
    pub months: i32,
    pub days: i32,
}

impl Tenor {
    /// The period from `start` to `end`, as Java's `Period.between` gives
    /// it: whole months stepped from `start` (clamped to month end), then the
    /// leftover days. `2026-01-31 -> 2026-03-01` is 1 month 1 day.
    pub fn between(start: NaiveDate, end: NaiveDate) -> Tenor {
        let start_month_index = i64::from(start.year()) * 12 + i64::from(start.month0());
        let end_month_index = i64::from(end.year()) * 12 + i64::from(end.month0());
        let mut total_months = end_month_index - start_month_index;
        let mut days = i64::from(end.day()) - i64::from(start.day());
        if total_months > 0 && days < 0 {
            total_months -= 1;
            days = match add_months(start, total_months) {
                Some(stepped) => (end - stepped).num_days(),
                None => days,
            };
        } else if total_months < 0 && days > 0 {
            total_months += 1;
            days -= i64::from(days_in_month(end));
        }
        Tenor {
            years: (total_months / 12) as i32,
            months: (total_months % 12) as i32,
            days: days as i32,
        }
    }

    /// `date` plus this period, as Java's `LocalDate.plus(Period)`: the total
    /// months first (clamped to month end), then the days. None on overflow.
    pub fn add_to(&self, date: NaiveDate) -> Option<NaiveDate> {
        let total_months = i64::from(self.years) * 12 + i64::from(self.months);
        add_months(date, total_months)?.checked_add_signed(Duration::days(i64::from(self.days)))
    }
}

fn add_months(date: NaiveDate, months: i64) -> Option<NaiveDate> {
    let magnitude = Months::new(u32::try_from(months.unsigned_abs()).ok()?);
    if months >= 0 {
        date.checked_add_months(magnitude)
    } else {
        date.checked_sub_months(magnitude)
    }
}

fn days_in_month(date: NaiveDate) -> u32 {
    let first = date.with_day(1).unwrap_or(date);
    match first.checked_add_months(Months::new(1)) {
        Some(next) => (next - first).num_days() as u32,
        None => 31,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(y: i32, m: u32, day: u32) -> NaiveDate {
        NaiveDate::from_ymd_opt(y, m, day).unwrap()
    }

    fn t(years: i32, months: i32, days: i32) -> Tenor {
        Tenor { years, months, days }
    }

    #[test]
    fn between_matches_java_period_between() {
        assert_eq!(Tenor::between(d(2026, 1, 31), d(2026, 3, 1)), t(0, 1, 1));
        assert_eq!(Tenor::between(d(2026, 1, 31), d(2026, 3, 30)), t(0, 1, 30));
        assert_eq!(Tenor::between(d(2026, 8, 31), d(2026, 11, 30)), t(0, 2, 30));
        assert_eq!(Tenor::between(d(2021, 1, 15), d(2023, 7, 20)), t(2, 6, 5));
        // Backward, as Java: Period.between(2026-03-01, 2026-01-31) is P-1M-1D.
        assert_eq!(Tenor::between(d(2026, 3, 1), d(2026, 1, 31)), t(0, -1, -1));
    }

    #[test]
    fn add_to_clamps_to_month_end() {
        assert_eq!(t(0, 1, 0).add_to(d(2026, 1, 31)), Some(d(2026, 2, 28)));
        assert_eq!(t(0, 1, 0).add_to(d(2028, 1, 31)), Some(d(2028, 2, 29)));
        assert_eq!(t(0, 1, 1).add_to(d(2028, 1, 31)), Some(d(2028, 3, 1)));
    }
}
