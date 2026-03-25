/// Request to create or update an IndexCompositionProto record.
/// If a record with the same (index_uuid, effective_date) already exists it is replaced
/// (last-writer-wins — same semantics as InMemoryIndexCompositionStore.upsert).
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateIndexCompositionRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    /// The composition to store.
    #[prost(message, optional, tag = "20")]
    pub create_index_composition_input: ::core::option::Option<
        super::super::models::security::IndexCompositionProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateIndexCompositionResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    /// Echo of the request that produced this response.
    #[prost(message, optional, tag = "20")]
    pub create_index_composition_request: ::core::option::Option<
        CreateIndexCompositionRequestProto,
    >,
    /// The stored composition (with any server-side defaults applied, e.g. auto-generated UUID).
    #[prost(message, optional, tag = "30")]
    pub index_composition_response: ::core::option::Option<
        super::super::models::security::IndexCompositionProto,
    >,
}
/// Request to retrieve the index composition active on a given date.
/// Returns the most recent IndexCompositionProto where effective_date <= as_of_date.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetIndexCompositionRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// UUID of the index security (EQUITY_INDEX_SECURITY).
    #[prost(message, optional, tag = "10")]
    pub index_uuid: ::core::option::Option<super::super::models::util::UuidProto>,
    /// The business date for which to retrieve the active composition.
    /// Resolution: most recent IndexCompositionProto where effective_date <= as_of_date.
    #[prost(message, optional, tag = "11")]
    pub as_of_date: ::core::option::Option<super::super::models::util::LocalDateProto>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetIndexCompositionResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    /// The resolved composition. Absent if no composition exists for as_of_date.
    #[prost(message, optional, tag = "20")]
    pub composition: ::core::option::Option<
        super::super::models::security::IndexCompositionProto,
    >,
    /// The effective_date of the composition returned. Useful when as_of_date
    /// falls between rebalances — tells the caller which rebalance date applies.
    #[prost(message, optional, tag = "21")]
    pub resolved_effective_date: ::core::option::Option<
        super::super::models::util::LocalDateProto,
    >,
}
