use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum BondError {
    ConvergenceFailure { iterations: u32, last_price_error: f64 },
    InvalidInput(String),
    MaturedBond,
}

impl fmt::Display for BondError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BondError::ConvergenceFailure { iterations, last_price_error } => {
                write!(f, "YTM solver failed to converge after {} iterations (price error: {:.2e})", iterations, last_price_error)
            }
            BondError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            BondError::MaturedBond => write!(f, "Bond has matured"),
        }
    }
}

impl std::error::Error for BondError {}
