#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePortfolioRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_portfolio_input: ::core::option::Option<
        super::super::models::portfolio::PortfolioProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreatePortfolioResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_portfolio_request: ::core::option::Option<CreatePortfolioRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub portfolio_response: ::prost::alloc::vec::Vec<
        super::super::models::portfolio::PortfolioProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPortfolioRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, repeated, tag = "21")]
    pub uu_ids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    #[prost(message, optional, tag = "22")]
    pub search_portfolio_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
    #[prost(message, optional, tag = "23")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
    /// Case-insensitive substring match on portfolio name. Empty string means no filter (return all).
    #[prost(string, tag = "24")]
    pub name_filter: ::prost::alloc::string::String,
    /// Paging (see docs/adr/query_paging.md). Max records returned in this
    /// response: the page size the client asks for. Unset or 0 = no client page
    /// cap; the server keeps today's behaviour for this RPC. The server may cap
    /// `limit` and return fewer items; fewer items does not mean last page, only
    /// an empty `next_page_token` does. For streaming Search, `limit` caps the
    /// total items across the whole stream. Clients that set neither `limit` nor
    /// `page_token` get exactly today's results.
    #[prost(int32, tag = "50")]
    pub limit: i32,
    /// Paging (see docs/adr/query_paging.md). Opaque token copied from a
    /// previous response's `next_page_token`. Unset or empty = first page.
    /// Clients must not parse or build tokens; send the other request fields
    /// unchanged across pages. Clients that set neither `limit` nor
    /// `page_token` get exactly today's results.
    #[prost(string, tag = "51")]
    pub page_token: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryPortfolioResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub query_portfolio_request: ::core::option::Option<QueryPortfolioRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub portfolio_response: ::prost::alloc::vec::Vec<
        super::super::models::portfolio::PortfolioProto,
    >,
    /// Paging (see docs/adr/query_paging.md). Opaque token for the next page;
    /// pass it back as the request's `page_token`. Empty = last page. For
    /// streaming Search, only the final message of the stream carries it.
    /// Old clients that ignore it get exactly today's results.
    #[prost(string, tag = "50")]
    pub next_page_token: ::prost::alloc::string::String,
}
