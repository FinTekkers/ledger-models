use super::TaxRates;

/// Tax-Equivalent Yield (TEY): the pretax yield a taxable bond must offer
/// to match the after-tax return of a tax-exempt muni.
///
/// Simple: TEY = muni_yield / (1 - marginal_tax_rate)
///
/// Full (federal + state + local):
/// If the muni is exempt from both federal and state tax (in-state bond):
///   TEY = muni_yield / (1 - federal_rate - state_rate - local_rate + overlap_adjustment)
///
/// The overlap adjustment accounts for the fact that state taxes reduce
/// federal taxable income (if deductible):
///   If state_deductible: combined_rate = fed + agi_surcharge + state*(1-fed) + local*(1-fed)
///   Else: combined_rate = fed + state + local + agi_surcharge
pub fn tax_equivalent_yield(muni_yield: f64, tax_rates: &TaxRates, is_in_state: bool) -> f64 {
    let combined = combined_tax_rate(tax_rates, is_in_state);
    if combined >= 1.0 {
        return f64::INFINITY;
    }
    muni_yield / (1.0 - combined)
}

/// After-tax yield of a taxable bond.
///
/// after_tax = taxable_yield * (1 - combined_tax_rate)
///
/// Uses the full combined rate (federal + state + local + surcharge) since
/// taxable bond income is subject to all layers of taxation.
pub fn after_tax_yield(taxable_yield: f64, tax_rates: &TaxRates) -> f64 {
    let combined = combined_tax_rate(tax_rates, false);
    taxable_yield * (1.0 - combined)
}

/// Combined marginal tax rate for investment income.
///
/// When `is_in_state` is true, the bond is exempt from state and local taxes
/// (in addition to federal), so those rates factor into the combined rate
/// for TEY purposes.
///
/// When `is_in_state` is false, only federal exemption applies — state/local
/// taxes are still owed, but for the TEY calculation of a federally-exempt
/// muni, the combined rate uses only federal + agi_surcharge.
fn combined_tax_rate(rates: &TaxRates, is_in_state: bool) -> f64 {
    let state_local = if is_in_state {
        rates.state_rate + rates.local_rate
    } else {
        0.0
    };

    if rates.state_deductible {
        rates.federal_rate + rates.agi_surcharge + state_local * (1.0 - rates.federal_rate)
    } else {
        rates.federal_rate + rates.agi_surcharge + state_local
    }
}

/// Muni-to-Treasury ratio: muni_yield / treasury_yield.
///
/// A ratio < 1.0 is normal (munis yield less because of tax exemption).
/// Typical values: 0.75-0.90 for high-grade munis.
pub fn muni_treasury_ratio(muni_yield: f64, treasury_yield: f64) -> f64 {
    if treasury_yield == 0.0 {
        return 0.0;
    }
    muni_yield / treasury_yield
}

/// De minimis threshold: if a muni is purchased at a discount greater than
/// 0.25 points per year to maturity, the discount is taxed as ordinary income
/// rather than capital gains.
///
/// threshold_price = par - (0.25 * years_to_maturity)
///
/// If purchase_price < threshold: entire discount is ordinary income at sale/maturity.
/// If purchase_price >= threshold: discount is capital gains.
pub fn de_minimis_threshold(par: f64, years_to_maturity: f64) -> f64 {
    par - 0.25 * years_to_maturity
}

/// Check if a purchase price triggers de minimis tax treatment.
pub fn is_de_minimis(purchase_price: f64, par: f64, years_to_maturity: f64) -> bool {
    purchase_price < de_minimis_threshold(par, years_to_maturity)
}

/// Tax cost of de minimis: the ordinary income tax on the discount.
///
/// If de minimis is triggered, the entire discount (par - purchase_price)
/// is taxed as ordinary income at the federal rate.
pub fn de_minimis_tax_cost(
    purchase_price: f64,
    par: f64,
    years_to_maturity: f64,
    federal_rate: f64,
) -> f64 {
    if !is_de_minimis(purchase_price, par, years_to_maturity) {
        return 0.0;
    }
    (par - purchase_price) * federal_rate
}

/// Taxable-equivalent yield accounting for de minimis.
///
/// Adjusts the base TEY by the annualized tax drag from de minimis treatment.
/// If the purchase price does not trigger de minimis, returns the base TEY.
pub fn tey_with_de_minimis(
    muni_yield: f64,
    purchase_price: f64,
    par: f64,
    years_to_maturity: f64,
    tax_rates: &TaxRates,
    is_in_state: bool,
) -> f64 {
    let base_tey = tax_equivalent_yield(muni_yield, tax_rates, is_in_state);

    if !is_de_minimis(purchase_price, par, years_to_maturity) {
        return base_tey;
    }

    // Annualized yield drag from de minimis ordinary-income tax
    let annual_drag_yield =
        (par - purchase_price) * tax_rates.federal_rate / (years_to_maturity * purchase_price);
    let combined = combined_tax_rate(tax_rates, is_in_state);
    if combined >= 1.0 {
        return f64::INFINITY;
    }
    base_tey - annual_drag_yield / (1.0 - combined)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOLERANCE: f64 = 1e-6;

    fn approx_eq(a: f64, b: f64) -> bool {
        (a - b).abs() < TOLERANCE
    }

    // TEY basic: 3% muni at 37% federal -> TEY = 3% / 0.63 ~ 4.76%
    #[test]
    fn test_tey_basic_federal_only() {
        let rates = TaxRates {
            federal_rate: 0.37,
            state_rate: 0.0,
            local_rate: 0.0,
            agi_surcharge: 0.0,
            state_deductible: false,
        };
        let tey = tax_equivalent_yield(0.03, &rates, false);
        // 0.03 / (1 - 0.37) = 0.03 / 0.63
        let expected = 0.03 / 0.63;
        assert!(
            approx_eq(tey, expected),
            "TEY basic: got {}, expected {}",
            tey,
            expected
        );
    }

    // TEY with state: 3% muni, NY top rate -> TEY higher than federal-only
    #[test]
    fn test_tey_with_state_ny_in_state() {
        let federal_only = TaxRates {
            federal_rate: 0.37,
            state_rate: 0.0,
            local_rate: 0.0,
            agi_surcharge: 0.038,
            state_deductible: false,
        };
        let ny = TaxRates::new_york_top();

        let tey_federal = tax_equivalent_yield(0.03, &federal_only, false);
        let tey_ny = tax_equivalent_yield(0.03, &ny, true);

        assert!(
            tey_ny > tey_federal,
            "NY in-state TEY ({}) should be > federal-only TEY ({})",
            tey_ny,
            tey_federal
        );
    }

    // After-tax yield: 5% taxable at 37% -> 5% * (1 - 0.37) = 3.15%
    #[test]
    fn test_after_tax_yield() {
        let rates = TaxRates {
            federal_rate: 0.37,
            state_rate: 0.0,
            local_rate: 0.0,
            agi_surcharge: 0.0,
            state_deductible: false,
        };
        let aty = after_tax_yield(0.05, &rates);
        let expected = 0.05 * (1.0 - 0.37);
        assert!(
            approx_eq(aty, expected),
            "After-tax yield: got {}, expected {}",
            aty,
            expected
        );
    }

    // TEY > taxable yield: verify muni is attractive when TEY > comparable taxable yield
    #[test]
    fn test_muni_attractive_when_tey_exceeds_taxable() {
        let rates = TaxRates::top_federal();
        let muni_yield = 0.035; // 3.5% tax-exempt
        let taxable_yield = 0.05; // 5.0% taxable

        let tey = tax_equivalent_yield(muni_yield, &rates, false);
        // TEY = 0.035 / (1 - 0.37 - 0.038) = 0.035 / 0.592 ~ 5.91%
        // Since 5.91% > 5.0%, the muni is more attractive
        assert!(
            tey > taxable_yield,
            "TEY ({}) should exceed taxable yield ({}), muni is attractive",
            tey,
            taxable_yield
        );
    }

    // Muni-Treasury ratio: typical range 0.7-0.9
    #[test]
    fn test_muni_treasury_ratio() {
        let ratio = muni_treasury_ratio(0.032, 0.04);
        assert!(
            approx_eq(ratio, 0.8),
            "Ratio: got {}, expected 0.8",
            ratio
        );
        assert!(ratio > 0.7 && ratio < 0.9, "Ratio {} not in typical range", ratio);
    }

    #[test]
    fn test_muni_treasury_ratio_zero_treasury() {
        let ratio = muni_treasury_ratio(0.03, 0.0);
        assert_eq!(ratio, 0.0, "Should return 0 when treasury yield is zero");
    }

    // De minimis threshold: par=100, 10 years -> threshold = 97.5
    #[test]
    fn test_de_minimis_threshold() {
        let threshold = de_minimis_threshold(100.0, 10.0);
        assert!(
            approx_eq(threshold, 97.5),
            "Threshold: got {}, expected 97.5",
            threshold
        );
    }

    // De minimis trigger: price 96 < 97.5 -> triggers
    #[test]
    fn test_de_minimis_triggered() {
        assert!(
            is_de_minimis(96.0, 100.0, 10.0),
            "Price 96 < threshold 97.5 should trigger de minimis"
        );
    }

    // De minimis not triggered: price 98 > 97.5 -> no trigger
    #[test]
    fn test_de_minimis_not_triggered() {
        assert!(
            !is_de_minimis(98.0, 100.0, 10.0),
            "Price 98 > threshold 97.5 should NOT trigger de minimis"
        );
    }

    // De minimis tax cost: discount * federal rate
    #[test]
    fn test_de_minimis_tax_cost() {
        // Price 96, par 100, 10 years, 37% federal
        // Discount = 4.0, tax = 4.0 * 0.37 = 1.48
        let cost = de_minimis_tax_cost(96.0, 100.0, 10.0, 0.37);
        assert!(
            approx_eq(cost, 1.48),
            "Tax cost: got {}, expected 1.48",
            cost
        );
    }

    #[test]
    fn test_de_minimis_tax_cost_not_triggered() {
        let cost = de_minimis_tax_cost(98.0, 100.0, 10.0, 0.37);
        assert!(
            approx_eq(cost, 0.0),
            "Tax cost should be 0 when not triggered, got {}",
            cost
        );
    }

    // Presets: verify NY, CA, federal-only rates are reasonable
    #[test]
    fn test_preset_top_federal() {
        let rates = TaxRates::top_federal();
        assert!(approx_eq(rates.federal_rate, 0.37));
        assert!(approx_eq(rates.state_rate, 0.0));
        assert!(approx_eq(rates.local_rate, 0.0));
        assert!(approx_eq(rates.agi_surcharge, 0.038));
    }

    #[test]
    fn test_preset_new_york() {
        let rates = TaxRates::new_york_top();
        assert!(approx_eq(rates.federal_rate, 0.37));
        assert!(rates.state_rate > 0.10, "NY state rate should be > 10%");
        assert!(rates.local_rate > 0.0, "NY should have local tax");
    }

    #[test]
    fn test_preset_california() {
        let rates = TaxRates::california_top();
        assert!(approx_eq(rates.federal_rate, 0.37));
        assert!(rates.state_rate > 0.13, "CA state rate should be > 13%");
        assert!(approx_eq(rates.local_rate, 0.0), "CA has no local income tax");
    }

    // Edge case: 0% tax rate -> TEY = muni yield
    #[test]
    fn test_tey_zero_tax_rate() {
        let rates = TaxRates {
            federal_rate: 0.0,
            state_rate: 0.0,
            local_rate: 0.0,
            agi_surcharge: 0.0,
            state_deductible: false,
        };
        let tey = tax_equivalent_yield(0.03, &rates, false);
        assert!(
            approx_eq(tey, 0.03),
            "TEY at 0% tax should equal muni yield: got {}, expected 0.03",
            tey
        );
    }

    // Edge case: 100% tax rate -> TEY = infinity
    #[test]
    fn test_tey_100_percent_tax_rate() {
        let rates = TaxRates {
            federal_rate: 1.0,
            state_rate: 0.0,
            local_rate: 0.0,
            agi_surcharge: 0.0,
            state_deductible: false,
        };
        let tey = tax_equivalent_yield(0.03, &rates, false);
        assert!(tey.is_infinite(), "TEY at 100% tax should be infinity, got {}", tey);
    }

    // TEY with de minimis: verify adjustment reduces effective TEY
    #[test]
    fn test_tey_with_de_minimis_reduces_yield() {
        let rates = TaxRates {
            federal_rate: 0.37,
            state_rate: 0.0,
            local_rate: 0.0,
            agi_surcharge: 0.0,
            state_deductible: false,
        };
        let base_tey = tax_equivalent_yield(0.03, &rates, false);
        let adjusted_tey = tey_with_de_minimis(0.03, 96.0, 100.0, 10.0, &rates, false);

        assert!(
            adjusted_tey < base_tey,
            "De minimis adjusted TEY ({}) should be less than base TEY ({})",
            adjusted_tey,
            base_tey
        );
    }

    // TEY with de minimis: no adjustment when not triggered
    #[test]
    fn test_tey_with_de_minimis_no_adjustment() {
        let rates = TaxRates::top_federal();
        let base_tey = tax_equivalent_yield(0.03, &rates, false);
        let adjusted_tey = tey_with_de_minimis(0.03, 99.0, 100.0, 10.0, &rates, false);

        assert!(
            approx_eq(adjusted_tey, base_tey),
            "No de minimis: adjusted TEY ({}) should equal base TEY ({})",
            adjusted_tey,
            base_tey
        );
    }

    // State deductible flag changes the combined rate
    #[test]
    fn test_state_deductible_lowers_combined_rate() {
        let non_deductible = TaxRates {
            federal_rate: 0.37,
            state_rate: 0.10,
            local_rate: 0.0,
            agi_surcharge: 0.0,
            state_deductible: false,
        };
        let deductible = TaxRates {
            federal_rate: 0.37,
            state_rate: 0.10,
            local_rate: 0.0,
            agi_surcharge: 0.0,
            state_deductible: true,
        };

        let tey_non_ded = tax_equivalent_yield(0.03, &non_deductible, true);
        let tey_ded = tax_equivalent_yield(0.03, &deductible, true);

        // When state taxes are deductible from federal, the combined rate is lower
        // (state_rate * (1 - fed_rate) < state_rate), so TEY should be lower
        assert!(
            tey_ded < tey_non_ded,
            "Deductible TEY ({}) should be < non-deductible TEY ({})",
            tey_ded,
            tey_non_ded
        );
    }

    // Out-of-state muni: only federal exempt, state taxes still owed
    #[test]
    fn test_out_of_state_lower_tey_than_in_state() {
        let rates = TaxRates::new_york_top();
        let tey_in_state = tax_equivalent_yield(0.03, &rates, true);
        let tey_out_state = tax_equivalent_yield(0.03, &rates, false);

        assert!(
            tey_in_state > tey_out_state,
            "In-state TEY ({}) should be > out-of-state TEY ({}) since more taxes are avoided",
            tey_in_state,
            tey_out_state
        );
    }

    // After-tax yield with full rates
    #[test]
    fn test_after_tax_yield_with_surcharge() {
        let rates = TaxRates::top_federal();
        let aty = after_tax_yield(0.05, &rates);
        // combined = 0.37 + 0.038 = 0.408
        // after_tax = 0.05 * (1 - 0.408) = 0.05 * 0.592 = 0.0296
        let expected = 0.05 * (1.0 - 0.408);
        assert!(
            approx_eq(aty, expected),
            "After-tax yield with surcharge: got {}, expected {}",
            aty,
            expected
        );
    }
}
