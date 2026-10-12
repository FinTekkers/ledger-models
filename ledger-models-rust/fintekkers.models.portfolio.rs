#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PortfolioProto {
    /// 1-4 reserved
    #[deprecated]
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[deprecated]
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// Compact form of object_class / version (LM-297). Writers set both in stage 1.
    #[prost(enumeration = "super::util::ObjectTypeProto", tag = "1001")]
    pub object_type: i32,
    #[prost(uint32, tag = "1002")]
    pub version_major: u32,
    #[prost(uint32, tag = "1003")]
    pub version_minor: u32,
    #[prost(uint32, tag = "1004")]
    pub version_patch: u32,
    /// Primary Key
    #[prost(message, optional, tag = "5")]
    pub uuid: ::core::option::Option<super::util::UuidProto>,
    #[prost(message, optional, tag = "6")]
    pub as_of: ::core::option::Option<super::util::LocalTimestampProto>,
    /// When true, only uuid is populated — resolve full entity via PortfolioService.GetByIds.
    /// See docs/adr/is_link_pattern.md.
    #[prost(bool, tag = "7")]
    pub is_link: bool,
    #[prost(message, optional, tag = "8")]
    pub valid_from: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(message, optional, tag = "9")]
    pub valid_to: ::core::option::Option<super::util::LocalTimestampProto>,
    #[prost(string, tag = "10")]
    pub portfolio_name: ::prost::alloc::string::String,
}
