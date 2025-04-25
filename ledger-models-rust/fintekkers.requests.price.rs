#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePriceRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_price_input: ::core::option::Option<
        super::super::models::price::PriceProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPriceRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, repeated, tag = "21")]
    pub uu_ids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    #[prost(message, optional, tag = "22")]
    pub search_price_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
    #[prost(message, optional, tag = "23")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
    /// Optional: Used to filter the price frequency and horizon
    #[prost(enumeration = "PriceFrequencyProto", tag = "24")]
    pub frequency: i32,
    #[prost(oneof = "query_price_request_proto::TimeRange", tags = "25, 26")]
    pub time_range: ::core::option::Option<query_price_request_proto::TimeRange>,
}
/// Nested message and enum types in `QueryPriceRequestProto`.
pub mod query_price_request_proto {
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum TimeRange {
        #[prost(enumeration = "super::PriceHorizonProto", tag = "25")]
        Horizon(i32),
        #[prost(message, tag = "26")]
        DateRange(super::super::super::models::util::DateRangeProto),
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PriceFrequencyProto {
    PriceFrequencyUnspecified = 0,
    PriceFrequencyWeekly = 10,
    PriceFrequencyDaily = 20,
    PriceFrequencyHourly = 30,
    PriceFrequencyMinute = 40,
    /// PRICE_FREQUENCY_SECOND = 50;
    /// PRICE_FREQUENCY_MILLISECOND = 60;
    /// PRICE_FREQUENCY_MICROSECOND = 70;
    /// PRICE_FREQUENCY_NANOSECOND = 80;
    PriceFrequencyEveryTick = 90,
}
impl PriceFrequencyProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PriceFrequencyProto::PriceFrequencyUnspecified => {
                "PRICE_FREQUENCY_UNSPECIFIED"
            }
            PriceFrequencyProto::PriceFrequencyWeekly => "PRICE_FREQUENCY_WEEKLY",
            PriceFrequencyProto::PriceFrequencyDaily => "PRICE_FREQUENCY_DAILY",
            PriceFrequencyProto::PriceFrequencyHourly => "PRICE_FREQUENCY_HOURLY",
            PriceFrequencyProto::PriceFrequencyMinute => "PRICE_FREQUENCY_MINUTE",
            PriceFrequencyProto::PriceFrequencyEveryTick => "PRICE_FREQUENCY_EVERY_TICK",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "PRICE_FREQUENCY_UNSPECIFIED" => Some(Self::PriceFrequencyUnspecified),
            "PRICE_FREQUENCY_WEEKLY" => Some(Self::PriceFrequencyWeekly),
            "PRICE_FREQUENCY_DAILY" => Some(Self::PriceFrequencyDaily),
            "PRICE_FREQUENCY_HOURLY" => Some(Self::PriceFrequencyHourly),
            "PRICE_FREQUENCY_MINUTE" => Some(Self::PriceFrequencyMinute),
            "PRICE_FREQUENCY_EVERY_TICK" => Some(Self::PriceFrequencyEveryTick),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PriceHorizonProto {
    PriceHorizonUnspecified = 0,
    PriceHorizon1Day = 1,
    PriceHorizon5Days = 2,
    PriceHorizon1Week = 3,
    PriceHorizon1Month = 4,
    PriceHorizon6Months = 5,
    PriceHorizon1Year = 6,
    PriceHorizon5Year = 7,
    PriceHorizonMax = 8,
    PriceHorizonYearToDate = 9,
}
impl PriceHorizonProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PriceHorizonProto::PriceHorizonUnspecified => "PRICE_HORIZON_UNSPECIFIED",
            PriceHorizonProto::PriceHorizon1Day => "PRICE_HORIZON_1_DAY",
            PriceHorizonProto::PriceHorizon5Days => "PRICE_HORIZON_5_DAYS",
            PriceHorizonProto::PriceHorizon1Week => "PRICE_HORIZON_1_WEEK",
            PriceHorizonProto::PriceHorizon1Month => "PRICE_HORIZON_1_MONTH",
            PriceHorizonProto::PriceHorizon6Months => "PRICE_HORIZON_6_MONTHS",
            PriceHorizonProto::PriceHorizon1Year => "PRICE_HORIZON_1_YEAR",
            PriceHorizonProto::PriceHorizon5Year => "PRICE_HORIZON_5_YEAR",
            PriceHorizonProto::PriceHorizonMax => "PRICE_HORIZON_MAX",
            PriceHorizonProto::PriceHorizonYearToDate => "PRICE_HORIZON_YEAR_TO_DATE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "PRICE_HORIZON_UNSPECIFIED" => Some(Self::PriceHorizonUnspecified),
            "PRICE_HORIZON_1_DAY" => Some(Self::PriceHorizon1Day),
            "PRICE_HORIZON_5_DAYS" => Some(Self::PriceHorizon5Days),
            "PRICE_HORIZON_1_WEEK" => Some(Self::PriceHorizon1Week),
            "PRICE_HORIZON_1_MONTH" => Some(Self::PriceHorizon1Month),
            "PRICE_HORIZON_6_MONTHS" => Some(Self::PriceHorizon6Months),
            "PRICE_HORIZON_1_YEAR" => Some(Self::PriceHorizon1Year),
            "PRICE_HORIZON_5_YEAR" => Some(Self::PriceHorizon5Year),
            "PRICE_HORIZON_MAX" => Some(Self::PriceHorizonMax),
            "PRICE_HORIZON_YEAR_TO_DATE" => Some(Self::PriceHorizonYearToDate),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPriceResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub query_price_request: ::core::option::Option<QueryPriceRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub price_response: ::prost::alloc::vec::Vec<
        super::super::models::price::PriceProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePriceResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_price_request: ::core::option::Option<CreatePriceRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub price_response: ::prost::alloc::vec::Vec<
        super::super::models::price::PriceProto,
    >,
}
