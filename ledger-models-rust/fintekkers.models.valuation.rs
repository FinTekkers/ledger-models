/// Represents a single cashflow in a bond's payment schedule.
/// Each cashflow has a date, a present value (discounted to settlement),
/// and a future value (the nominal/undiscounted amount).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CashflowProto {
    /// The date this cashflow occurs (coupon payment date or maturity date)
    #[prost(message, optional, tag = "1")]
    pub cashflow_date: ::core::option::Option<super::util::LocalDateProto>,
    /// Present value of this cashflow, discounted to the settlement date
    #[prost(message, optional, tag = "2")]
    pub pv_amount: ::core::option::Option<super::util::DecimalValueProto>,
    /// Future value of this cashflow (undiscounted, nominal amount)
    #[prost(message, optional, tag = "3")]
    pub fv_amount: ::core::option::Option<super::util::DecimalValueProto>,
    /// The annualized coupon rate applied for this period (as a percentage, e.g. 5.25 = 5.25%).
    /// For fixed-rate bonds this is constant; for FRNs it is reference_rate + spread for the period.
    #[prost(message, optional, tag = "4")]
    pub coupon_rate: ::core::option::Option<super::util::DecimalValueProto>,
}
