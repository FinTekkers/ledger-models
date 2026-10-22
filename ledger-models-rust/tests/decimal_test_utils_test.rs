//! The `test-utils` decimal helpers, used the way a consumer crate uses them
//! (LM-312). Runs only with `cargo test --features test-utils`.

use ledger_models::fintekkers::models::price::PriceProto;
use ledger_models::fintekkers::models::security::bond::IssuanceProto;
use ledger_models::fintekkers::models::security::security_proto::NonBondDetails;
use ledger_models::fintekkers::models::security::{
    BondDetailsProto, CashDetailsProto, FrnExtensionProto, IndexDetailsProto, MbsExtensionProto, SecurityProto,
    TipsExtensionProto,
};
use ledger_models::fintekkers::models::util::DecimalValueProto;
use ledger_models::fintekkers::requests::valuation::{CurveInputProto, CurveRequestProto};
use ledger_models::fintekkers::wrappers::models::utils::decimal_test_utils::{
    compact_only, find_decimals, value_and_scale,
};

/// Hands out a distinct decimal on each call, each with trailing zeros
/// (`1.50`, `200.000`, `3.50`, ...).
struct Decimals(u32);

impl Decimals {
    fn next(&mut self) -> Option<DecimalValueProto> {
        self.0 += 1;
        let n = self.0;
        let s = if n % 2 == 1 { format!("{}.50", n) } else { format!("{}00.000", n) };
        Some(compact_only(&s))
    }
}

/// A bond-shaped security with `coupon_rate` and `face_value`: 2 decimals.
fn bond(d: &mut Decimals) -> SecurityProto {
    SecurityProto {
        bond_details: Some(BondDetailsProto { coupon_rate: d.next(), face_value: d.next(), ..Default::default() }),
        ..Default::default()
    }
}

/// Every decimal field of `SecurityProto` set once, nested ones included.
/// Counted from security.proto and bond/issuance.proto:
/// - bond_details: coupon_rate, face_value                                2
/// - bond_details.issuance_info[0]: post_auction_outstanding_quantity,
///   auction_offering_amount, price_for_single_price_auction,
///   total_accepted, mature_security_amount, high_discount_rate          6
/// - tips_extension.base_cpi                                              1
/// - frn_extension.spread                                                 1
/// - mbs_extension: wac, pass_through_rate, current_factor,
///   original_face_value, current_upb, psa_speed                          6
/// - non_bond_details is a oneof. index_details is the only branch that
///   can hold decimals (through constituents; equity and cash have none,
///   fx_spot holds two cash securities). constituents[0] is a bond       2
/// - legs[0] is a bond                                                    2
/// - settlement_currency is a cash security: no decimal fields            0
///
/// Total                                                                 20
const SECURITY_DECIMALS: usize = 20;

fn full_security() -> SecurityProto {
    let d = &mut Decimals(0);
    let mut security = bond(d);
    if let Some(bond_details) = security.bond_details.as_mut() {
        bond_details.issuance_info = vec![IssuanceProto {
            post_auction_outstanding_quantity: d.next(),
            auction_offering_amount: d.next(),
            price_for_single_price_auction: d.next(),
            total_accepted: d.next(),
            mature_security_amount: d.next(),
            high_discount_rate: d.next(),
            ..Default::default()
        }];
    }
    security.tips_extension = Some(TipsExtensionProto { base_cpi: d.next(), ..Default::default() });
    security.frn_extension = Some(FrnExtensionProto { spread: d.next(), ..Default::default() });
    security.mbs_extension = Some(MbsExtensionProto {
        wac: d.next(),
        pass_through_rate: d.next(),
        current_factor: d.next(),
        original_face_value: d.next(),
        current_upb: d.next(),
        psa_speed: d.next(),
        ..Default::default()
    });
    security.non_bond_details =
        Some(NonBondDetails::IndexDetails(IndexDetailsProto { constituents: vec![bond(d)], ..Default::default() }));
    security.legs = vec![bond(d)];
    security.settlement_currency = Some(Box::new(SecurityProto {
        non_bond_details: Some(NonBondDetails::CashDetails(CashDetailsProto { cash_id: "USD".to_string() })),
        ..Default::default()
    }));
    security
}

/// Every decimal field of `CurveRequestProto` set, with two inputs. Counted
/// from curve_request.proto, price.proto and security.proto:
/// - curve_inputs[i].security is a bond                                   2
/// - curve_inputs[i].price.price                                          1
/// - curve_inputs[i].price.security: bond_details.face_value              1
/// - curve_inputs[i].tenor                                                1
/// - curve_inputs[i].clean_price                                          1
///   per input 6, two inputs                                             12
/// - tenor_points, repeated: three entries                                3
///
/// Total                                                                 15
const CURVE_REQUEST_DECIMALS: usize = 15;

fn full_curve_request() -> CurveRequestProto {
    let d = &mut Decimals(0);
    let mut input = || CurveInputProto {
        security: Some(bond(d)),
        price: Some(PriceProto {
            price: d.next(),
            security: Some(SecurityProto {
                bond_details: Some(BondDetailsProto { face_value: d.next(), ..Default::default() }),
                ..Default::default()
            }),
            ..Default::default()
        }),
        tenor: d.next(),
        clean_price: d.next(),
    };
    let curve_inputs = vec![input(), input()];
    let tenor_points = (0..3).map(|_| d.next().unwrap()).collect();
    CurveRequestProto { curve_inputs, tenor_points, ..Default::default() }
}

fn paths(found: &[(String, DecimalValueProto)]) -> Vec<&str> {
    found.iter().map(|(p, _)| p.as_str()).collect()
}

#[test]
fn finds_every_decimal_in_security() {
    let found = find_decimals(&full_security());
    assert_eq!(found.len(), SECURITY_DECIMALS, "{:#?}", paths(&found));
    let paths = paths(&found);
    for expected in [
        "bond_details.face_value",
        "bond_details.issuance_info[0].total_accepted",
        "mbs_extension.psa_speed",
        "index_details.constituents[0].bond_details.coupon_rate",
        "legs[0].bond_details.face_value",
    ] {
        assert!(paths.contains(&expected), "{} not in {:#?}", expected, paths);
    }
}

#[test]
fn finds_every_decimal_in_curve_request() {
    let found = find_decimals(&full_curve_request());
    assert_eq!(found.len(), CURVE_REQUEST_DECIMALS, "{:#?}", paths(&found));
    let paths = paths(&found);
    for expected in ["curve_inputs[1].tenor", "curve_inputs[0].price.price", "tenor_points[2]"] {
        assert!(paths.contains(&expected), "{} not in {:#?}", expected, paths);
    }
}

#[test]
fn compact_only_keeps_value_and_scale() {
    assert_eq!(value_and_scale(&compact_only("1.50")), Some((150, 2)));
    assert_eq!(value_and_scale(&compact_only("-0.005")), Some((-5, 3)));
    assert_eq!(value_and_scale(&DecimalValueProto::default()), None);
}
