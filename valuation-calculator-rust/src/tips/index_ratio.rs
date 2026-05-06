/// The index ratio at a given settlement date.
/// index_ratio = reference_cpi_settlement / base_cpi
///
/// The reference CPI for a settlement date uses a 2-3 month lag with
/// linear interpolation. For simplicity, we accept the current CPI directly.
pub fn index_ratio(current_cpi: f64, base_cpi: f64) -> f64 {
    current_cpi / base_cpi
}

/// The inflation-adjusted principal.
/// adjusted_principal = face_value * max(index_ratio, 1.0)
/// The max enforces the deflation floor: at maturity, TIPS pay no less than original face.
pub fn adjusted_principal(face_value: f64, current_cpi: f64, base_cpi: f64) -> f64 {
    let ratio = index_ratio(current_cpi, base_cpi);
    face_value * ratio.max(1.0)
}

/// Inflation-adjusted principal without deflation floor (for interim coupons).
/// Coupons use the raw ratio, not floored.
pub fn raw_adjusted_principal(face_value: f64, current_cpi: f64, base_cpi: f64) -> f64 {
    face_value * index_ratio(current_cpi, base_cpi)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn index_ratio_3pct_inflation() {
        // CPI up 3% -> ratio = 1.03
        let ratio = index_ratio(103.0, 100.0);
        assert!((ratio - 1.03).abs() < 1e-12, "ratio={}", ratio);
    }

    #[test]
    fn index_ratio_exact() {
        let ratio = index_ratio(256.394, 256.394);
        assert!((ratio - 1.0).abs() < 1e-12);
    }

    #[test]
    fn deflation_floor_adjusted_principal() {
        // CPI below base -> adjusted_principal = face (floored at 1.0)
        let adj = adjusted_principal(100.0, 95.0, 100.0);
        assert!((adj - 100.0).abs() < 1e-12, "adj={}", adj);
    }

    #[test]
    fn adjusted_principal_with_inflation() {
        let adj = adjusted_principal(100.0, 103.0, 100.0);
        assert!((adj - 103.0).abs() < 1e-12, "adj={}", adj);
    }

    #[test]
    fn raw_adjusted_principal_no_floor() {
        // Interim coupons use the raw ratio (no floor)
        let raw = raw_adjusted_principal(100.0, 95.0, 100.0);
        assert!((raw - 95.0).abs() < 1e-12, "raw={}", raw);
    }

    #[test]
    fn raw_adjusted_principal_with_inflation() {
        let raw = raw_adjusted_principal(100.0, 110.0, 100.0);
        assert!((raw - 110.0).abs() < 1e-12, "raw={}", raw);
    }

    #[test]
    fn high_inflation_ratio() {
        // 50% inflation
        let ratio = index_ratio(150.0, 100.0);
        assert!((ratio - 1.5).abs() < 1e-12);
        let adj = adjusted_principal(1000.0, 150.0, 100.0);
        assert!((adj - 1500.0).abs() < 1e-10);
    }
}
