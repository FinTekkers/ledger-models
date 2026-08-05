mod actual_actual_icma;

pub use actual_actual_icma::*;

use crate::date::Date;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DayCountConvention {
    ActualActualICMA,
}

impl DayCountConvention {
    pub fn accrual_fraction(
        &self,
        start: Date,
        end: Date,
        period_start: Date,
        period_end: Date,
    ) -> f64 {
        match self {
            DayCountConvention::ActualActualICMA => {
                actual_actual_icma::accrual_fraction(start, end, period_start, period_end)
            }
        }
    }
}
