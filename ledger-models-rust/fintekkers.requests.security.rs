/// A request to allow clients to find existing securities.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QuerySecurityRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The list of UUIds to return
    #[prost(message, repeated, tag = "21")]
    pub uu_ids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    /// A list of position filters that will filter securities that match.
    #[prost(message, optional, tag = "22")]
    pub search_security_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
    #[prost(message, optional, tag = "23")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QuerySecurityResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The input that was provided for this request.
    #[prost(message, optional, tag = "20")]
    pub query_security_input: ::core::option::Option<QuerySecurityRequestProto>,
    /// The security (or securities) that was matched by this request.
    #[prost(message, repeated, tag = "30")]
    pub security_response: ::prost::alloc::vec::Vec<
        super::super::models::security::SecurityProto,
    >,
    /// Any errors or warnings related to this request
    #[prost(message, repeated, tag = "40")]
    pub errors_or_warnings: ::prost::alloc::vec::Vec<super::util::errors::SummaryProto>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetFieldsResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(
        enumeration = "super::super::models::position::FieldProto",
        repeated,
        tag = "10"
    )]
    pub fields: ::prost::alloc::vec::Vec<i32>,
}
/// Use this request to create or update securities. Uniqueness is guaranteed via the UUID.
/// Security identifiers do not guarantee uniqueness. As an example a bond ISIN or stock ticker
/// may be re-used over time. Therefore if you send 2 requests with the same security identifier
/// you will create two securities. In order to avoid duplication you should either re-use the UUID
/// when calling the API, in which case an update will be applied. If you do not know the UUID, you
/// should first do a search operation.
///
/// It is preferred that the client generates the UUID. This will avoid issues in the network leading
/// to duplicate securities.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateSecurityRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// A fully formed security object to be created or updated. Validations may be applied
    /// before creating. For example creating an equity security with bond fields may be invalid and
    /// therefore rejected.
    #[prost(message, optional, tag = "20")]
    pub security_input: ::core::option::Option<
        super::super::models::security::SecurityProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateSecurityResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The input that was provided for this request.
    #[prost(message, optional, tag = "20")]
    pub security_request: ::core::option::Option<CreateSecurityRequestProto>,
    /// The security (or securities) that were created in response to this request
    #[prost(message, optional, tag = "30")]
    pub security_response: ::core::option::Option<
        super::super::models::security::SecurityProto,
    >,
    /// If no errors or warnings in the response then the request was processed successfully without any
    /// contingencies.
    #[prost(message, optional, tag = "40")]
    pub errors_or_warnings: ::core::option::Option<super::util::errors::SummaryProto>,
}
