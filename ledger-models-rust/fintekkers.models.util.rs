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
/// One value per message type that carries object_type. The name is the
/// message name without its `Proto` suffix, in SCREAMING_SNAKE, prefixed
/// OBJECT_TYPE_. Models use 1-99 and requests 101+.
///
/// Numbers are append-only: never renumber or reuse a value. A removed value
/// is `reserved`. test-fixtures/object-type/enum-numbers.json pins them.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum ObjectTypeProto {
    ObjectTypeUnknown = 0,
    /// fintekkers/models/**
    ObjectTypeApiKey = 1,
    ObjectTypeDateRange = 2,
    ObjectTypeIdentifier = 3,
    ObjectTypeIndexComposition = 4,
    ObjectTypeIssuance = 5,
    ObjectTypeNodePartition = 6,
    ObjectTypeNodeState = 7,
    ObjectTypePortfolio = 8,
    ObjectTypePosition = 9,
    ObjectTypePositionFilter = 10,
    ObjectTypePrice = 11,
    ObjectTypeSecurity = 12,
    ObjectTypeStrategy = 13,
    ObjectTypeStrategyAllocation = 14,
    ObjectTypeTenor = 15,
    ObjectTypeTransaction = 16,
    /// fintekkers/requests/**
    ObjectTypeCreateIndexCompositionRequest = 101,
    ObjectTypeCreateIndexCompositionResponse = 102,
    ObjectTypeCreatePortfolioRequest = 103,
    ObjectTypeCreatePortfolioResponse = 104,
    ObjectTypeCreatePriceRequest = 105,
    ObjectTypeCreatePriceResponse = 106,
    ObjectTypeCreateSecurityRequest = 107,
    ObjectTypeCreateSecurityResponse = 108,
    ObjectTypeCreateTransactionRequest = 109,
    ObjectTypeCreateTransactionResponse = 110,
    ObjectTypeCurveRequest = 111,
    ObjectTypeCurveResponse = 112,
    ObjectTypeDeleteRequest = 113,
    ObjectTypeDeleteResponse = 114,
    ObjectTypeGetFieldsResponse = 115,
    ObjectTypeGetFieldValuesRequest = 116,
    ObjectTypeGetFieldValuesResponse = 117,
    ObjectTypeGetIndexCompositionRequest = 118,
    ObjectTypeGetIndexCompositionResponse = 119,
    ObjectTypeLockRequest = 120,
    ObjectTypeLockResponse = 121,
    ObjectTypeQueryPortfolioRequest = 122,
    ObjectTypeQueryPortfolioResponse = 123,
    ObjectTypeQueryPositionRequest = 124,
    ObjectTypeQueryPositionResponse = 125,
    ObjectTypeQueryPriceRequest = 126,
    ObjectTypeQueryPriceResponse = 127,
    ObjectTypeQuerySecurityRequest = 128,
    ObjectTypeQuerySecurityResponse = 129,
    ObjectTypeQueryTransactionRequest = 130,
    ObjectTypeQueryTransactionResponse = 131,
    ObjectTypeValuationRequest = 132,
    ObjectTypeValuationResponse = 133,
}
impl ObjectTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            ObjectTypeProto::ObjectTypeUnknown => "OBJECT_TYPE_UNKNOWN",
            ObjectTypeProto::ObjectTypeApiKey => "OBJECT_TYPE_API_KEY",
            ObjectTypeProto::ObjectTypeDateRange => "OBJECT_TYPE_DATE_RANGE",
            ObjectTypeProto::ObjectTypeIdentifier => "OBJECT_TYPE_IDENTIFIER",
            ObjectTypeProto::ObjectTypeIndexComposition => {
                "OBJECT_TYPE_INDEX_COMPOSITION"
            }
            ObjectTypeProto::ObjectTypeIssuance => "OBJECT_TYPE_ISSUANCE",
            ObjectTypeProto::ObjectTypeNodePartition => "OBJECT_TYPE_NODE_PARTITION",
            ObjectTypeProto::ObjectTypeNodeState => "OBJECT_TYPE_NODE_STATE",
            ObjectTypeProto::ObjectTypePortfolio => "OBJECT_TYPE_PORTFOLIO",
            ObjectTypeProto::ObjectTypePosition => "OBJECT_TYPE_POSITION",
            ObjectTypeProto::ObjectTypePositionFilter => "OBJECT_TYPE_POSITION_FILTER",
            ObjectTypeProto::ObjectTypePrice => "OBJECT_TYPE_PRICE",
            ObjectTypeProto::ObjectTypeSecurity => "OBJECT_TYPE_SECURITY",
            ObjectTypeProto::ObjectTypeStrategy => "OBJECT_TYPE_STRATEGY",
            ObjectTypeProto::ObjectTypeStrategyAllocation => {
                "OBJECT_TYPE_STRATEGY_ALLOCATION"
            }
            ObjectTypeProto::ObjectTypeTenor => "OBJECT_TYPE_TENOR",
            ObjectTypeProto::ObjectTypeTransaction => "OBJECT_TYPE_TRANSACTION",
            ObjectTypeProto::ObjectTypeCreateIndexCompositionRequest => {
                "OBJECT_TYPE_CREATE_INDEX_COMPOSITION_REQUEST"
            }
            ObjectTypeProto::ObjectTypeCreateIndexCompositionResponse => {
                "OBJECT_TYPE_CREATE_INDEX_COMPOSITION_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeCreatePortfolioRequest => {
                "OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST"
            }
            ObjectTypeProto::ObjectTypeCreatePortfolioResponse => {
                "OBJECT_TYPE_CREATE_PORTFOLIO_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeCreatePriceRequest => {
                "OBJECT_TYPE_CREATE_PRICE_REQUEST"
            }
            ObjectTypeProto::ObjectTypeCreatePriceResponse => {
                "OBJECT_TYPE_CREATE_PRICE_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeCreateSecurityRequest => {
                "OBJECT_TYPE_CREATE_SECURITY_REQUEST"
            }
            ObjectTypeProto::ObjectTypeCreateSecurityResponse => {
                "OBJECT_TYPE_CREATE_SECURITY_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeCreateTransactionRequest => {
                "OBJECT_TYPE_CREATE_TRANSACTION_REQUEST"
            }
            ObjectTypeProto::ObjectTypeCreateTransactionResponse => {
                "OBJECT_TYPE_CREATE_TRANSACTION_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeCurveRequest => "OBJECT_TYPE_CURVE_REQUEST",
            ObjectTypeProto::ObjectTypeCurveResponse => "OBJECT_TYPE_CURVE_RESPONSE",
            ObjectTypeProto::ObjectTypeDeleteRequest => "OBJECT_TYPE_DELETE_REQUEST",
            ObjectTypeProto::ObjectTypeDeleteResponse => "OBJECT_TYPE_DELETE_RESPONSE",
            ObjectTypeProto::ObjectTypeGetFieldsResponse => {
                "OBJECT_TYPE_GET_FIELDS_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeGetFieldValuesRequest => {
                "OBJECT_TYPE_GET_FIELD_VALUES_REQUEST"
            }
            ObjectTypeProto::ObjectTypeGetFieldValuesResponse => {
                "OBJECT_TYPE_GET_FIELD_VALUES_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeGetIndexCompositionRequest => {
                "OBJECT_TYPE_GET_INDEX_COMPOSITION_REQUEST"
            }
            ObjectTypeProto::ObjectTypeGetIndexCompositionResponse => {
                "OBJECT_TYPE_GET_INDEX_COMPOSITION_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeLockRequest => "OBJECT_TYPE_LOCK_REQUEST",
            ObjectTypeProto::ObjectTypeLockResponse => "OBJECT_TYPE_LOCK_RESPONSE",
            ObjectTypeProto::ObjectTypeQueryPortfolioRequest => {
                "OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST"
            }
            ObjectTypeProto::ObjectTypeQueryPortfolioResponse => {
                "OBJECT_TYPE_QUERY_PORTFOLIO_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeQueryPositionRequest => {
                "OBJECT_TYPE_QUERY_POSITION_REQUEST"
            }
            ObjectTypeProto::ObjectTypeQueryPositionResponse => {
                "OBJECT_TYPE_QUERY_POSITION_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeQueryPriceRequest => {
                "OBJECT_TYPE_QUERY_PRICE_REQUEST"
            }
            ObjectTypeProto::ObjectTypeQueryPriceResponse => {
                "OBJECT_TYPE_QUERY_PRICE_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeQuerySecurityRequest => {
                "OBJECT_TYPE_QUERY_SECURITY_REQUEST"
            }
            ObjectTypeProto::ObjectTypeQuerySecurityResponse => {
                "OBJECT_TYPE_QUERY_SECURITY_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeQueryTransactionRequest => {
                "OBJECT_TYPE_QUERY_TRANSACTION_REQUEST"
            }
            ObjectTypeProto::ObjectTypeQueryTransactionResponse => {
                "OBJECT_TYPE_QUERY_TRANSACTION_RESPONSE"
            }
            ObjectTypeProto::ObjectTypeValuationRequest => {
                "OBJECT_TYPE_VALUATION_REQUEST"
            }
            ObjectTypeProto::ObjectTypeValuationResponse => {
                "OBJECT_TYPE_VALUATION_RESPONSE"
            }
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "OBJECT_TYPE_UNKNOWN" => Some(Self::ObjectTypeUnknown),
            "OBJECT_TYPE_API_KEY" => Some(Self::ObjectTypeApiKey),
            "OBJECT_TYPE_DATE_RANGE" => Some(Self::ObjectTypeDateRange),
            "OBJECT_TYPE_IDENTIFIER" => Some(Self::ObjectTypeIdentifier),
            "OBJECT_TYPE_INDEX_COMPOSITION" => Some(Self::ObjectTypeIndexComposition),
            "OBJECT_TYPE_ISSUANCE" => Some(Self::ObjectTypeIssuance),
            "OBJECT_TYPE_NODE_PARTITION" => Some(Self::ObjectTypeNodePartition),
            "OBJECT_TYPE_NODE_STATE" => Some(Self::ObjectTypeNodeState),
            "OBJECT_TYPE_PORTFOLIO" => Some(Self::ObjectTypePortfolio),
            "OBJECT_TYPE_POSITION" => Some(Self::ObjectTypePosition),
            "OBJECT_TYPE_POSITION_FILTER" => Some(Self::ObjectTypePositionFilter),
            "OBJECT_TYPE_PRICE" => Some(Self::ObjectTypePrice),
            "OBJECT_TYPE_SECURITY" => Some(Self::ObjectTypeSecurity),
            "OBJECT_TYPE_STRATEGY" => Some(Self::ObjectTypeStrategy),
            "OBJECT_TYPE_STRATEGY_ALLOCATION" => Some(Self::ObjectTypeStrategyAllocation),
            "OBJECT_TYPE_TENOR" => Some(Self::ObjectTypeTenor),
            "OBJECT_TYPE_TRANSACTION" => Some(Self::ObjectTypeTransaction),
            "OBJECT_TYPE_CREATE_INDEX_COMPOSITION_REQUEST" => {
                Some(Self::ObjectTypeCreateIndexCompositionRequest)
            }
            "OBJECT_TYPE_CREATE_INDEX_COMPOSITION_RESPONSE" => {
                Some(Self::ObjectTypeCreateIndexCompositionResponse)
            }
            "OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST" => {
                Some(Self::ObjectTypeCreatePortfolioRequest)
            }
            "OBJECT_TYPE_CREATE_PORTFOLIO_RESPONSE" => {
                Some(Self::ObjectTypeCreatePortfolioResponse)
            }
            "OBJECT_TYPE_CREATE_PRICE_REQUEST" => {
                Some(Self::ObjectTypeCreatePriceRequest)
            }
            "OBJECT_TYPE_CREATE_PRICE_RESPONSE" => {
                Some(Self::ObjectTypeCreatePriceResponse)
            }
            "OBJECT_TYPE_CREATE_SECURITY_REQUEST" => {
                Some(Self::ObjectTypeCreateSecurityRequest)
            }
            "OBJECT_TYPE_CREATE_SECURITY_RESPONSE" => {
                Some(Self::ObjectTypeCreateSecurityResponse)
            }
            "OBJECT_TYPE_CREATE_TRANSACTION_REQUEST" => {
                Some(Self::ObjectTypeCreateTransactionRequest)
            }
            "OBJECT_TYPE_CREATE_TRANSACTION_RESPONSE" => {
                Some(Self::ObjectTypeCreateTransactionResponse)
            }
            "OBJECT_TYPE_CURVE_REQUEST" => Some(Self::ObjectTypeCurveRequest),
            "OBJECT_TYPE_CURVE_RESPONSE" => Some(Self::ObjectTypeCurveResponse),
            "OBJECT_TYPE_DELETE_REQUEST" => Some(Self::ObjectTypeDeleteRequest),
            "OBJECT_TYPE_DELETE_RESPONSE" => Some(Self::ObjectTypeDeleteResponse),
            "OBJECT_TYPE_GET_FIELDS_RESPONSE" => Some(Self::ObjectTypeGetFieldsResponse),
            "OBJECT_TYPE_GET_FIELD_VALUES_REQUEST" => {
                Some(Self::ObjectTypeGetFieldValuesRequest)
            }
            "OBJECT_TYPE_GET_FIELD_VALUES_RESPONSE" => {
                Some(Self::ObjectTypeGetFieldValuesResponse)
            }
            "OBJECT_TYPE_GET_INDEX_COMPOSITION_REQUEST" => {
                Some(Self::ObjectTypeGetIndexCompositionRequest)
            }
            "OBJECT_TYPE_GET_INDEX_COMPOSITION_RESPONSE" => {
                Some(Self::ObjectTypeGetIndexCompositionResponse)
            }
            "OBJECT_TYPE_LOCK_REQUEST" => Some(Self::ObjectTypeLockRequest),
            "OBJECT_TYPE_LOCK_RESPONSE" => Some(Self::ObjectTypeLockResponse),
            "OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST" => {
                Some(Self::ObjectTypeQueryPortfolioRequest)
            }
            "OBJECT_TYPE_QUERY_PORTFOLIO_RESPONSE" => {
                Some(Self::ObjectTypeQueryPortfolioResponse)
            }
            "OBJECT_TYPE_QUERY_POSITION_REQUEST" => {
                Some(Self::ObjectTypeQueryPositionRequest)
            }
            "OBJECT_TYPE_QUERY_POSITION_RESPONSE" => {
                Some(Self::ObjectTypeQueryPositionResponse)
            }
            "OBJECT_TYPE_QUERY_PRICE_REQUEST" => Some(Self::ObjectTypeQueryPriceRequest),
            "OBJECT_TYPE_QUERY_PRICE_RESPONSE" => {
                Some(Self::ObjectTypeQueryPriceResponse)
            }
            "OBJECT_TYPE_QUERY_SECURITY_REQUEST" => {
                Some(Self::ObjectTypeQuerySecurityRequest)
            }
            "OBJECT_TYPE_QUERY_SECURITY_RESPONSE" => {
                Some(Self::ObjectTypeQuerySecurityResponse)
            }
            "OBJECT_TYPE_QUERY_TRANSACTION_REQUEST" => {
                Some(Self::ObjectTypeQueryTransactionRequest)
            }
            "OBJECT_TYPE_QUERY_TRANSACTION_RESPONSE" => {
                Some(Self::ObjectTypeQueryTransactionResponse)
            }
            "OBJECT_TYPE_VALUATION_REQUEST" => Some(Self::ObjectTypeValuationRequest),
            "OBJECT_TYPE_VALUATION_RESPONSE" => Some(Self::ObjectTypeValuationResponse),
            _ => None,
        }
    }
}
/// The schema version of the message that carries it, as field 2 (LM-318).
/// Not the library release: writers set 0.0.1. See
/// docs/adr/compact_object_type_and_version.md.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct VersionProto {
    #[prost(uint32, tag = "1")]
    pub major: u32,
    #[prost(uint32, tag = "2")]
    pub minor: u32,
    #[prost(uint32, tag = "3")]
    pub patch: u32,
}
/// An exact decimal: value = unscaled_value x 10^-scale. See
/// docs/adr/compact_decimal.md.
///
/// Presence rule: a non-empty unscaled_value means the decimal is set. Zero
/// is the single byte 0x00, so a set zero is never empty. An empty
/// unscaled_value means the decimal is unset.
///
/// LM-318 deleted the old decimal string, field 10, in place,
/// with no reserved line: bytes written before it are not readable.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DecimalValueProto {
    /// The unscaled integer in minimal two's-complement big-endian form, of any
    /// size. Zero is 0x00. Non-empty means the decimal is set.
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
    #[prost(enumeration = "ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<VersionProto>,
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
