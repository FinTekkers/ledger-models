/// Request to store one SecurityMetricProto observation (LM-482).
///
/// A write for a (security_id, metric, observation_date) that already has an
/// observation is a correction: it is stored as a new version with a later
/// as_of, and the earlier version is kept. See docs/adr/security_metric.md.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateSecurityMetricRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    /// The observation to store. security_id, metric (not
    /// UNKNOWN_SECURITY_METRIC), observation_date and value are required.
    #[prost(message, optional, tag = "20")]
    pub create_security_metric_input: ::core::option::Option<
        super::super::models::security::SecurityMetricProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateSecurityMetricResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    /// Echo of the request that produced this response.
    #[prost(message, optional, tag = "20")]
    pub create_security_metric_request: ::core::option::Option<
        CreateSecurityMetricRequestProto,
    >,
    /// The stored version, with any server-set fields (uuid, as_of,
    /// valid_from) filled in.
    #[prost(message, optional, tag = "30")]
    pub security_metric_response: ::core::option::Option<
        super::super::models::security::SecurityMetricProto,
    >,
}
/// The latest observation on or before a date, per (security, metric)
/// (LM-482).
///
/// For each requested (security_id, metric) pair, the observation with the
/// latest observation_date on or before date, in its latest as_of version. A
/// pair with no such observation is absent from the response: absent means
/// unknown, never 0. See docs/adr/security_metric.md.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetLatestSecurityMetricRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// The securities to look up. Empty gives an empty response, not an error.
    #[prost(message, repeated, tag = "10")]
    pub security_id: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    /// The metrics to look up. Empty means all metrics. UNKNOWN_SECURITY_METRIC
    /// is invalid.
    #[prost(
        enumeration = "super::super::models::security::SecurityMetricTypeProto",
        repeated,
        tag = "11"
    )]
    pub metric: ::prost::alloc::vec::Vec<i32>,
    /// Required. The latest observation_date on or before this date is
    /// returned (latest-on-or-before).
    #[prost(message, optional, tag = "12")]
    pub date: ::core::option::Option<super::super::models::util::LocalDateProto>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetLatestSecurityMetricResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// At most one observation per (security_id, metric): the latest
    /// observation_date on or before the request's date. A pair with none is
    /// absent. Each observation's own observation_date tells the caller how
    /// stale it is.
    #[prost(message, repeated, tag = "20")]
    pub security_metric_response: ::prost::alloc::vec::Vec<
        super::super::models::security::SecurityMetricProto,
    >,
}
/// The observations of one security's metrics in a date range (LM-482).
///
/// Returns the latest as_of version of each (security_id, metric,
/// observation_date) whose observation_date is in [from_date, to_date], ordered
/// by observation_date, then metric. A date with no observation is absent from
/// the results, never sent as 0. See docs/adr/security_metric.md.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SearchSecurityMetricRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// Required. The security whose metrics to return.
    #[prost(message, optional, tag = "10")]
    pub security_id: ::core::option::Option<super::super::models::util::UuidProto>,
    /// The metrics to return. Empty means all metrics. UNKNOWN_SECURITY_METRIC
    /// is invalid.
    #[prost(
        enumeration = "super::super::models::security::SecurityMetricTypeProto",
        repeated,
        tag = "11"
    )]
    pub metric: ::prost::alloc::vec::Vec<i32>,
    /// Inclusive lower bound on observation_date. Unset means unbounded.
    #[prost(message, optional, tag = "12")]
    pub from_date: ::core::option::Option<super::super::models::util::LocalDateProto>,
    /// Inclusive upper bound on observation_date. Unset means unbounded. A
    /// to_date before from_date is invalid.
    #[prost(message, optional, tag = "13")]
    pub to_date: ::core::option::Option<super::super::models::util::LocalDateProto>,
}
/// One message of the Search stream. The stream as a whole is ordered by
/// observation_date, then metric.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SearchSecurityMetricResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// The observations in this message, in order.
    #[prost(message, repeated, tag = "20")]
    pub security_metric_response: ::prost::alloc::vec::Vec<
        super::super::models::security::SecurityMetricProto,
    >,
}
