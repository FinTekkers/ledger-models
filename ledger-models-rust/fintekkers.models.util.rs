///   uint32 scale = 1;
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DecimalValueProto {
    /// This is a string representation of a float number.
    /// This will be deprecated in the future for a more space efficient approach
    #[prost(string, tag = "10")]
    pub arbitrary_precision_value: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LocalDateProto {
    #[prost(uint32, tag = "1")]
    pub year: u32,
    #[prost(uint32, tag = "2")]
    pub month: u32,
    #[prost(uint32, tag = "3")]
    pub day: u32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LocalTimestampProto {
    #[prost(message, optional, tag = "1")]
    pub timestamp: ::core::option::Option<::prost_types::Timestamp>,
    /// TODO: Need to decide how to model this: <https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations>
    /// <https://docs.oracle.com/javase/8/docs/api/java/time/ZoneId.html>
    #[prost(string, tag = "2")]
    pub time_zone: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct UuidProto {
    #[prost(bytes = "vec", tag = "1")]
    pub raw_uuid: ::prost::alloc::vec::Vec<u8>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Endpoint {
    /// The IP address that an endpoint is exposed through. The assumption is the IP
    /// is exposed to internal clients through VPC/Security rules, or to the public
    /// internet if public-facing
    #[prost(string, tag = "1")]
    pub ip: ::prost::alloc::string::String,
    /// The port that the service is listening to on the specified IP address.
    #[prost(uint32, tag = "2")]
    pub port: u32,
    /// Placeholder for the future. For public-facing traffic a URL will be used, and
    /// the resolution to IP occurs via DNS.
    #[prost(string, tag = "3")]
    pub fully_qualified_url: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DateRangeProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Date Ranges are inclusive of the start and end dates
    #[prost(message, optional, tag = "10")]
    pub start: ::core::option::Option<LocalTimestampProto>,
    #[prost(message, optional, tag = "11")]
    pub end: ::core::option::Option<LocalTimestampProto>,
}
