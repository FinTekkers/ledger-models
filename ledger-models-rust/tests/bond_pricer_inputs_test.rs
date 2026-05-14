//! Integration tests for the `from_pricer_inputs` builders on
//! `BondSecurity`, `TIPSBond`, and `FloatingRateNote`.
//!
//! For each builder: invoke with typed inputs → assert the returned
//! `SecurityProto` has the expected `bond_details` and (when applicable)
//! extension fields populated. Then encode → decode → re-wrap to confirm
//! the proto round-trips and the wrappers re-read what was written.

use chrono::NaiveDate;
use prost::Message;
use rust_decimal_macros::dec;

use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::security::{
    CouponFrequencyProto, CouponTypeProto, ProductTypeProto, SecurityProto,
};
use ledger_models::fintekkers::wrappers::models::bond_security::BondSecurity;
use ledger_models::fintekkers::wrappers::models::floating_rate_note::FloatingRateNote;
use ledger_models::fintekkers::wrappers::models::tips_bond::TIPSBond;

fn round_trip(proto: &SecurityProto) -> SecurityProto {
    let bytes = proto.encode_to_vec();
    SecurityProto::decode(bytes.as_slice()).expect("decode failed")
}

fn date(y: i32, m: u32, d: u32) -> NaiveDate {
    NaiveDate::from_ymd_opt(y, m, d).unwrap()
}

// ---------- BondSecurity::from_pricer_inputs ----------

#[test]
fn bond_from_pricer_inputs_populates_bond_details() {
    let proto = BondSecurity::from_pricer_inputs(
        dec!(1000),
        dec!(0.05),
        CouponTypeProto::Fixed,
        CouponFrequencyProto::Semiannually,
        date(2025, 1, 15),
        date(2035, 1, 15),
    );

    assert_eq!(proto.product_type, ProductTypeProto::TreasuryNote as i32);
    let bond = proto.bond_details.as_ref().expect("bond_details set");
    assert_eq!(
        bond.face_value.as_ref().unwrap().arbitrary_precision_value,
        "1000"
    );
    assert_eq!(
        bond.coupon_rate.as_ref().unwrap().arbitrary_precision_value,
        "0.05"
    );
    assert_eq!(bond.coupon_type, CouponTypeProto::Fixed as i32);
    assert_eq!(
        bond.coupon_frequency,
        CouponFrequencyProto::Semiannually as i32
    );
    let issue = bond.issue_date.as_ref().unwrap();
    assert_eq!((issue.year, issue.month, issue.day), (2025, 1, 15));
    let mat = bond.maturity_date.as_ref().unwrap();
    assert_eq!((mat.year, mat.month, mat.day), (2035, 1, 15));
    assert!(proto.tips_extension.is_none());
    assert!(proto.frn_extension.is_none());
}

#[test]
fn bond_from_pricer_inputs_round_trips_and_rewraps() {
    let proto = BondSecurity::from_pricer_inputs(
        dec!(1000),
        dec!(0.05),
        CouponTypeProto::Fixed,
        CouponFrequencyProto::Semiannually,
        date(2025, 1, 15),
        date(2035, 1, 15),
    );

    let parsed = round_trip(&proto);
    let bond = BondSecurity::from_proto(parsed).expect("wraps as bond");
    assert_eq!(bond.issue_date().unwrap(), date(2025, 1, 15));
    assert_eq!(bond.maturity_date().unwrap(), date(2035, 1, 15));
    assert_eq!(bond.original_tenor().unwrap(), dec!(10));
}

// ---------- TIPSBond::from_pricer_inputs ----------

#[test]
fn tips_from_pricer_inputs_populates_bond_and_tips_extension() {
    let proto = TIPSBond::from_pricer_inputs(
        dec!(1000),
        dec!(0.00625),
        CouponTypeProto::Fixed,
        CouponFrequencyProto::Semiannually,
        date(2020, 1, 15),
        date(2030, 1, 15),
        dec!(256.394),
        date(2020, 1, 1),
        IndexTypeProto::CpiU,
    );

    assert_eq!(proto.product_type, ProductTypeProto::Tips as i32);
    let bond = proto.bond_details.as_ref().expect("bond_details set");
    assert_eq!(
        bond.coupon_rate.as_ref().unwrap().arbitrary_precision_value,
        "0.00625"
    );
    let tips = proto.tips_extension.as_ref().expect("tips_extension set");
    assert_eq!(
        tips.base_cpi.as_ref().unwrap().arbitrary_precision_value,
        "256.394"
    );
    assert_eq!(tips.inflation_index_type, IndexTypeProto::CpiU as i32);
    let idx_date = tips.index_date.as_ref().unwrap();
    assert_eq!((idx_date.year, idx_date.month, idx_date.day), (2020, 1, 1));
    assert!(proto.frn_extension.is_none());
}

#[test]
fn tips_from_pricer_inputs_round_trips_and_rewraps() {
    let proto = TIPSBond::from_pricer_inputs(
        dec!(1000),
        dec!(0.00625),
        CouponTypeProto::Fixed,
        CouponFrequencyProto::Semiannually,
        date(2020, 1, 15),
        date(2030, 1, 15),
        dec!(256.394),
        date(2020, 1, 1),
        IndexTypeProto::CpiU,
    );

    let parsed = round_trip(&proto);
    let tips = TIPSBond::from_proto(parsed).expect("wraps as TIPS");
    assert_eq!(tips.base_cpi(), Some(dec!(256.394)));
    assert_eq!(tips.index_date(), Some(date(2020, 1, 1)));
    assert_eq!(tips.inflation_index_type(), IndexTypeProto::CpiU);
}

// ---------- FloatingRateNote::from_pricer_inputs ----------

#[test]
fn frn_from_pricer_inputs_populates_bond_and_frn_extension() {
    let proto = FloatingRateNote::from_pricer_inputs(
        dec!(100),
        dec!(0),
        CouponTypeProto::Float,
        CouponFrequencyProto::Quarterly,
        date(2024, 1, 15),
        date(2028, 1, 15),
        dec!(0.0050),
        IndexTypeProto::TBill13Week,
        CouponFrequencyProto::Quarterly,
    );

    assert_eq!(proto.product_type, ProductTypeProto::TreasuryFrn as i32);
    let bond = proto.bond_details.as_ref().expect("bond_details set");
    assert_eq!(bond.coupon_type, CouponTypeProto::Float as i32);
    let frn = proto.frn_extension.as_ref().expect("frn_extension set");
    assert_eq!(
        frn.spread.as_ref().unwrap().arbitrary_precision_value,
        "0.0050"
    );
    assert_eq!(frn.reference_rate_index, IndexTypeProto::TBill13Week as i32);
    assert_eq!(frn.reset_frequency, CouponFrequencyProto::Quarterly as i32);
    assert!(proto.tips_extension.is_none());
}

#[test]
fn frn_from_pricer_inputs_round_trips_and_rewraps() {
    let proto = FloatingRateNote::from_pricer_inputs(
        dec!(100),
        dec!(0),
        CouponTypeProto::Float,
        CouponFrequencyProto::Quarterly,
        date(2024, 1, 15),
        date(2028, 1, 15),
        dec!(0.0050),
        IndexTypeProto::TBill13Week,
        CouponFrequencyProto::Quarterly,
    );

    let parsed = round_trip(&proto);
    let frn = FloatingRateNote::from_proto(parsed).expect("wraps as FRN");
    assert_eq!(frn.spread(), Some(dec!(0.0050)));
    assert_eq!(frn.reference_rate_index(), IndexTypeProto::TBill13Week);
    assert_eq!(frn.reset_frequency(), CouponFrequencyProto::Quarterly);
}
