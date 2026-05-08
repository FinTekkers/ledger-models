use chrono::{DateTime, Datelike, NaiveDate, TimeZone};
use rust_decimal::Decimal;

use crate::fintekkers::models::security::security_proto::ProductDetails;
use crate::fintekkers::models::security::{SecurityProto, SecurityTypeProto};
use crate::fintekkers::models::util::LocalDateProto;
use crate::fintekkers::wrappers::models::security_type::SecurityType;
use crate::fintekkers::wrappers::models::utils::errors::Error;

pub struct BondSecurity {
    pub proto: SecurityProto,
}

impl BondSecurity {
    pub fn from_proto(proto: SecurityProto) -> Result<Self, Error> {
        // Resolve the proto's security_type i32 → SecurityTypeProto →
        // SecurityType wrapper. Bond-flavored security types (Bond, Tips,
        // Frn) all collapse to SecurityType::Bond/Tips/Frn here, which is
        // the membership predicate this wrapper cares about.
        let st_proto = SecurityTypeProto::from_i32(proto.security_type)
            .unwrap_or(SecurityTypeProto::UnknownSecurityType);
        match SecurityType::from_proto(st_proto) {
            SecurityType::Bond | SecurityType::Tips | SecurityType::Frn => {
                Ok(BondSecurity { proto })
            }
            _ => Err(Error::NotABondSecurity),
        }
    }

    pub fn issue_date(&self) -> Result<NaiveDate, Error> {
        bond_dates(&self.proto)
            .0
            .ok_or(Error::MissingIssueDate)
            .and_then(local_date_proto_to_naive)
    }

    pub fn maturity_date(&self) -> Result<NaiveDate, Error> {
        bond_dates(&self.proto)
            .1
            .ok_or(Error::MissingMaturityDate)
            .and_then(local_date_proto_to_naive)
    }

    /// Original tenor in decimal years: `maturity_date - issue_date` under
    /// ACT/ACT (Treasury convention).
    pub fn original_tenor(&self) -> Result<Decimal, Error> {
        let issue = self.issue_date()?;
        let maturity = self.maturity_date()?;
        Ok(act_act_year_fraction(issue, maturity))
    }

    /// Effective tenor in decimal years: `maturity_date - as_of` under ACT/ACT.
    /// Returns 0 if `as_of` is at or after maturity.
    pub fn effective_tenor<Tz: TimeZone>(&self, as_of: DateTime<Tz>) -> Result<Decimal, Error> {
        let maturity = self.maturity_date()?;
        let as_of_date = as_of.naive_utc().date();
        Ok(act_act_year_fraction(as_of_date, maturity))
    }
}

fn bond_dates(proto: &SecurityProto) -> (Option<LocalDateProto>, Option<LocalDateProto>) {
    if let Some(details) = &proto.product_details {
        match details {
            ProductDetails::BondDetails(b) => return (b.issue_date.clone(), b.maturity_date.clone()),
            ProductDetails::TipsDetails(t) => return (t.issue_date.clone(), t.maturity_date.clone()),
            ProductDetails::FrnDetails(f) => return (f.issue_date.clone(), f.maturity_date.clone()),
            _ => {}
        }
    }
    (proto.issue_date.clone(), proto.maturity_date.clone())
}

fn local_date_proto_to_naive(p: LocalDateProto) -> Result<NaiveDate, Error> {
    NaiveDate::from_ymd_opt(p.year as i32, p.month, p.day).ok_or(Error::DateConversion)
}

fn is_leap_year(year: i32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

/// ACT/ACT ISDA year fraction: split the period at calendar-year boundaries;
/// each segment in calendar year Y contributes `days_in_segment / days_in_Y`
/// (365 in non-leap years, 366 in leap years). Returns 0 when end <= start.
fn act_act_year_fraction(start: NaiveDate, end: NaiveDate) -> Decimal {
    if end <= start {
        return Decimal::ZERO;
    }

    let mut total = Decimal::ZERO;
    let mut cursor = start;

    while cursor.year() < end.year() {
        let next_year_start =
            NaiveDate::from_ymd_opt(cursor.year() + 1, 1, 1).expect("valid Jan 1");
        let segment_days = (next_year_start - cursor).num_days();
        let days_in_year: i64 = if is_leap_year(cursor.year()) { 366 } else { 365 };
        total += Decimal::from(segment_days) / Decimal::from(days_in_year);
        cursor = next_year_start;
    }

    let final_days = (end - cursor).num_days();
    if final_days > 0 {
        let days_in_year: i64 = if is_leap_year(end.year()) { 366 } else { 365 };
        total += Decimal::from(final_days) / Decimal::from(days_in_year);
    }

    total
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fintekkers::models::security::{
        BondDetailsProto, CouponFrequencyProto, CouponTypeProto,
    };
    use crate::fintekkers::models::util::DecimalValueProto;
    use chrono::Utc;
    use rust_decimal_macros::dec;

    fn date(year: u32, month: u32, day: u32) -> Option<LocalDateProto> {
        Some(LocalDateProto { year, month, day })
    }

    fn decimal(s: &str) -> Option<DecimalValueProto> {
        Some(DecimalValueProto {
            arbitrary_precision_value: s.to_string(),
        })
    }

    fn bond_proto(
        issue: Option<LocalDateProto>,
        maturity: Option<LocalDateProto>,
        use_oneof: bool,
    ) -> SecurityProto {
        let mut proto = SecurityProto {
            security_type: SecurityTypeProto::BondSecurity as i32,
            ..Default::default()
        };
        if use_oneof {
            proto.product_details = Some(ProductDetails::BondDetails(BondDetailsProto {
                coupon_rate: decimal("5.0"),
                coupon_type: CouponTypeProto::Fixed as i32,
                coupon_frequency: CouponFrequencyProto::Semiannually as i32,
                face_value: decimal("100"),
                issue_date: issue,
                dated_date: None,
                maturity_date: maturity,
                issuance_info: vec![],
            }));
        } else {
            proto.issue_date = issue;
            proto.maturity_date = maturity;
        }
        proto
    }

    #[test]
    fn rejects_non_bond_security_types() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::EquitySecurity as i32,
            ..Default::default()
        };
        let result = BondSecurity::from_proto(proto);
        assert!(matches!(result, Err(Error::NotABondSecurity)));
    }

    #[test]
    fn accepts_bond_tips_and_frn() {
        for st in [
            SecurityTypeProto::BondSecurity,
            SecurityTypeProto::Tips,
            SecurityTypeProto::Frn,
        ] {
            let proto = SecurityProto {
                security_type: st as i32,
                ..Default::default()
            };
            assert!(
                BondSecurity::from_proto(proto).is_ok(),
                "expected {:?} to be accepted",
                st
            );
        }
    }

    /// Reference: spec test fixture
    /// issue=2025-01-15, maturity=2035-01-15, as_of=2030-07-15
    /// original=10y exact, effective≈4.5y under ACT/ACT.
    #[test]
    fn original_tenor_fixture_is_ten_years() {
        let proto = bond_proto(date(2025, 1, 15), date(2035, 1, 15), false);
        let bond = BondSecurity::from_proto(proto).unwrap();
        let original = bond.original_tenor().unwrap();
        // Full intermediate calendar years contribute exactly 1.0 each;
        // partial 2025 + partial 2035 sum to 365/365 = 1.0 → total 10.0 exact.
        assert_eq!(original, dec!(10));
    }

    #[test]
    fn original_tenor_works_via_oneof() {
        let proto = bond_proto(date(2025, 1, 15), date(2035, 1, 15), true);
        let bond = BondSecurity::from_proto(proto).unwrap();
        assert_eq!(bond.original_tenor().unwrap(), dec!(10));
    }

    #[test]
    fn effective_tenor_fixture_is_about_four_and_a_half_years() {
        let proto = bond_proto(date(2025, 1, 15), date(2035, 1, 15), false);
        let bond = BondSecurity::from_proto(proto).unwrap();
        let as_of = Utc.with_ymd_and_hms(2030, 7, 15, 0, 0, 0).unwrap();
        let effective = bond.effective_tenor(as_of).unwrap();

        // Hand calc:
        //   2030 (365 days, non-leap): days from 07-15 to 2031-01-01 = 170 → 170/365
        //   2031, 2033, 2034 full non-leap years → 1.0 each
        //   2032 full leap year (366/366) → 1.0
        //   2035 (365): 14 days (Jan 1 to Jan 15) → 14/365
        // total = 170/365 + 4 + 14/365 = 184/365 + 4 ≈ 4.50411
        let expected = dec!(4) + dec!(184) / dec!(365);
        let diff = (effective - expected).abs();
        assert!(
            diff < dec!(0.0001),
            "effective={} expected={} diff={}",
            effective,
            expected,
            diff
        );
        // Also assert the rough magnitude in years for readability.
        assert!(
            effective > dec!(4.5) && effective < dec!(4.51),
            "effective tenor should be ≈4.5y, got {}",
            effective
        );
    }

    #[test]
    fn effective_tenor_at_issue_equals_original_tenor() {
        let proto = bond_proto(date(2025, 1, 15), date(2035, 1, 15), false);
        let bond = BondSecurity::from_proto(proto).unwrap();
        let as_of = Utc.with_ymd_and_hms(2025, 1, 15, 0, 0, 0).unwrap();
        assert_eq!(bond.effective_tenor(as_of).unwrap(), bond.original_tenor().unwrap());
    }

    #[test]
    fn effective_tenor_at_or_after_maturity_is_zero() {
        let proto = bond_proto(date(2025, 1, 15), date(2035, 1, 15), false);
        let bond = BondSecurity::from_proto(proto).unwrap();

        let at_maturity = Utc.with_ymd_and_hms(2035, 1, 15, 0, 0, 0).unwrap();
        assert_eq!(bond.effective_tenor(at_maturity).unwrap(), Decimal::ZERO);

        let after = Utc.with_ymd_and_hms(2040, 6, 1, 0, 0, 0).unwrap();
        assert_eq!(bond.effective_tenor(after).unwrap(), Decimal::ZERO);
    }

    #[test]
    fn missing_maturity_returns_error() {
        let proto = bond_proto(date(2025, 1, 15), None, false);
        let bond = BondSecurity::from_proto(proto).unwrap();
        assert!(matches!(bond.maturity_date(), Err(Error::MissingMaturityDate)));
        assert!(matches!(bond.original_tenor(), Err(Error::MissingMaturityDate)));
    }

    #[test]
    fn missing_issue_returns_error() {
        let proto = bond_proto(None, date(2035, 1, 15), false);
        let bond = BondSecurity::from_proto(proto).unwrap();
        assert!(matches!(bond.issue_date(), Err(Error::MissingIssueDate)));
        assert!(matches!(bond.original_tenor(), Err(Error::MissingIssueDate)));
    }

    #[test]
    fn act_act_handles_leap_year_correctly() {
        // 2024-02-15 to 2025-02-15: spans the 2024 leap day, so the period has
        // 366 actual days but is "1 calendar year" — under ACT/ACT ISDA the
        // year fraction is ~1.00034 (NOT exactly 1.0, by design of the convention).
        // Y=2024 (leap, 366): 02-15 to 2025-01-01 = 321 days → 321/366 ≈ 0.8770
        // Y=2025 (365):       01-01 to 02-15      =  45 days →  45/365 ≈ 0.1233
        let issue = NaiveDate::from_ymd_opt(2024, 2, 15).unwrap();
        let maturity = NaiveDate::from_ymd_opt(2025, 2, 15).unwrap();
        let yf = act_act_year_fraction(issue, maturity);
        assert!(yf > dec!(1.0) && yf < dec!(1.001), "yf={}", yf);
    }

    /// Cross-language fixture test (TS/Java/Rust ACT/ACT consistency).
    /// Same dates → equivalent tenor across all three languages within tolerance.
    /// TS/Java surface a calendar Period (years/months/days); Rust returns
    /// decimal years. The conversion 10y/0m/0d ↔ Decimal(10) is exact at this
    /// fixture under ACT/ACT (full intermediate years).
    #[test]
    fn cross_language_fixture_2025_to_2035_matches_ts_java() {
        let proto = bond_proto(date(2025, 1, 15), date(2035, 1, 15), false);
        let bond = BondSecurity::from_proto(proto).unwrap();

        // TS: BondSecurity.getTenor() returns Period {years: 10, months: 0, days: 0}
        // Java: BondSecurity.getTenor() returns Period.of(10, 0, 0)
        // Rust: original_tenor() returns Decimal(10)
        let original = bond.original_tenor().unwrap();
        assert_eq!(original, dec!(10));

        // Effective from 2030-07-15:
        //   TS / Java getAdjustedTenor(asOf) → Period {years: 4, months: 6, days: 0}
        //   Rust effective_tenor(asOf) → Decimal ≈ 4.5041
        // The calendar Period (4y 6m 0d) corresponds to between 4.5 and 4.51 years
        // under ACT/ACT (depending on which months are crossed). All three should
        // agree on "4 years and 6 months" with at most one day's worth of drift.
        let as_of = Utc.with_ymd_and_hms(2030, 7, 15, 0, 0, 0).unwrap();
        let effective = bond.effective_tenor(as_of).unwrap();
        // 4.5 years exact in calendar terms = 4.5 ± a few days/365 in ACT/ACT.
        let drift = (effective - dec!(4.5)).abs();
        assert!(
            drift < dec!(0.01),
            "effective {} drifts more than 1% from 4.5y — TS/Java/Rust would disagree",
            effective
        );
    }
}
