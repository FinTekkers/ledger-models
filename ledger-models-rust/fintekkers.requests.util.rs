#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum RequestOperationTypeProto {
    UnknownOperation = 0,
    /// Validate whether an object is well-formed. The proto schema provides the syntax, but validation
    /// ensures semantic meaning is correct.
    Validate = 1,
    /// Create an object in the back-end
    Create = 2,
    /// Retrieve an object
    Get = 3,
    /// Search for an object
    Search = 4,
}
impl RequestOperationTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            RequestOperationTypeProto::UnknownOperation => "UNKNOWN_OPERATION",
            RequestOperationTypeProto::Validate => "VALIDATE",
            RequestOperationTypeProto::Create => "CREATE",
            RequestOperationTypeProto::Get => "GET",
            RequestOperationTypeProto::Search => "SEARCH",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_OPERATION" => Some(Self::UnknownOperation),
            "VALIDATE" => Some(Self::Validate),
            "CREATE" => Some(Self::Create),
            "GET" => Some(Self::Get),
            "SEARCH" => Some(Self::Search),
            _ => None,
        }
    }
}
/// An entity that was deleted or would be deleted (in dry_run mode).
/// Used in the affected_entities list of DeleteResponseProto.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct AffectedEntityProto {
    /// The type of this affected entity (may differ from the request's entity_type
    /// during cascade deletions — e.g. deleting a portfolio cascades to transactions).
    #[prost(enumeration = "EntityTypeProto", tag = "1")]
    pub entity_type: i32,
    /// The UUID of the affected entity.
    #[prost(message, optional, tag = "2")]
    pub uuid: ::core::option::Option<super::super::models::util::UuidProto>,
    /// Human-readable description for display in confirmation dialogs and audit logs.
    /// Examples:
    ///    "US Treasury 2.5% 2028-03-15 (CUSIP: 91282CJK3)"
    ///    "Portfolio: Growth Fund (3 transactions)"
    ///    "Transaction: BUY 10000 face T 2.5 03/15/28 @ 98.50"
    #[prost(string, tag = "3")]
    pub description: ::prost::alloc::string::String,
}
/// Request to delete an entity by UUID. Used by all entity services
/// (Security.Delete, Portfolio.Delete, Transaction.Delete, Price.Delete).
///
/// The entity_type field is optional when calling a specific service's Delete RPC
/// (e.g. calling Security.Delete implies entity_type=SECURITY). It is included
/// for consistency in the response and for potential future use with a bulk
/// delete endpoint.
///
/// Deletion modes:
///    - Default (all flags false): fails if the entity is referenced by other entities.
///    - dry_run=true: returns what WOULD be deleted without performing the delete.
///    - cascade=true: automatically deletes dependent entities (e.g. deleting a
///      portfolio also deletes its transactions).
///    - force=true: allows deletion even when the entity is referenced elsewhere,
///      without deleting the referencing entities (leaves dangling references).
///      This is a destructive operation — use with caution.
///
/// cascade and force are mutually exclusive. If both are set, the service
/// should return an error.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DeleteRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The UUID of the entity to delete.
    #[prost(message, optional, tag = "10")]
    pub uuid: ::core::option::Option<super::super::models::util::UuidProto>,
    /// The type of entity being deleted.
    #[prost(enumeration = "EntityTypeProto", tag = "11")]
    pub entity_type: i32,
    /// If true, return what would be deleted without actually deleting anything.
    #[prost(bool, tag = "20")]
    pub dry_run: bool,
    /// If true, delete dependent entities in addition to the target entity.
    /// Mutually exclusive with force.
    #[prost(bool, tag = "21")]
    pub cascade: bool,
    /// If true, allow deletion even if the entity is referenced by other entities,
    /// without deleting those references. Mutually exclusive with cascade.
    #[prost(bool, tag = "22")]
    pub force: bool,
}
/// Response from a Delete RPC. Contains the outcome of the deletion (or
/// dry-run preview) including all entities that were or would be affected.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct DeleteResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The original request, echoed back for correlation.
    #[prost(message, optional, tag = "10")]
    pub delete_request: ::core::option::Option<DeleteRequestProto>,
    /// Whether the deletion was successful. For dry_run requests, this is true
    /// if the deletion WOULD succeed.
    #[prost(bool, tag = "20")]
    pub success: bool,
    /// Whether this response is from a dry run (echoed from the request).
    #[prost(bool, tag = "21")]
    pub was_dry_run: bool,
    /// The total number of entities that were deleted (or would be deleted).
    #[prost(int32, tag = "22")]
    pub total_count: i32,
    /// The list of entities that were deleted or would be deleted.
    /// For a non-cascade delete, this contains only the target entity.
    /// For a cascade delete, this includes the target plus all dependents.
    #[prost(message, repeated, tag = "30")]
    pub affected_entities: ::prost::alloc::vec::Vec<AffectedEntityProto>,
    /// Human-readable warnings about the deletion. Examples:
    ///    "Security 91282CJK3 is referenced by 3 transactions in portfolio Growth Fund"
    ///    "Cascade will delete 47 price observations for this security"
    #[prost(string, repeated, tag = "40")]
    pub warnings: ::prost::alloc::vec::Vec<::prost::alloc::string::String>,
}
/// The type of entity being deleted or affected by a cascade deletion.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum EntityTypeProto {
    UnknownEntity = 0,
    Security = 1,
    Portfolio = 2,
    Transaction = 3,
    Price = 4,
    Position = 5,
}
impl EntityTypeProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            EntityTypeProto::UnknownEntity => "UNKNOWN_ENTITY",
            EntityTypeProto::Security => "SECURITY",
            EntityTypeProto::Portfolio => "PORTFOLIO",
            EntityTypeProto::Transaction => "TRANSACTION",
            EntityTypeProto::Price => "PRICE",
            EntityTypeProto::Position => "POSITION",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNKNOWN_ENTITY" => Some(Self::UnknownEntity),
            "SECURITY" => Some(Self::Security),
            "PORTFOLIO" => Some(Self::Portfolio),
            "TRANSACTION" => Some(Self::Transaction),
            "PRICE" => Some(Self::Price),
            "POSITION" => Some(Self::Position),
            _ => None,
        }
    }
}
