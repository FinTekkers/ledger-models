/// US tax elections for amortising bond premium and discount. Fixed per
/// portfolio: they apply to every lot. Zero values mean "use the default".
/// Read by MeasureProto.ADJUSTED_COST_BASIS (VS-110, LM-364). Tax elections
/// only: book (GAAP/IFRS) elections are out of scope.
/// See docs/adr/amortisation_elections.md.
///
/// Fields 1 and 2 are not used. This is a value nested in PortfolioProto and
/// CostBasisInput, not a stamped message, so it has no object_type/version
/// (LM-318).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct AmortisationElectionsProto {
    /// IRC §171; UNSPECIFIED → PREMIUM_ELECTED
    #[prost(enumeration = "PremiumAmortisationElectionProto", tag = "10")]
    pub bond_premium: i32,
    /// IRC §1278(b); UNSPECIFIED → AT_DISPOSITION
    #[prost(enumeration = "MarketDiscountInclusionProto", tag = "11")]
    pub market_discount_inclusion: i32,
    /// IRC §1276(b)(2); UNSPECIFIED → RATABLE; only with INCLUDE_CURRENTLY
    #[prost(enumeration = "MarketDiscountAccrualMethodProto", tag = "12")]
    pub market_discount_accrual: i32,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PremiumAmortisationElectionProto {
    /// Use the default: PREMIUM_ELECTED.
    UnspecifiedPremiumElection = 0,
    PremiumElected = 1,
    PremiumNotElected = 2,
}
impl PremiumAmortisationElectionProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PremiumAmortisationElectionProto::UnspecifiedPremiumElection => {
                "UNSPECIFIED_PREMIUM_ELECTION"
            }
            PremiumAmortisationElectionProto::PremiumElected => "PREMIUM_ELECTED",
            PremiumAmortisationElectionProto::PremiumNotElected => "PREMIUM_NOT_ELECTED",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNSPECIFIED_PREMIUM_ELECTION" => Some(Self::UnspecifiedPremiumElection),
            "PREMIUM_ELECTED" => Some(Self::PremiumElected),
            "PREMIUM_NOT_ELECTED" => Some(Self::PremiumNotElected),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum MarketDiscountInclusionProto {
    /// Use the default: AT_DISPOSITION.
    UnspecifiedMarketDiscountInclusion = 0,
    AtDisposition = 1,
    IncludeCurrently = 2,
}
impl MarketDiscountInclusionProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            MarketDiscountInclusionProto::UnspecifiedMarketDiscountInclusion => {
                "UNSPECIFIED_MARKET_DISCOUNT_INCLUSION"
            }
            MarketDiscountInclusionProto::AtDisposition => "AT_DISPOSITION",
            MarketDiscountInclusionProto::IncludeCurrently => "INCLUDE_CURRENTLY",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNSPECIFIED_MARKET_DISCOUNT_INCLUSION" => {
                Some(Self::UnspecifiedMarketDiscountInclusion)
            }
            "AT_DISPOSITION" => Some(Self::AtDisposition),
            "INCLUDE_CURRENTLY" => Some(Self::IncludeCurrently),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum MarketDiscountAccrualMethodProto {
    /// Use the default: RATABLE.
    UnspecifiedAccrualMethod = 0,
    Ratable = 1,
    ConstantYield = 2,
}
impl MarketDiscountAccrualMethodProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            MarketDiscountAccrualMethodProto::UnspecifiedAccrualMethod => {
                "UNSPECIFIED_ACCRUAL_METHOD"
            }
            MarketDiscountAccrualMethodProto::Ratable => "RATABLE",
            MarketDiscountAccrualMethodProto::ConstantYield => "CONSTANT_YIELD",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNSPECIFIED_ACCRUAL_METHOD" => Some(Self::UnspecifiedAccrualMethod),
            "RATABLE" => Some(Self::Ratable),
            "CONSTANT_YIELD" => Some(Self::ConstantYield),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PortfolioProto {
    /// 1-4 reserved
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::util::VersionProto>,
    /// Primary Key
    #[prost(message, optional, tag = "5")]
    pub uuid: ::core::option::Option<super::util::UuidProto>,
    #[prost(message, optional, tag = "6")]
    pub as_of: ::core::option::Option<super::util::LocalTimestampProto>,
    /// When true, only uuid is populated — resolve full entity via PortfolioService.GetByIds.
    /// See docs/adr/is_link_pattern.md.
    #[prost(bool, tag = "7")]
    pub is_link: bool,
    #[prost(message, optional, tag = "8")]
    pub valid_from: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "9")]
    pub valid_to: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(string, tag = "10")]
    pub portfolio_name: ::prost::alloc::string::String,
    /// US tax elections, fixed per portfolio; apply to every lot. Unset = every
    /// default. Copied into CostBasisInput.elections for ADJUSTED_COST_BASIS.
    /// See docs/adr/amortisation_elections.md.
    #[prost(message, optional, tag = "11")]
    pub amortisation_elections: ::core::option::Option<AmortisationElectionsProto>,
}
