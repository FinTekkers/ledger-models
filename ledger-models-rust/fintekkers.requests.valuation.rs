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
///    13   mbs
///    14   equity
///    15   cash
///    16+  other (money market, futures, scenario, krd, ...)
///
/// The arms grouped by valuation engine: docs/adr/product_input_engine_arms.md.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ProductInput {
    #[prost(oneof = "product_input::Input", tags = "1, 2, 8, 13, 14, 15")]
    pub input: ::core::option::Option<product_input::Input>,
}
/// Nested message and enum types in `ProductInput`.
pub mod product_input {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum Input {
        /// Intended for coupon_type FIXED. Not validated today; see VS-69.
        #[prost(message, tag = "1")]
        Bond(super::BondInput),
        #[prost(message, tag = "2")]
        Tips(super::TipsInput),
        /// Intended for coupon_type FLOAT.
        #[prost(message, tag = "8")]
        Frn(super::FrnInput),
        /// MORTGAGE_BACKED. Valued by the bond engine today (G8, VS-71); see MbsInput.
        #[prost(message, tag = "13")]
        Mbs(super::MbsInput),
        /// Equities and funds priced per share. See EquityInput.
        #[prost(message, tag = "14")]
        Equity(super::EquityInput),
        /// Cash and money-market funds priced at NAV per unit. See CashInput.
        #[prost(message, tag = "15")]
        Cash(super::CashInput),
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
    /// Intended: ProductTypeProto.TREASURY_NOTE with coupon_type FIXED. A FLOAT
    /// coupon belongs on FrnInput (ProductInput.frn).
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
    /// Inputs for ADJUSTED_COST_BASIS; see CostBasisInput.
    #[prost(message, optional, tag = "20")]
    pub cost_basis: ::core::option::Option<CostBasisInput>,
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
    /// With readings, they must include the readings for months m-3 and m-2
    /// of settlement month m, the month of the UTC date of
    /// ValuationRequestProto.asof_datetime (asof_datetime.timestamp in UTC;
    /// time_zone is not used). A missing m-3 or m-2 makes the request invalid
    /// and it is rejected. They may also include the extra months that lot
    /// settlement dates need for MeasureProto.PROFIT_LOSS (LM-405); an extra
    /// month no date needs is allowed and ignored. A duplicate (year, month) or
    /// a month outside 1-12 is still rejected. See InflationIndexInput and
    /// MonthlyIndexReadings.
    #[prost(message, optional, tag = "4")]
    pub cpi: ::core::option::Option<InflationIndexInput>,
    /// Inputs for ADJUSTED_COST_BASIS; see CostBasisInput.
    #[prost(message, optional, tag = "20")]
    pub cost_basis: ::core::option::Option<CostBasisInput>,
}
/// Inputs for ADJUSTED_COST_BASIS, reused by every typed input that supports it.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CostBasisInput {
    /// copied from the portfolio; unset = every default
    #[prost(message, optional, tag = "1")]
    pub elections: ::core::option::Option<
        super::super::models::portfolio::AmortisationElectionsProto,
    >,
    /// the holding's open lots
    #[prost(message, repeated, tag = "2")]
    pub lots: ::prost::alloc::vec::Vec<super::super::models::position::TaxLotProto>,
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
        /// Raw monthly index levels. Must include the readings for months m-3
        /// and m-2 of settlement month m, the month of the UTC date of
        /// ValuationRequestProto.asof_datetime (asof_datetime.timestamp in UTC;
        /// time_zone is not used); a missing m-3 or m-2 makes the request invalid
        /// and it is rejected. May also include the extra months that lot
        /// settlement dates need for MeasureProto.PROFIT_LOSS (LM-405); an extra
        /// month no date needs is allowed and ignored. A duplicate (year, month)
        /// or a month outside 1-12 is still rejected.
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
    /// When used as InflationIndexInput.readings, must include the readings
    /// for months m-3 and m-2 of settlement month m, the month of the UTC date
    /// of ValuationRequestProto.asof_datetime (asof_datetime.timestamp in UTC;
    /// time_zone is not used); a missing m-3 or m-2 makes the request invalid.
    /// May also include the extra months that lot settlement dates need for
    /// MeasureProto.PROFIT_LOSS (LM-405); an extra month no date needs is
    /// allowed and ignored. A month outside 1-12 is invalid.
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
/// fixings (11) carries published reference-rate fixings.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FrnInput {
    /// The FRN security. Must have bond_details and frn_extension populated.
    /// Intended for coupon_type FLOAT; a FIXED coupon belongs on BondInput.
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
    /// Published fixings of the FRN's reference rate, one per fixing date.
    /// Each fixing.index must equal security.frn_extension.reference_rate_index.
    /// Order is not significant. A duplicate fixing_date makes the input invalid.
    /// Not read by valuation-service today; use is tracked under VS-110.
    #[prost(message, repeated, tag = "11")]
    pub fixings: ::prost::alloc::vec::Vec<ReferenceRateFixingProto>,
    /// Inputs for ADJUSTED_COST_BASIS; see CostBasisInput.
    #[prost(message, optional, tag = "20")]
    pub cost_basis: ::core::option::Option<CostBasisInput>,
}
/// One published fixing of a floating-rate benchmark, e.g. the 13-week
/// T-bill rate set at the 2026-10-19 auction.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ReferenceRateFixingProto {
    /// The benchmark. Same enum as FrnExtensionProto.reference_rate_index
    /// (IndexTypeProto), and must equal it on the FRN being valued.
    #[prost(
        enumeration = "super::super::models::security::index::IndexTypeProto",
        tag = "1"
    )]
    pub index: i32,
    /// The date the rate was fixed: the auction date for T_BILL_13_WEEK,
    /// the business day the rate applies to for SOFR.
    #[prost(message, optional, tag = "2")]
    pub fixing_date: ::core::option::Option<super::super::models::util::LocalDateProto>,
    /// The index rate exactly as its source publishes it, in percent per annum.
    /// SOFR: the rate as the New York Fed publishes it: 4.32 = 4.32%.
    /// T_BILL_13_WEEK: the auction's high discount rate as Treasury
    /// publishes it, in percent on a bank-discount basis: 4.215 = 4.215%.
    /// Same value and unit as IssuanceProto.high_discount_rate.
    /// Neither is a decimal fraction, nor yet the rate the FRN accrues on.
    /// For T_BILL_13_WEEK valuation-service converts it to the money-market
    /// yield using bill_maturity_date; for SOFR it converts it from percent.
    #[prost(message, optional, tag = "3")]
    pub rate: ::core::option::Option<super::super::models::util::DecimalValueProto>,
    /// T_BILL_13_WEEK only: the maturity date of the bill whose auction set
    /// this fixing. valuation-service uses it for the bill's actual days to
    /// maturity when it converts rate. Unset for SOFR.
    #[prost(message, optional, tag = "4")]
    pub bill_maturity_date: ::core::option::Option<
        super::super::models::util::LocalDateProto,
    >,
    /// T_BILL_13_WEEK only: the issue date of the auction chosen for this
    /// fixing, copied from that issuance's IssuanceProto.auction_issue_date.
    /// A reopened bill uses the reopening's own issue date, not the original
    /// auction's. valuation-service counts the bill's days to maturity from
    /// here to bill_maturity_date. Unset for SOFR.
    #[prost(message, optional, tag = "5")]
    pub bill_issue_date: ::core::option::Option<
        super::super::models::util::LocalDateProto,
    >,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// MbsInput — valuation request for a mortgage-backed security (LM-408).
///
/// Static pool data (pass_through_rate, wac, wam, current_factor, psa_speed,
/// ...) is read from security.bond_details and security.mbs_extension. None
/// is repeated on this message.
///
/// G8 (valuation-service known gap 8, tracked as VS-71): MORTGAGE_BACKED is
/// valued as a bullet fixed-rate bond (no amortisation or prepayment), because
/// it descends from BOND. The mbs arm gives MBS its own route, but it still
/// uses the bond engine, so the numbers are unchanged until a real MBS engine
/// replaces it.
///
/// Fields 10-19 are kept free for later prepayment and curve inputs. Do not
/// use them for anything else.
///
/// Settlement date is read from ValuationRequestProto.asof_datetime.
/// See docs/adr/product_input_engine_arms.md.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MbsInput {
    /// The MBS security: ProductTypeProto.MORTGAGE_BACKED with bond_details and
    /// mbs_extension populated.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market clean price as a percentage of current face: the original face
    /// times mbs_extension.current_factor, not the original face
    /// (e.g. 101.5 = 101.5% of current face).
    #[prost(message, optional, tag = "2")]
    pub clean_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
    /// Inputs for ADJUSTED_COST_BASIS; see CostBasisInput.
    #[prost(message, optional, tag = "20")]
    pub cost_basis: ::core::option::Option<CostBasisInput>,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// EquityInput — valuation request for an equity or fund priced per share
/// (LM-408). Unit-priced: market value is unit_price x quantity, no accrual.
/// See docs/adr/product_input_engine_arms.md.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct EquityInput {
    /// The equity security (e.g. COMMON_STOCK, ETF).
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// Market price per share, in the security's currency (e.g. 187.25 = 187.25
    /// per share). Not a percentage of face.
    #[prost(message, optional, tag = "2")]
    pub unit_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
}
/// ═══════════════════════════════════════════════════════════════════════════
/// CashInput — valuation request for cash or a money-market fund (LM-408).
/// Unit-priced: market value is unit_price x quantity, no accrual.
/// See docs/adr/product_input_engine_arms.md.
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CashInput {
    /// The cash or money-market fund security (e.g. CURRENCY, MONEY_MARKET_FUND).
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<super::super::models::security::SecurityProto>,
    /// NAV per unit, in the security's currency (e.g. 1.00 for cash or a stable
    /// NAV fund). Not a percentage of face.
    #[prost(message, optional, tag = "2")]
    pub unit_price: ::core::option::Option<
        super::super::models::util::DecimalValueProto,
    >,
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
    /// Must match the FRN security's reference_rate_index. valuation-service
    /// rejects a mismatch with INVALID_ARGUMENT. An unset index
    /// (UNKNOWN_INDEX_TYPE) is accepted.
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
    /// Deprecated: use `product_input` (70). Still required for products without a typed `ProductInput` arm; removed under LM-376 once every product has one.
    #[deprecated]
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
    /// Deprecated: use `product_input` (70). Still required for products without a typed `ProductInput` arm; removed under LM-376 once every product has one.
    #[deprecated]
    #[prost(message, optional, tag = "22")]
    pub price_input: ::core::option::Option<super::super::models::price::PriceProto>,
    /// The asof datetime for the valuation.
    #[prost(message, optional, tag = "23")]
    pub asof_datetime: ::core::option::Option<
        super::super::models::util::LocalTimestampProto,
    >,
    /// Product-specific input — determines the calculation path in the service.
    /// When set, the service values from this input alone: security_input (20)
    /// and price_input (22) are not read for the calculation. They may still be
    /// read for logging and audit.
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
