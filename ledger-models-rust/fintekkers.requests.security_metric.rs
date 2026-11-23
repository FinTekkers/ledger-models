/// Request to store the points of one series (LM-484). See
/// SecurityMetric.CreateOrUpdate for the upsert and correction rules.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateSecurityMetricRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    #[prost(enumeration = "super::util::RequestOperationTypeProto", tag = "10")]
    pub operation_type: i32,
    /// One series per request: security_id, metric and at least one point.
    /// series.as_of is ignored; the server stamps its own.
    #[prost(message, optional, tag = "20")]
    pub series: ::core::option::Option<
        super::super::models::security::SecurityMetricSeriesProto,
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
    /// The header only: the request's security_id and metric, and the as_of the
    /// server stamped on the write. The points are not echoed, so `points` is
    /// always empty here. In this response an empty list means "not echoed",
    /// not "no known observation". Search at this as_of to read them back.
    #[prost(message, optional, tag = "20")]
    pub series: ::core::option::Option<
        super::super::models::security::SecurityMetricSeriesProto,
    >,
}
/// Request for the latest point on or before `date` of each (security,
/// metric) pair, as known at as_of (LM-484). See SecurityMetric.GetLatest.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetLatestSecurityMetricRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// The securities, at least one. A repeated UUID is returned once, at its
    /// first position.
    #[prost(message, repeated, tag = "10")]
    pub security_ids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    /// The metrics, at least one. A repeated metric is returned once, at its
    /// first position.
    #[prost(
        enumeration = "super::super::models::security::SecurityMetricTypeProto",
        repeated,
        tag = "11"
    )]
    pub metrics: ::prost::alloc::vec::Vec<i32>,
    /// The business date. Each pair returns its latest observation_date on or
    /// before this date. Required.
    #[prost(message, optional, tag = "12")]
    pub date: ::core::option::Option<super::super::models::util::LocalDateProto>,
    /// The knowledge time to read at: return the values the store knew at this
    /// instant. Unset means the server's now.
    #[prost(message, optional, tag = "13")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetLatestSecurityMetricResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// One series per distinct (security_id, metric) pair: securities in
    /// request order, then metrics in request order. Each holds at most one
    /// point, the latest observation_date on or before the request's date. A
    /// pair with no such point holds zero points: the value is unknown, never 0.
    #[prost(message, repeated, tag = "20")]
    pub series: ::prost::alloc::vec::Vec<
        super::super::models::security::SecurityMetricSeriesProto,
    >,
}
/// Request for every point of one security's metrics in a date range, as
/// known at as_of (LM-484). See SecurityMetric.Search for the stream rules.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SearchSecurityMetricRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// The security. Required.
    #[prost(message, optional, tag = "10")]
    pub security_id: ::core::option::Option<super::super::models::util::UuidProto>,
    /// The metrics to return, at least one. The stream returns them in this
    /// order. A repeated metric is returned once, at its first position.
    #[prost(
        enumeration = "super::super::models::security::SecurityMetricTypeProto",
        repeated,
        tag = "11"
    )]
    pub metrics: ::prost::alloc::vec::Vec<i32>,
    /// First observation_date to return, inclusive. Unset means no lower bound.
    #[prost(message, optional, tag = "12")]
    pub start_date: ::core::option::Option<super::super::models::util::LocalDateProto>,
    /// Last observation_date to return, inclusive. Unset means no upper bound.
    #[prost(message, optional, tag = "13")]
    pub end_date: ::core::option::Option<super::super::models::util::LocalDateProto>,
    /// The knowledge time to read at: return the values the store knew at this
    /// instant. Unset means the server's now.
    #[prost(message, optional, tag = "14")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
}
/// One message of the Search stream: a full series header plus a run of
/// points. A long series arrives as several consecutive messages (chunks);
/// see SecurityMetric.Search.
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SearchSecurityMetricResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    #[prost(message, optional, tag = "20")]
    pub series: ::core::option::Option<
        super::super::models::security::SecurityMetricSeriesProto,
    >,
}
