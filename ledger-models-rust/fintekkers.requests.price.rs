#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePriceRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    #[prost(message, optional, tag = "20")]
    pub create_price_input: ::core::option::Option<
        super::super::models::price::PriceProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePriceResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    #[prost(message, optional, tag = "20")]
    pub create_price_request: ::core::option::Option<CreatePriceRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub price_response: ::prost::alloc::vec::Vec<
        super::super::models::price::PriceProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPriceRequestProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    /// Price IDs (PriceProto.uuid), never security IDs.
    /// Search: when non-empty, only prices with these IDs match. This is
    /// ANDed with every other filter (search_price_input, as_of, horizon or
    /// date_range, frequency), as in transaction Search.
    /// To get prices for given securities, leave uuIds empty and put a
    /// SECURITY_ID filter in search_price_input.
    /// GetByIds: takes price IDs in this field.
    #[prost(message, repeated, tag = "21")]
    pub uu_ids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    #[prost(message, optional, tag = "22")]
    pub search_price_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
    #[prost(message, optional, tag = "23")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
    /// Optional downsampling, applied after the `horizon` or `date_range`
    /// filter. The server returns the latest price per security per bucket.
    /// Bucket boundaries are UTC, whatever `as_of.time_zone` says. Buckets are
    /// half-open, `[bucket start, next bucket start)`, unlike horizon windows,
    /// which are inclusive at both ends. Buckets per value:
    /// - PRICE_FREQUENCY_UNSPECIFIED: no bucketing; every price is returned.
    /// - PRICE_FREQUENCY_WEEKLY: ISO week starting Monday 00:00 UTC.
    /// - PRICE_FREQUENCY_DAILY: calendar day starting 00:00 UTC.
    /// - PRICE_FREQUENCY_HOURLY: hour starting at :00 minutes, UTC.
    /// - PRICE_FREQUENCY_MINUTE: minute starting at :00 seconds, UTC.
    /// - PRICE_FREQUENCY_EVERY_TICK: no bucketing; every price is returned.
    #[prost(enumeration = "PriceFrequencyProto", tag = "24")]
    pub frequency: i32,
    /// Paging (see docs/adr/query_paging.md). Max records returned in this
    /// response: the page size the client asks for. Unset or 0 = no client page
    /// cap; the server keeps today's behaviour for this RPC. The server may cap
    /// `limit` and return fewer items; fewer items does not mean last page, only
    /// an empty `next_page_token` does. For streaming Search, `limit` caps the
    /// total items across the whole stream. Clients that set neither `limit` nor
    /// `page_token` get exactly today's results.
    ///
    /// Maximum number of price records the server may return. If unset or < 1
    /// the server applies a default cap (typically 1000) and surfaces a warning
    /// in QueryPriceResponseProto.errors_or_warnings. Servers may also enforce
    /// a hard ceiling above which `limit` is clamped silently.
    #[prost(int32, tag = "27")]
    pub limit: i32,
    /// Paging (see docs/adr/query_paging.md). Opaque token copied from a
    /// previous response's `next_page_token`. Unset or empty = first page.
    /// Clients must not parse or build tokens; send the other request fields
    /// unchanged across pages. Clients that set neither `limit` nor
    /// `page_token` get exactly today's results.
    #[prost(string, tag = "51")]
    pub page_token: ::prost::alloc::string::String,
    /// `horizon` windows are defined on PriceHorizonProto.
    #[prost(oneof = "query_price_request_proto::TimeRange", tags = "25, 26")]
    pub time_range: ::core::option::Option<query_price_request_proto::TimeRange>,
}
/// Nested message and enum types in `QueryPriceRequestProto`.
pub mod query_price_request_proto {
    /// `horizon` windows are defined on PriceHorizonProto.
    #[allow(clippy::derive_partial_eq_without_eq)]
    #[derive(Clone, PartialEq, ::prost::Oneof)]
    pub enum TimeRange {
        #[prost(enumeration = "super::PriceHorizonProto", tag = "25")]
        Horizon(i32),
        #[prost(message, tag = "26")]
        DateRange(super::super::super::models::util::DateRangeProto),
    }
}
/// How QueryPriceRequestProto.frequency downsamples prices. Each bucket is
/// half-open, `[bucket start, next bucket start)`, with boundaries in UTC. The
/// server returns the latest price per security per bucket. See the
/// `frequency` field for the full rule.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PriceFrequencyProto {
    /// No downsampling: every price in the time range is returned.
    PriceFrequencyUnspecified = 0,
    /// One bucket per ISO week, starting Monday 00:00 UTC.
    PriceFrequencyWeekly = 10,
    /// One bucket per UTC day, starting 00:00 UTC.
    PriceFrequencyDaily = 20,
    /// One bucket per UTC hour, starting at :00 minutes.
    PriceFrequencyHourly = 30,
    /// One bucket per UTC minute, starting at :00 seconds.
    PriceFrequencyMinute = 40,
    /// No downsampling: every price in the time range is returned.
    PriceFrequencyEveryTick = 90,
}
impl PriceFrequencyProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PriceFrequencyProto::PriceFrequencyUnspecified => {
                "PRICE_FREQUENCY_UNSPECIFIED"
            }
            PriceFrequencyProto::PriceFrequencyWeekly => "PRICE_FREQUENCY_WEEKLY",
            PriceFrequencyProto::PriceFrequencyDaily => "PRICE_FREQUENCY_DAILY",
            PriceFrequencyProto::PriceFrequencyHourly => "PRICE_FREQUENCY_HOURLY",
            PriceFrequencyProto::PriceFrequencyMinute => "PRICE_FREQUENCY_MINUTE",
            PriceFrequencyProto::PriceFrequencyEveryTick => "PRICE_FREQUENCY_EVERY_TICK",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "PRICE_FREQUENCY_UNSPECIFIED" => Some(Self::PriceFrequencyUnspecified),
            "PRICE_FREQUENCY_WEEKLY" => Some(Self::PriceFrequencyWeekly),
            "PRICE_FREQUENCY_DAILY" => Some(Self::PriceFrequencyDaily),
            "PRICE_FREQUENCY_HOURLY" => Some(Self::PriceFrequencyHourly),
            "PRICE_FREQUENCY_MINUTE" => Some(Self::PriceFrequencyMinute),
            "PRICE_FREQUENCY_EVERY_TICK" => Some(Self::PriceFrequencyEveryTick),
            _ => None,
        }
    }
}
/// The time window QueryPriceRequestProto.horizon selects. Every window ends
/// at the anchor: the request's `as_of` if set, else the server's now. Both
/// ends of the window are inclusive.
///
/// Fixed-day horizons step back a whole number of 24-hour periods from the
/// anchor instant. Calendar horizons step back in calendar months or years on
/// the anchor's date in UTC (not in `as_of.time_zone`), keeping the anchor's
/// time of day. When the target month has no such day (e.g. 31 March back one
/// month, or 29 February back one year) the start clamps to that month's last
/// day.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum PriceHorizonProto {
    /// No horizon filter: the window ends at the anchor (`as_of`, else now),
    /// inclusive, and has no lower bound. Labelled calendar only nominally,
    /// since no calendar step applies.
    PriceHorizonUnspecified = 0,
    /// fixed-day: from anchor - 24h to the anchor (`as_of`, else now),
    /// inclusive at both ends.
    PriceHorizon1Day = 1,
    /// fixed-day: from anchor - 5 x 24h to the anchor (`as_of`, else now),
    /// inclusive at both ends.
    PriceHorizon5Days = 2,
    /// fixed-day: from anchor - 7 x 24h to the anchor (`as_of`, else now),
    /// inclusive at both ends.
    PriceHorizon1Week = 3,
    /// calendar: from the same UTC day-of-month one month before the anchor
    /// (`as_of`, else now) to the anchor, clamped to month end, inclusive at
    /// both ends.
    PriceHorizon1Month = 4,
    /// calendar: from the same UTC day-of-month six months before the anchor
    /// (`as_of`, else now) to the anchor, clamped to month end, inclusive at
    /// both ends.
    PriceHorizon6Months = 5,
    /// calendar: from the same UTC date one year before the anchor (`as_of`,
    /// else now) to the anchor; 29 February clamps to 28 February. Inclusive
    /// at both ends.
    PriceHorizon1Year = 6,
    /// calendar: from the same UTC date five years before the anchor (`as_of`,
    /// else now) to the anchor; 29 February clamps to 28 February. Inclusive
    /// at both ends.
    PriceHorizon5Year = 7,
    /// calendar: no lower bound; every price up to the anchor (`as_of`, else
    /// now), inclusive.
    PriceHorizonMax = 8,
    /// calendar: from 1 January 00:00 UTC of the anchor's UTC year to the
    /// anchor (`as_of`, else now), inclusive at both ends.
    PriceHorizonYearToDate = 9,
}
impl PriceHorizonProto {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            PriceHorizonProto::PriceHorizonUnspecified => "PRICE_HORIZON_UNSPECIFIED",
            PriceHorizonProto::PriceHorizon1Day => "PRICE_HORIZON_1_DAY",
            PriceHorizonProto::PriceHorizon5Days => "PRICE_HORIZON_5_DAYS",
            PriceHorizonProto::PriceHorizon1Week => "PRICE_HORIZON_1_WEEK",
            PriceHorizonProto::PriceHorizon1Month => "PRICE_HORIZON_1_MONTH",
            PriceHorizonProto::PriceHorizon6Months => "PRICE_HORIZON_6_MONTHS",
            PriceHorizonProto::PriceHorizon1Year => "PRICE_HORIZON_1_YEAR",
            PriceHorizonProto::PriceHorizon5Year => "PRICE_HORIZON_5_YEAR",
            PriceHorizonProto::PriceHorizonMax => "PRICE_HORIZON_MAX",
            PriceHorizonProto::PriceHorizonYearToDate => "PRICE_HORIZON_YEAR_TO_DATE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "PRICE_HORIZON_UNSPECIFIED" => Some(Self::PriceHorizonUnspecified),
            "PRICE_HORIZON_1_DAY" => Some(Self::PriceHorizon1Day),
            "PRICE_HORIZON_5_DAYS" => Some(Self::PriceHorizon5Days),
            "PRICE_HORIZON_1_WEEK" => Some(Self::PriceHorizon1Week),
            "PRICE_HORIZON_1_MONTH" => Some(Self::PriceHorizon1Month),
            "PRICE_HORIZON_6_MONTHS" => Some(Self::PriceHorizon6Months),
            "PRICE_HORIZON_1_YEAR" => Some(Self::PriceHorizon1Year),
            "PRICE_HORIZON_5_YEAR" => Some(Self::PriceHorizon5Year),
            "PRICE_HORIZON_MAX" => Some(Self::PriceHorizonMax),
            "PRICE_HORIZON_YEAR_TO_DATE" => Some(Self::PriceHorizonYearToDate),
            _ => None,
        }
    }
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPriceResponseProto {
    #[prost(enumeration = "super::super::models::util::ObjectTypeProto", tag = "1")]
    pub object_type: i32,
    #[prost(message, optional, tag = "2")]
    pub version: ::core::option::Option<super::super::models::util::VersionProto>,
    #[prost(message, optional, tag = "20")]
    pub query_price_request: ::core::option::Option<QueryPriceRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub price_response: ::prost::alloc::vec::Vec<
        super::super::models::price::PriceProto,
    >,
    /// If no errors or warnings in the response then the request was processed successfully without any
    /// contingencies. Servers populate this with a warning when `limit` was unset and a default cap was
    /// applied, or when other notable behavior occurred (matching QueryTransactionResponseProto).
    #[prost(message, optional, tag = "40")]
    pub errors_or_warnings: ::core::option::Option<super::util::errors::SummaryProto>,
    /// Paging (see docs/adr/query_paging.md). Opaque token for the next page;
    /// pass it back as the request's `page_token`. Empty = last page. For
    /// streaming Search, only the final message of the stream carries it.
    /// Old clients that ignore it get exactly today's results.
    #[prost(string, tag = "50")]
    pub next_page_token: ::prost::alloc::string::String,
    /// Row cap (see docs/adr/query_price_truncation.md). True only when the
    /// server stopped at `row_cap` and more matching rows exist that the caller
    /// cannot reach by paging: `truncated` is set only when `next_page_token` is
    /// empty. A page that returns a `next_page_token` is never truncated; follow
    /// the token instead. Unset (reads as false) when the result is complete.
    /// Servers that predate this field never set it, so unset also means "not
    /// reported". For streaming Search, only the final message of the stream
    /// carries it.
    /// To recover when true: raise the request's `limit`, up to the server
    /// ceiling, or narrow the as-of window with a shorter `date_range` or
    /// `horizon`.
    #[prost(bool, tag = "60")]
    pub truncated: bool,
    /// Row cap (see docs/adr/query_price_truncation.md). The effective cap the
    /// server applied, in rows: the request's `limit` clamped to the server
    /// ceiling, or the default cap when `limit` is unset or < 1. Set when
    /// `truncated` is true. Unset (reads as 0) when the result is complete. For
    /// streaming Search, counts rows across the whole stream and only the final
    /// message carries it.
    #[prost(int32, tag = "61")]
    pub row_cap: i32,
}
