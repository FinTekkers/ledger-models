//! Convexity adjustment for bond and interest rate futures.
//!
//! Futures prices differ from forward prices because futures are
//! daily-margined (marked to market). This creates a convexity bias:
//! futures rates are systematically higher than forward rates.
//!
//! When rates rise, the short futures position profits, and that profit
//! is reinvested at higher rates. When rates fall, losses are financed
//! at lower rates. This asymmetry means the expected futures rate exceeds
//! the forward rate.
//!
//! The simplified Hull formula gives:
//!   CA = 0.5 * sigma^2 * t1 * t2
//!
//! where sigma = annual yield volatility, t1 = time to futures expiry,
//! t2 = time to end of the underlying period (or bond maturity).

/// Compute the convexity adjustment between futures and forward rates.
///
/// The adjustment is always non-negative (for non-negative volatility):
/// futures rate >= forward rate.
///
/// # Arguments
/// * `volatility` - annual yield volatility (e.g., 0.01 = 1% = 100 basis points)
/// * `t_expiry` - time to futures expiry in years
/// * `t_maturity` - time to end of the underlying period (or bond maturity) in years
///
/// # Returns
/// The convexity adjustment in rate terms. For example, a return value of
/// 0.00055 means 5.5 basis points.
///
/// # Example
/// For sigma = 1%, t_expiry = 1 year, t_maturity = 11 years:
///   CA = 0.5 * 0.01^2 * 1 * 11 = 0.00055 (5.5 bps)
pub fn convexity_adjustment(
    volatility: f64,
    t_expiry: f64,
    t_maturity: f64,
) -> f64 {
    0.5 * volatility * volatility * t_expiry * t_maturity
}

/// Convert a forward rate to the corresponding futures rate by adding
/// the convexity adjustment.
///
/// futures_rate = forward_rate + CA
pub fn forward_to_futures_rate(
    forward_rate: f64,
    volatility: f64,
    t_expiry: f64,
    t_maturity: f64,
) -> f64 {
    forward_rate + convexity_adjustment(volatility, t_expiry, t_maturity)
}

/// Convert a futures rate to the corresponding forward rate by subtracting
/// the convexity adjustment.
///
/// forward_rate = futures_rate - CA
pub fn futures_to_forward_rate(
    futures_rate: f64,
    volatility: f64,
    t_expiry: f64,
    t_maturity: f64,
) -> f64 {
    futures_rate - convexity_adjustment(volatility, t_expiry, t_maturity)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adjustment_is_always_positive() {
        // For any positive volatility and positive times, CA > 0
        let ca = convexity_adjustment(0.015, 2.0, 10.0);
        assert!(ca > 0.0, "CA should be positive: {}", ca);
    }

    #[test]
    fn adjustment_increases_with_volatility_quadratic() {
        let ca1 = convexity_adjustment(0.01, 1.0, 10.0);
        let ca2 = convexity_adjustment(0.02, 1.0, 10.0);
        // Doubling volatility should quadruple the adjustment
        let ratio = ca2 / ca1;
        assert!(
            (ratio - 4.0).abs() < 1e-10,
            "CA should scale as vol^2: ratio={}",
            ratio
        );
    }

    #[test]
    fn adjustment_increases_with_expiry() {
        let ca1 = convexity_adjustment(0.01, 1.0, 10.0);
        let ca2 = convexity_adjustment(0.01, 3.0, 10.0);
        assert!(
            ca2 > ca1,
            "Longer expiry should increase CA: ca1={}, ca2={}",
            ca1,
            ca2
        );
        // Linear in t_expiry
        let ratio = ca2 / ca1;
        assert!(
            (ratio - 3.0).abs() < 1e-10,
            "CA should scale linearly with t_expiry: ratio={}",
            ratio
        );
    }

    #[test]
    fn adjustment_increases_with_maturity() {
        let ca1 = convexity_adjustment(0.01, 1.0, 5.0);
        let ca2 = convexity_adjustment(0.01, 1.0, 15.0);
        assert!(
            ca2 > ca1,
            "Longer maturity should increase CA: ca1={}, ca2={}",
            ca1,
            ca2
        );
    }

    #[test]
    fn zero_volatility_zero_adjustment() {
        let ca = convexity_adjustment(0.0, 5.0, 30.0);
        assert!(ca.abs() < 1e-15, "Zero vol should give zero CA: {}", ca);
    }

    #[test]
    fn zero_expiry_zero_adjustment() {
        let ca = convexity_adjustment(0.01, 0.0, 10.0);
        assert!(ca.abs() < 1e-15, "Zero expiry should give zero CA: {}", ca);
    }

    #[test]
    fn forward_to_futures_and_back_is_identity() {
        let forward = 0.035;
        let vol = 0.012;
        let t1 = 2.0;
        let t2 = 12.0;

        let futures = forward_to_futures_rate(forward, vol, t1, t2);
        let recovered = futures_to_forward_rate(futures, vol, t1, t2);
        assert!(
            (recovered - forward).abs() < 1e-15,
            "Round-trip failed: forward={}, recovered={}",
            forward,
            recovered
        );
    }

    #[test]
    fn futures_rate_exceeds_forward_rate() {
        let forward = 0.04;
        let futures = forward_to_futures_rate(forward, 0.01, 1.0, 10.0);
        assert!(
            futures > forward,
            "Futures rate should exceed forward rate: futures={}, forward={}",
            futures,
            forward
        );
    }

    #[test]
    fn typical_magnitude() {
        // sigma=1%, t1=1yr, t2=11yr => CA = 0.5 * 0.0001 * 1 * 11 = 0.00055
        let ca = convexity_adjustment(0.01, 1.0, 11.0);
        let expected = 0.5 * 0.0001 * 1.0 * 11.0;
        assert!(
            (ca - expected).abs() < 1e-15,
            "CA={}, expected={}",
            ca,
            expected
        );
        // Should be about 5.5 basis points
        let bps = ca * 10_000.0;
        assert!(
            (bps - 5.5).abs() < 1e-10,
            "Expected ~5.5 bps, got {} bps",
            bps
        );
    }

    #[test]
    fn larger_typical_scenario() {
        // sigma=1.5%, t1=2yr, t2=20yr
        // CA = 0.5 * 0.015^2 * 2 * 20 = 0.5 * 0.000225 * 40 = 0.0045 = 45bps
        let ca = convexity_adjustment(0.015, 2.0, 20.0);
        let expected = 0.5 * 0.015 * 0.015 * 2.0 * 20.0;
        assert!(
            (ca - expected).abs() < 1e-15,
            "CA={}, expected={}",
            ca,
            expected
        );
        let bps = ca * 10_000.0;
        assert!(
            (bps - 45.0).abs() < 1e-8,
            "Expected 45 bps, got {} bps",
            bps
        );
    }

    #[test]
    fn symmetry_in_time_arguments() {
        // CA(vol, t1, t2) = CA(vol, t2, t1) because formula is symmetric
        let ca1 = convexity_adjustment(0.01, 2.0, 10.0);
        let ca2 = convexity_adjustment(0.01, 10.0, 2.0);
        assert!(
            (ca1 - ca2).abs() < 1e-15,
            "CA should be symmetric: ca1={}, ca2={}",
            ca1,
            ca2
        );
    }
}
