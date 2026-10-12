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
/// An exact decimal: value = unscaled_value x 10^-scale. See
/// docs/adr/compact_decimal.md.
///
/// Presence rule: a non-empty unscaled_value means the compact form (11, 12)
/// is set, and it wins over arbitrary_precision_value. Zero is the single byte
/// 0x00, so a set zero is never empty. When unscaled_value is empty, readers
/// fall back to arbitrary_precision_value. When both are empty the decimal is
/// unset.
///
/// Stage 1 (LM-294): writers set both forms. Stage 2 (LM-295) stops writing
/// arbitrary_precision_value. Stage 3 (LM-296) deletes it.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DecimalValueProto {
    /// Deprecated (LM-294). A decimal string such as "1.50" or "1E+3". Read only
    /// when unscaled_value is empty. Writers keep setting it alongside 11 and 12
    /// until LM-295.
    #[deprecated]
    #[prost(string, tag = "10")]
    pub arbitrary_precision_value: ::prost::alloc::string::String,
    /// The unscaled integer in minimal two's-complement big-endian form, of any
    /// size. Zero is 0x00. Non-empty means the compact form is set.
    #[prost(bytes = "vec", tag = "11")]
    pub unscaled_value: ::prost::alloc::vec::Vec<u8>,
    /// The number of digits after the decimal point. Never negative: an exponent
    /// such as 1E+3 is stored as unscaled 1000, scale 0.
    #[prost(uint32, tag = "12")]
    pub scale: u32,
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
/// A currency, identified by its ISO 4217 alpha code (e.g. "USD", "GBP", "EUR").
/// This is a lightweight alternative to embedding a full CASH_SECURITY SecurityProto
/// when only the currency code is needed.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CurrencyProto {
    /// ISO 4217 alpha-3, e.g. "USD", "GBP"
    #[prost(string, tag = "1")]
    pub iso_code: ::prost::alloc::string::String,
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
