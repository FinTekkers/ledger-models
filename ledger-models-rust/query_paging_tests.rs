//! Wire tests for the paging fields (limit, page_token, next_page_token) on all
//! four query messages. See docs/adr/query_paging.md.
//!
//! Lib unit tests (mounted from lib.rs) because scripts/checks/test.sh runs
//! `cargo test --lib`, which skips tests/.

use prost::Message;

use crate::fintekkers::models::util::DateRangeProto;
use crate::fintekkers::requests::portfolio::{QueryPortfolioRequestProto, QueryPortfolioResponseProto};
use crate::fintekkers::requests::price::query_price_request_proto::TimeRange;
use crate::fintekkers::requests::price::{
    PriceHorizonProto, QueryPriceRequestProto, QueryPriceResponseProto,
};
use crate::fintekkers::requests::security::{QuerySecurityRequestProto, QuerySecurityResponseProto};
use crate::fintekkers::requests::transaction::{
    QueryTransactionRequestProto, QueryTransactionResponseProto,
};

fn round_trip<M: Message + Default>(message: &M) -> M {
    M::decode(message.encode_to_vec().as_slice()).unwrap()
}

/// Applies `check` to the same request/response pair for each of the four entities.
macro_rules! for_each_entity {
    ($check:ident) => {
        $check!(QuerySecurityRequestProto, QuerySecurityResponseProto);
        $check!(QueryTransactionRequestProto, QueryTransactionResponseProto);
        $check!(QueryPortfolioRequestProto, QueryPortfolioResponseProto);
        $check!(QueryPriceRequestProto, QueryPriceResponseProto);
    };
}

#[test]
fn old_request_reads_defaults() {
    macro_rules! check {
        ($request:ident, $response:ident) => {
            let old = $request {
                ..Default::default()
            };
            let parsed = round_trip(&old);
            assert_eq!(parsed.limit, 0, stringify!($request));
            assert_eq!(parsed.page_token, "", stringify!($request));
            assert_eq!($response::decode(&[][..]).unwrap().next_page_token, "");
        };
    }
    for_each_entity!(check);
}

#[test]
fn paging_fields_round_trip() {
    macro_rules! check {
        ($request:ident, $response:ident) => {
            let request = $request {
                limit: 25,
                page_token: "opaque-abc".into(),
                ..Default::default()
            };
            let response = $response {
                next_page_token: "opaque-def".into(),
                ..Default::default()
            };
            let parsed_request = round_trip(&request);
            let parsed_response = round_trip(&response);
            assert_eq!(parsed_request.limit, 25, stringify!($request));
            assert_eq!(parsed_request.page_token, "opaque-abc", stringify!($request));
            assert_eq!(parsed_response.next_page_token, "opaque-def", stringify!($response));
        };
    }
    for_each_entity!(check);
}

#[test]
fn empty_next_page_token_encodes_as_unset() {
    macro_rules! check {
        ($request:ident, $response:ident) => {
            let unset = $response {
                ..Default::default()
            };
            let empty = $response {
                next_page_token: String::new(),
                ..Default::default()
            };
            assert_eq!(empty.encode_to_vec(), unset.encode_to_vec(), stringify!($response));
        };
    }
    for_each_entity!(check);
}

#[test]
fn price_page_token_round_trips_with_horizon() {
    let horizon = TimeRange::Horizon(PriceHorizonProto::PriceHorizon1Year as i32);
    let request = QueryPriceRequestProto {
        time_range: Some(horizon.clone()),
        page_token: "opaque-abc".into(),
        limit: 10,
        ..Default::default()
    };

    let parsed = round_trip(&request);

    assert_eq!(parsed.time_range, Some(horizon));
    assert_eq!(parsed.page_token, "opaque-abc");
    assert_eq!(parsed.limit, 10);
}

#[test]
fn price_page_token_round_trips_with_date_range() {
    let date_range = TimeRange::DateRange(DateRangeProto {
        ..Default::default()
    });
    let request = QueryPriceRequestProto {
        time_range: Some(date_range.clone()),
        page_token: "opaque-abc".into(),
        limit: 10,
        ..Default::default()
    };

    let parsed = round_trip(&request);

    assert_eq!(parsed.time_range, Some(date_range));
    assert_eq!(parsed.page_token, "opaque-abc");
    assert_eq!(parsed.limit, 10);
}
