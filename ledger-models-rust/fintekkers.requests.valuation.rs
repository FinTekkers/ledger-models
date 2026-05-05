/// A single observation that contributes one point to the curve.
///
/// Two equivalent shapes are supported:
///
///    1. Bond + price (the typical case): provide `security` (with `issue_date`
///       and `maturity_date` populated) and either `price` (already a yield) or
///       `clean_price` (server runs YTM internally to derive the yield). The
///       server computes the tenor from `(maturity_date - asof_datetime)`.
///
///    2. Synthetic CMT-style point: provide `tenor` and `price` directly. Use
///       this for inputs that have no underlying bond (e.g. CMT par yields
///       published by Treasury). When `tenor` is set it overrides any tenor
///       that would otherwise be computed from `security`.
///
/// `price` and `clean_price` are mutually exclusive; if both are set the
/// server returns InvalidArgument.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurveInputProto {
    /// The bond security at this curve point. Required unless `tenor` is set.
    /// Must carry `issue_date` and `maturity_date` for tenor computation when
    /// `tenor` is not explicitly provided.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// The observed yield for this security, expressed as a yield (e.g. 4.25
    /// for 4.25%). Mutually exclusive with `clean_price`.
    #[prost(message, optional, tag = "2")]
    pub price: ::core::option::Option<super::super::models::price::PriceProto>,
    /// Optional tenor override, in decimal years (e.g. 0.5 for 6M, 10.0 for 10Y).
    /// When set, this is used as the curve point's x-coordinate directly, bypassing
    /// any date-based computation from `security`. Intended for synthetic CMT-style
    /// inputs that have no bond.
    #[prost(message, optional, tag = "4")]
    pub tenor: ::core::option::Option<super::super::models::util::DecimalValueProto>,
    /// Optional clean price (quoted as % of par, e.g. 99.50). Alternative to
    /// `price`: when set, the server runs a YTM solver against the bond's cash
    /// flows to derive the yield used for curve fitting. Mutually exclusive
    /// with `price`.
    #[prost(message, optional, tag = "5")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
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
    /// The as-of datetime for the curve construction. **Required** — the server
    /// returns InvalidArgument if missing. This drives the effective tenor of
    /// every input bond (`maturity_date - asof_datetime`) when `CurveInputProto.tenor`
    /// is not explicitly set, and any YTM solve performed against `clean_price`.
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
/// ═══════════════════════════════════════════════════════════════════════════
/// ProductInput — the dispatch field on ValuationRequestProto.
///
/// Exactly one variant should be set per request. The service routes to the
/// appropriate calculation engine based on which oneof field is populated.
///
/// Field numbers are reserved per the platform product roadmap:
///    1–7  fixed-income (bond, callable, tips, muni, amortizing, ...)
///    8    frn
///    9–12 rates/credit (swap, xccy, repo, loan)
///    13+  other (mbs, money market, futures, scenario, krd, ...)
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ProductInput {
    #[prost(oneof = "product_input::Input", tags = "1, 2, 8")]
    pub input: ::core::option::Option<product_input::Input>,
}
/// Nested message and enum types in `ProductInput`.
pub mod product_input {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Input {
        #[prost(message, tag = "1")]
        Bond(super::BondInput),
        #[prost(message, tag = "2")]
        Tips(super::TipsInput),
        #[prost(message, tag = "8")]
        Frn(super::FrnInput),
    }
}
/// ═══════════════════════════════════════════════════════════════════════════
/// BondInput — valuation request for a fixed-rate bond.
///
/// Static security details (coupon_rate, coupon_frequency, face_value,
/// dated_date, maturity_date) are read from the SecurityProto.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BondInput {
    /// The bond security. Must be SecurityTypeProto.BOND_SECURITY with
    /// coupon_type FIXED and all standard fixed-income fields populated.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market clean price as a percentage of face value (e.g. 99.75 = 99.75% of par).
    #[prost(message, optional, tag = "2")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
    /// Optional benchmark curve for Z-spread computation, expressed as a set of
    /// benchmark securities and their market clean prices. The engine bootstraps
    /// a zero-coupon spot curve internally. When omitted, Z-spread is not computed.
    #[prost(message, optional, tag = "10")]
    pub benchmark_curve: ::core::option::Option<SecurityBasedCurveInput>,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// TipsInput — valuation request for a Treasury Inflation-Protected Security.
///
/// Static security details (real coupon_rate, coupon_frequency, face_value,
/// maturity_date) are read from the SecurityProto.
/// Base CPI at issuance is read from SecurityProto.base_cpi.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TipsInput {
    /// The TIPS security. Must be SecurityTypeProto.TIPS with coupon_type FIXED,
    /// all standard fixed-income fields populated, and base_cpi set to the
    /// reference CPI index value at issuance.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market clean price as a percentage of face value (e.g. 99.75 = 99.75% of par).
    #[prost(message, optional, tag = "2")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
    /// Current CPI index value (e.g. 310.326). Used to compute:
    ///    index_ratio = current_cpi / base_cpi
    ///    adjusted_principal = face_value * index_ratio
    /// The base CPI is read from security.base_cpi.
    #[prost(message, optional, tag = "3")]
    pub current_cpi: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// FrnInput — valuation request for a Floating Rate Note.
///
/// Static security details (spread, reference_rate_index, coupon_frequency,
/// face_value, dated_date, maturity_date) are read from security.frn_details
/// and are not repeated here.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FrnInput {
    /// The FRN security. Must have frn_details populated on the product_details oneof.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market clean price as a percentage of face value (e.g. 99.75 = 99.75% of par).
    #[prost(message, optional, tag = "2")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
    /// Yield curve for projecting floating coupons and discounting cashflows.
    /// curve.index must match security.frn_details.reference_rate_index.
    /// A single curve is used for both projection and discounting (single-curve framework).
    /// This is appropriate for RFR-based FRNs (SOFR, SONIA, ESTR, TONA).
    #[prost(message, optional, tag = "10")]
    pub curve: ::core::option::Option<YieldCurveInput>,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// YieldCurveInput — a term structure of continuously compounded zero rates.
///
/// Used to project forward rates for floating coupons and to compute
/// discount factors for present-valuing cashflows.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct YieldCurveInput {
    /// The benchmark this curve represents (e.g. SOFR, SONIA).
    /// Must match the FRN security's reference_rate_index — validated by the service.
    #[prost(
        enumeration = "super::super::models::security::index::IndexTypeProto",
        tag = "1"
    )]
    pub index: i32,
    /// As-of date for the curve, typically today or the most recent business day.
    #[prost(message, optional, tag = "2")]
    pub reference_date: ::core::option::Option<
        super::super::models::util::LocalDateProto,
    >,
    /// Term structure points, must be sorted by tenor strictly ascending.
    #[prost(message, repeated, tag = "3")]
    pub points: ::prost::alloc::vec::Vec<CurvePoint>,
}
/// A single point on a yield curve.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurvePoint {
    /// Time from reference_date in years (e.g. 0.25, 0.5, 1.0, 2.0, 5.0, 10.0).
    #[prost(message, optional, tag = "1")]
    pub tenor: ::core::option::Option<super::super::models::util::DecimalValueProto>,
    /// Continuously compounded zero rate as a decimal (e.g. 0.0425 = 4.25%).
    /// Not a percentage — 4.25 would be interpreted as 425%.
    #[prost(message, optional, tag = "2")]
    pub rate: ::core::option::Option<super::super::models::util::DecimalValueProto>,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// SecurityBasedCurveInput — a benchmark curve specified as a set of benchmark
/// securities and their observed market clean prices.
///
/// The valuation engine bootstraps a zero-coupon spot rate curve from these
/// inputs using a closed-form iterative bootstrap (shortest maturity first).
/// Callers do not supply rates directly; the engine derives them internally.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityBasedCurveInput {
    /// Which government benchmark this curve represents.
    /// Must be one of the government curve identifiers: US_TREASURY, UK_GILT,
    /// DE_BUND, JP_JGB.
    #[prost(
        enumeration = "super::super::models::security::index::IndexTypeProto",
        tag = "1"
    )]
    pub index: i32,
    /// As-of date for the curve, typically today or the most recent business day.
    #[prost(message, optional, tag = "2")]
    pub reference_date: ::core::option::Option<
        super::super::models::util::LocalDateProto,
    >,
    /// Benchmark securities sorted by maturity ascending. Each entry pairs a
    /// security with its observed clean price. The engine processes them in order,
    /// bootstrapping the zero rate at each maturity from the previously solved
    /// shorter-dated zeros.
    #[prost(message, repeated, tag = "3")]
    pub points: ::prost::alloc::vec::Vec<SecurityCurvePoint>,
}
/// A benchmark security and its market clean price, used as one input to the
/// bootstrap algorithm in SecurityBasedCurveInput.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityCurvePoint {
    /// The benchmark bond (must have fixed coupon, maturity_date, coupon_frequency,
    /// face_value, and coupon_rate populated).
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market clean price as a percentage of face value (e.g. 99.50 = 99.50% of par).
    #[prost(message, optional, tag = "2")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
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
    /// Deprecated in favour of FrnInput.curve — retained for backward compatibility with flat-rate FRN pricing.
    #[prost(message, optional, tag = "25")]
    pub reference_rate_input: ::core::option::Option<
        super::super::models::price::PriceProto,
    >,
    /// Product-specific input — determines the calculation path in the service.
    /// When set, the service routes to the new engine dispatch; existing flat fields
    /// (security_input, price_input, etc.) are ignored for the purposes of the
    /// product calculation but may still be read for logging and audit.
    #[prost(message, optional, tag = "70")]
    pub product_input: ::core::option::Option<ProductInput>,
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
