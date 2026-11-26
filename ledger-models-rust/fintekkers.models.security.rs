#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum IdentifierTypeProto {
    UnknownIdentifierType = 0,
    ExchTicker = 1,
    Isin = 2,
    Cusip = 3,
    Osi = 4,
    Figi = 5,
    SeriesId = 6,
    /// Identifier for index securities (e.g. 'US Treasury Curve', 'S&P 500',
    /// 'CDX.NA.IG'). Used when productType is one of the *_INDEX leaves and
    /// there's no exchange-listed ticker or ISIN that uniquely identifies
    /// the index. Added per second-brain#268.
    IndexName = 7,
    Cash = 50,
}
impl IdentifierTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            IdentifierTypeProto::UnknownIdentifierType => "UNKNOWN_IDENTIFIER_TYPE",
            IdentifierTypeProto::ExchTicker => "EXCH_TICKER",
            IdentifierTypeProto::Isin => "ISIN",
            IdentifierTypeProto::Cusip => "CUSIP",
            IdentifierTypeProto::Osi => "OSI",
            IdentifierTypeProto::Figi => "FIGI",
            IdentifierTypeProto::SeriesId => "SERIES_ID",
            IdentifierTypeProto::IndexName => "INDEX_NAME",
            IdentifierTypeProto::Cash => "CASH",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_IDENTIFIER_TYPE" => Some(Self::UnknownIdentifierType),
            "EXCH_TICKER" => Some(Self::ExchTicker),
            "ISIN" => Some(Self::Isin),
            "CUSIP" => Some(Self::Cusip),
            "OSI" => Some(Self::Osi),
            "FIGI" => Some(Self::Figi),
            "SERIES_ID" => Some(Self::SeriesId),
            "INDEX_NAME" => Some(Self::IndexName),
            "CASH" => Some(Self::Cash),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IdentifierProto {
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    /// Primary Key
    #[prost(string, tag = "5")]
    pub identifier_value: ::prost::alloc::string::String,
    #[prost(enumeration = "IdentifierTypeProto", tag = "6")]
    pub identifier_type: i32,
}
/// Leaf product types — the kind of contract a Security represents.
///
/// Authoritative shape lives in ledger-models-protos/hierarchy.json
/// (single source of truth: parent chain, asset_class, instrument_type,
/// label, status). Every active leaf in hierarchy.json must have a
/// matching enum value here; CI guard enforces the round-trip.
///
/// Abstract parent nodes (BOND, GOV_BOND, OPTION, EQUITY_OPTION, etc.)
/// live only in hierarchy.json — they are never assigned to a Security.
///
/// Strategies (butterfly, vertical spread, calendar spread, condor,
/// straddle, ...) are intentionally absent. They are derived from the
/// SecurityProto.legs field, not from a productType enum value.
///
/// Multi-language wrapper helpers (parentOf, descendantsOf,
/// isDescendantOf, labelOf, assetClassOf, instrumentTypeOf) load
/// hierarchy.json at startup and dispatch on the leaf identity carried
/// by ProductTypeProto.
///
/// See ../../../hierarchy-examples.md for worked examples and
/// ../../../registry-versioning.md for compatibility rules on changes
/// to this enum.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum ProductTypeProto {
    ProductTypeUnknown = 0,
    /// Bonds (1-19)
    Tbill = 1,
    TreasuryNote = 2,
    TreasuryBond = 3,
    Tips = 4,
    TreasuryFrn = 5,
    Strips = 6,
    SovereignBond = 7,
    CorpBond = 8,
    MuniBond = 9,
    MortgageBacked = 10,
    /// Stocks (20-29)
    CommonStock = 20,
    PreferredStock = 21,
    Adr = 22,
    Etf = 23,
    /// Reference indices and rate series (30-39)
    EquityIndex = 30,
    BondIndex = 31,
    CommodityIndex = 32,
    VixSpot = 33,
    CpiSeries = 34,
    SofrSeries = 35,
    TBill13WeekSeries = 36,
    /// Cash and FX (40-49)
    Currency = 40,
    FxSpot = 41,
    MoneyMarketFund = 42,
    /// Crypto (50-59)
    Cryptocurrency = 50,
    Stablecoin = 51,
    /// Commodity spot (60-69)
    Gold = 60,
    Silver = 61,
}
impl ProductTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            ProductTypeProto::ProductTypeUnknown => "PRODUCT_TYPE_UNKNOWN",
            ProductTypeProto::Tbill => "TBILL",
            ProductTypeProto::TreasuryNote => "TREASURY_NOTE",
            ProductTypeProto::TreasuryBond => "TREASURY_BOND",
            ProductTypeProto::Tips => "TIPS",
            ProductTypeProto::TreasuryFrn => "TREASURY_FRN",
            ProductTypeProto::Strips => "STRIPS",
            ProductTypeProto::SovereignBond => "SOVEREIGN_BOND",
            ProductTypeProto::CorpBond => "CORP_BOND",
            ProductTypeProto::MuniBond => "MUNI_BOND",
            ProductTypeProto::MortgageBacked => "MORTGAGE_BACKED",
            ProductTypeProto::CommonStock => "COMMON_STOCK",
            ProductTypeProto::PreferredStock => "PREFERRED_STOCK",
            ProductTypeProto::Adr => "ADR",
            ProductTypeProto::Etf => "ETF",
            ProductTypeProto::EquityIndex => "EQUITY_INDEX",
            ProductTypeProto::BondIndex => "BOND_INDEX",
            ProductTypeProto::CommodityIndex => "COMMODITY_INDEX",
            ProductTypeProto::VixSpot => "VIX_SPOT",
            ProductTypeProto::CpiSeries => "CPI_SERIES",
            ProductTypeProto::SofrSeries => "SOFR_SERIES",
            ProductTypeProto::TBill13WeekSeries => "T_BILL_13_WEEK_SERIES",
            ProductTypeProto::Currency => "CURRENCY",
            ProductTypeProto::FxSpot => "FX_SPOT",
            ProductTypeProto::MoneyMarketFund => "MONEY_MARKET_FUND",
            ProductTypeProto::Cryptocurrency => "CRYPTOCURRENCY",
            ProductTypeProto::Stablecoin => "STABLECOIN",
            ProductTypeProto::Gold => "GOLD",
            ProductTypeProto::Silver => "SILVER",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "PRODUCT_TYPE_UNKNOWN" => Some(Self::ProductTypeUnknown),
            "TBILL" => Some(Self::Tbill),
            "TREASURY_NOTE" => Some(Self::TreasuryNote),
            "TREASURY_BOND" => Some(Self::TreasuryBond),
            "TIPS" => Some(Self::Tips),
            "TREASURY_FRN" => Some(Self::TreasuryFrn),
            "STRIPS" => Some(Self::Strips),
            "SOVEREIGN_BOND" => Some(Self::SovereignBond),
            "CORP_BOND" => Some(Self::CorpBond),
            "MUNI_BOND" => Some(Self::MuniBond),
            "MORTGAGE_BACKED" => Some(Self::MortgageBacked),
            "COMMON_STOCK" => Some(Self::CommonStock),
            "PREFERRED_STOCK" => Some(Self::PreferredStock),
            "ADR" => Some(Self::Adr),
            "ETF" => Some(Self::Etf),
            "EQUITY_INDEX" => Some(Self::EquityIndex),
            "BOND_INDEX" => Some(Self::BondIndex),
            "COMMODITY_INDEX" => Some(Self::CommodityIndex),
            "VIX_SPOT" => Some(Self::VixSpot),
            "CPI_SERIES" => Some(Self::CpiSeries),
            "SOFR_SERIES" => Some(Self::SofrSeries),
            "T_BILL_13_WEEK_SERIES" => Some(Self::TBill13WeekSeries),
            "CURRENCY" => Some(Self::Currency),
            "FX_SPOT" => Some(Self::FxSpot),
            "MONEY_MARKET_FUND" => Some(Self::MoneyMarketFund),
            "CRYPTOCURRENCY" => Some(Self::Cryptocurrency),
            "STABLECOIN" => Some(Self::Stablecoin),
            "GOLD" => Some(Self::Gold),
            "SILVER" => Some(Self::Silver),
            _ => None,
        }
    }
}
/// Mechanical structure of a Security — orthogonal to productType.
///
/// Three values:
///
///    CASH             A tradable underlying that settles to a position.
///                     T-Bill, common stock, BTC, FX spot, money-market
///                     fund, ETF.
///
///    DERIVATIVE       A contract whose value derives from an underlying.
///                     Future, option, swap, forward, FX swap, variance
///                     swap.
///
///    REFERENCE_INDEX  Observational only, never positioned. Used as
///                     fixings for derivatives or as display benchmarks.
///                     Cash-index values (.SPX, .NDX, .VIX), reference
///                     rate series (.SOFR, .CPI), and benchmark indices
///                     (Bloomberg Commodity Index).
///
/// The distinction matters because: .SPX (REFERENCE_INDEX) and SPY (CASH
/// ETF that tracks .SPX) are both "EQUITY index"-flavoured but only SPY
/// is positionable; ES future (DERIVATIVE) is positionable but isn't the
/// same instrument as either.
///
/// Enum-value names are prefixed INSTRUMENT_TYPE_* because proto3
/// enforces package-wide uniqueness for enum value names — bare CASH
/// would collide with IdentifierTypeProto.CASH in this package.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum InstrumentTypeProto {
    InstrumentTypeUnknown = 0,
    InstrumentTypeCash = 1,
    InstrumentTypeDerivative = 2,
    InstrumentTypeReferenceIndex = 3,
}
impl InstrumentTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            InstrumentTypeProto::InstrumentTypeUnknown => "INSTRUMENT_TYPE_UNKNOWN",
            InstrumentTypeProto::InstrumentTypeCash => "INSTRUMENT_TYPE_CASH",
            InstrumentTypeProto::InstrumentTypeDerivative => "INSTRUMENT_TYPE_DERIVATIVE",
            InstrumentTypeProto::InstrumentTypeReferenceIndex => {
                "INSTRUMENT_TYPE_REFERENCE_INDEX"
            }
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "INSTRUMENT_TYPE_UNKNOWN" => Some(Self::InstrumentTypeUnknown),
            "INSTRUMENT_TYPE_CASH" => Some(Self::InstrumentTypeCash),
            "INSTRUMENT_TYPE_DERIVATIVE" => Some(Self::InstrumentTypeDerivative),
            "INSTRUMENT_TYPE_REFERENCE_INDEX" => Some(Self::InstrumentTypeReferenceIndex),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum SecurityQuantityTypeProto {
    /// Maps to Security
    UnknownQuantityType = 0,
    OriginalFaceValue = 1,
    Notional = 2,
    Units = 3,
}
impl SecurityQuantityTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            SecurityQuantityTypeProto::UnknownQuantityType => "UNKNOWN_QUANTITY_TYPE",
            SecurityQuantityTypeProto::OriginalFaceValue => "ORIGINAL_FACE_VALUE",
            SecurityQuantityTypeProto::Notional => "NOTIONAL",
            SecurityQuantityTypeProto::Units => "UNITS",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_QUANTITY_TYPE" => Some(Self::UnknownQuantityType),
            "ORIGINAL_FACE_VALUE" => Some(Self::OriginalFaceValue),
            "NOTIONAL" => Some(Self::Notional),
            "UNITS" => Some(Self::Units),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum CouponFrequencyProto {
    /// Maps to Security
    UnknownCouponFrequency = 0,
    Annually = 1,
    Semiannually = 2,
    Quarterly = 3,
    Monthly = 4,
    NoCoupon = 5,
}
impl CouponFrequencyProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            CouponFrequencyProto::UnknownCouponFrequency => "UNKNOWN_COUPON_FREQUENCY",
            CouponFrequencyProto::Annually => "ANNUALLY",
            CouponFrequencyProto::Semiannually => "SEMIANNUALLY",
            CouponFrequencyProto::Quarterly => "QUARTERLY",
            CouponFrequencyProto::Monthly => "MONTHLY",
            CouponFrequencyProto::NoCoupon => "NO_COUPON",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_COUPON_FREQUENCY" => Some(Self::UnknownCouponFrequency),
            "ANNUALLY" => Some(Self::Annually),
            "SEMIANNUALLY" => Some(Self::Semiannually),
            "QUARTERLY" => Some(Self::Quarterly),
            "MONTHLY" => Some(Self::Monthly),
            "NO_COUPON" => Some(Self::NoCoupon),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum CouponTypeProto {
    /// Maps to Security
    UnknownCouponType = 0,
    Fixed = 1,
    Float = 2,
    Zero = 3,
}
impl CouponTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            CouponTypeProto::UnknownCouponType => "UNKNOWN_COUPON_TYPE",
            CouponTypeProto::Fixed => "FIXED",
            CouponTypeProto::Float => "FLOAT",
            CouponTypeProto::Zero => "ZERO",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_COUPON_TYPE" => Some(Self::UnknownCouponType),
            "FIXED" => Some(Self::Fixed),
            "FLOAT" => Some(Self::Float),
            "ZERO" => Some(Self::Zero),
            _ => None,
        }
    }
}
/// How a bond counts the days and the year fraction between two dates, for
/// accrued interest and coupon-period fractions. Set on
/// BondDetailsProto.day_count; when that is unset the product default from
/// hierarchy.json default_day_count applies (see BondDetailsProto.day_count).
/// See docs/adr/day_count_convention.md.
///
/// D1/M1/Y1 is the start date (day, month, year) and D2/M2/Y2 the end date.
/// The start date is excluded and the end date included, so start == end
/// counts 0 days. A year fraction is a number of years, never a fraction of
/// a coupon period.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum DayCountConventionProto {
    /// No convention is known. Readers must not guess one: no ACT/ACT or any
    /// other fallback. An explicit UNKNOWN_DAY_COUNT resolves like unset.
    UnknownDayCount = 0,
    /// ACT/ACT (ICMA), ICMA Rule 251. US Treasuries (notes, bonds, TIPS,
    /// STRIPS). Days = actual calendar days from D1/M1/Y1 to D2/M2/Y2. The
    /// accrual lies inside one regular coupon period [period_start,
    /// period_end] with F coupons a year. Period days = actual calendar days
    /// from period_start to period_end. Period fraction = days / period days.
    /// Year fraction = days / (F x period days). Example: 2026-12-01 ->
    /// 2027-03-01 in the semiannual period 2026-12-01 -> 2027-06-01 is 90 days
    /// of 182, period fraction 90/182, year fraction 90/364. Stub (irregular)
    /// periods are out of scope here.
    ActActIcma = 1,
    /// 30/360 US, bond basis (ISDA 2006 4.16(f)). US corporates and agencies.
    /// Days = 360 x (Y2 - Y1) + 30 x (M2 - M1) + (D2 - D1), after these rules
    /// in this order:
    ///    1. If D1 = 31, set D1 = 30.
    ///    2. If D2 = 31 and D1 >= 30 (after rule 1), set D2 = 30.
    /// There is no February end-of-month adjustment: Feb 28 and Feb 29 stay 28
    /// and 29 as D1 or D2. Year fraction = days / 360. Examples:
    /// 2027-01-31 -> 2027-03-31 = 60; 2027-04-30 -> 2027-05-31 = 30;
    /// 2027-01-31 -> 2027-02-01 = 1; 2027-02-28 -> 2027-03-31 = 33.
    Thirty360Us = 2,
    /// ACT/360. Treasury bills and money-market instruments. Days = actual
    /// calendar days. Year fraction = days / 360.
    Act360 = 3,
    /// ACT/365 (Fixed). Days = actual calendar days. Year fraction = days / 365,
    /// in leap years too.
    Act365Fixed = 4,
}
impl DayCountConventionProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            DayCountConventionProto::UnknownDayCount => "UNKNOWN_DAY_COUNT",
            DayCountConventionProto::ActActIcma => "ACT_ACT_ICMA",
            DayCountConventionProto::Thirty360Us => "THIRTY_360_US",
            DayCountConventionProto::Act360 => "ACT_360",
            DayCountConventionProto::Act365Fixed => "ACT_365_FIXED",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_DAY_COUNT" => Some(Self::UnknownDayCount),
            "ACT_ACT_ICMA" => Some(Self::ActActIcma),
            "THIRTY_360_US" => Some(Self::Thirty360Us),
            "ACT_360" => Some(Self::Act360),
            "ACT_365_FIXED" => Some(Self::Act365Fixed),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityProto {
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    /// Primary Key
    #[prost(message, optional, tag = "5")]
    pub uuid: ::core::option::Option<super::util::UuidProto>,
    #[prost(message, optional, tag = "6")]
    pub as_of: ::core::option::Option<super::util::LocalTimestampProto>,
    /// When true, this message is a lightweight reference — only uuid is populated.
    /// The caller must resolve the full entity by calling SecurityService.GetByIds
    /// with this UUID. Used when embedding a SecurityProto inside another message
    /// (e.g. PriceProto.security, TransactionProto.security) to avoid duplicating
    /// the full security data. See docs/adr/is_link_pattern.md for details.
    #[prost(bool, tag = "7")]
    pub is_link: bool,
    #[prost(message, optional, tag = "8")]
    pub valid_from: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "9")]
    pub valid_to: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(enumeration = "ProductTypeProto", tag = "10")]
    pub product_type: i32,
    /// Orthogonal to product_type — see instrument_type.proto.
    /// CASH (positionable), DERIVATIVE (value derives from underlying),
    /// REFERENCE_INDEX (observational only).
    #[prost(enumeration = "InstrumentTypeProto", tag = "16")]
    pub instrument_type: i32,
    /// Multi-leg strategy package legs — each leg is itself a Security
    /// referenced by UUID using the is_link=true pattern (see
    /// docs/adr/is_link_pattern.md). See hierarchy-examples.md for the
    /// pattern: butterflies, calendar spreads, iron condors, etc. are not
    /// productTypes; they're a Security whose product_type is the
    /// underlying vanilla type with `legs` populated.
    ///
    /// Each leg MUST have is_link=true with uuid and as_of populated.
    /// Resolve full legs via SecurityService.GetByIds.
    ///
    /// WIRE COMPATIBLE with the prior SecurityIdProto type at this tag:
    /// SecurityIdProto carried uuid at tag 1, identical to SecurityProto.
    /// Legacy persisted bytes parse correctly under the new type.
    #[prost(message, repeated, tag = "17")]
    pub legs: ::prost::alloc::vec::Vec<SecurityProto>,
    /// Biz fields
    #[prost(string, tag = "11")]
    pub asset_class: ::prost::alloc::string::String,
    #[prost(string, tag = "12")]
    pub issuer_name: ::prost::alloc::string::String,
    #[prost(message, optional, boxed, tag = "13")]
    pub settlement_currency: ::core::option::Option<
        ::prost::alloc::boxed::Box<SecurityProto>,
    >,
    #[prost(enumeration = "SecurityQuantityTypeProto", tag = "14")]
    pub quantity_type: i32,
    #[prost(string, tag = "41")]
    pub description: ::prost::alloc::string::String,
    /// All known identifiers for this security. The primary identifier (used as
    /// the human-readable ID) is the first entry. Secondary identifiers follow.
    /// For Gilts, entry 0 will be {type=ISIN, value="GB..."}; for US Treasuries,
    /// entry 0 will be {type=CUSIP, value="912828..."}.
    #[prost(message, repeated, tag = "42")]
    pub identifiers: ::prost::alloc::vec::Vec<IdentifierProto>,
    /// Bond-shape details. Populated for any product_type descending from BOND
    /// in hierarchy.json (TBILL, TREASURY_NOTE, TREASURY_BOND, TIPS,
    /// TREASURY_FRN, STRIPS, SOVEREIGN_BOND, CORP_BOND, MUNI_BOND, ...).
    /// Single canonical home for the 8 shared bond fields. Null for non-bonds.
    #[prost(message, optional, tag = "200")]
    pub bond_details: ::core::option::Option<BondDetailsProto>,
    /// TIPS-specific extras. Populated when product_type == TIPS.
    /// Co-exists with bond_details (does NOT replace it).
    #[prost(message, optional, tag = "201")]
    pub tips_extension: ::core::option::Option<TipsExtensionProto>,
    /// FRN-specific extras. Populated when product_type == TREASURY_FRN.
    /// Co-exists with bond_details (does NOT replace it).
    #[prost(message, optional, tag = "202")]
    pub frn_extension: ::core::option::Option<FrnExtensionProto>,
    /// Agency MBS pass-through extras. Populated when
    /// product_type == MORTGAGE_BACKED. Co-exists with bond_details
    /// (does NOT replace it) — pool-level coupon / face / maturity
    /// are still on bond_details.
    #[prost(message, optional, tag = "207")]
    pub mbs_extension: ::core::option::Option<MbsExtensionProto>,
    /// Non-bond product details. These ARE mutually exclusive — Cash, Equity,
    /// Index, FxSpot have no shared shape — so a oneof fits.
    #[prost(oneof = "security_proto::NonBondDetails", tags = "203, 204, 205, 206")]
    pub non_bond_details: ::core::option::Option<security_proto::NonBondDetails>,
}
/// Nested message and enum types in `SecurityProto`.
pub mod security_proto {
    /// Non-bond product details. These ARE mutually exclusive — Cash, Equity,
    /// Index, FxSpot have no shared shape — so a oneof fits.
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum NonBondDetails {
        #[prost(message, tag = "203")]
        IndexDetails(super::IndexDetailsProto),
        #[prost(message, tag = "204")]
        EquityDetails(super::EquityDetailsProto),
        #[prost(message, tag = "205")]
        CashDetails(super::CashDetailsProto),
        #[prost(message, tag = "206")]
        FxSpotDetails(::prost::alloc::boxed::Box<super::FxSpotDetailsProto>),
    }
}
/// Bond security details: fixed-rate coupon bonds (US Treasuries, corporates, etc.)
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BondDetailsProto {
    /// Annual coupon rate in percentage form: 6.0 = 6%, 0.625 = 0.625%.
    /// Not a decimal fraction: valuation-service rejects values in (0, 0.1)
    /// as decimal-fraction mistakes (send 5.0 for 5%, not 0.05).
    /// A TBILL pays no coupon: when product_type == TBILL, coupon_rate must be
    /// unset or 0. Writers enforce this through the security validators
    /// (Java SecurityRules.validate, see docs/adr/tbill_coupon_validation.md);
    /// stored rows that break it still deserialize.
    #[prost(message, optional, tag = "1")]
    pub coupon_rate: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(enumeration = "CouponTypeProto", tag = "2")]
    pub coupon_type: i32,
    #[prost(enumeration = "CouponFrequencyProto", tag = "3")]
    pub coupon_frequency: i32,
    #[prost(message, optional, tag = "4")]
    pub dated_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "5")]
    pub face_value: ::core::option::Option<super::util::DecimalValueProto>,
    /// issue_date / maturity_date: any security type may set them, not only
    /// bonds. Unset means unknown or not applicable; there is no placeholder
    /// date (no 1900-01-01 or 2999-12-31). Readers report an unset date as
    /// absent (LM-441).
    #[prost(message, optional, tag = "6")]
    pub issue_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "7")]
    pub maturity_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, repeated, tag = "8")]
    pub issuance_info: ::prost::alloc::vec::Vec<bond::IssuanceProto>,
    /// callable: true when the issuer may redeem the bond before maturity_date.
    /// Default false. Example: Treasury bonds issued 1979-84, such as 912810CK2
    /// (10 3/8% Bonds of 2004-2009).
    #[prost(bool, tag = "9")]
    pub callable: bool,
    /// call_date: the first date the issuer may redeem the bond at par. It is
    /// NOT the maturity date and does not change maturity_date, which stays the
    /// legal final maturity (912810CK2: call_date 2004-11-15, maturity_date
    /// 2009-11-15). Set only when callable is true; unset otherwise, with no
    /// placeholder date (LM-441). An exercised call is booked as transactions
    /// (a SELL to zero on the call date), not by editing this security.
    /// See docs/adr/callable_bonds.md.
    #[prost(message, optional, tag = "10")]
    pub call_date: ::core::option::Option<super::util::LocalDateProto>,
    /// day_count: how this bond counts days and year fractions for accrued
    /// interest and coupon-period fractions (DayCountConventionProto defines
    /// each convention). Unset means the product default: the entry for the
    /// security's product_type in hierarchy.json default_day_count, the deepest
    /// node on its parent chain winning (TREASURY_NOTE / TREASURY_BOND / TIPS /
    /// STRIPS -> ACT_ACT_ICMA, TBILL -> ACT_360, CORP_BOND -> THIRTY_360_US).
    /// An explicit UNKNOWN_DAY_COUNT resolves like unset. A product with no
    /// entry resolves to UNKNOWN_DAY_COUNT: services never guess a convention.
    /// The wrapper getters (Java Security.getDayCount, Python
    /// Security.get_day_count, JS getDayCount, Rust SecurityWrapper::day_count)
    /// apply this rule. See docs/adr/day_count_convention.md.
    #[prost(enumeration = "DayCountConventionProto", optional, tag = "11")]
    pub day_count: ::core::option::Option<i32>,
}
/// TIPS (Treasury Inflation-Protected Securities) extras.
/// Carries ONLY the TIPS-specific fields; shared bond fields live in
/// SecurityProto.bond_details. Populated when product_type == TIPS.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TipsExtensionProto {
    /// Reference CPI at bond issuance (e.g. 256.394)
    #[prost(message, optional, tag = "1")]
    pub base_cpi: ::core::option::Option<super::util::DecimalValueProto>,
    /// The date the base CPI was observed
    #[prost(message, optional, tag = "2")]
    pub index_date: ::core::option::Option<super::util::LocalDateProto>,
    /// Which inflation index (e.g. CPI_U)
    #[prost(enumeration = "index::IndexTypeProto", tag = "3")]
    pub inflation_index_type: i32,
}
/// Floating Rate Note (FRN) extras.
/// Carries ONLY the FRN-specific fields; shared bond fields live in
/// SecurityProto.bond_details. Populated when product_type == TREASURY_FRN.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FrnExtensionProto {
    /// Fixed spread over the reference rate, in basis points
    #[prost(message, optional, tag = "1")]
    pub spread: ::core::option::Option<super::util::DecimalValueProto>,
    /// Which floating rate benchmark (e.g. SOFR)
    #[prost(enumeration = "index::IndexTypeProto", tag = "2")]
    pub reference_rate_index: i32,
    /// How often the floating coupon rate resets
    #[prost(enumeration = "CouponFrequencyProto", tag = "3")]
    pub reset_frequency: i32,
}
/// Agency MBS pass-through extras (FNMA / FHLMC / GNMA).
/// Carries pool-level fields beyond what BondDetailsProto already covers
/// (coupon, face value, maturity date). Populated when
/// product_type == MORTGAGE_BACKED.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct MbsExtensionProto {
    /// Agency pool identifier (e.g. "FN AS1234")
    #[prost(string, tag = "1")]
    pub pool_number: ::prost::alloc::string::String,
    /// Issuing agency
    #[prost(enumeration = "bond::AgencyProto", tag = "2")]
    pub agency: i32,
    /// Weighted-average coupon (decimal fraction; 0.045 = 4.5%)
    #[prost(message, optional, tag = "3")]
    pub wac: ::core::option::Option<super::util::DecimalValueProto>,
    /// Weighted-average maturity, in months
    #[prost(int32, tag = "4")]
    pub wam: i32,
    /// Pass-through coupon paid to investors (decimal fraction)
    #[prost(message, optional, tag = "5")]
    pub pass_through_rate: ::core::option::Option<super::util::DecimalValueProto>,
    /// Current pool factor (fraction of original principal remaining)
    #[prost(message, optional, tag = "6")]
    pub current_factor: ::core::option::Option<super::util::DecimalValueProto>,
    /// Original face / par at issuance
    #[prost(message, optional, tag = "7")]
    pub original_face_value: ::core::option::Option<super::util::DecimalValueProto>,
    /// Current unpaid principal balance
    #[prost(message, optional, tag = "8")]
    pub current_upb: ::core::option::Option<super::util::DecimalValueProto>,
    /// Prepayment speed assumption (PSA model multiplier)
    #[prost(message, optional, tag = "9")]
    pub psa_speed: ::core::option::Option<super::util::DecimalValueProto>,
}
/// Index security details (e.g. CPI-U, SOFR index, S&P 500).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IndexDetailsProto {
    #[prost(enumeration = "index::IndexTypeProto", tag = "1")]
    pub index_type: i32,
    /// Populated when QuerySecurityRequestProto.lookthrough=true. Server-side
    /// resolver computes constituents for the request asOf. Each constituent
    /// is a SecurityProto with is_link=true (uuid + as_of populated; resolve
    /// full security via SecurityService.GetByIds).
    /// See docs/adr/is_link_pattern.md.
    #[prost(message, repeated, tag = "2")]
    pub constituents: ::prost::alloc::vec::Vec<SecurityProto>,
}
/// Equity security details. Minimal for now — placeholder for future fields
/// (e.g. shares_outstanding, dividend_yield, sector).
///
/// No equity-specific fields exist yet. This message serves as a type marker
/// in the oneof and a home for future equity-specific fields.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct EquityDetailsProto {}
/// Cash security details.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CashDetailsProto {
    /// e.g. "USD", "EUR", "GBP"
    #[prost(string, tag = "1")]
    pub cash_id: ::prost::alloc::string::String,
}
/// FX spot pair details.
/// Represents a spot foreign exchange rate between two currencies.
/// The pair is expressed as: price = units of quote_currency per 1 unit of base_currency.
/// Example: USD/GBP with convention UNITS_OF_QUOTE_PER_BASE means the price is
/// "how many GBP you receive for 1 USD" (e.g. 0.79).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FxSpotDetailsProto {
    /// The currency being bought/sold (e.g. USD cash security). Must be a CashDetailsProto with is_link=true.
    #[prost(message, optional, boxed, tag = "1")]
    pub base_currency: ::core::option::Option<::prost::alloc::boxed::Box<SecurityProto>>,
    /// The currency in which the price is expressed (e.g. GBP cash security). Must be a CashDetailsProto with is_link=true.
    #[prost(message, optional, boxed, tag = "2")]
    pub quote_currency: ::core::option::Option<
        ::prost::alloc::boxed::Box<SecurityProto>,
    >,
    /// Quoting convention — always "UNITS_OF_QUOTE_PER_BASE" for spot FX (ISO standard)
    #[prost(string, tag = "3")]
    pub convention: ::prost::alloc::string::String,
}
/// Asset class of a security, as a proto enum.
///
/// The ONE canonical asset-class vocabulary (codes and parent/child tree)
/// is `asset_classes` in ledger-models-protos/hierarchy.json. Every value
/// here, except UNKNOWN_ASSET_CLASS, either names a hierarchy.json code or
/// is marked deprecated with a comment pointing at hierarchy.json (CI test:
/// AssetClassVocabularyTest / test_asset_class_vocabulary.py). Use
/// ProductHierarchy.assetClassMatches (asset_class_matches in Python) to
/// filter stored values against a code; it walks the tree and resolves
/// legacy values such as "Cash", "Equity" and "Fixed Income".
/// See docs/adr/asset_class_vocabulary.md.
///
/// Note: the SecurityProto.asset_class field is currently `string` (security.proto
/// field 11). This enum defines the canonical values; the field type stays
/// string in this release to avoid coordinating a breaking change with
/// ledger-service / valuation-service / market-data-inputs. A follow-up
/// will flip the field type after a data-normalization audit.
///
/// Initial values are conservative — only those with active usage in the
/// codebase as of the v0.1.x line:
///    Cash, Equity, Fixed Income, Index
/// Add new variants only when there is concrete consumer demand.
///
/// Naming note: proto3 enforces package-wide uniqueness for enum value
/// names (C++ scoping rules — enum values are siblings of their type, not
/// children of it). `IdentifierTypeProto.CASH` already exists in this
/// package, so the cash-asset-class value is named `CASH_ASSET_CLASS` to
/// disambiguate. The other values (FIXED_INCOME, EQUITY, INDEX) are
/// unique within the package and stay bare.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum AssetClassProto {
    UnknownAssetClass = 0,
    FixedIncome = 1,
    Equity = 2,
    /// Deprecated: canonical asset-class codes live in hierarchy.json. Use the
    /// hierarchy.json code CASH; "CASH_ASSET_CLASS" is an alias of it there.
    CashAssetClass = 3,
    /// INDEX covers reference instruments like SP500, CMT-derived treasury
    /// indices, etc. — used in market-data-inputs today. Borderline as an
    /// "asset class" in finance terminology, but matches in-use data.
    /// Deprecated: canonical asset-class codes live in hierarchy.json, which
    /// has no INDEX code. Indices are modelled by instrument_type
    /// REFERENCE_INDEX plus the underlying's asset class (e.g. EQUITY_INDEX is
    /// EQUITY). A stored "INDEX" asset class matches no filter.
    Index = 4,
    /// VOLATILITY covers volatility-class reference instruments — VIX
    /// (CBOE Volatility Index), VVIX, etc. Stored as INDEX at the
    /// proto type level (these are reference indices, not holdable
    /// instruments) but distinct asset_class to differentiate from
    /// equity / fixed-income reference indices like SP500 or CMT yields.
    /// Added per FinTekkers/second-brain#236.
    Volatility = 5,
    /// CRYPTO covers cryptocurrency holdings — BTC, ETH, and other crypto
    /// assets. Pairs with ProductTypeProto.CRYPTOCURRENCY. Added per
    /// FinTekkers/second-brain#237.
    Crypto = 6,
}
impl AssetClassProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            AssetClassProto::UnknownAssetClass => "UNKNOWN_ASSET_CLASS",
            AssetClassProto::FixedIncome => "FIXED_INCOME",
            AssetClassProto::Equity => "EQUITY",
            AssetClassProto::CashAssetClass => "CASH_ASSET_CLASS",
            AssetClassProto::Index => "INDEX",
            AssetClassProto::Volatility => "VOLATILITY",
            AssetClassProto::Crypto => "CRYPTO",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_ASSET_CLASS" => Some(Self::UnknownAssetClass),
            "FIXED_INCOME" => Some(Self::FixedIncome),
            "EQUITY" => Some(Self::Equity),
            "CASH_ASSET_CLASS" => Some(Self::CashAssetClass),
            "INDEX" => Some(Self::Index),
            "VOLATILITY" => Some(Self::Volatility),
            "CRYPTO" => Some(Self::Crypto),
            _ => None,
        }
    }
}
/// A point-in-time snapshot of an equity index's constituent securities and weights.
///
/// Temporal model (identical to PriceProto):
///    uuid        — stable identity for this composition record
///    as_of       — the timestamp this composition was observed / recorded
///    valid_from  — bitemporal: when this record became system-valid
///    valid_to    — bitemporal: when this record was superseded
///    is_link     — if true, only uuid is meaningful; resolve via GetByIds
///
/// A new IndexCompositionProto is created whenever the index is rebalanced.
/// The effective_date field marks the business date the new composition took effect.
/// To find the composition active on a given date D, query for the most recent
/// record where effective_date <= D.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IndexCompositionProto {
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    /// Primary Key (same temporal pattern as SecurityProto and PriceProto)
    #[prost(message, optional, tag = "5")]
    pub uuid: ::core::option::Option<super::util::UuidProto>,
    #[prost(message, optional, tag = "6")]
    pub as_of: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(bool, tag = "7")]
    pub is_link: bool,
    #[prost(message, optional, tag = "8")]
    pub valid_from: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "9")]
    pub valid_to: ::core::option::Option<super::util::LocalTimestampProto>,
    /// The index security this composition belongs to (EQUITY_INDEX type).
    /// Typically is_link = true; resolve via SecurityService.GetByIds.
    #[prost(message, optional, tag = "10")]
    pub index_security: ::core::option::Option<SecurityProto>,
    /// The calendar date on which this composition became effective (the rebalance date).
    /// Temporal lookup key: given as_of_date D, return the composition where
    /// effective_date <= D, ordered by effective_date DESC, LIMIT 1.
    #[prost(message, optional, tag = "11")]
    pub effective_date: ::core::option::Option<super::util::LocalDateProto>,
    /// The full list of constituents at this rebalance point.
    #[prost(message, repeated, tag = "20")]
    pub constituents: ::prost::alloc::vec::Vec<IndexConstituentProto>,
    /// For price-weighted indices (e.g. DJIA), the divisor at this rebalance point.
    /// Divisors change when constituents change or corporate actions occur.
    /// index_level = sum(price_i * shares_i) / index_divisor
    #[prost(message, optional, tag = "21")]
    pub index_divisor: ::core::option::Option<super::util::DecimalValueProto>,
    /// Free-form notes (e.g. "Quarterly rebalance — removed XYZ, added ABC").
    #[prost(string, tag = "31")]
    pub notes: ::prost::alloc::string::String,
}
/// A single constituent within an index at a specific rebalance point.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IndexConstituentProto {
    /// The constituent equity security.
    /// Typically is_link = true; resolve via SecurityService.GetByIds.
    #[prost(message, optional, tag = "1")]
    pub security: ::core::option::Option<SecurityProto>,
    /// Weight of this constituent in the index, expressed as a decimal fraction
    /// (e.g. 0.05 = 5%). Used for market-cap-weighted and equal-weighted indices.
    /// For price-weighted indices, leave unset; use shares_in_index instead.
    #[prost(message, optional, tag = "2")]
    pub weight: ::core::option::Option<super::util::DecimalValueProto>,
    /// Number of shares used in price-weighted index calculation (e.g. DJIA).
    /// For non-price-weighted indices, leave unset; use weight instead.
    #[prost(message, optional, tag = "3")]
    pub shares_in_index: ::core::option::Option<super::util::DecimalValueProto>,
}
/// A per-security metric observed on a date, such as a fund's shares
/// outstanding (LM-484). Each value's comment is the spec for its units. See
/// SecurityMetricSeriesProto and docs/adr/security_metric_series.md.
///
/// "The security's currency" below means the currency named by the
/// SecurityProto.settlement_currency of the security that
/// SecurityMetricSeriesProto.security_id identifies. The series does not carry
/// it: resolve the security through SecurityService.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum SecurityMetricTypeProto {
    /// Not a metric. Invalid on write; a reader treats it as unknown.
    UnknownSecurityMetric = 0,
    /// Units: a whole-number count of shares, never in thousands or millions
    /// (15204137000, not 15204.137). The value has no fractional part; a
    /// writer sends a decimal with scale 0.
    SharesOutstanding = 1,
    /// Units: currency per share, in the security's currency. The net asset
    /// value of one share at the close of observation_date.
    NavPerShare = 2,
    /// Units: a currency amount, in the security's currency, in whole currency
    /// units (never in thousands or millions). The fund's total net assets at
    /// the close of observation_date.
    TotalNetAssets = 3,
    /// Units: a percentage of net assets per year (0.0945 = 0.0945% a year, the
    /// convention TipsInput.assumed_inflation_rate uses). The fund's net annual
    /// expense ratio as charged to holders, after any fee waiver or expense
    /// reimbursement. observation_date is the date the ratio takes effect, so a
    /// series is sparse (one point per change) and GetLatest returns the ratio
    /// in force on the requested date.
    ExpenseRatio = 4,
}
impl SecurityMetricTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            SecurityMetricTypeProto::UnknownSecurityMetric => "UNKNOWN_SECURITY_METRIC",
            SecurityMetricTypeProto::SharesOutstanding => "SHARES_OUTSTANDING",
            SecurityMetricTypeProto::NavPerShare => "NAV_PER_SHARE",
            SecurityMetricTypeProto::TotalNetAssets => "TOTAL_NET_ASSETS",
            SecurityMetricTypeProto::ExpenseRatio => "EXPENSE_RATIO",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_SECURITY_METRIC" => Some(Self::UnknownSecurityMetric),
            "SHARES_OUTSTANDING" => Some(Self::SharesOutstanding),
            "NAV_PER_SHARE" => Some(Self::NavPerShare),
            "TOTAL_NET_ASSETS" => Some(Self::TotalNetAssets),
            "EXPENSE_RATIO" => Some(Self::ExpenseRatio),
            _ => None,
        }
    }
}
/// The observations of one metric for one security, as known at one time
/// (LM-484). See docs/adr/security_metric_series.md.
///
/// One header (security_id, metric, as_of) carries the metadata for every
/// point, so a point is only a date and a value.
///
/// Bitemporal model:
///    observation_date (on each point) is the business date the value is for.
///    as_of (on the series) is the knowledge time: the store's contents at
///    that instant. It is never an observation date. A query at an earlier
///    as_of returns the values known then, before any later correction.
///    valid_from / valid_to stay on the server's stored rows. A correction (a
///    new value for an existing observation_date) closes the old row through
///    its valid_to; see SecurityMetric.CreateOrUpdate.
///
/// Absent means unknown, never 0. A date with no point is unknown: a reader
/// must never fill it with 0 or carry another date's value into it. A point
/// whose value is 0 is a real, observed zero. An empty `points` list means no
/// known observation in the range asked for (one exception: the
/// CreateOrUpdate response, which does not echo points).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityMetricSeriesProto {
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    /// The security the metric is for. Only its UUID: never a SecurityProto or
    /// a link, so this file does not import security.proto.
    #[prost(message, optional, tag = "10")]
    pub security_id: ::core::option::Option<super::util::UuidProto>,
    /// What the points measure, and so their units. Never
    /// UNKNOWN_SECURITY_METRIC on write.
    #[prost(enumeration = "SecurityMetricTypeProto", tag = "11")]
    pub metric: i32,
    /// The knowledge time the series reflects: the points are what the store
    /// knew at this instant. Set by the server; a writer's value is ignored.
    #[prost(message, optional, tag = "12")]
    pub as_of: ::core::option::Option<super::util::LocalTimestampProto>,
    /// Ascending by observation_date, at most one point per date.
    #[prost(message, repeated, tag = "20")]
    pub points: ::prost::alloc::vec::Vec<SecurityMetricPointProto>,
}
/// One observation in a SecurityMetricSeriesProto: a date and a value only.
/// It carries no uuid, version, as_of or source of its own; the series header
/// has them.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityMetricPointProto {
    /// The business date the value is for. Required.
    #[prost(message, optional, tag = "1")]
    pub observation_date: ::core::option::Option<super::util::LocalDateProto>,
    /// The value on observation_date, in the units of the series' metric.
    /// Required: a point with no value is invalid. An unknown value is a
    /// missing point, never a 0 or unset value.
    #[prost(message, optional, tag = "2")]
    pub value: ::core::option::Option<super::util::DecimalValueProto>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum TenorTypeProto {
    UnknownTenorType = 0,
    Perpetual = 1,
    Term = 2,
}
impl TenorTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            TenorTypeProto::UnknownTenorType => "UNKNOWN_TENOR_TYPE",
            TenorTypeProto::Perpetual => "PERPETUAL",
            TenorTypeProto::Term => "TERM",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_TENOR_TYPE" => Some(Self::UnknownTenorType),
            "PERPETUAL" => Some(Self::Perpetual),
            "TERM" => Some(Self::Term),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TenorProto {
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    #[prost(string, tag = "5")]
    pub term_value: ::prost::alloc::string::String,
    #[prost(enumeration = "TenorTypeProto", tag = "6")]
    pub tenor_type: i32,
}
