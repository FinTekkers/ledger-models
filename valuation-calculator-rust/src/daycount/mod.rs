mod actual_actual_icma;
mod actual_365;
mod actual_360;
mod thirty_360;

pub use actual_actual_icma::*;

use crate::date::Date;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DayCountConvention {
    ActualActualICMA,
    Actual365Fixed,
    Thirty360US,
    Thirty360European,
    Actual360,
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
            DayCountConvention::Actual365Fixed => {
                actual_365::accrual_fraction(start, end)
            }
            DayCountConvention::Thirty360US => {
                thirty_360::thirty_360_us(start, end)
            }
            DayCountConvention::Thirty360European => {
                thirty_360::thirty_360_eu(start, end)
            }
            DayCountConvention::Actual360 => {
                actual_360::accrual_fraction(start, end)
            }
        }
    }
}
