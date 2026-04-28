use crate::date::{Date, add_months};
use super::{AmortizingBondSpec, SinkingSchedule};

#[derive(Debug, Clone)]
pub struct AmortizingCashflow {
    pub date: Date,
    pub interest: f64,
    pub principal: f64,
    pub total: f64,
    pub outstanding_after: f64,
}

/// Generate payment dates (backward from maturity, like bond coupon dates)
fn generate_dates(spec: &AmortizingBondSpec) -> Vec<Date> {
    let months_per_period = 12 / spec.coupon_freq as i32;
    let mut dates = Vec::new();
    let mut date = spec.maturity_date;
    loop {
        dates.push(date);
        date = add_months(&date, -months_per_period);
        if date <= spec.dated_date {
            break;
        }
    }
    dates.reverse();
    dates
}

/// Generate amortizing bond cashflows
pub fn generate(spec: &AmortizingBondSpec, settlement: Date) -> Vec<AmortizingCashflow> {
    let dates = generate_dates(spec);
    let n = dates.len();
    let mut balance = spec.face_value;
    let mut result = Vec::new();

    for (i, &date) in dates.iter().enumerate() {
        if date <= settlement {
            // For periods before/at settlement, still update balance for
            // LevelPrincipal, ProRata, and Custom so outstanding is correct.
            let principal = match &spec.schedule {
                SinkingSchedule::LevelPrincipal => spec.face_value / n as f64,
                SinkingSchedule::LevelPayment => {
                    let r = spec.coupon_rate / spec.coupon_freq as f64;
                    if r > 0.0 {
                        let remaining_from_here = n - i;
                        let payment =
                            balance * r / (1.0 - (1.0 + r).powi(-(remaining_from_here as i32)));
                        let interest = balance * r;
                        (payment - interest).max(0.0)
                    } else {
                        balance / (n - i) as f64
                    }
                }
                SinkingSchedule::Custom(entries) => entries
                    .iter()
                    .find(|e| e.date == date)
                    .map(|e| e.principal_amount)
                    .unwrap_or(0.0),
                SinkingSchedule::ProRata(frac) => spec.face_value * frac,
            };
            let principal = principal.min(balance);
            balance = (balance - principal).max(0.0);
            continue;
        }

        let interest = balance * spec.coupon_rate / spec.coupon_freq as f64;

        let principal = match &spec.schedule {
            SinkingSchedule::LevelPrincipal => spec.face_value / n as f64,
            SinkingSchedule::LevelPayment => {
                let r = spec.coupon_rate / spec.coupon_freq as f64;
                if r > 0.0 {
                    let remaining_from_here = n - i;
                    let payment =
                        balance * r / (1.0 - (1.0 + r).powi(-(remaining_from_here as i32)));
                    (payment - interest).max(0.0)
                } else {
                    balance / (n - i) as f64
                }
            }
            SinkingSchedule::Custom(entries) => entries
                .iter()
                .find(|e| e.date == date)
                .map(|e| e.principal_amount)
                .unwrap_or(0.0),
            SinkingSchedule::ProRata(frac) => spec.face_value * frac,
        };

        let principal = principal.min(balance);
        let new_balance = (balance - principal).max(0.0);

        // At maturity, pay any remaining balance
        let principal = if date == spec.maturity_date {
            balance
        } else {
            principal
        };
        let new_balance = if date == spec.maturity_date {
            0.0
        } else {
            new_balance
        };

        result.push(AmortizingCashflow {
            date,
            interest,
            principal,
            total: interest + principal,
            outstanding_after: new_balance,
        });

        balance = new_balance;
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::amortizing::{AmortizingBondSpec, SinkingEntry, SinkingSchedule};
    use crate::date::Date;
    use crate::daycount::DayCountConvention;

    fn make_spec(schedule: SinkingSchedule) -> AmortizingBondSpec {
        AmortizingBondSpec {
            coupon_rate: 0.06,
            coupon_freq: 2,
            face_value: 1000.0,
            dated_date: Date::new(2025, 1, 15),
            maturity_date: Date::new(2030, 1, 15),
            day_count: DayCountConvention::Thirty360US,
            schedule,
        }
    }

    fn settlement() -> Date {
        Date::new(2025, 1, 15)
    }

    // --- Level principal tests ---

    #[test]
    fn level_principal_equal_payments() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let cfs = generate(&spec, settlement());
        let expected_principal = spec.face_value / cfs.len() as f64;
        // All but the last should have approximately equal principal
        for cf in cfs.iter().take(cfs.len() - 1) {
            assert!(
                (cf.principal - expected_principal).abs() < 0.01,
                "principal {} != expected {}",
                cf.principal,
                expected_principal
            );
        }
    }

    #[test]
    fn level_principal_sums_to_face() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let cfs = generate(&spec, settlement());
        let total_principal: f64 = cfs.iter().map(|c| c.principal).sum();
        assert!(
            (total_principal - spec.face_value).abs() < 0.01,
            "total principal {} != face {}",
            total_principal,
            spec.face_value
        );
    }

    #[test]
    fn level_principal_declining_balance() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let cfs = generate(&spec, settlement());
        for i in 1..cfs.len() {
            assert!(
                cfs[i].outstanding_after <= cfs[i - 1].outstanding_after,
                "balance not declining at period {}",
                i
            );
        }
    }

    #[test]
    fn level_principal_interest_declines() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let cfs = generate(&spec, settlement());
        for i in 1..cfs.len() {
            assert!(
                cfs[i].interest <= cfs[i - 1].interest + 1e-10,
                "interest not declining at period {}",
                i
            );
        }
    }

    #[test]
    fn level_principal_maturity_zero_balance() {
        let spec = make_spec(SinkingSchedule::LevelPrincipal);
        let cfs = generate(&spec, settlement());
        let last = cfs.last().unwrap();
        assert!(
            last.outstanding_after.abs() < 1e-10,
            "balance at maturity should be 0, got {}",
            last.outstanding_after
        );
    }

    // --- Level payment tests ---

    #[test]
    fn level_payment_constant_total() {
        let spec = make_spec(SinkingSchedule::LevelPayment);
        let cfs = generate(&spec, settlement());
        let first_total = cfs[0].total;
        for cf in &cfs {
            assert!(
                (cf.total - first_total).abs() < 0.01,
                "total payment {} != first {}",
                cf.total,
                first_total
            );
        }
    }

    #[test]
    fn level_payment_sums_to_face() {
        let spec = make_spec(SinkingSchedule::LevelPayment);
        let cfs = generate(&spec, settlement());
        let total_principal: f64 = cfs.iter().map(|c| c.principal).sum();
        assert!(
            (total_principal - spec.face_value).abs() < 0.01,
            "total principal {} != face {}",
            total_principal,
            spec.face_value
        );
    }

    #[test]
    fn level_payment_declining_balance() {
        let spec = make_spec(SinkingSchedule::LevelPayment);
        let cfs = generate(&spec, settlement());
        for i in 1..cfs.len() {
            assert!(
                cfs[i].outstanding_after <= cfs[i - 1].outstanding_after,
                "balance not declining at period {}",
                i
            );
        }
    }

    #[test]
    fn level_payment_interest_declines() {
        let spec = make_spec(SinkingSchedule::LevelPayment);
        let cfs = generate(&spec, settlement());
        for i in 1..cfs.len() {
            assert!(
                cfs[i].interest <= cfs[i - 1].interest + 1e-10,
                "interest not declining at period {}",
                i
            );
        }
    }

    // --- Custom schedule tests ---

    #[test]
    fn custom_schedule_specific_amounts() {
        let entries = vec![
            SinkingEntry {
                date: Date::new(2026, 1, 15),
                principal_amount: 200.0,
            },
            SinkingEntry {
                date: Date::new(2027, 1, 15),
                principal_amount: 300.0,
            },
            SinkingEntry {
                date: Date::new(2028, 1, 15),
                principal_amount: 100.0,
            },
        ];
        let spec = make_spec(SinkingSchedule::Custom(entries));
        let cfs = generate(&spec, settlement());

        // Find the cashflow on 2026-01-15 and check principal
        let cf_2026 = cfs.iter().find(|c| c.date == Date::new(2026, 1, 15)).unwrap();
        assert!(
            (cf_2026.principal - 200.0).abs() < 0.01,
            "expected 200.0 principal, got {}",
            cf_2026.principal
        );

        let cf_2027 = cfs.iter().find(|c| c.date == Date::new(2027, 1, 15)).unwrap();
        assert!(
            (cf_2027.principal - 300.0).abs() < 0.01,
            "expected 300.0 principal, got {}",
            cf_2027.principal
        );
    }

    #[test]
    fn custom_schedule_maturity_repays_remaining() {
        // Custom schedule that does not pay all principal before maturity
        let entries = vec![SinkingEntry {
            date: Date::new(2027, 1, 15),
            principal_amount: 200.0,
        }];
        let spec = make_spec(SinkingSchedule::Custom(entries));
        let cfs = generate(&spec, settlement());
        let last = cfs.last().unwrap();
        assert!(
            last.outstanding_after.abs() < 1e-10,
            "remaining balance should be 0 at maturity, got {}",
            last.outstanding_after
        );
        // The maturity principal should be the remaining balance
        assert!(
            last.principal > 0.0,
            "maturity principal should be positive"
        );
    }

    #[test]
    fn custom_schedule_principal_sums_to_face() {
        let entries = vec![
            SinkingEntry {
                date: Date::new(2026, 1, 15),
                principal_amount: 200.0,
            },
            SinkingEntry {
                date: Date::new(2027, 1, 15),
                principal_amount: 300.0,
            },
        ];
        let spec = make_spec(SinkingSchedule::Custom(entries));
        let cfs = generate(&spec, settlement());
        let total_principal: f64 = cfs.iter().map(|c| c.principal).sum();
        assert!(
            (total_principal - spec.face_value).abs() < 0.01,
            "total principal {} != face {}",
            total_principal,
            spec.face_value
        );
    }

    // --- Pro-rata tests ---

    #[test]
    fn pro_rata_fixed_fraction() {
        let spec = make_spec(SinkingSchedule::ProRata(0.05));
        let cfs = generate(&spec, settlement());
        let expected_principal = spec.face_value * 0.05;
        // All periods except maturity should have the fixed fraction
        for cf in cfs.iter().take(cfs.len() - 1) {
            assert!(
                (cf.principal - expected_principal).abs() < 0.01,
                "principal {} != expected {}",
                cf.principal,
                expected_principal
            );
        }
    }

    #[test]
    fn pro_rata_principal_sums_to_face() {
        let spec = make_spec(SinkingSchedule::ProRata(0.05));
        let cfs = generate(&spec, settlement());
        let total_principal: f64 = cfs.iter().map(|c| c.principal).sum();
        assert!(
            (total_principal - spec.face_value).abs() < 0.01,
            "total principal {} != face {}",
            total_principal,
            spec.face_value
        );
    }

    #[test]
    fn pro_rata_maturity_repays_remaining() {
        let spec = make_spec(SinkingSchedule::ProRata(0.05));
        let cfs = generate(&spec, settlement());
        let last = cfs.last().unwrap();
        assert!(
            last.outstanding_after.abs() < 1e-10,
            "balance at maturity should be 0, got {}",
            last.outstanding_after
        );
    }
}
