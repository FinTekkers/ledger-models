//! Every message with `object_type` has an own-type stamp (LM-320).
//!
//! Walks the descriptor set for messages whose field 1 is
//! `fintekkers.models.util.ObjectTypeProto`, and fails when one has no
//! `object_typed!` row. Stamps each with `stamp_own` and checks its own type
//! and version (0, 0, 1). Runs as an outside crate, like PSR-33 and BS-22.
//! Runs only with `cargo test --features test-utils`.

use std::collections::{BTreeMap, BTreeSet};

use ledger_models::fintekkers::models::security::IndexCompositionProto;
use ledger_models::fintekkers::models::util::ObjectTypeProto;
use ledger_models::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use ledger_models::fintekkers::requests::index_composition::{
    CreateIndexCompositionRequestProto, CreateIndexCompositionResponseProto, GetIndexCompositionRequestProto,
    GetIndexCompositionResponseProto,
};
use ledger_models::fintekkers::requests::portfolio::{CreatePortfolioResponseProto, QueryPortfolioResponseProto};
use ledger_models::fintekkers::requests::position::QueryPositionResponseProto;
use ledger_models::fintekkers::requests::price::{CreatePriceResponseProto, QueryPriceResponseProto};
use ledger_models::fintekkers::requests::security::{CreateSecurityResponseProto, QuerySecurityResponseProto};
use ledger_models::fintekkers::requests::transaction::{
    CreateTransactionResponseProto, QueryTransactionResponseProto,
};
use ledger_models::fintekkers::wrappers::util::object_types::{
    own_type_by_full_name, own_type_stampers, read_type, read_version, stamp, stamp_own,
    OwnObjectType,
};
use prost_reflect::{DescriptorPool, Kind};

const OBJECT_TYPE_ENUM: &str = "fintekkers.models.util.ObjectTypeProto";

/// The 13 types LM-320 names: every *ResponseProto and the index-composition
/// requests and responses.
const NAMED: [&str; 13] = [
    "fintekkers.requests.price.CreatePriceResponseProto",
    "fintekkers.requests.price.QueryPriceResponseProto",
    "fintekkers.requests.security.CreateSecurityResponseProto",
    "fintekkers.requests.security.QuerySecurityResponseProto",
    "fintekkers.requests.portfolio.CreatePortfolioResponseProto",
    "fintekkers.requests.portfolio.QueryPortfolioResponseProto",
    "fintekkers.requests.transaction.CreateTransactionResponseProto",
    "fintekkers.requests.transaction.QueryTransactionResponseProto",
    "fintekkers.requests.position.QueryPositionResponseProto",
    "fintekkers.requests.index_composition.CreateIndexCompositionRequestProto",
    "fintekkers.requests.index_composition.CreateIndexCompositionResponseProto",
    "fintekkers.requests.index_composition.GetIndexCompositionRequestProto",
    "fintekkers.requests.index_composition.GetIndexCompositionResponseProto",
];

fn pool() -> DescriptorPool {
    DescriptorPool::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).expect("descriptor set decodes")
}

/// Full names of every message whose field 1 is ObjectTypeProto.
fn walked() -> Vec<String> {
    pool()
        .all_messages()
        .filter(|m| {
            m.get_field(1)
                .map(|f| matches!(f.kind(), Kind::Enum(e) if e.full_name() == OBJECT_TYPE_ENUM))
                .unwrap_or(false)
        })
        .map(|m| m.full_name().to_string())
        .collect()
}

/// The walked names that `lookup` has no own type for.
fn missing_types(walked: &[String], lookup: impl Fn(&str) -> Option<ObjectTypeProto>) -> Vec<String> {
    walked.iter().filter(|name| lookup(name).is_none()).cloned().collect()
}

/// The enum number the naming rule gives: message name without `Proto`, in
/// SCREAMING_SNAKE, prefixed OBJECT_TYPE_ (object_type.proto).
fn expected_number(full_name: &str) -> i32 {
    let name = full_name.rsplit('.').next().unwrap();
    let name = name.strip_suffix("Proto").unwrap_or(name);
    let mut snake = String::new();
    let mut previous: Option<char> = None;
    for c in name.chars() {
        if c.is_ascii_uppercase() && previous.map_or(false, |p| p.is_ascii_lowercase()) {
            snake.push('_');
        }
        snake.push(c.to_ascii_uppercase());
        previous = Some(c);
    }
    let enum_name = format!("OBJECT_TYPE_{snake}");
    pool()
        .get_enum_by_name(OBJECT_TYPE_ENUM)
        .unwrap()
        .get_value_by_name(&enum_name)
        .unwrap_or_else(|| panic!("{full_name}: no {enum_name} in ObjectTypeProto"))
        .number()
}

#[test]
fn the_walk_finds_every_typed_message_including_the_named_ones() {
    let walked = walked();
    assert!(walked.len() >= 49, "walk found only {} messages", walked.len());
    for name in NAMED {
        assert!(walked.iter().any(|w| w == name), "walk is missing {name}");
    }
}

#[test]
fn every_typed_message_has_an_own_type() {
    assert_eq!(missing_types(&walked(), own_type_by_full_name), Vec::<String>::new());
}

#[test]
fn a_missing_row_is_reported() {
    let without = |name: &str| match name {
        "fintekkers.requests.price.QueryPriceResponseProto" => None,
        _ => own_type_by_full_name(name),
    };
    assert_eq!(missing_types(&walked(), without), vec!["fintekkers.requests.price.QueryPriceResponseProto"]);
}

#[test]
fn stamping_each_walked_message_sets_its_own_type_and_version() {
    let stampers: BTreeMap<_, _> = own_type_stampers().into_iter().collect();
    let mut seen = BTreeSet::new();
    for name in walked() {
        let stamper = stampers.get(name.as_str()).unwrap_or_else(|| panic!("{name} has no stamper"));
        let (object_type, version) = stamper();
        let expected = expected_number(&name);
        assert_ne!(expected, 0, "{name}");
        assert_eq!(object_type as i32, expected, "{name}");
        assert_eq!(own_type_by_full_name(&name), Some(object_type), "{name}");
        assert_eq!(version, Some((0, 0, 1)), "{name}");
        assert!(seen.insert(object_type as i32), "{name} shares {object_type:?} with another message");
    }
}

#[test]
fn the_lm318_rows_keep_their_values() {
    for (name, object_type) in [
        ("fintekkers.models.portfolio.PortfolioProto", ObjectTypeProto::ObjectTypePortfolio),
        ("fintekkers.models.position.PositionProto", ObjectTypeProto::ObjectTypePosition),
        ("fintekkers.models.position.PositionFilterProto", ObjectTypeProto::ObjectTypePositionFilter),
        ("fintekkers.models.price.PriceProto", ObjectTypeProto::ObjectTypePrice),
        ("fintekkers.models.security.IdentifierProto", ObjectTypeProto::ObjectTypeIdentifier),
        ("fintekkers.models.security.SecurityProto", ObjectTypeProto::ObjectTypeSecurity),
        ("fintekkers.models.security.TenorProto", ObjectTypeProto::ObjectTypeTenor),
        ("fintekkers.models.strategy.StrategyProto", ObjectTypeProto::ObjectTypeStrategy),
        ("fintekkers.models.strategy.StrategyAllocationProto", ObjectTypeProto::ObjectTypeStrategyAllocation),
        ("fintekkers.models.transaction.TransactionProto", ObjectTypeProto::ObjectTypeTransaction),
        ("fintekkers.requests.portfolio.CreatePortfolioRequestProto", ObjectTypeProto::ObjectTypeCreatePortfolioRequest),
        ("fintekkers.requests.portfolio.QueryPortfolioRequestProto", ObjectTypeProto::ObjectTypeQueryPortfolioRequest),
        ("fintekkers.requests.price.CreatePriceRequestProto", ObjectTypeProto::ObjectTypeCreatePriceRequest),
        ("fintekkers.requests.price.QueryPriceRequestProto", ObjectTypeProto::ObjectTypeQueryPriceRequest),
        ("fintekkers.requests.security.CreateSecurityRequestProto", ObjectTypeProto::ObjectTypeCreateSecurityRequest),
        ("fintekkers.requests.security.QuerySecurityRequestProto", ObjectTypeProto::ObjectTypeQuerySecurityRequest),
        ("fintekkers.requests.transaction.CreateTransactionRequestProto", ObjectTypeProto::ObjectTypeCreateTransactionRequest),
        ("fintekkers.requests.transaction.QueryTransactionRequestProto", ObjectTypeProto::ObjectTypeQueryTransactionRequest),
    ] {
        assert_eq!(own_type_by_full_name(name), Some(object_type), "{name}");
    }
}

/// Both `stamp_own` and `stamp` work on `M` from outside this crate.
fn check_both<M: OwnObjectType + Default>(expected: ObjectTypeProto) {
    assert_eq!(M::OBJECT_TYPE, expected);
    let own = stamp_own(M::default());
    let explicit = stamp(M::default(), expected);
    for message in [&own, &explicit] {
        assert_eq!(read_type(message), expected);
        assert_eq!(read_version(message), Some((0, 0, 1)));
    }
    assert_eq!(own.raw_object_type(), explicit.raw_object_type());
}

#[test]
fn the_named_types_stamp_through_the_public_api() {
    use ObjectTypeProto::*;
    check_both::<CreatePriceResponseProto>(ObjectTypeCreatePriceResponse);
    check_both::<QueryPriceResponseProto>(ObjectTypeQueryPriceResponse);
    check_both::<CreateSecurityResponseProto>(ObjectTypeCreateSecurityResponse);
    check_both::<QuerySecurityResponseProto>(ObjectTypeQuerySecurityResponse);
    check_both::<CreatePortfolioResponseProto>(ObjectTypeCreatePortfolioResponse);
    check_both::<QueryPortfolioResponseProto>(ObjectTypeQueryPortfolioResponse);
    check_both::<CreateTransactionResponseProto>(ObjectTypeCreateTransactionResponse);
    check_both::<QueryTransactionResponseProto>(ObjectTypeQueryTransactionResponse);
    check_both::<QueryPositionResponseProto>(ObjectTypeQueryPositionResponse);
    check_both::<CreateIndexCompositionRequestProto>(ObjectTypeCreateIndexCompositionRequest);
    check_both::<CreateIndexCompositionResponseProto>(ObjectTypeCreateIndexCompositionResponse);
    check_both::<GetIndexCompositionRequestProto>(ObjectTypeGetIndexCompositionRequest);
    check_both::<GetIndexCompositionResponseProto>(ObjectTypeGetIndexCompositionResponse);
    // The model the index-composition messages carry.
    check_both::<IndexCompositionProto>(ObjectTypeIndexComposition);
}
