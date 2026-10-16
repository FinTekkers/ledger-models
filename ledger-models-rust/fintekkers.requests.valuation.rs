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
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
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
    /// Term length, in whole years, for FORWARD_YIELD curve construction.
    ///
    /// When set, FORWARD_YIELD curve result returns f(t, t+T) at annual t for
    /// t in [0, T_max - T]. When unset, existing behavior preserved.
    ///
    /// Annual granularity only (uint32). Added per #264. Only meaningful when
    /// FORWARD_YIELD is among `curve_types`; ignored otherwise.
    #[prost(uint32, tag = "50")]
    pub forward_term_years: u32,
}
/// A single point on the yield curve: a tenor and its corresponding yield.
/// Par and spot points carry `tenor`. Forward points carry the forward period
/// in `from_tenor` / `to_tenor` (LM-313, docs/adr/forward_curve_tenor_range.md).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurvePointProto {
    /// The tenor in years (e.g. 0.25 = 3 months, 2.0 = 2 years, 10.0 = 10 years).
    /// This is the point tenor for PAR_YIELD and SPOT_YIELD points. On
    /// FORWARD_YIELD points readers must not parse it: read from_tenor / to_tenor.
    /// A from-to label such as "1-2" was written in the decimal string form
    /// before LM-313; LM-318 deleted that form.
    #[prost(message, optional, tag = "1")]
    pub tenor: ::core::option::Option<super::super::models::util::DecimalValueProto>,
    /// The yield at this tenor point (decimal, 0-1 scale; e.g. 0.045 = 4.50%).
    #[prost(message, optional, tag = "2")]
    pub r#yield: ::core::option::Option<super::super::models::util::DecimalValueProto>,
    /// Start of the forward period, in decimal years from the as-of date
    /// (e.g. 0 = today, 1.0 = one year out). Set only on FORWARD_YIELD points;
    /// unset on PAR_YIELD and SPOT_YIELD points. 0 is a valid value (the first
    /// period), so test presence of the message, not a non-zero value.
    #[prost(message, optional, tag = "3")]
    pub from_tenor: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
    /// End of the forward period, in decimal years from the as-of date. Set only
    /// on FORWARD_YIELD points, always together with from_tenor, and greater than
    /// it. The yield is the forward rate from from_tenor to to_tenor. When
    /// CurveRequestProto.forward_term_years is T (1 when unset), to_tenor =
    /// from_tenor + T.
    #[prost(message, optional, tag = "4")]
    pub to_tenor: ::core::option::Option<super::super::models::util::DecimalValueProto>,
}
/// The computed yield curve for a single curve type (par, spot, or forward).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurveResultProto {
    /// Which curve type this result represents (PAR_YIELD, SPOT_YIELD, or FORWARD_YIELD).
    #[prost(enumeration = "super::super::models::position::MeasureProto", tag = "1")]
    pub curve_type: i32,
    /// The curve points: par and spot points ordered by ascending tenor, forward
    /// points by ascending from_tenor.
    #[prost(message, repeated, tag = "2")]
    pub points: ::prost::alloc::vec::Vec<CurvePointProto>,
}
/// Response from a curve construction request.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurveResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
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
/// maturity_date) are read from the SecurityProto. dated_date is not read
/// today; see VS-69.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BondInput {
    /// The bond security, with bond_details populated.
    /// Intended: ProductTypeProto.TREASURY_NOTE with coupon_type FIXED.
    /// Not validated today: any product_type is accepted and coupon_type is
    /// ignored. Check tracked in VS-69.
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
/// Static security details: shared bond fields (real coupon_rate,
/// coupon_frequency, face_value, maturity_date) are read from
/// security.bond_details. TIPS-specific extras (base_cpi, index_date,
/// inflation_index_type) are read from security.tips_extension.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
///
/// cpi (4) is the only CPI input.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TipsInput {
    /// The TIPS security. Must be ProductTypeProto.TIPS with bond_details
    /// populated (coupon_type FIXED, etc.) and tips_extension populated with
    /// base_cpi set to the reference CPI index value at issuance.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market clean price as a percentage of face value (e.g. 99.75 = 99.75% of par).
    #[prost(message, optional, tag = "2")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
    /// The CPI the index ratio is computed from: raw monthly index levels, or a
    /// reference CPI already derived for the settlement date. See
    /// MeasureProto.REFERENCE_CPI and MeasureProto.INDEX_RATIO.
    ///
    /// With readings, they must be exactly the readings for months m-3 and m-2
    /// of settlement month m, the month of the UTC date of
    /// ValuationRequestProto.asof_datetime (asof_datetime.timestamp in UTC;
    /// time_zone is not used). A missing or extra month makes the request
    /// invalid and it is rejected, the same as a duplicate month. See
    /// InflationIndexInput and MonthlyIndexReadings.
    #[prost(message, optional, tag = "4")]
    pub cpi: ::core::option::Option<InflationIndexInput>,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// InflationIndexInput — the inflation index a TIPS is linked to, and its CPI.
///
/// Either the raw monthly readings (valuation-service derives the reference
/// CPI for the settlement date, ValuationRequestProto.asof_datetime) or the
/// reference CPI itself. There is no source field: index names the index, and
/// where a reading came from is price-service's concern. See
/// docs/adr/inflation_index_input.md.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct InflationIndexInput {
    /// The index security, with index_details.index_type set (e.g. CPI_U).
    /// Should match security.tips_extension.inflation_index_type on the TIPS.
    #[prost(message, optional, tag = "1")]
    pub index: ::core::option::Option<super::super::models::security::SecurityProto>,
    #[prost(oneof = "inflation_index_input::Cpi", tags = "2, 3")]
    pub cpi: ::core::option::Option<inflation_index_input::Cpi>,
}
/// Nested message and enum types in `InflationIndexInput`.
pub mod inflation_index_input {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Cpi {
        /// Raw monthly index levels. Must be exactly the readings for months m-3
        /// and m-2 of settlement month m, the month of the UTC date of
        /// ValuationRequestProto.asof_datetime (asof_datetime.timestamp in UTC;
        /// time_zone is not used). A missing or extra month makes the request
        /// invalid and it is rejected, the same as a duplicate (year, month).
        #[prost(message, tag = "2")]
        Readings(super::MonthlyIndexReadings),
        /// Reference CPI for the settlement date, already derived
        /// (e.g. 310.32600). Used as-is: not rounded, not re-derived.
        #[prost(message, tag = "3")]
        ReferenceCpi(super::super::super::models::util::DecimalValueProto),
    }
}
/// A set of monthly index levels. A wrapper because a oneof cannot hold a
/// repeated field directly.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MonthlyIndexReadings {
    /// When used as InflationIndexInput.readings, must hold exactly the
    /// readings for months m-3 and m-2 of settlement month m, the month of the
    /// UTC date of ValuationRequestProto.asof_datetime (asof_datetime.timestamp
    /// in UTC; time_zone is not used). A missing or extra month makes the
    /// request invalid, the same as a duplicate month.
    ///
    /// Order is not significant. Each (year, month) appears at most once; a
    /// request with a duplicate (year, month) is invalid and is rejected, even
    /// when the values agree.
    #[prost(message, repeated, tag = "1")]
    pub readings: ::prost::alloc::vec::Vec<MonthlyIndexReading>,
}
/// One published monthly index level, e.g. CPI-U NSA for July 2026.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MonthlyIndexReading {
    /// Calendar year of the reading (e.g. 2026).
    #[prost(int32, tag = "1")]
    pub year: i32,
    /// Calendar month of the reading, 1-12.
    #[prost(int32, tag = "2")]
    pub month: i32,
    /// Index level in index points as published (e.g. 321.500). Not a rate.
    #[prost(message, optional, tag = "3")]
    pub value: ::core::option::Option<super::super::models::util::DecimalValueProto>,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// FrnInput — valuation request for a Floating Rate Note.
///
/// Static security details: shared bond fields (coupon_frequency, face_value,
/// dated_date, maturity_date) are read from security.bond_details; FRN-specific
/// extras (spread, reference_rate_index, reset_frequency) are read from
/// security.frn_extension. None are repeated on this message.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FrnInput {
    /// The FRN security. Must have bond_details and frn_extension populated.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market clean price as a percentage of face value (e.g. 99.75 = 99.75% of par).
    #[prost(message, optional, tag = "2")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
    /// Yield curve for projecting floating coupons and discounting cashflows.
    /// curve.index must match security.frn_extension.reference_rate_index.
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
    /// Should match the FRN security's reference_rate_index.
    /// Not validated today: the service does not read this field. Check tracked in VS-74.
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
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
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
    /// Bonds: per 100 face (99.75 = 99.75% of par). Cash and equity: per unit.
    #[prost(message, optional, tag = "22")]
    pub price_input: ::core::option::Option<super::super::models::price::PriceProto>,
    /// The asof datetime for the valuation.
    #[prost(message, optional, tag = "23")]
    pub asof_datetime: ::core::option::Option<
        super::super::models::util::LocalTimestampProto,
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
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
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
