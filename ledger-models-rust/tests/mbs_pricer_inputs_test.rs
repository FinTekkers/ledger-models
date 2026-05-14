//! Integration tests for the `from_pricer_inputs` builder on
//! `MortgageBackedSecurity`.
//!
//! Invoke the builder with typed inputs → assert the returned `SecurityProto`
//! has the expected `bond_details` and `mbs_extension` fields populated.
//! Then encode → decode → re-wrap to confirm the proto round-trips and the
//! wrapper re-reads what was written via every typed accessor.

use chrono::NaiveDate;
use prost::Message;
use rust_decimal_macros::dec;

use ledger_models::fintekkers::models::security::bond::AgencyProto;
use ledger_models::fintekkers::models::security::{
    CouponFrequencyProto, CouponTypeProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::wrappers::models::mortgage_backed_security::MortgageBackedSecurity;

fn round_trip(proto: &SecurityProto) -> SecurityProto {
    let bytes = proto.encode_to_vec();
    SecurityProto::decode(bytes.as_slice()).expect("decode failed")
}

fn date(y: i32, m: u32, d: u32) -> NaiveDate {
    NaiveDate::from_ymd_opt(y, m, d).unwrap()
}

#[test]
fn mbs_from_pricer_inputs_populates_bond_details_and_mbs_extension() {
    let proto = MortgageBackedSecurity::from_pricer_inputs(
        dec!(250000000),
        dec!(0.04),
        CouponTypeProto::Fixed,
        CouponFrequencyProto::Monthly,
        date(2023, 6, 1),
        date(2053, 6, 1),
        "FN AS1234".to_string(),
        AgencyProto::Fnma,
        dec!(0.045),
        358,
        dec!(0.04),
        dec!(0.95),
        dec!(250000000),
        dec!(237500000),
        dec!(150),
    );

    assert_eq!(proto.product_type, ProductTypeProto::MortgageBacked as i32);

    let bond = proto.bond_details.as_ref().expect("bond_details set");
    assert_eq!(
        bond.face_value.as_ref().unwrap().arbitrary_precision_value,
        "250000000"
    );
    assert_eq!(
        bond.coupon_rate.as_ref().unwrap().arbitrary_precision_value,
        "0.04"
    );
    assert_eq!(bond.coupon_type, CouponTypeProto::Fixed as i32);
    assert_eq!(bond.coupon_frequency, CouponFrequencyProto::Monthly as i32);
    let issue = bond.issue_date.as_ref().unwrap();
    assert_eq!((issue.year, issue.month, issue.day), (2023, 6, 1));
    let mat = bond.maturity_date.as_ref().unwrap();
    assert_eq!((mat.year, mat.month, mat.day), (2053, 6, 1));

    let mbs = proto.mbs_extension.as_ref().expect("mbs_extension set");
    assert_eq!(mbs.pool_number, "FN AS1234");
    assert_eq!(mbs.agency, AgencyProto::Fnma as i32);
    assert_eq!(
        mbs.wac.as_ref().unwrap().arbitrary_precision_value,
        "0.045"
    );
    assert_eq!(mbs.wam, 358);
    assert_eq!(
        mbs.pass_through_rate
            .as_ref()
            .unwrap()
            .arbitrary_precision_value,
        "0.04"
    );
    assert_eq!(
        mbs.current_factor
            .as_ref()
            .unwrap()
            .arbitrary_precision_value,
        "0.95"
    );
    assert_eq!(
        mbs.original_face_value
            .as_ref()
            .unwrap()
            .arbitrary_precision_value,
        "250000000"
    );
    assert_eq!(
        mbs.current_upb
            .as_ref()
            .unwrap()
            .arbitrary_precision_value,
        "237500000"
    );
    assert_eq!(
        mbs.psa_speed.as_ref().unwrap().arbitrary_precision_value,
        "150"
    );

    assert!(proto.tips_extension.is_none());
    assert!(proto.frn_extension.is_none());
}

#[test]
fn mbs_round_trips_via_encoded_bytes() {
    let proto = MortgageBackedSecurity::from_pricer_inputs(
        dec!(250000000),
        dec!(0.04),
        CouponTypeProto::Fixed,
        CouponFrequencyProto::Monthly,
        date(2023, 6, 1),
        date(2053, 6, 1),
        "FN AS1234".to_string(),
        AgencyProto::Fnma,
        dec!(0.045),
        358,
        dec!(0.04),
        dec!(0.95),
        dec!(250000000),
        dec!(237500000),
        dec!(150),
    );

    let parsed = round_trip(&proto);
    let mbs = MortgageBackedSecurity::from_proto(parsed).expect("wraps as MBS");

    assert_eq!(mbs.pool_number(), "FN AS1234");
    assert_eq!(mbs.agency(), AgencyProto::Fnma);
    assert_eq!(mbs.wac(), Some(dec!(0.045)));
    assert_eq!(mbs.wam(), 358);
    assert_eq!(mbs.pass_through_rate(), Some(dec!(0.04)));
    assert_eq!(mbs.current_factor(), Some(dec!(0.95)));
    assert_eq!(mbs.original_face_value(), Some(dec!(250000000)));
    assert_eq!(mbs.current_upb(), Some(dec!(237500000)));
    assert_eq!(mbs.psa_speed(), Some(dec!(150)));
}
