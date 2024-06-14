#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LockRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The namespace/partition to get the lock for. Generally, when requesting a
    /// lock the caller should only specify the namespace, meaning that its up to
    /// the lock service to pick a partition for you.
    ///
    /// If the partition number is also specified the lock service will ONLY try
    /// to get the lock on that parition and fail if it the lock is already taken
    #[prost(message, optional, tag = "11")]
    pub node_partition: ::core::option::Option<
        super::super::super::models::util::lock::NodePartition,
    >,
    #[prost(message, optional, tag = "12")]
    pub endpoint: ::core::option::Option<super::super::super::models::util::Endpoint>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LockResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The request that this response is for
    #[prost(message, optional, tag = "3")]
    pub get_lock_request: ::core::option::Option<LockRequestProto>,
    /// Returns the node, and its state that was granted to the caller. If this is empty
    /// then there will be details in the {errors_or_warning} variable
    #[prost(message, optional, tag = "4")]
    pub lock_response: ::core::option::Option<
        super::super::super::models::util::lock::NodeState,
    >,
    /// If no errors or warnings in the response then the request was processed successfully without any
    /// contingencies.
    #[prost(message, optional, tag = "40")]
    pub errors_or_warnings: ::core::option::Option<super::errors::SummaryProto>,
}
