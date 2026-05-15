use std::fmt;

/// Errors related to yield curve construction and usage.
#[derive(Debug, Clone, PartialEq)]
pub enum CurveError {
    /// The tenor and/or rate vectors were empty.
    EmptyInputs,
    /// The tenor and rate vectors have different lengths.
    MismatchedLengths { tenors: usize, rates: usize },
    /// Tenors are not in strictly ascending order.
    UnsortedTenors,
    /// A tenor value is invalid (e.g. negative).
    InvalidTenor(String),
}

impl fmt::Display for CurveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CurveError::EmptyInputs => write!(f, "Tenor and rate inputs must not be empty"),
            CurveError::MismatchedLengths { tenors, rates } => {
                write!(
                    f,
                    "Mismatched lengths: {} tenors vs {} rates",
                    tenors, rates
                )
            }
            CurveError::UnsortedTenors => {
                write!(f, "Tenors must be in strictly ascending order")
            }
            CurveError::InvalidTenor(msg) => write!(f, "Invalid tenor: {}", msg),
        }
    }
}

impl std::error::Error for CurveError {}
