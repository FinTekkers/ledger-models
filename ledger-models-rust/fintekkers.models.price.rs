#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PriceTypeProto {
    UnknownPriceType = 0,
    /// Price in local currency (e.g. equity prices, futures)
    Absolute = 1,
    /// Price as a percentage (e.g. bond prices quoted as % of par)
    Percentage = 2,
    /// Price in basis points (e.g. spreads)
    BasisPoints = 3,
    /// Index level (e.g. CPI readings)
    IndexLevel = 4,
}
impl PriceTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PriceTypeProto::UnknownPriceType => "UNKNOWN_PRICE_TYPE",
            PriceTypeProto::Absolute => "ABSOLUTE",
            PriceTypeProto::Percentage => "PERCENTAGE",
            PriceTypeProto::BasisPoints => "BASIS_POINTS",
            PriceTypeProto::IndexLevel => "INDEX_LEVEL",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_PRICE_TYPE" => Some(Self::UnknownPriceType),
            "ABSOLUTE" => Some(Self::Absolute),
            "PERCENTAGE" => Some(Self::Percentage),
            "BASIS_POINTS" => Some(Self::BasisPoints),
            "INDEX_LEVEL" => Some(Self::IndexLevel),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PriceProto {
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
    #[prost(message, optional, tag = "10")]
    pub price: ::core::option::Option<super::util::DecimalValueProto>,
    #[prost(message, optional, tag = "11")]
    pub security: ::core::option::Option<super::security::SecurityProto>,
    #[prost(enumeration = "PriceTypeProto", tag = "12")]
    pub price_type: i32,
}
