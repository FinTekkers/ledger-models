/// Represents a single row in a bond's cashflow schedule.
/// Each row has a date, a present value (discounted to settlement),
/// and a future value (the nominal/undiscounted amount).
/// For TIPS, fv_amount is inflation-adjusted; see index_ratio.
///
/// Row rules (one rule for every product with a cashflow schedule: fixed
/// bonds, TIPS and FRNs):
/// - Each coupon payment is one row, with coupon_rate set.
/// - The principal repayment is its own row on its date, with coupon_rate
///    unset. This covers principal at maturity and any principal paydown.
///    Its fv_amount and pv_amount cover principal only.
/// - So one date can have two rows: the final coupon and the principal.
/// - The sum of pv_amount over all rows (coupon and principal) equals
///    PRESENT_VALUE.
/// See docs/adr/cashflow_principal_row.md.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CashflowProto {
    /// The date this cashflow occurs (coupon payment date, principal paydown
    /// date or maturity date). A date can carry both a coupon row and a
    /// principal row.
    #[prost(message, optional, tag = "1")]
    pub cashflow_date: ::core::option::Option<super::util::LocalDateProto>,
    /// Present value of this cashflow, discounted to the settlement date.
    /// A coupon row holds the coupon only; a principal row holds principal only.
    #[prost(message, optional, tag = "2")]
    pub pv_amount: ::core::option::Option<super::util::DecimalValueProto>,
    /// Future value of this cashflow (undiscounted, nominal amount).
    /// A coupon row holds the coupon only; a principal row holds principal only.
    #[prost(message, optional, tag = "3")]
    pub fv_amount: ::core::option::Option<super::util::DecimalValueProto>,
    /// The annualized coupon rate applied for this period (as a percentage, e.g. 5.25 = 5.25%).
    /// For fixed-rate bonds this is constant; for FRNs it is reference_rate + spread for the period.
    /// Set on every coupon row. Unset on a principal row (absent, never 0): an
    /// unset coupon_rate is how a consumer tells the principal row apart.
    #[prost(message, optional, tag = "4")]
    pub coupon_rate: ::core::option::Option<super::util::DecimalValueProto>,
    /// The currency this cashflow is denominated in (ISO 4217 alpha-3, e.g. "GBP").
    /// Allows cashflows to be self-describing without resolving the parent security.
    #[prost(message, optional, tag = "5")]
    pub currency: ::core::option::Option<super::util::CurrencyProto>,
    /// The index ratio applied to this row, a dimensionless ratio (1.25 =
    /// principal accreted by 25%). Set for TIPS rows only; absent for every
    /// other product. Absent when unset, never 0. On a TIPS principal row it is
    /// set the same way as on the coupon rows.
    ///    ratio(t) = INDEX_RATIO at settlement x (1 + rate/100)^y,
    /// where y = days from settlement to t / 365 (ACT/365) and rate is
    /// TipsInput.assumed_inflation_rate in percent a year. Without a rate, it
    /// is today's INDEX_RATIO.
    /// This is the unfloored ratio. The max(ratio, 1) floor applies only to
    /// principal at maturity, so the principal row's fv_amount can be above
    /// principal x ratio. See docs/adr/tips_assumed_inflation_rate.md.
    #[prost(message, optional, tag = "6")]
    pub index_ratio: ::core::option::Option<super::util::DecimalValueProto>,
}
