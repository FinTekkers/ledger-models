#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Message {
    /// This message should not have any technical knowledge requirements to be understood
    /// and provide a suggested action for how to avoid. Examples:
    ///
    /// A server throws an exception -> "Please retry your operation, and if it fails again,
    /// contact customer support".
    ///
    /// A bond security is set as having a fixed coupon, but a reference index and spread is
    /// provided -> "A fixed income bond needs a static coupon, and shouldn't have an index
    /// or spread provided."
    #[prost(string, tag = "1")]
    pub message_for_user: ::prost::alloc::string::String,
    /// This message can be used to instruct a developer operating on APIs how best to approach
    /// resolving this issue.
    /// A server throws an exception -> "The <x> service timed out or rejected this message.
    ///   Please consider whether you are spamming the backend server and reach out to developer
    ///   support to see how to optimize your usage".
    #[prost(string, tag = "2")]
    pub message_for_developer: ::prost::alloc::string::String,
}
/// One field-level input problem found by a ledger-models validator (e.g. a bond with
/// no face_value). Validators return these so a service can put them as-is into
/// ErrorProto.violations and answer with gRPC INVALID_ARGUMENT.
///
/// Violations describe bad input only. State errors that depend on what a service
/// already holds (e.g. no lots to reduce, duplicates, permissions) never use this
/// message; services report those as FAILED_PRECONDITION or similar.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct FieldViolationProto {
    /// Proto field path of the bad field, snake_case, relative to the top-level object
    /// that was validated. Nested fields are dot-separated, e.g. "bond_details.face_value"
    /// when validating a security, or "security.bond_details.face_value" when the same
    /// security is validated as part of a transaction.
    #[prost(string, tag = "1")]
    pub field: ::prost::alloc::string::String,
    /// UUID of the object that owns the bad field: the security for bond rules, even when
    /// the violation was found by validating a transaction. Unset if the input had no UUID.
    #[prost(message, optional, tag = "2")]
    pub object_id: ::core::option::Option<super::super::super::models::util::UuidProto>,
    /// Human-readable English explanation for a developer. Not stable; do not parse it.
    #[prost(string, tag = "3")]
    pub message: ::prost::alloc::string::String,
}
/// An error is used for situations where a request cannot be processed successfully, either
/// from a technical perspective or a business perspective.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ErrorProto {
    #[prost(enumeration = "ErrorCode", tag = "1")]
    pub code: i32,
    #[prost(message, optional, tag = "2")]
    pub detail: ::core::option::Option<Message>,
    /// Field-level input problems behind this error, one per bad field, as returned by
    /// the ledger-models validators. Empty for errors that are not about bad input
    /// (e.g. state errors such as no lots to reduce).
    #[prost(message, repeated, tag = "3")]
    pub violations: ::prost::alloc::vec::Vec<FieldViolationProto>,
}
/// Warnings can have error codes, if it is useful in categorizing the severity of the warning.
/// For example a warning may be thrown if 2 securities are created with the same identifier.
/// Another example may be usage of a deprecated API.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct WarningProto {
    #[prost(enumeration = "ErrorCode", tag = "1")]
    pub code: i32,
    #[prost(message, optional, tag = "2")]
    pub detail: ::core::option::Option<Message>,
}
/// Error codes are defined to allow clients to programmatically
/// respond to issues. The bar for creating a new error code should
/// be that the
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum ErrorCode {
    UnknownError = 0,
    /// TO THINK ABOUT
    Warning = 1,
}
impl ErrorCode {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            ErrorCode::UnknownError => "UNKNOWN_ERROR",
            ErrorCode::Warning => "WARNING",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_ERROR" => Some(Self::UnknownError),
            "WARNING" => Some(Self::Warning),
            _ => None,
        }
    }
}
/// GRPC error codes are used to indicate if there was any substantial issue. They cover situations
/// like OK, Cancelled, AlreadyExists, InvalidArgument, ResourceExhausted, Unauthenticated, etc.
/// Ideally Fintekkers will not introduce another concept on top of that to avoid complicating the
/// solution.
///
/// If there are any errors, the GRPC response should not return OK (code=0).
/// Warnings may be returned at any time, and may be done even with successful responses.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SummaryProto {
    #[prost(message, repeated, tag = "1")]
    pub errors: ::prost::alloc::vec::Vec<ErrorProto>,
    #[prost(message, repeated, tag = "2")]
    pub warnings: ::prost::alloc::vec::Vec<WarningProto>,
}
