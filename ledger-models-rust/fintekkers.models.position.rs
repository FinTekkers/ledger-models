#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum FieldProto {
    UnknownField = 0,
    /// (UUID.class)
    Id = 1,
    /// ZonedDateTime
    AsOf = 2,
    /// Attribute fields. Likely to be fields that one would pivot on.
    ///
    /// LocalDate.class
    EffectiveDate = 10,
    /// common.model.strategy.Strategy.class
    Strategy = 11,
    /// common.model.security.Security.class
    Security = 12,
    SecurityDescription = 61,
    SecurityIssuerName = 62,
    /// common.model.security.Security.class
    CashImpactSecurity = 13,
    /// Security Fields
    ///
    ///   AssetClass(String.class), //FixedIncome, Equity, etc
    AssetClass = 50,
    /// ProductClass(String.class), //Bond, CashEquity, etc
    ProductClass = 51,
    /// ProductType (String.class), //TBILL, BOND, etc
    ProductType = 52,
    SecurityId = 53,
    Identifier = 54,
    /// 1M
    Tenor = 55,
    IssueDate = 58,
    MaturityDate = 56,
    AdjustedTenor = 57,
    /// Portfolio fields
    ///
    /// common.model.portfolio.Portfolio.class
    Portfolio = 14,
    /// UUID
    PortfolioId = 15,
    PortfolioName = 60,
    /// Miscellaneous
    ///
    /// common.model.price.Price.class
    Price = 16,
    /// UUID
    PriceId = 17,
    /// Boolean.class
    IsCancelled = 18,
    /// PositionStatus.class
    PositionStatus = 19,
    /// Transaction only
    ///
    /// TradeDate(LocalDate.class),
    TradeDate = 30,
    ///   SettlementDate(LocalDate.class),
    SettlementDate = 31,
    /// BUY, SELL, MATURATION, etc (TransactionType.class)
    TransactionType = 32,
    /// Tax Lot only
    ///
    ///   TaxLotOpenDate(LocalDate.class),
    TaxLotOpenDate = 40,
    ///   TaxLotCloseDate(LocalDate.class),
    TaxLotCloseDate = 41,
}
impl FieldProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            FieldProto::UnknownField => "UNKNOWN_FIELD",
            FieldProto::Id => "ID",
            FieldProto::AsOf => "AS_OF",
            FieldProto::EffectiveDate => "EFFECTIVE_DATE",
            FieldProto::Strategy => "STRATEGY",
            FieldProto::Security => "SECURITY",
            FieldProto::SecurityDescription => "SECURITY_DESCRIPTION",
            FieldProto::SecurityIssuerName => "SECURITY_ISSUER_NAME",
            FieldProto::CashImpactSecurity => "CASH_IMPACT_SECURITY",
            FieldProto::AssetClass => "ASSET_CLASS",
            FieldProto::ProductClass => "PRODUCT_CLASS",
            FieldProto::ProductType => "PRODUCT_TYPE",
            FieldProto::SecurityId => "SECURITY_ID",
            FieldProto::Identifier => "IDENTIFIER",
            FieldProto::Tenor => "TENOR",
            FieldProto::IssueDate => "ISSUE_DATE",
            FieldProto::MaturityDate => "MATURITY_DATE",
            FieldProto::AdjustedTenor => "ADJUSTED_TENOR",
            FieldProto::Portfolio => "PORTFOLIO",
            FieldProto::PortfolioId => "PORTFOLIO_ID",
            FieldProto::PortfolioName => "PORTFOLIO_NAME",
            FieldProto::Price => "PRICE",
            FieldProto::PriceId => "PRICE_ID",
            FieldProto::IsCancelled => "IS_CANCELLED",
            FieldProto::PositionStatus => "POSITION_STATUS",
            FieldProto::TradeDate => "TRADE_DATE",
            FieldProto::SettlementDate => "SETTLEMENT_DATE",
            FieldProto::TransactionType => "TRANSACTION_TYPE",
            FieldProto::TaxLotOpenDate => "TAX_LOT_OPEN_DATE",
            FieldProto::TaxLotCloseDate => "TAX_LOT_CLOSE_DATE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_FIELD" => Some(Self::UnknownField),
            "ID" => Some(Self::Id),
            "AS_OF" => Some(Self::AsOf),
            "EFFECTIVE_DATE" => Some(Self::EffectiveDate),
            "STRATEGY" => Some(Self::Strategy),
            "SECURITY" => Some(Self::Security),
            "SECURITY_DESCRIPTION" => Some(Self::SecurityDescription),
            "SECURITY_ISSUER_NAME" => Some(Self::SecurityIssuerName),
            "CASH_IMPACT_SECURITY" => Some(Self::CashImpactSecurity),
            "ASSET_CLASS" => Some(Self::AssetClass),
            "PRODUCT_CLASS" => Some(Self::ProductClass),
            "PRODUCT_TYPE" => Some(Self::ProductType),
            "SECURITY_ID" => Some(Self::SecurityId),
            "IDENTIFIER" => Some(Self::Identifier),
            "TENOR" => Some(Self::Tenor),
            "ISSUE_DATE" => Some(Self::IssueDate),
            "MATURITY_DATE" => Some(Self::MaturityDate),
            "ADJUSTED_TENOR" => Some(Self::AdjustedTenor),
            "PORTFOLIO" => Some(Self::Portfolio),
            "PORTFOLIO_ID" => Some(Self::PortfolioId),
            "PORTFOLIO_NAME" => Some(Self::PortfolioName),
            "PRICE" => Some(Self::Price),
            "PRICE_ID" => Some(Self::PriceId),
            "IS_CANCELLED" => Some(Self::IsCancelled),
            "POSITION_STATUS" => Some(Self::PositionStatus),
            "TRADE_DATE" => Some(Self::TradeDate),
            "SETTLEMENT_DATE" => Some(Self::SettlementDate),
            "TRANSACTION_TYPE" => Some(Self::TransactionType),
            "TAX_LOT_OPEN_DATE" => Some(Self::TaxLotOpenDate),
            "TAX_LOT_CLOSE_DATE" => Some(Self::TaxLotCloseDate),
            _ => None,
        }
    }
}
/// Absent versus zero: a measure that is missing from a position (no
/// MeasureMapEntry for it, or an entry with no measure_decimal_value) means
/// "not computable" for that position, e.g. a price or input it needs was
/// unavailable. It is distinct from a computed 0, which is a real value and is
/// always sent as "0".
///
/// Serializers in every language must omit a measure they could not compute and
/// never zero-fill it; deserializers must read an absent measure back as
/// absent/null, never as 0.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum MeasureProto {
    /// Placeholder for unset or unrecognized measure values.
    /// Should never be requested in a valuation call.
    UnknownMeasure = 0,
    /// The signed quantity of a position (e.g. number of shares, or total face value of bonds held).
    /// This is an input measure provided on the PositionProto, not a computed output.
    ///
    /// Formula: N/A — user-supplied input.
    /// Applicability: All security types (Bond, TIPS, FRN, Equity, Cash).
    /// Units: Units of the security (shares for equity, face-value dollars for bonds).
    DirectedQuantity = 1,
    /// The current dollar value of a position at the given market price.
    ///
    /// Formula:
    ///    MarketValue = (price * face_value / 100) * (directed_quantity / face_value)
    ///                = price / 100 * directed_quantity
    ///    Where price is quoted as a percentage of par (e.g. 95 means 95% of face).
    ///
    /// Example: face=1000, price=95, qty=20000 → MV = 95/100 * 20000 = 19,000.
    ///
    /// Formula (TIPS): the real clean price is scaled by the index ratio.
    ///    MarketValue = (clean_price / 100 * face_value * index_ratio) * (directed_quantity / face_value)
    ///                = clean_price / 100 * index_ratio * directed_quantity
    ///    Where index_ratio is INDEX_RATIO: rounded to 5 decimals per 31 CFR 356
    ///    Appendix B, and unfloored. The deflation floor does not apply to market
    ///    value (see INFLATION_ADJUSTED_PRINCIPAL).
    ///    The TIPS result is rounded to cents (a project rule, not Appendix B
    ///    text), so it equals the PROFIT_LOSS (TIPS) market side.
    ///
    /// Example (TIPS): price=97.5, index_ratio=1.2, qty=20000 → MV = 97.5/100 * 1.2 * 20000 = 23,400.
    ///
    /// Model assumptions: None — this is a direct mark-to-market calculation.
    /// Applicability: Bond, TIPS, FRN, Equity (price=share price, face_value=1), Cash.
    /// Units: Dollars (or settlement currency).
    MarketValue = 2,
    /// The original purchase price of the security, before any adjustments for
    /// amortization, accretion, or corporate actions.
    ///
    /// Formula: Returns the price_input as-is (quoted as % of par for bonds).
    ///    Over time this may incorporate adjustments such as stock splits.
    ///
    /// Model assumptions: None — pass-through of the input price.
    /// Applicability: Bond, TIPS, FRN, Equity, Cash.
    /// Units: Quoted price (% of par for bonds; dollar price for equities).
    UnadjustedCostBasis = 3,
    /// Tax amortised cost, per 100 face, quantity-weighted over the open lots
    /// (LM-364; implemented under VS-110). See docs/adr/amortisation_elections.md.
    ///
    /// Inputs: cost_basis (CostBasisInput) on BondInput, TipsInput or FrnInput:
    ///    lots, the holding's open TaxLotProto lots, and elections, the
    ///    portfolio's AmortisationElectionsProto (unset = every default).
    ///
    /// Formula, for each open lot i:
    ///    acb_i = the lot's amortised cost per 100 face at the valuation date:
    ///            price_i, adjusted by the OID, premium and market-discount rules below.
    ///    AdjustedCostBasis = sum(open_quantity_i * acb_i) / sum(open_quantity_i)
    ///
    /// OID: always accreted (mandatory, whatever the elections) at constant yield
    ///    from the issue price (IssuanceProto.price_for_single_price_auction,
    ///    MDI-82), reduced by any acquisition premium.
    /// Premium (IRC §171): amortised at constant yield if elected
    ///    (bond_premium; the default is PREMIUM_ELECTED).
    /// Market discount: accreted only with INCLUDE_CURRENTLY, ratably or at
    ///    constant yield per market_discount_accrual (the default is RATABLE);
    ///    otherwise (AT_DISPOSITION, the default) left until disposition.
    /// De minimis: OID and market discount below 0.25% × complete years to
    ///    maturity are treated as zero.
    /// Accrual start: from each lot's open_date plus the product's settlement lag
    ///    (e.g. T+1 for Treasuries).
    /// TIPS: amortise in real terms, then multiply by the index ratio
    ///    (INDEX_RATIO) at the valuation date, giving a figure per 100 original
    ///    face in nominal dollars:
    ///      AdjustedCostBasis = sum(open_quantity_i * real_acb_i) / sum(open_quantity_i)
    ///                          * IndexRatio(valuation date)
    ///    real_acb_i: lot i's amortised cost per 100 real face. It starts from the
    ///      lot's real purchase price (TaxLotProto.price) and accrues at constant
    ///      yield on real principal.
    ///    open_quantity_i: the lot's original (unadjusted) face.
    ///    Accrual start: as above, on real principal. valuation-service owns the
    ///      settlement lag; lots carry no settlement field.
    ///    Elections: premium and market discount accrue or not per the elections,
    ///      as in the fixed-rate rules above.
    ///    IndexRatio(valuation date): INDEX_RATIO for the UTC date of
    ///      ValuationRequestProto.asof_datetime. It uses only the m-3 and m-2
    ///      readings in TipsInput.cpi. Extra lot months there serve PROFIT_LOSS
    ///      and are ignored here.
    ///    Rounding: the index ratio is INDEX_RATIO, rounded to 5 decimals per
    ///      31 CFR 356 Appendix B. real_acb_i, the weighted average and the
    ///      result are not rounded further.
    ///    Deflation floor: not applied. It applies only to final principal
    ///      (INFLATION_ADJUSTED_PRINCIPAL), never to the basis.
    ///    Example: lots of 10000 at real_acb 99.00 and 5000 at 101.50, index
    ///      ratio 1.2 -> (10000*99.00 + 5000*101.50) / 15000 * 1.2 = 119.80.
    /// FRN: use the equivalent fixed rate from the fixing at settlement.
    /// Treasury FRN (frn_extension.reference_rate_index T_BILL_13_WEEK, LM-383):
    ///    Inputs: FrnInput.cost_basis (lots and elections) and FrnInput.fixings.
    ///    Per lot: amortise each lot as the equivalent fixed-rate instrument,
    ///      using the same constant-yield, elections and de minimis rules as the
    ///      fixed-rate bonds above.
    ///    Coupon: the lot's equivalent fixed coupon, as a decimal fraction, is
    ///        coupon_i = MMY(fixing_i) + spread / 10000
    ///      fixing_i: the fixing in effect at the lot's accrual start, i.e. the
    ///        FrnInput.fixings entry with the latest fixing_date on or before it.
    ///      spread: frn_extension.spread, in basis points.
    ///    OID: the fixing in effect on bond_details.issue_date (the latest
    ///      fixing_date on or before it) sets the issue-date OID schedule.
    ///    Resets: later coupon resets do not change a lot's schedule.
    ///    Conversion: fixings.rate is the published high discount rate in
    ///      percent (see ReferenceRateFixingProto.rate). valuation-service
    ///      converts it to the money-market yield, on a 360-day basis:
    ///        MMY = 360 * d / (360 - d * t)
    ///      d = rate / 100.
    ///      t = bill_maturity_date - bill_issue_date, in days, both from the same
    ///        fixing. bill_issue_date is the chosen auction's own issue date, so
    ///        a reopened bill counts from the reopening.
    ///      Example: rate 4.215, t 91 -> d = 0.04215,
    ///        MMY = 360 * 0.04215 / (360 - 0.04215 * 91) = 0.042604 (rounded here only).
    ///    Missing data: no fixing on or before a needed date (a lot's accrual
    ///      start, or the issue date) makes the request invalid.
    ///    Other indices (e.g. SOFR): not defined yet.
    /// No lots: the measure is absent, with a "no open lots" warning, never 0.
    ///
    /// Scope: tax basis only. Book (GAAP/IFRS) cost is out of scope.
    /// Applicability: TREASURY_NOTE, TREASURY_BOND, SOVEREIGN_BOND, CORP_BOND,
    ///    MUNI_BOND, TIPS, TREASURY_FRN.
    /// Units: Price per 100 face (% of par). TIPS: per 100 original face, in
    ///    nominal dollars.
    AdjustedCostBasis = 4,
    /// Annual coupon income as a percentage of the current market price.
    ///
    /// Formula (coupon-bearing bonds):
    ///    CurrentYield = (coupon_rate * principal) / (price * face_value / 100)
    ///    Where principal = face_value for nominal bonds, or inflation-adjusted principal for TIPS.
    ///
    /// Formula (zero-coupon bonds):
    ///    CurrentYield = (face_value / dollar_price)^(1 / years_to_maturity) - 1
    ///    This is the annualized investment yield from discount to par.
    ///
    /// Model assumptions: Assumes coupon income is constant (no reinvestment assumption).
    ///    For TIPS, uses the inflation-adjusted principal for the annual coupon calculation.
    ///    Day count: Actual/365 for years-to-maturity calculation.
    /// Applicability: Bond, TIPS. (Equity dividend yield not yet supported.)
    /// Units: Decimal (0-1 scale; e.g. 0.0526 = 5.26%).
    CurrentYield = 5,
    /// The annualized rate of return assuming the bond is held to maturity and all
    /// coupons are reinvested at the same rate. This is the internal rate of return
    /// that equates the present value of all future cashflows to the current price.
    ///
    /// Formula:
    ///    Solve for r (annual) such that:
    ///    price * (face / 100) = Sum_{t=1}^{N} [C / (1 + r/m)^t] + F / (1 + r/m)^N
    ///    Where C = periodic coupon, F = principal (face or inflation-adjusted),
    ///    m = coupon frequency, N = number of periods.
    ///    For TIPS the left side is also scaled by index_ratio (see REAL_YIELD).
    ///
    /// Solver: Newton-Raphson iteration (ytm_solver.rs) with the linear approximation
    ///    YTM ≈ (annual_coupon + (F - P) / years) / ((F + P) / 2)
    ///    as the initial guess. Converges to the exact YTM where PV = price.
    ///
    /// Model assumptions:
    ///    - Coupon reinvestment at the YTM rate (standard bond math assumption).
    ///    - For TIPS: returns the same value as REAL_YIELD (the real yield), and adds
    ///      this warning to the response summary:
    ///      "YIELD_TO_MATURITY for TIPS is the real yield (same as REAL_YIELD); a nominal
    ///      yield needs an inflation forecast". There is no nominal TIPS yield without
    ///      an inflation forecast.
    ///    - Settlement on a coupon date (no accrued interest adjustment currently).
    ///    - Day count: Actual/365 for years-to-maturity.
    ///
    /// Applicability: Bond, TIPS. Not meaningful for FRN (use DISCOUNT_MARGIN) or Equity.
    /// Units: Decimal (0-1 scale; e.g. 0.06 = 6.00% annual).
    YieldToMaturity = 7,
    /// The weighted average time (in years) to receive all cashflows from a bond,
    /// where each cashflow's weight is its proportion of the bond's total present value.
    ///
    /// Formula:
    ///    D = Sum_{t=1}^{N} [(t / m) * PV_t / TotalPV]
    ///    Where PV_t = cashflow_t / (1 + r/m)^t, TotalPV = Sum(PV_t),
    ///    m = coupon frequency, r = YTM.
    ///    For TIPS, r = REAL_YIELD and cashflow_t is the inflation-adjusted cash flow.
    ///
    /// Model assumptions:
    ///    - Uses the bond's YTM (from Newton-Raphson solver) as the discount rate.
    ///    - Flat yield curve (single rate for all maturities).
    ///    - Settlement on a coupon date (integer period exponents).
    ///
    /// Applicability: Bond, TIPS. Not typically used for FRN (spread duration is the
    ///    relevant risk measure). Not applicable to Equity or Cash.
    /// Units: Years (e.g. 4.41 = 4.41 years).
    MacaulayDuration = 8,
    /// The theoretical price of a bond computed as the sum of all future cashflows
    /// (coupons + principal) discounted at the bond's yield to maturity.
    ///
    /// Formula:
    ///    PV = Sum_{t=1}^{N} [C / (1 + r/m)^t] + F / (1 + r/m)^N
    ///    Returned as: PV_dollar / (face_value / 100)  (quoted price, % of par).
    ///
    /// The YTM used for discounting is computed via Newton-Raphson from the input price,
    /// which guarantees the three-way invariant:
    ///    price == present_value == sum(cashflow_pvs)
    ///
    /// Model assumptions:
    ///    - Same as YIELD_TO_MATURITY (the discount rate is derived from the input price).
    ///    - For TIPS: the inflation-adjusted cash flows are discounted at REAL_YIELD,
    ///      consistent with the scaled price clean_price × index_ratio (so the
    ///      invariant reads clean_price × index_ratio == present_value).
    ///
    /// Applicability: Bond, TIPS. For FRN, PV uses the discount margin framework instead.
    /// Units: Quoted price (% of par; e.g. 95.00 = $95 per $100 face).
    PresentValue = 9,
    /// The yield of a TIPS bond in real (inflation-adjusted) terms. This is the return
    /// an investor earns above the rate of inflation.
    ///
    /// Formula (TIPS):
    ///    Solve for r (annual) such that:
    ///    clean_price × index_ratio × face / 100 = Σ PV(inflation-adjusted cash flows at r)
    ///    The quoted real price is scaled by the same index ratio as the cash flows, so
    ///    the result is the true real yield and does not change with CPI.
    ///
    /// Model assumptions:
    ///    - Same solver and conventions as YIELD_TO_MATURITY.
    ///    - PRESENT_VALUE, MACAULAY_DURATION, MODIFIED_DURATION and CONVEXITY for TIPS
    ///      are computed at this real yield on the inflation-adjusted cash flows.
    ///
    /// Applicability: TIPS only. For nominal bonds, returns the same value as YTM.
    /// Units: Decimal (0-1 scale; e.g. 0.02 = 2.00% real annual yield).
    RealYield = 10,
    /// The inflation-adjusted principal of a TIPS bond, reflecting the cumulative
    /// change in the Consumer Price Index (CPI) since the bond's issuance.
    ///
    /// Formula:
    ///    index_ratio = INDEX_RATIO = reference_cpi / base_cpi
    ///    adjusted_principal = max(face_value * index_ratio, face_value)
    ///    The max() enforces the deflation floor: at maturity, TIPS redeem at no less
    ///    than the original face value, even if CPI has fallen. The floor applies
    ///    to this measure only; INDEX_RATIO and MARKET_VALUE are unfloored.
    ///
    /// Model assumptions:
    ///    - Uses base_cpi from security.tips_extension and the reference CPI from
    ///      TipsInput.cpi (see REFERENCE_CPI).
    ///    - Deflation floor applies only to the principal at maturity; interim coupons
    ///      use the raw (potentially deflated) adjusted principal.
    ///
    /// Applicability: TIPS only.
    /// Units: Dollars (e.g. 103.36 for face=100 with 3.36% cumulative inflation).
    InflationAdjustedPrincipal = 11,
    /// Requests the full schedule of future cashflows for a bond or TIPS.
    /// When this measure is included in the request, the ValuationResponseProto will
    /// populate the `cashflows` repeated field with one CashflowProto per payment period.
    ///
    /// Each CashflowProto contains:
    ///    - cashflow_date: the payment date
    ///    - fv_amount: the undiscounted (future) value of the cashflow
    ///    - pv_amount: the cashflow discounted to settlement at the bond's YTM
    ///    - coupon_rate: the annualized coupon rate for this period (constant for
    ///      fixed-rate bonds; reference_rate + spread for FRNs)
    ///
    /// The sum of all pv_amounts equals the PRESENT_VALUE measure (three-way invariant).
    ///
    /// Model assumptions: Same as PRESENT_VALUE.
    /// Applicability: Bond, TIPS, FRN.
    /// Units: fv_amount and pv_amount in dollars; coupon_rate as percentage.
    PresentValueCashflows = 12,
    /// The discount margin of a Floating Rate Note (FRN) — the spread over the
    /// reference rate at which the market discounts the FRN's projected cashflows
    /// to arrive at its current price. This is the FRN analogue of YTM.
    ///
    /// Formula:
    ///    Solve for DM such that:
    ///    price = Sum_{t=1}^{N} [(R + QM)/m * FV / (1 + (R + DM)/m)^t]
    ///          + FV / (1 + (R + DM)/m)^N
    ///    Where R = reference rate, QM = quoted margin (fixed spread), FV = face value,
    ///    m = payment frequency, N = number of remaining periods.
    ///
    /// Solver: Newton-Raphson — same solver as YTM (ytm_solver.rs). Solve for the
    ///    periodic discount rate, then extract DM = (solved_rate * m) - R.
    ///
    /// Model assumptions:
    ///    - Flat forward rates: all future reference rate fixings are assumed equal to
    ///      the current observation of R. This is the standard FRN simplification.
    ///    - When DM = QM, price = par (100) on a reset date.
    ///    - When DM > QM, price < par (discount); when DM < QM, price > par (premium).
    ///
    /// Applicability: FRN only. For fixed-rate bonds, use YIELD_TO_MATURITY.
    /// Units: Decimal (0-1 scale; e.g. 0.0075 = 75 basis points).
    DiscountMargin = 13,
    /// The sensitivity of an FRN's price to a 1 basis point change in the discount
    /// margin. This is the primary risk measure for FRNs, analogous to modified
    /// duration for fixed-rate bonds but measuring spread risk rather than rate risk.
    ///
    /// Formula (numerical differentiation):
    ///    SpreadDuration = -(1/P) * dP/dDM
    ///                   ≈ (P_down - P_up) / (2 * 0.0001 * P_base)
    ///    Where P_down and P_up are the FRN prices when DM is bumped down and up by 1bp.
    ///
    /// For a 2-year quarterly FRN at par, spread duration ≈ 1.90 years.
    /// This is approximately equal to the weighted average time to maturity.
    ///
    /// Model assumptions:
    ///    - Same flat-forward assumption as DISCOUNT_MARGIN.
    ///    - Uses a symmetric 1bp bump for numerical differentiation.
    ///    - Interest rate duration of an FRN is near-zero (≈ time to next reset);
    ///      spread duration captures the economically significant risk.
    ///
    /// Applicability: FRN only. For fixed-rate bonds, use MACAULAY_DURATION.
    /// Units: Years (e.g. 1.90 = a 1bp spread widening causes ~1.90bp price decline).
    SpreadDuration = 14,
    /// The par yield at a given maturity point on the yield curve. The par yield is
    /// the coupon rate at which a bond would trade at par (price = 100) for a given
    /// maturity. This is the most commonly quoted yield curve.
    ///
    /// Formula:
    ///    For each maturity point, the par yield is the coupon rate c such that:
    ///    100 = Sum_{t=1}^{N} [c/m / (1 + r_t)^t] + 100 / (1 + r_N)^N
    ///    Where r_t are spot rates, m = coupon frequency, N = number of periods.
    ///
    ///    In practice, for on-the-run bonds, par yield ≈ YTM when the bond trades
    ///    near par. The par yield curve is bootstrapped from observed bond prices.
    ///
    /// Model assumptions:
    ///    - Coupon frequency matches the market convention (semiannual for US Treasuries).
    ///    - Interpolation between observed maturities uses the method specified in
    ///      the CurveRequestProto (linear by default).
    ///
    /// Applicability: Bond, TIPS (real par yield curve).
    ///    Not applicable to FRN, Equity, or Cash.
    /// Units: Decimal (0-1 scale; e.g. 0.045 = 4.50% annual).
    ParYield = 15,
    /// The spot (zero-coupon) yield at a given maturity. The spot rate is the yield
    /// on a zero-coupon bond maturing at that point — it represents the pure time
    /// value of money with no reinvestment assumption.
    ///
    /// Formula:
    ///    Bootstrapped from the par yield curve:
    ///    P = 100 / (1 + s_N)^N  →  s_N = (100 / P)^(1/N) - 1
    ///    Where s_N is the N-period spot rate, P is the zero-coupon bond price
    ///    implied by stripping coupons from the par curve.
    ///
    ///    For the first period, spot rate = par yield. For subsequent periods,
    ///    the bootstrap solves:
    ///    100 = Sum_{t=1}^{N-1} [c/m / (1 + s_t)^t] + (100 + c/m) / (1 + s_N)^N
    ///    for s_N, using previously computed spot rates s_1..s_{N-1}.
    ///
    /// Model assumptions:
    ///    - Requires a complete par yield curve as input (no gaps).
    ///    - Bootstrap assumes exact coupon dates (no day-count adjustments).
    ///
    /// Applicability: Derived from Bond par curve. Used for discounting cashflows
    ///    and computing forward rates.
    /// Units: Decimal (0-1 scale; e.g. 0.046 = 4.60% annual).
    SpotYield = 16,
    /// The forward yield between two future dates, implied by the spot curve.
    /// The forward rate f(t1, t2) is the rate agreed today for borrowing/lending
    /// between future times t1 and t2.
    ///
    /// Formula:
    ///    f(t1, t2) = [(1 + s_{t2})^{t2} / (1 + s_{t1})^{t1}]^{1/(t2 - t1)} - 1
    ///    Where s_t are spot rates for maturities t1 and t2.
    ///
    ///    For example, the 1-year forward rate 1 year from now (1y1y) is:
    ///    f(1,2) = [(1 + s_2)^2 / (1 + s_1)]^1 - 1
    ///
    /// Model assumptions:
    ///    - Derived from the spot curve (which is bootstrapped from par).
    ///    - Assumes no arbitrage between spot and forward rates.
    ///    - The forward period is defined by adjacent tenor points in the
    ///      CurveRequestProto.
    ///
    /// Applicability: Derived from Bond spot curve. Used for rate expectations
    ///    and forward-starting instrument pricing.
    /// Units: Decimal (0-1 scale; e.g. 0.048 = 4.80% annual forward rate).
    ForwardYield = 17,
    /// The profit or loss on a position relative to its cost basis.
    ///
    /// Formula:
    ///    ProfitLoss = MarketValue - (UnadjustedCostBasis / d * DirectedQuantity)
    ///    Where d = 100 for par-quoted securities (bonds, TIPS, FRNs) and
    ///    d = 1 for dollar-quoted securities (equities, cash).
    ///
    /// Example (bond): MV=19,000, UCB=90 (% of par), qty=20000 face →
    ///    ProfitLoss = 19000 - (90 / 100 * 20000) = 19000 - 18000 = 1,000.
    /// Example (equity): MV=5,500, UCB=50 (dollars per share), qty=100 →
    ///    ProfitLoss = 5500 - (50 / 1 * 100) = 5500 - 5000 = 500.
    ///
    /// The measure is absent, never 0, when MarketValue, UnadjustedCostBasis
    /// or DirectedQuantity is unavailable.
    ///
    /// Formula (TIPS): replaces the formula above for TIPS. Nominal and clean,
    ///    with both sides index-adjusted (LM-405):
    ///      MarketSide = clean_price / 100 * IndexRatio(valuation date) * directed_quantity
    ///      CostSide   = sum over the open lots i in TipsInput.cost_basis.lots of
    ///                   price_i / 100 * IndexRatio(S_i) * face_i
    ///      ProfitLoss = MarketSide - CostSide
    ///    MarketSide: the real clean price (TipsInput.clean_price) scaled by
    ///      INDEX_RATIO for the valuation date. It equals MARKET_VALUE for TIPS.
    ///    price_i: the lot's real purchase price per 100 face (TaxLotProto.price).
    ///    face_i: the open lot's remaining quantity (TaxLotProto.open_quantity),
    ///      in original (unadjusted) face units.
    ///    S_i: the lot's settlement date, TaxLotProto.open_date plus the product's
    ///      settlement lag (T+1 business day for Treasuries). valuation-service
    ///      owns the lag; lots carry no settlement field.
    ///    IndexRatio(S_i): REFERENCE_CPI's daily interpolation with S_i as the
    ///      settlement date, from the CPI-U readings for months L-3 and L-2 of
    ///      S_i's month L in TipsInput.cpi.readings, divided by base_cpi, and
    ///      rounded as REFERENCE_CPI and INDEX_RATIO are.
    ///    Accrued interest is excluded on both sides.
    ///
    /// Absent (TIPS): the measure is absent, never 0 and never the real-price
    ///    fallback (the UnadjustedCostBasis formula above), when:
    ///    - there are no lots (TipsInput.cost_basis unset or its lots empty);
    ///    - a lot has no open_date;
    ///    - a needed CPI-U month is missing: L-3 or L-2 of any lot's settlement
    ///      month. TipsInput.cpi with reference_cpi carries no lot months, so the
    ///      measure is absent then. (A missing m-3 or m-2 of the valuation month
    ///      makes the whole request invalid; see TipsInput.cpi.)
    ///
    /// Rounding (TIPS): 31 CFR 356 Appendix B. Each reference CPI and each
    ///    index ratio is rounded to 5 decimals (half up). Project rule, not
    ///    Appendix B text: MarketSide and CostSide (after the sum) are each
    ///    rounded to cents, and ProfitLoss is the difference of the rounded sides.
    ///
    /// Example (TIPS): 912810RL4, 0.750% due 2045-02-15, base_cpi 235.48150.
    ///    Lot: face 100,000, real price 68.1875, open_date 2026-07-27, settling
    ///      2026-07-28. CPI-U April 2026 333.020, May 2026 335.123 →
    ///      RefCPI = 333.020 + 27/31 * (335.123 - 333.020) = 334.85165,
    ///      IndexRatio = 334.85165 / 235.48150 = 1.42199,
    ///      CostSide = 68.1875 / 100 * 1.42199 * 100,000 = 96,961.94.
    ///    Valuation 2026-10-28, clean_price 67.625. CPI-U July 2026 333.918,
    ///      August 2026 334.980 →
    ///      RefCPI = 333.918 + 27/31 * (334.980 - 333.918) = 334.84297,
    ///      IndexRatio = 334.84297 / 235.48150 = 1.42195,
    ///      MarketSide = 67.625 / 100 * 1.42195 * 100,000 = 96,159.37.
    ///    ProfitLoss = 96,159.37 - 96,961.94 = -802.57.
    ///
    /// Applicability: All security types.
    /// Units: Dollars (or settlement currency).
    ProfitLoss = 18,
    /// The profit or loss as a percentage of the original cost basis.
    ///
    /// Formula:
    ///    ProfitLossPercent = ProfitLoss / (UnadjustedCostBasis / d * DirectedQuantity)
    ///    Where d = 100 for par-quoted securities (bonds, TIPS, FRNs) and
    ///    d = 1 for dollar-quoted securities (equities, cash).
    ///
    /// The measure is absent, never 0, when MarketValue, UnadjustedCostBasis
    /// or DirectedQuantity is unavailable.
    ///
    /// Formula (TIPS): replaces the formula above for TIPS (LM-405):
    ///      ProfitLossPercent = ProfitLoss / CostSide
    ///    ProfitLoss and CostSide are PROFIT_LOSS (TIPS): nominal and clean, with
    ///    the market side at INDEX_RATIO for the valuation date and each open
    ///    lot's real price at the index ratio for its settlement date
    ///    (TaxLotProto.open_date plus the product's settlement lag). Accrued
    ///    interest is excluded on both sides.
    ///
    /// Absent (TIPS): the measure is absent, never 0 and never the real-price
    ///    fallback (the UnadjustedCostBasis formula above), when:
    ///    - there are no lots (TipsInput.cost_basis unset or its lots empty);
    ///    - a lot has no open_date;
    ///    - a needed CPI-U month is missing (see PROFIT_LOSS).
    ///
    /// Rounding (TIPS): ProfitLoss and CostSide are rounded as in PROFIT_LOSS:
    ///    31 CFR 356 Appendix B, reference CPI and index ratio to 5 decimals,
    ///    then each side to cents (a project rule). The ratio is not rounded
    ///    further.
    ///
    /// Example (TIPS): 912810RL4 (see PROFIT_LOSS): cost 96,961.94,
    ///    market 96,159.37, P&L -802.57 →
    ///    ProfitLossPercent = -802.57 / 96,961.94 = -0.0082772 (rounded here only).
    ///
    /// Applicability: All security types.
    /// Units: Decimal (0-1 scale; e.g. 0.05 = 5.00% gain).
    ProfitLossPercent = 19,
    /// The coupon interest accrued from the last coupon date up to (but not
    /// including) the settlement date, per the security's day count. Earned but not
    /// yet received.
    ///
    /// Fixed-coupon bonds and TIPS:
    ///    AccruedInterest = (coupon_rate / coupon_frequency) * (days_since_last_coupon / days_in_period)
    ///                      * directed_quantity
    ///    Day count: the security's (Actual/Actual (ICMA) for US Treasuries).
    ///
    /// Treasury FRNs: the sum, over each day from the last coupon date to
    /// settlement, of that day's (13-week bill index fixing + spread) / 360 on face:
    ///    AccruedInterest = Σ_{each day} (index_fixing_d + spread) / 360 * directed_quantity
    ///    where directed_quantity is the position's face.
    ///    The fixings are the ones supplied in the request; no curve is used.
    ///
    /// Applicability: Bond, TIPS, FRN (coupon-bearing securities).
    ///    Returns null/zero for Equity, Cash, and zero-coupon bonds.
    /// Units: Dollars (absolute dollar amount for the position).
    AccruedInterest = 20,
    /// The second derivative of a bond's price with respect to yield, normalised by price.
    /// Convexity measures how the duration of a bond changes as yield changes — a bond
    /// with higher convexity gains more in price when yields fall and loses less when
    /// yields rise, compared to a bond with lower convexity of equal duration.
    ///
    /// Formula:
    ///    Convexity = (1/P) × Σ_{t=1}^{N} [CF_t × t × (t+1) / (1+y/n)^(t+2)] / n²
    ///
    ///    Equivalently, in terms of periodic-discount PVs:
    ///    Convexity = Σ_{t=1}^{N} [t(t+1) × PV_t] / (P_dollar × n² × (1+r)²)
    ///    Where r = y/n (periodic yield), P_dollar = dollar price,
    ///    PV_t = CF_t / (1+r)^t, n = coupon frequency (periods per year).
    ///
    /// Model assumptions:
    ///    - Same as MACAULAY_DURATION (flat yield curve, YTM-based discounting).
    ///    - For TIPS: y = REAL_YIELD and CF_t are the inflation-adjusted cash flows.
    ///    - For FRN: uses flat-forwards effective YTM (same model as PRESENT_VALUE).
    ///    - Settlement on a coupon date (integer period exponents).
    ///
    /// Applicability: Bond, TIPS, FRN. UNIMPLEMENTED for Equity and Cash.
    /// Units: Years² (e.g. 20.5 = 20.5 years²).
    Convexity = 21,
    /// The full (invoice) price of a bond including accrued interest, expressed as a
    /// percentage of face value.
    ///
    /// Formula:
    ///    DirtyPrice = CLEAN_PRICE + accrued_interest_per_bond / face_value * 100
    ///    where CLEAN_PRICE is the supplied market clean price and
    ///    accrued_interest_per_bond is ACCRUED_INTEREST for one bond of face_value,
    ///    as of the settlement date.
    ///    The result is a percentage of par, per bond, and is never scaled by quantity.
    ///
    /// Applicability: Bond, TIPS, FRN. UNIMPLEMENTED for Equity and Cash.
    /// Units: Percentage of par (e.g. 99.5 = 99.5% of par).
    DirtyPrice = 22,
    /// The market clean price per 100 of face (excluding accrued interest), as
    /// supplied in the request — e.g. the FedInvest end-of-day price via price-service.
    ///
    /// An input, never computed: valuation-service returns UNIMPLEMENTED for it.
    ///
    /// Units: Percentage of par (e.g. 98.75 = 98.75% of par).
    CleanPrice = 23,
    /// Modified Duration = MacaulayDuration / (1 + ytm/coupon_frequency).
    ///
    /// Measures the percentage price change of a bond for a 1% (100bp) change in yield.
    /// Unlike Macaulay Duration (which is expressed in years), Modified Duration is a
    /// direct measure of price sensitivity: a bond with ModifiedDuration=5 will move
    /// approximately 5% in price for a 100bp parallel shift in yield.
    ///
    /// Formula:
    ///    ModifiedDuration = MacaulayDuration / (1 + ytm/n)
    ///    where ytm = yield to maturity (annual), n = coupon periods per year.
    ///    For TIPS, ytm = REAL_YIELD (on the inflation-adjusted cash flows).
    ///
    /// Applicability: Bond, TIPS, FRN. UNIMPLEMENTED for Equity and Cash.
    /// Units: Years (dimensionally equivalent to years, interpreted as % per 100bp).
    ModifiedDuration = 24,
    /// DV01 (Dollar Value of 01) = the dollar P&L impact of a 1bp (0.01%) yield increase.
    ///
    /// Formula:
    ///    DV01 = ModifiedDuration × MarketValue × 0.0001
    ///
    /// For a $1M market value position with ModifiedDuration=5:
    ///    DV01 = 5 × 1,000,000 × 0.0001 = $500 per bp
    ///
    /// Applicability: Bond, TIPS, FRN. UNIMPLEMENTED for Equity and Cash.
    /// Units: Dollars per basis point.
    Dv01 = 25,
    /// U.S. Treasury Bill discount-basis yield. The market convention used by
    /// TreasuryDirect auction results ("High discount rate"), Bloomberg TBILL
    /// screens, and most short-tenor money-market quotes.
    ///
    /// Formula:
    ///    DiscountYield = (F - P) / F × 360 / days_to_maturity
    ///    Where F = face value (par), P = dollar price, day count is Actual/360.
    ///
    /// Example: 13W TBill 912797TW7 priced at 99.082, days_to_maturity=91:
    ///    DiscountYield = (100 - 99.082) / 100 × 360 / 91 = 0.0363 = 3.63%
    ///
    /// Distinct from YIELD_TO_MATURITY which uses the annual-compound convention
    /// (F/P)^(1/years) - 1; the two differ by 5-14bp at typical TBill tenors.
    /// The U.S. Treasury publishes BOTH conventions for each auction plus
    /// BOND_EQUIVALENT_YIELD; the industry-standard wire format for TBills is
    /// DiscountYield. See #209.
    ///
    /// Model assumptions:
    ///    - Simple (non-compounded) discount basis — standard U.S. money-market.
    ///    - 360-day year (Actual/360 day count).
    ///    - Assumes the security has a defined maturity_date and face_value;
    ///      null for instruments where days_to_maturity is undefined.
    ///
    /// Applicability: Zero-coupon short-tenor securities — Tbill, principal-only
    ///    Strips with <1yr remaining. Returns null/error for other product types.
    /// Units: Decimal (0-1 scale; e.g. 0.0363 = 3.63%).
    DiscountYield = 26,
    /// Bond-Equivalent Yield (BEY) for U.S. Treasury Bills — also known as the
    /// "investment rate" published alongside DISCOUNT_YIELD on TreasuryDirect.
    /// The conventional way to compare TBill returns to coupon-bearing bond
    /// yields (which conventionally use a 365-day year).
    ///
    /// Formula:
    ///    BondEquivalentYield = (F - P) / P × 365 / days_to_maturity
    ///    Where F = face value (par), P = dollar price, day count is Actual/365.
    ///
    /// Example: 13W TBill 912797TW7 priced at 99.082, days_to_maturity=91:
    ///    BEY = (100 - 99.082) / 99.082 × 365 / 91 = 0.0371 = 3.71%
    ///
    /// Distinct from DISCOUNT_YIELD which uses 360-day simple discount; BEY's
    /// dividing-by-P (not F) and 365-day basis make it directly comparable to
    /// YTM on a coupon-bearing Treasury Note of equivalent tenor. The Treasury
    /// calls this the "investment rate" on auction results. See #209.
    ///
    /// Model assumptions:
    ///    - Simple (non-compounded) basis.
    ///    - 365-day year (Actual/365 day count).
    ///    - Same applicability constraints as DISCOUNT_YIELD.
    ///
    /// Applicability: Zero-coupon short-tenor securities — Tbill, principal-only
    ///    Strips with <1yr remaining. Returns null/error for other product types.
    /// Units: Decimal (0-1 scale; e.g. 0.0371 = 3.71%).
    BondEquivalentYield = 27,
    /// The reference CPI of a TIPS for the settlement date (the UTC date of
    /// ValuationRequestProto.asof_datetime), the numerator of INDEX_RATIO.
    ///
    /// Formula:
    ///    With TipsInput.cpi.reference_cpi: the value as given.
    ///    With TipsInput.cpi.readings:
    ///      RefCPI = CPI(m-3) + (d - 1) / days_in_month * (CPI(m-2) - CPI(m-3))
    ///    Where m is the settlement month, the month of the UTC date of
    ///    ValuationRequestProto.asof_datetime (asof_datetime.timestamp in UTC;
    ///    time_zone is not used), d the settlement day of month,
    ///    days_in_month the number of days in month m, and CPI(m-k) the reading
    ///    for the month k months before m.
    ///
    /// Example: settlement 2026-07-16, CPI(April)=320.0, CPI(May)=321.5 →
    ///    RefCPI = 320.0 + 15/31 * (321.5 - 320.0) = 320.72580645... → 320.72581.
    ///
    /// Model assumptions:
    ///    - Rounding: with readings, RefCPI is rounded to 5 decimals (half up)
    ///      per 31 CFR 356 Appendix B. A given reference_cpi is used as-is.
    ///    - With readings, months m-3 and m-2 are required: the request is
    ///      rejected when either is missing. Extra months (e.g. those lot
    ///      settlement dates need for PROFIT_LOSS) are allowed and ignored here.
    ///      A duplicate (year, month) or a month outside 1-12 is rejected.
    ///    - The measure is absent when no CPI is given.
    ///
    /// Applicability: TIPS only.
    /// Units: Index points (e.g. 310.326).
    ReferenceCpi = 28,
    /// The index ratio of a TIPS for the settlement date.
    ///
    /// Formula:
    ///    IndexRatio = REFERENCE_CPI / security.tips_extension.base_cpi
    ///
    /// Example: RefCPI=312.0, base_cpi=260.0 → IndexRatio = 1.2.
    ///
    /// Model assumptions:
    ///    - Rounding: computed from the rounded REFERENCE_CPI and rounded to
    ///      5 decimals (half up) per 31 CFR 356 Appendix B. Every measure that
    ///      uses the index ratio (MARKET_VALUE, ADJUSTED_COST_BASIS,
    ///      INFLATION_ADJUSTED_PRINCIPAL, REAL_YIELD, PRESENT_VALUE, PROFIT_LOSS)
    ///      uses this rounded ratio.
    ///    - Unfloored: a ratio below 1 is returned as is. The deflation floor
    ///      belongs to INFLATION_ADJUSTED_PRINCIPAL only.
    ///    - The measure is absent when REFERENCE_CPI or base_cpi is absent.
    ///
    /// Applicability: TIPS only.
    /// Units: Dimensionless ratio (e.g. 1.2 = 20% cumulative inflation since base).
    IndexRatio = 29,
}
impl MeasureProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            MeasureProto::UnknownMeasure => "UNKNOWN_MEASURE",
            MeasureProto::DirectedQuantity => "DIRECTED_QUANTITY",
            MeasureProto::MarketValue => "MARKET_VALUE",
            MeasureProto::UnadjustedCostBasis => "UNADJUSTED_COST_BASIS",
            MeasureProto::AdjustedCostBasis => "ADJUSTED_COST_BASIS",
            MeasureProto::CurrentYield => "CURRENT_YIELD",
            MeasureProto::YieldToMaturity => "YIELD_TO_MATURITY",
            MeasureProto::MacaulayDuration => "MACAULAY_DURATION",
            MeasureProto::PresentValue => "PRESENT_VALUE",
            MeasureProto::RealYield => "REAL_YIELD",
            MeasureProto::InflationAdjustedPrincipal => "INFLATION_ADJUSTED_PRINCIPAL",
            MeasureProto::PresentValueCashflows => "PRESENT_VALUE_CASHFLOWS",
            MeasureProto::DiscountMargin => "DISCOUNT_MARGIN",
            MeasureProto::SpreadDuration => "SPREAD_DURATION",
            MeasureProto::ParYield => "PAR_YIELD",
            MeasureProto::SpotYield => "SPOT_YIELD",
            MeasureProto::ForwardYield => "FORWARD_YIELD",
            MeasureProto::ProfitLoss => "PROFIT_LOSS",
            MeasureProto::ProfitLossPercent => "PROFIT_LOSS_PERCENT",
            MeasureProto::AccruedInterest => "ACCRUED_INTEREST",
            MeasureProto::Convexity => "CONVEXITY",
            MeasureProto::DirtyPrice => "DIRTY_PRICE",
            MeasureProto::CleanPrice => "CLEAN_PRICE",
            MeasureProto::ModifiedDuration => "MODIFIED_DURATION",
            MeasureProto::Dv01 => "DV01",
            MeasureProto::DiscountYield => "DISCOUNT_YIELD",
            MeasureProto::BondEquivalentYield => "BOND_EQUIVALENT_YIELD",
            MeasureProto::ReferenceCpi => "REFERENCE_CPI",
            MeasureProto::IndexRatio => "INDEX_RATIO",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_MEASURE" => Some(Self::UnknownMeasure),
            "DIRECTED_QUANTITY" => Some(Self::DirectedQuantity),
            "MARKET_VALUE" => Some(Self::MarketValue),
            "UNADJUSTED_COST_BASIS" => Some(Self::UnadjustedCostBasis),
            "ADJUSTED_COST_BASIS" => Some(Self::AdjustedCostBasis),
            "CURRENT_YIELD" => Some(Self::CurrentYield),
            "YIELD_TO_MATURITY" => Some(Self::YieldToMaturity),
            "MACAULAY_DURATION" => Some(Self::MacaulayDuration),
            "PRESENT_VALUE" => Some(Self::PresentValue),
            "REAL_YIELD" => Some(Self::RealYield),
            "INFLATION_ADJUSTED_PRINCIPAL" => Some(Self::InflationAdjustedPrincipal),
            "PRESENT_VALUE_CASHFLOWS" => Some(Self::PresentValueCashflows),
            "DISCOUNT_MARGIN" => Some(Self::DiscountMargin),
            "SPREAD_DURATION" => Some(Self::SpreadDuration),
            "PAR_YIELD" => Some(Self::ParYield),
            "SPOT_YIELD" => Some(Self::SpotYield),
            "FORWARD_YIELD" => Some(Self::ForwardYield),
            "PROFIT_LOSS" => Some(Self::ProfitLoss),
            "PROFIT_LOSS_PERCENT" => Some(Self::ProfitLossPercent),
            "ACCRUED_INTEREST" => Some(Self::AccruedInterest),
            "CONVEXITY" => Some(Self::Convexity),
            "DIRTY_PRICE" => Some(Self::DirtyPrice),
            "CLEAN_PRICE" => Some(Self::CleanPrice),
            "MODIFIED_DURATION" => Some(Self::ModifiedDuration),
            "DV01" => Some(Self::Dv01),
            "DISCOUNT_YIELD" => Some(Self::DiscountYield),
            "BOND_EQUIVALENT_YIELD" => Some(Self::BondEquivalentYield),
            "REFERENCE_CPI" => Some(Self::ReferenceCpi),
            "INDEX_RATIO" => Some(Self::IndexRatio),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MeasureMapEntry {
    #[prost(enumeration = "MeasureProto", tag = "1")]
    pub measure: i32,
    #[prost(message, optional, tag = "2")]
    pub measure_decimal_value: ::core::option::Option<super::util::DecimalValueProto>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FieldMapEntry {
    #[prost(enumeration = "FieldProto", tag = "1")]
    pub field: i32,
    /// Used for position filters, but not for responses
    #[prost(enumeration = "PositionFilterOperator", tag = "20")]
    pub operator: i32,
    #[prost(oneof = "field_map_entry::FieldMapValueOneOf", tags = "4, 5, 6")]
    pub field_map_value_one_of: ::core::option::Option<
        field_map_entry::FieldMapValueOneOf,
    >,
}
/// Nested message and enum types in `FieldMapEntry`.
pub mod field_map_entry {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum FieldMapValueOneOf {
        /// If the field is a 'complex' proto type (e.g. a full enum) we serialize the enum and wrap it in an Any. You can think of the Any as a string describing the type, and a binary of the proto itself
        #[prost(message, tag = "4")]
        FieldValuePacked(::prost_types::Any),
        /// If the field is an enum type, then we use the number to denote which value it is
        #[prost(int32, tag = "5")]
        EnumValue(i32),
        /// If the field is a string type, we just serialize the string (packing has an overhead)
        #[prost(string, tag = "6")]
        StringValue(::prost::alloc::string::String),
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PositionFilterOperator {
    UnknownOperator = 0,
    Equals = 1,
    NotEquals = 2,
    LessThan = 3,
    LessThanOrEquals = 4,
    MoreThan = 5,
    MoreThanOrEquals = 6,
}
impl PositionFilterOperator {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PositionFilterOperator::UnknownOperator => "UNKNOWN_OPERATOR",
            PositionFilterOperator::Equals => "EQUALS",
            PositionFilterOperator::NotEquals => "NOT_EQUALS",
            PositionFilterOperator::LessThan => "LESS_THAN",
            PositionFilterOperator::LessThanOrEquals => "LESS_THAN_OR_EQUALS",
            PositionFilterOperator::MoreThan => "MORE_THAN",
            PositionFilterOperator::MoreThanOrEquals => "MORE_THAN_OR_EQUALS",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_OPERATOR" => Some(Self::UnknownOperator),
            "EQUALS" => Some(Self::Equals),
            "NOT_EQUALS" => Some(Self::NotEquals),
            "LESS_THAN" => Some(Self::LessThan),
            "LESS_THAN_OR_EQUALS" => Some(Self::LessThanOrEquals),
            "MORE_THAN" => Some(Self::MoreThan),
            "MORE_THAN_OR_EQUALS" => Some(Self::MoreThanOrEquals),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PositionProto {
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    #[prost(enumeration = "PositionViewProto", tag = "10")]
    pub position_view: i32,
    #[prost(enumeration = "PositionTypeProto", tag = "11")]
    pub position_type: i32,
    #[prost(message, repeated, tag = "20")]
    pub measures: ::prost::alloc::vec::Vec<MeasureMapEntry>,
    #[prost(message, repeated, tag = "21")]
    pub fields: ::prost::alloc::vec::Vec<FieldMapEntry>,
    /// The base/reporting currency for monetary measures in this position.
    /// Set to the portfolio's base currency (e.g. USD cash security).
    /// Allows the UI to display the currency alongside MARKET_VALUE and other measures.
    #[prost(message, optional, tag = "22")]
    pub reporting_currency: ::core::option::Option<super::security::SecurityProto>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PositionViewProto {
    UnknownPositionView = 0,
    DefaultView = 1,
    StrategyView = 2,
}
impl PositionViewProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PositionViewProto::UnknownPositionView => "UNKNOWN_POSITION_VIEW",
            PositionViewProto::DefaultView => "DEFAULT_VIEW",
            PositionViewProto::StrategyView => "STRATEGY_VIEW",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_POSITION_VIEW" => Some(Self::UnknownPositionView),
            "DEFAULT_VIEW" => Some(Self::DefaultView),
            "STRATEGY_VIEW" => Some(Self::StrategyView),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PositionTypeProto {
    UnknownPositionType = 0,
    Transaction = 1,
    TaxLot = 2,
}
impl PositionTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PositionTypeProto::UnknownPositionType => "UNKNOWN_POSITION_TYPE",
            PositionTypeProto::Transaction => "TRANSACTION",
            PositionTypeProto::TaxLot => "TAX_LOT",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_POSITION_TYPE" => Some(Self::UnknownPositionType),
            "TRANSACTION" => Some(Self::Transaction),
            "TAX_LOT" => Some(Self::TaxLot),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PositionFilterProto {
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    #[prost(message, repeated, tag = "21")]
    pub filters: ::prost::alloc::vec::Vec<FieldMapEntry>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PositionStatusProto {
    Unknown = 0,
    /// Hypothetical status means a transaction, tax lot or position that may never occur. This can be used to understand how potential actions could impact a portfolio
    Hypothetical = 1,
    /// Intended status means a transaction, tax lot or position that is expected to occur if nothing changes. For example a fixed income bond that is expected to pay a coupon, or a security that is expected to mature in a specific point in the future
    Intended = 2,
    /// Executed status means a transaction, tax lot or position that is the result of a legally binding transaction
    Executed = 3,
}
impl PositionStatusProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PositionStatusProto::Unknown => "UNKNOWN",
            PositionStatusProto::Hypothetical => "HYPOTHETICAL",
            PositionStatusProto::Intended => "INTENDED",
            PositionStatusProto::Executed => "EXECUTED",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN" => Some(Self::Unknown),
            "HYPOTHETICAL" => Some(Self::Hypothetical),
            "INTENDED" => Some(Self::Intended),
            "EXECUTED" => Some(Self::Executed),
            _ => None,
        }
    }
}
/// One open tax lot of a holding.
///
/// The proto form of the tax lots ledger-models already computes in Java
/// (common.models.taxLot.TaxLotSummary). A domain model, not a request-only
/// input: CostBasisInput.lots carries it to valuation-service for
/// MeasureProto.ADJUSTED_COST_BASIS (LM-364).
/// See docs/adr/amortisation_elections.md.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TaxLotProto {
    /// the opening trade date
    #[prost(message, optional, tag = "1")]
    pub open_date: ::core::option::Option<super::util::LocalDateProto>,
    /// quantity still open, in the position's units (face value for bonds; TIPS: original face, not inflation-adjusted)
    #[prost(message, optional, tag = "2")]
    pub open_quantity: ::core::option::Option<super::util::DecimalValueProto>,
    /// purchase price per 100 face, clean; TIPS: the real (unadjusted) price
    #[prost(message, optional, tag = "3")]
    pub price: ::core::option::Option<super::util::DecimalValueProto>,
}
