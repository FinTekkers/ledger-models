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
            "CASH" => Some(Self::Cash),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IdentifierProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
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
/// Lightweight reference to a Security by UUID.
///
/// Used for the SecurityProto.legs field (multi-leg strategy packages
/// where each leg is itself a Security). Unlike SecurityProto with
/// is_link=true, this carries only the UUID — no settlement currency
/// echo, no embedded fields. Resolve to a full SecurityProto via
/// SecurityService.GetByIds.
///
/// See hierarchy-examples.md for the multi-leg-strategy pattern: a
/// strategy Security carries productType=EQUITY_VANILLA (for example)
/// and a legs list of per-leg Security IDs; cashflows and risk
/// aggregate over legs.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityIdProto {
    #[prost(message, optional, tag = "1")]
    pub uuid: ::core::option::Option<super::util::UuidProto>,
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
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SecurityProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
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
    /// identified by UUID. See hierarchy-examples.md for the pattern:
    /// butterflies, calendar spreads, iron condors, etc. are not
    /// productTypes; they're a Security whose product_type is the
    /// underlying vanilla type with `legs` populated.
    #[prost(message, repeated, tag = "17")]
    pub legs: ::prost::alloc::vec::Vec<SecurityIdProto>,
    /// Soft-delete marker. null/unset = active record; non-null = soft-deleted
    /// at this timestamp. SecurityService.Search and GetByIds filter out
    /// soft-deleted records by default. Setting deleted_at via CreateOrUpdate
    /// is a soft-delete; clearing it on a subsequent CreateOrUpdate resurrects
    /// the record.
    /// See: <https://github.com/FinTekkers/second-brain/issues/188>
    #[prost(message, optional, tag = "15")]
    pub deleted_at: ::core::option::Option<super::util::LocalTimestampProto>,
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
    /// DEPRECATED: use identifiers
    #[prost(message, optional, tag = "40")]
    pub identifier: ::core::option::Option<IdentifierProto>,
    #[prost(string, tag = "41")]
    pub description: ::prost::alloc::string::String,
    /// All known identifiers for this security. The primary identifier (used as
    /// the human-readable ID) is the first entry. Secondary identifiers follow.
    /// For Gilts, entry 0 will be {type=ISIN, value="GB..."}; for US Treasuries,
    /// entry 0 will be {type=CUSIP, value="912828..."}.
    #[prost(message, repeated, tag = "42")]
    pub identifiers: ::prost::alloc::vec::Vec<IdentifierProto>,
    /// Cash Security fields
    #[prost(string, tag = "50")]
    pub cash_id: ::prost::alloc::string::String,
    /// Bond Security fields
    ///
    /// Expressed as a decimal fraction (0.05=5%, 0.0075=0.75%). Do NOT use percentage form (5.0 will be rejected).
    #[prost(message, optional, tag = "60")]
    pub coupon_rate: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(enumeration = "CouponTypeProto", tag = "61")]
    pub coupon_type: i32,
    #[prost(enumeration = "CouponFrequencyProto", tag = "62")]
    pub coupon_frequency: i32,
    #[prost(message, optional, tag = "63")]
    pub dated_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "64")]
    pub face_value: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(message, optional, tag = "65")]
    pub issue_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "66")]
    pub maturity_date: ::core::option::Option<super::util::LocalDateProto>,
    /// Issuance can be repeated as there may be re-openings of bond auctions (e.g. in US treasuries)
    #[prost(message, repeated, tag = "67")]
    pub issuance_info: ::prost::alloc::vec::Vec<bond::IssuanceProto>,
    /// TIPS Bond fields
    ///
    /// Reference CPI at bond issuance (e.g. 256.394)
    #[prost(message, optional, tag = "70")]
    pub base_cpi: ::core::option::Option<super::util::DecimalValueProto>,
    /// The date the base CPI was observed (e.g. the reference CPI date)
    #[prost(message, optional, tag = "71")]
    pub index_date: ::core::option::Option<super::util::LocalDateProto>,
    /// Which inflation index this TIPS references (e.g. CPI_U)
    #[prost(enumeration = "index::IndexTypeProto", tag = "72")]
    pub inflation_index_type: i32,
    /// FRN (Floating Rate Note) fields
    ///
    /// Fixed spread over the reference rate, in basis points (e.g. 15 = +15bps)
    #[prost(message, optional, tag = "90")]
    pub spread: ::core::option::Option<super::util::DecimalValueProto>,
    /// Which floating rate benchmark this FRN references (e.g. SOFR, T_BILL_13_WEEK)
    #[prost(enumeration = "index::IndexTypeProto", tag = "91")]
    pub reference_rate_index: i32,
    /// How often the floating coupon rate resets
    #[prost(enumeration = "CouponFrequencyProto", tag = "92")]
    pub reset_frequency: i32,
    /// Index Security fields
    #[prost(enumeration = "index::IndexTypeProto", tag = "80")]
    pub index_type: i32,
    /// ============================================================================
    /// oneof product_details — structured alternative to the flat fields above.
    ///
    /// During migration, BOTH the flat fields (tags 50-92) and the oneof (tags 200+)
    /// may be populated. Consumers should prefer the oneof if set, falling back to
    /// flat fields for backward compatibility. Writers should populate BOTH during
    /// the dual-write period.
    ///
    /// Once all consumers have migrated to the oneof, the flat fields will be
    /// deprecated and eventually removed in a major version bump.
    /// ============================================================================
    #[prost(
        oneof = "security_proto::ProductDetails",
        tags = "200, 201, 202, 203, 204, 205, 206"
    )]
    pub product_details: ::core::option::Option<security_proto::ProductDetails>,
}
/// Nested message and enum types in `SecurityProto`.
pub mod security_proto {
    /// ============================================================================
    /// oneof product_details — structured alternative to the flat fields above.
    ///
    /// During migration, BOTH the flat fields (tags 50-92) and the oneof (tags 200+)
    /// may be populated. Consumers should prefer the oneof if set, falling back to
    /// flat fields for backward compatibility. Writers should populate BOTH during
    /// the dual-write period.
    ///
    /// Once all consumers have migrated to the oneof, the flat fields will be
    /// deprecated and eventually removed in a major version bump.
    /// ============================================================================
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum ProductDetails {
        #[prost(message, tag = "200")]
        BondDetails(super::BondDetailsProto),
        #[prost(message, tag = "201")]
        TipsDetails(super::TipsDetailsProto),
        #[prost(message, tag = "202")]
        FrnDetails(super::FrnDetailsProto),
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
    /// Expressed as a decimal fraction (0.05=5%, 0.0075=0.75%). Do NOT use percentage form (5.0 will be rejected).
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
    #[prost(message, optional, tag = "6")]
    pub issue_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "7")]
    pub maturity_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, repeated, tag = "8")]
    pub issuance_info: ::prost::alloc::vec::Vec<bond::IssuanceProto>,
}
/// TIPS (Treasury Inflation-Protected Securities) details.
/// Extends bond fields with inflation-indexing information.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct TipsDetailsProto {
    /// Shared bond fields
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
    #[prost(message, optional, tag = "6")]
    pub issue_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "7")]
    pub maturity_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, repeated, tag = "8")]
    pub issuance_info: ::prost::alloc::vec::Vec<bond::IssuanceProto>,
    /// TIPS-specific fields
    ///
    /// Reference CPI at bond issuance (e.g. 256.394)
    #[prost(message, optional, tag = "10")]
    pub base_cpi: ::core::option::Option<super::util::DecimalValueProto>,
    /// The date the base CPI was observed
    #[prost(message, optional, tag = "11")]
    pub index_date: ::core::option::Option<super::util::LocalDateProto>,
    /// Which inflation index (e.g. CPI_U)
    #[prost(enumeration = "index::IndexTypeProto", tag = "12")]
    pub inflation_index_type: i32,
}
/// Floating Rate Note (FRN) details.
/// Extends bond fields with floating-rate-specific information.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FrnDetailsProto {
    /// Shared bond fields
    ///
    /// Unused for FRN (rate is computed from reference_rate + spread). If set, must be in decimal form (0.05=5%).
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
    #[prost(message, optional, tag = "6")]
    pub issue_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, optional, tag = "7")]
    pub maturity_date: ::core::option::Option<super::util::LocalDateProto>,
    #[prost(message, repeated, tag = "8")]
    pub issuance_info: ::prost::alloc::vec::Vec<bond::IssuanceProto>,
    /// FRN-specific fields
    ///
    /// Fixed spread over the reference rate, in basis points
    #[prost(message, optional, tag = "10")]
    pub spread: ::core::option::Option<super::util::DecimalValueProto>,
    /// Which floating rate benchmark (e.g. SOFR)
    #[prost(enumeration = "index::IndexTypeProto", tag = "11")]
    pub reference_rate_index: i32,
    /// How often the floating coupon rate resets
    #[prost(enumeration = "CouponFrequencyProto", tag = "12")]
    pub reset_frequency: i32,
}
/// Index security details (e.g. CPI-U, SOFR index).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct IndexDetailsProto {
    #[prost(enumeration = "index::IndexTypeProto", tag = "1")]
    pub index_type: i32,
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
/// Canonical vocabulary for the asset class of a security.
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
    CashAssetClass = 3,
    /// INDEX covers reference instruments like SP500, CMT-derived treasury
    /// indices, etc. — used in market-data-inputs today. Borderline as an
    /// "asset class" in finance terminology, but matches in-use data.
    Index = 4,
    /// VOLATILITY covers volatility-class reference instruments — VIX
    /// (CBOE Volatility Index), VVIX, etc. Stored as INDEX_SECURITY at the
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
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
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
    /// The index security this composition belongs to (EQUITY_INDEX_SECURITY type).
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
    /// The currency of the constituent's price (e.g. "USD"). Needed for multi-currency indices.
    #[prost(string, tag = "5")]
    pub currency: ::prost::alloc::string::String,
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
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(string, tag = "5")]
    pub term_value: ::prost::alloc::string::String,
    #[prost(enumeration = "TenorTypeProto", tag = "6")]
    pub tenor_type: i32,
}
