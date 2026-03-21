/// A single security+price pair representing one observed point on the curve.
/// For example, a 10-year US Treasury trading at 95.50.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurveInputProto {
    /// The bond security at this curve point.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// The observed market price for this security (quoted as % of par).
    #[prost(message, optional, tag = "2")]
    pub price: ::core::option::Option<super::super::models::price::PriceProto>,
}
/// Request to construct a yield curve from a set of bond prices.
///
/// The caller provides:
///    - A set of securities with their market prices (the curve inputs)
///    - The type of curve to compute (par, spot, or forward)
///    - The tenor points at which to interpolate the curve
///
/// The valuation service bootstraps the curve from the inputs and returns
/// yields at the requested tenor points.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurveRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The as-of datetime for the curve construction.
    #[prost(message, optional, tag = "10")]
    pub asof_datetime: ::core::option::Option<
        super::super::models::util::LocalTimestampProto,
    >,
    /// The curve type to compute: PAR_YIELD, SPOT_YIELD, or FORWARD_YIELD.
    /// Multiple types can be requested in a single call — the response will
    /// contain one CurveResultProto per requested type.
    #[prost(
        enumeration = "super::super::models::position::MeasureProto",
        repeated,
        tag = "20"
    )]
    pub curve_types: ::prost::alloc::vec::Vec<i32>,
    /// The input securities and their observed prices. These are the bonds
    /// from which the curve is constructed (e.g. on-the-run US Treasuries).
    /// Should be sorted by maturity for clarity, though the service will
    /// sort internally if needed.
    #[prost(message, repeated, tag = "30")]
    pub curve_inputs: ::prost::alloc::vec::Vec<CurveInputProto>,
    /// The tenor points (in years as decimal) at which to interpolate the curve.
    /// Examples: 0.25 (3M), 0.5 (6M), 1.0 (1Y), 2.0, 3.0, 5.0, 7.0, 10.0, 20.0, 30.0.
    /// If empty, the service returns yields only at the observed maturity points.
    #[prost(message, repeated, tag = "40")]
    pub tenor_points: ::prost::alloc::vec::Vec<
        super::super::models::util::DecimalValueProto,
    >,
}
/// A single point on the yield curve: a tenor and its corresponding yield.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurvePointProto {
    /// The tenor in years (e.g. 0.25 = 3 months, 2.0 = 2 years, 10.0 = 10 years).
    #[prost(message, optional, tag = "1")]
    pub tenor: ::core::option::Option<super::super::models::util::DecimalValueProto>,
    /// The yield at this tenor point (decimal, 0-1 scale; e.g. 0.045 = 4.50%).
    #[prost(message, optional, tag = "2")]
    pub r#yield: ::core::option::Option<super::super::models::util::DecimalValueProto>,
}
/// The computed yield curve for a single curve type (par, spot, or forward).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurveResultProto {
    /// Which curve type this result represents (PAR_YIELD, SPOT_YIELD, or FORWARD_YIELD).
    #[prost(enumeration = "super::super::models::position::MeasureProto", tag = "1")]
    pub curve_type: i32,
    /// The curve points, ordered by ascending tenor.
    #[prost(message, repeated, tag = "2")]
    pub points: ::prost::alloc::vec::Vec<CurvePointProto>,
}
/// Response from a curve construction request.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurveResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The original request, echoed back for correlation.
    #[prost(message, optional, tag = "10")]
    pub curve_request: ::core::option::Option<CurveRequestProto>,
    /// One result per requested curve_type. For example, if the request asked for
    /// both PAR_YIELD and SPOT_YIELD, this will contain two CurveResultProto entries.
    #[prost(message, repeated, tag = "20")]
    pub curve_results: ::prost::alloc::vec::Vec<CurveResultProto>,
    /// Errors and warnings. Examples:
    ///    Warning: "Tenor gap between 7Y and 20Y — interpolation may be unreliable"
    ///    Error: "Insufficient inputs: need at least 2 bonds to bootstrap a curve"
    #[prost(message, optional, tag = "30")]
    pub summary: ::core::option::Option<super::util::errors::SummaryProto>,
}
/// Developer notes. This will need some re-organization once we start thinking through
/// varied valuations (e.g. value over a time range, value multiple securities in the same
/// request/etc. For now, the caller will need to make individual requests.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValuationRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Only supports GET, since there is no backing store, so CREATE isn't relevant. SEARCH isn't relevant either.
    /// VALIDATE could be implemented later, e.g. if the caller wants to check their inputs are correct.
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    /// The list of measures to be generated by this request, e.g. MARKET_VALUE, CURRENT_YIELD, etc.
    #[prost(
        enumeration = "super::super::models::position::MeasureProto",
        repeated,
        tag = "30"
    )]
    pub measures: ::prost::alloc::vec::Vec<i32>,
    /// The full security object for which we are going to run the valuation
    #[prost(message, optional, tag = "20")]
    pub security_input: ::core::option::Option<
        super::super::models::security::SecurityProto,
    >,
    /// The positions we are going to value.
    #[prost(message, optional, tag = "21")]
    pub position_input: ::core::option::Option<
        super::super::models::position::PositionProto,
    >,
    /// The price we are going to use for the valuation.
    #[prost(message, optional, tag = "22")]
    pub price_input: ::core::option::Option<super::super::models::price::PriceProto>,
    /// The asof datetime for the valuation.
    #[prost(message, optional, tag = "23")]
    pub asof_datetime: ::core::option::Option<
        super::super::models::util::LocalTimestampProto,
    >,
    /// The CPI index observation used for inflation-linked bond valuation (e.g. TIPS).
    /// Modeled as a PriceProto on a SecurityProto representing the CPI index.
    #[prost(message, optional, tag = "24")]
    pub cpi_price_input: ::core::option::Option<super::super::models::price::PriceProto>,
    /// The current reference rate observation for floating rate note (FRN) valuation.
    /// Modeled as a PriceProto on an INDEX_SECURITY representing the benchmark (e.g. SOFR).
    #[prost(message, optional, tag = "25")]
    pub reference_rate_input: ::core::option::Option<
        super::super::models::price::PriceProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ValuationResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub valuation_request: ::core::option::Option<ValuationRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub measure_results: ::prost::alloc::vec::Vec<
        super::super::models::position::MeasureMapEntry,
    >,
    #[prost(message, optional, tag = "40")]
    pub summary: ::core::option::Option<super::util::errors::SummaryProto>,
    /// The full schedule of cashflows, populated when PRESENT_VALUE_CASHFLOWS is requested.
    /// Each entry represents a single coupon or principal payment with PV and FV amounts.
    #[prost(message, repeated, tag = "50")]
    pub cashflows: ::prost::alloc::vec::Vec<
        super::super::models::valuation::CashflowProto,
    >,
}
