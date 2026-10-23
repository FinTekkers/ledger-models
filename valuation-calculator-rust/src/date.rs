#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Date {
    pub year: i32,
    pub month: u32,
    pub day: u32,
}

impl Date {
    pub fn new(year: i32, month: u32, day: u32) -> Self {
        debug_assert!(month >= 1 && month <= 12);
        debug_assert!(day >= 1 && day <= days_in_month(year, month));
        Date { year, month, day }
    }

    pub fn days_since(&self, other: &Date) -> i32 {
        to_jdn(self) - to_jdn(other)
    }
}

pub fn is_leap_year(year: i32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

pub fn days_in_month(year: i32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => if is_leap_year(year) { 29 } else { 28 },
        _ => panic!("invalid month: {}", month),
    }
}

pub fn is_end_of_month(d: &Date) -> bool {
    d.day == days_in_month(d.year, d.month)
}

pub fn add_months(d: &Date, months: i32) -> Date {
    let total_months = (d.year * 12 + d.month as i32 - 1) + months;
    let year = total_months.div_euclid(12);
    let month = (total_months.rem_euclid(12) + 1) as u32;
    let max_day = days_in_month(year, month);
    let day = d.day.min(max_day);
    Date { year, month, day }
}

fn to_jdn(d: &Date) -> i32 {
    let a = (14 - d.month as i32) / 12;
    let y = d.year + 4800 - a;
    let m = d.month as i32 + 12 * a - 3;
    d.day as i32 + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045
}

impl std::fmt::Display for Date {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:04}-{:02}-{:02}", self.year, self.month, self.day)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn days_between() {
        let d1 = Date::new(2025, 5, 15);
        let d2 = Date::new(2025, 11, 15);
        assert_eq!(d2.days_since(&d1), 184);
    }

    #[test]
    fn days_between_with_leap() {
        let d1 = Date::new(2024, 2, 28);
        let d2 = Date::new(2024, 3, 1);
        assert_eq!(d2.days_since(&d1), 2); // Feb 29 exists in 2024
    }

    #[test]
    fn add_months_normal() {
        let d = Date::new(2025, 5, 15);
        let result = add_months(&d, -6);
        assert_eq!(result, Date::new(2024, 11, 15));
    }

    #[test]
    fn add_months_end_of_month() {
        let d = Date::new(2025, 8, 31);
        let result = add_months(&d, -6);
        assert_eq!(result, Date::new(2025, 2, 28));
    }

    #[test]
    fn add_months_leap_year() {
        let d = Date::new(2024, 8, 31);
        let result = add_months(&d, -6);
        assert_eq!(result, Date::new(2024, 2, 29));
    }

    #[test]
    fn leap_year_check() {
        assert!(is_leap_year(2024));
        assert!(!is_leap_year(2025));
        assert!(is_leap_year(2000));
        assert!(!is_leap_year(1900));
    }

    #[test]
    fn ordering() {
        assert!(Date::new(2025, 5, 15) < Date::new(2025, 11, 15));
        assert!(Date::new(2025, 5, 15) == Date::new(2025, 5, 15));
    }
}
