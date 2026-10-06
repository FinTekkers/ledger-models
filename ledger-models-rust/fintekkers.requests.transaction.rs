#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateTransactionRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_input: ::core::option::Option<
        super::super::models::transaction::TransactionProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct CreateTransactionResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_request: ::core::option::Option<
        CreateTransactionRequestProto,
    >,
    #[prost(message, optional, tag = "30")]
    pub transaction_response: ::core::option::Option<
        super::super::models::transaction::TransactionProto,
    >,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct QueryTransactionRequestProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    /// The list of UUIds to return
    #[prost(message, repeated, tag = "21")]
    pub uu_ids: ::prost::alloc::vec::Vec<super::super::models::util::UuidProto>,
    /// A list of position filters that will filter securities that match.
    #[prost(message, optional, tag = "22")]
    pub search_transaction_input: ::core::option::Option<
        super::super::models::position::PositionFilterProto,
    >,
    /// The as of date to query the data set
    #[prost(message, optional, tag = "23")]
    pub as_of: ::core::option::Option<super::super::models::util::LocalTimestampProto>,
    /// Paging (see docs/adr/query_paging.md). Max records returned in this
    /// response: the page size the client asks for. Unset or 0 = no client page
    /// cap; the server keeps today's behaviour for this RPC. The server may cap
    /// `limit` and return fewer items; fewer items does not mean last page, only
    /// an empty `next_page_token` does. For streaming Search, `limit` caps the
    /// total items across the whole stream. Clients that set neither `limit` nor
    /// `page_token` get exactly today's results.
    #[prost(int32, tag = "24")]
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
pub struct QueryTransactionResponseProto {
    #[prost(string, tag = "1")]
    pub object_class: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub version: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "20")]
    pub create_transaction_request: ::core::option::Option<QueryTransactionRequestProto>,
    #[prost(message, repeated, tag = "30")]
    pub transaction_response: ::prost::alloc::vec::Vec<
        super::super::models::transaction::TransactionProto,
    >,
    /// If no errors or warnings in the response then the request was processed successfully without any
    /// contingencies.
    #[prost(message, optional, tag = "40")]
    pub errors_or_warnings: ::core::option::Option<super::util::errors::SummaryProto>,
    /// Paging (see docs/adr/query_paging.md). Opaque token for the next page;
    /// pass it back as the request's `page_token`. Empty = last page. For
    /// streaming Search, only the final message of the stream carries it.
    /// Old clients that ignore it get exactly today's results.
    #[prost(string, tag = "50")]
    pub next_page_token: ::prost::alloc::string::String,
}
