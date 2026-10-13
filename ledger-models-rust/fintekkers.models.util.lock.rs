/// The definition of a partition
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct NodePartition {
    #[prost(enumeration = "super::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::VersionProto>,
    /// The unique id that identifies a partition. For example a namespace with two
    /// partitions may have one partition with value 0, and another with value 1
    /// Values may not persist over time. If a namespace moves from having two partitions
    /// to having four may go from {0,1} to {0,1,2,3} depending on the implementation.
    /// Partitions are an internal Fintekkers concept and should not be exposed to
    /// clients
    #[prost(int32, tag = "3")]
    pub partition: i32,
    /// A generic concept to allow partitions of different data types. For example,
    /// 'Portfolio' may have a different partition space versus 'Security'. The natural
    /// values to use for this would be the object types provided by different services.
    #[prost(string, tag = "4")]
    pub namespace: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct NodeState {
    #[prost(enumeration = "super::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::VersionProto>,
    /// Placeholder, will change
    #[prost(message, optional, tag = "5")]
    pub partition: ::core::option::Option<NodePartition>,
    /// The end point that serves responses for this partition
    #[prost(message, optional, tag = "6")]
    pub end_point: ::core::option::Option<super::Endpoint>,
    /// The last time the node for this partition was seen, meaning the
    /// latest heartbeat
    #[prost(message, optional, tag = "7")]
    pub last_seen: ::core::option::Option<super::LocalTimestampProto>,
    /// Whether the lock is expired or not (owned by the lock-service)
    #[prost(bool, tag = "8")]
    pub is_expired: bool,
}
