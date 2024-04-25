///
///
/// TODO: Need to decide how to add API key to requests:
///
/// Option 1: We create a request object:
/// Request { ApiKey: xxx, Request: yyy, RequestObjectClass: zzz }, where yyy could be a oneof(each request type), or simply a bytes version of the underlying request; and zzz would be explicit on the request object
///
/// Option 2: Each service request requires an API key explicitly:
/// QueryPositionRequest { ApiKey: xxx, <the rest of the request as is> }
/// CreateTransactionRequest { ApiKey: xxx, <the rest of the request as is> }
///
/// Option 3: ?
///
/// Pros/Cons
///
/// Option 1:
/// PRO: Each indvidual request object doesn't require any change
/// PRO: Each underlying service could be sent the request and not even be aware of the security layer
/// CON: ? Adds a layer of indirection?
///
/// Option 2:
/// PRO: Very explicit approach
/// CON: Any changes in ApiKey model would need to be propagated to all the new objects
/// CON: Requires developers to understand they need to add this to new requests they define
///
///
/// I'm favoring option 1, but will think on it.
///
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ApiKey {
    /// Will be "API_Key"
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    /// In format 1.0.0
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Identify is a unique identifier for the user. Initially this can be email.
    /// Over time this can evolve to be a uuid which would represent an organization, organizational unit, or user
    #[prost(string, tag = "3")]
    pub identity: ::prost::alloc::string::String,
    /// The key. This could be a string representation of a certificate, token or credential provided by, say Google's
    /// authentication framework.
    #[prost(string, tag = "4")]
    pub key: ::prost::alloc::string::String,
}
