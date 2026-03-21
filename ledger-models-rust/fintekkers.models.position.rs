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
    /// Reserved for future use. The cost basis adjusted for amortization of premium,
    /// accretion of discount, or corporate actions (e.g. stock splits, return of capital).
    ///
    /// Not currently implemented.
    /// Applicability: Bond, TIPS, FRN, Equity.
    /// Units: Quoted price (% of par for bonds; dollar price for equities).
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
    ///
    /// Solver: Newton-Raphson iteration (ytm_solver.rs) with the linear approximation
    ///    YTM ≈ (annual_coupon + (F - P) / years) / ((F + P) / 2)
    ///    as the initial guess. Converges to the exact YTM where PV = price.
    ///
    /// Model assumptions:
    ///    - Coupon reinvestment at the YTM rate (standard bond math assumption).
    ///    - For TIPS: uses inflation-adjusted principal for cashflows, but the input
    ///      price is real — yielding a "mixed" rate, not the true real yield. Use
    ///      REAL_YIELD for the economically correct TIPS yield.
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
    ///    - For TIPS: cashflows use inflation-adjusted principal; discount rate is the
    ///      Newton-Raphson-solved rate equating nominal cashflows to the real price.
    ///
    /// Applicability: Bond, TIPS. For FRN, PV uses the discount margin framework instead.
    /// Units: Quoted price (% of par; e.g. 95.00 = $95 per $100 face).
    PresentValue = 9,
    /// The yield of a TIPS bond in real (inflation-adjusted) terms. This is the return
    /// an investor earns above the rate of inflation.
    ///
    /// Formula: Currently delegates to the YTM calculator, which uses inflation-adjusted
    ///    principal for cashflows. For a par TIPS (real coupon = real yield), the solver
    ///    finds a "mixed" rate rather than the true real yield (see YIELD_TO_MATURITY notes).
    ///
    /// Model assumptions:
    ///    - Same as YIELD_TO_MATURITY but applied to TIPS securities.
    ///    - Known limitation: the current implementation mixes real price with nominal
    ///      (inflation-adjusted) cashflows in the solver, which produces a rate that is
    ///      not the true real yield for non-par TIPS.
    ///
    /// Applicability: TIPS only. For nominal bonds, returns the same value as YTM.
    /// Units: Decimal (0-1 scale; e.g. 0.02 = 2.00% real annual yield).
    RealYield = 10,
    /// The inflation-adjusted principal of a TIPS bond, reflecting the cumulative
    /// change in the Consumer Price Index (CPI) since the bond's issuance.
    ///
    /// Formula:
    ///    index_ratio = current_cpi / base_cpi
    ///    adjusted_principal = max(face_value * index_ratio, face_value)
    ///    The max() enforces the deflation floor: at maturity, TIPS redeem at no less
    ///    than the original face value, even if CPI has fallen.
    ///
    /// Model assumptions:
    ///    - Uses the CPI values provided in the request (base_cpi on the security,
    ///      current_cpi on the cpi_price_input).
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
            _ => None,
        }
    }
}
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
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(enumeration = "PositionViewProto", tag = "10")]
    pub position_view: i32,
    #[prost(enumeration = "PositionTypeProto", tag = "11")]
    pub position_type: i32,
    #[prost(message, repeated, tag = "20")]
    pub measures: ::prost::alloc::vec::Vec<MeasureMapEntry>,
    #[prost(message, repeated, tag = "21")]
    pub fields: ::prost::alloc::vec::Vec<FieldMapEntry>,
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
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, repeated, tag = "21")]
    pub filters: ::prost::alloc::vec::Vec<FieldMapEntry>,
}
