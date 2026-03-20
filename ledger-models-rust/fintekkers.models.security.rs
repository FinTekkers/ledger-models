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
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum SecurityTypeProto {
    /// Maps to Security
    UnknownSecurityType = 0,
    CashSecurity = 1,
    EquitySecurity = 2,
    BondSecurity = 3,
    Tips = 4,
    Frn = 5,
    IndexSecurity = 6,
}
impl SecurityTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            SecurityTypeProto::UnknownSecurityType => "UNKNOWN_SECURITY_TYPE",
            SecurityTypeProto::CashSecurity => "CASH_SECURITY",
            SecurityTypeProto::EquitySecurity => "EQUITY_SECURITY",
            SecurityTypeProto::BondSecurity => "BOND_SECURITY",
            SecurityTypeProto::Tips => "TIPS",
            SecurityTypeProto::Frn => "FRN",
            SecurityTypeProto::IndexSecurity => "INDEX_SECURITY",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_SECURITY_TYPE" => Some(Self::UnknownSecurityType),
            "CASH_SECURITY" => Some(Self::CashSecurity),
            "EQUITY_SECURITY" => Some(Self::EquitySecurity),
            "BOND_SECURITY" => Some(Self::BondSecurity),
            "TIPS" => Some(Self::Tips),
            "FRN" => Some(Self::Frn),
            "INDEX_SECURITY" => Some(Self::IndexSecurity),
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
    #[prost(bool, tag = "7")]
    pub is_link: bool,
    #[prost(message, optional, tag = "8")]
    pub valid_from: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "9")]
    pub valid_to: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(enumeration = "SecurityTypeProto", tag = "10")]
    pub security_type: i32,
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
    #[prost(message, optional, tag = "40")]
    pub identifier: ::core::option::Option<IdentifierProto>,
    #[prost(string, tag = "41")]
    pub description: ::prost::alloc::string::String,
    /// Cash Security fields
    #[prost(string, tag = "50")]
    pub cash_id: ::prost::alloc::string::String,
    /// Bond Security fields
    ///
    /// Expressed as a % (5=5%, 0.75=0.75%, etc)
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
        tags = "200, 201, 202, 203, 204, 205"
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
    }
}
/// Bond security details: fixed-rate coupon bonds (US Treasuries, corporates, etc.)
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BondDetailsProto {
    /// Expressed as a % (5=5%, 0.75=0.75%, etc)
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
    /// Unused for FRN (rate is computed from reference_rate + spread)
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
