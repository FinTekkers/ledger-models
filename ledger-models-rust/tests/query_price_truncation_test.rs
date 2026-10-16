//! Wire tests for QueryPriceResponseProto.truncated / row_cap.
//! See docs/adr/query_price_truncation.md.

use ledger_models::fintekkers::models::price::PriceProto;
use ledger_models::fintekkers::requests::price::QueryPriceResponseProto;
use prost::Message;

fn paged_response() -> QueryPriceResponseProto {
    QueryPriceResponseProto {
        price_response: vec![PriceProto {
            is_link: true,
            ..Default::default()
        }],
        next_page_token: "opaque-def".into(),
        ..Default::default()
    }
}

#[test]
fn truncation_fields_round_trip_with_existing_fields() {
    let response = QueryPriceResponseProto {
        truncated: true,
        row_cap: 1000,
        ..paged_response()
    };

    let parsed = QueryPriceResponseProto::decode(response.encode_to_vec().as_slice()).unwrap();

    assert!(parsed.truncated);
    assert_eq!(parsed.row_cap, 1000);
    assert_eq!(parsed.next_page_token, "opaque-def");
    assert_eq!(parsed.price_response.len(), 1);
    assert!(parsed.price_response[0].is_link);
}

#[test]
fn response_without_new_fields_reads_defaults() {
    let old = paged_response();
    let explicit = QueryPriceResponseProto {
        truncated: false,
        row_cap: 0,
        ..paged_response()
    };

    let parsed = QueryPriceResponseProto::decode(old.encode_to_vec().as_slice()).unwrap();

    assert!(!parsed.truncated);
    assert_eq!(parsed.row_cap, 0);
    assert_eq!(explicit.encode_to_vec(), old.encode_to_vec());
}
