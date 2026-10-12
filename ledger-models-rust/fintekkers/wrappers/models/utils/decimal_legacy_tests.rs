//! LM-294 metric 2: bytes written by the published v0.4.33 (string field 10
//! only) decode through the public read paths, and re-saving them writes the
//! compact form while still writing field 10 (stage 1).
//!
//! Fixtures: ledger-models-protos/fixtures/legacy_v0433/, written by
//! examples/gen_legacy_decimal_fixtures.rs with the pinned v0.4.33 crate.

#![allow(deprecated)] // Asserts the legacy string field is still written.

use crate::fintekkers::models::price::PriceProto;
use crate::fintekkers::models::security::SecurityProto;
use crate::fintekkers::models::transaction::TransactionProto;
use crate::fintekkers::models::util::DecimalValueProto;
use crate::fintekkers::wrappers::models::mortgage_backed_security::MortgageBackedSecurity;
use crate::fintekkers::wrappers::models::price::PriceWrapper;
use crate::fintekkers::wrappers::models::utils::decimal::{decode_decimal, reencode_decimal};
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use prost::Message;
use rust_decimal::Decimal;
use std::str::FromStr;

macro_rules! fixture {
    ($name:literal) => {
        (
            include_bytes!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../ledger-models-protos/fixtures/legacy_v0433/",
                $name,
                ".bin"
            ))
            .as_slice(),
            include_str!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../ledger-models-protos/fixtures/legacy_v0433/",
                $name,
                ".json"
            )),
        )
    };
}

/// (path, expected value) from a fixture's .json.
fn expected(json: &str) -> Vec<(String, Decimal)> {
    let root: serde_json::Value = serde_json::from_str(json).unwrap();
    let decimals = root["decimals"].as_array().expect("decimals");
    assert!(!decimals.is_empty());
    decimals
        .iter()
        .map(|d| {
            let unscaled = i128::from_str(d["unscaled"].as_str().unwrap()).unwrap();
            let scale = d["scale"].as_u64().unwrap() as u32;
            (d["path"].as_str().unwrap().to_string(), Decimal::from_i128_with_scale(unscaled, scale))
        })
        .collect()
}

/// Reads a security decimal the way a consumer would: the MBS wrapper's
/// accessors, or ProtoSerializationUtil for bond_details.
fn read_security(sec: &SecurityProto, path: &str) -> Decimal {
    let mbs = MortgageBackedSecurity::from_proto(sec.clone()).unwrap();
    let bond = sec.bond_details.as_ref().unwrap();
    let read = match path {
        "bond_details.coupon_rate" => ProtoSerializationUtil::deserialize_decimal(
            bond.coupon_rate.as_ref().unwrap()).ok(),
        "bond_details.face_value" => ProtoSerializationUtil::deserialize_decimal(
            bond.face_value.as_ref().unwrap()).ok(),
        "mbs_extension.wac" => mbs.wac(),
        "mbs_extension.pass_through_rate" => mbs.pass_through_rate(),
        "mbs_extension.current_factor" => mbs.current_factor(),
        "mbs_extension.original_face_value" => mbs.original_face_value(),
        "mbs_extension.current_upb" => mbs.current_upb(),
        "mbs_extension.psa_speed" => mbs.psa_speed(),
        other => panic!("unknown security path {}", other),
    };
    read.unwrap_or_else(|| panic!("{} did not decode", path))
}

fn security_decimals_mut<'a>(sec: &'a mut SecurityProto, prefix: &str) -> Vec<(String, &'a mut DecimalValueProto)> {
    let mut out = Vec::new();
    if let Some(b) = sec.bond_details.as_mut() {
        out.push((format!("{}bond_details.coupon_rate", prefix), b.coupon_rate.as_mut().unwrap()));
        out.push((format!("{}bond_details.face_value", prefix), b.face_value.as_mut().unwrap()));
    }
    if let Some(m) = sec.mbs_extension.as_mut() {
        for (name, d) in [
            ("wac", m.wac.as_mut()),
            ("pass_through_rate", m.pass_through_rate.as_mut()),
            ("current_factor", m.current_factor.as_mut()),
            ("original_face_value", m.original_face_value.as_mut()),
            ("current_upb", m.current_upb.as_mut()),
            ("psa_speed", m.psa_speed.as_mut()),
        ] {
            out.push((format!("{}mbs_extension.{}", prefix, name), d.unwrap()));
        }
    }
    out
}

/// Every decimal was stored as the string only; after re-saving, each has the
/// compact form, still has field 10, and decodes to the expected value.
fn assert_resaved(decimals: Vec<(String, &mut DecimalValueProto)>, expected: &[(String, Decimal)]) {
    assert_eq!(decimals.len(), expected.len());
    for (path, d) in decimals {
        assert!(d.unscaled_value.is_empty(), "{}: fixture must be string-only", path);
        let want = &expected.iter().find(|(p, _)| *p == path).unwrap_or_else(|| panic!("{} in json", path)).1;
        reencode_decimal(d).unwrap();
        assert!(!d.unscaled_value.is_empty(), "{}: compact form written", path);
        assert!(!d.arbitrary_precision_value.is_empty(), "{}: field 10 still written", path);
        let compact = decode_decimal(d).unwrap();
        let value = compact.to_rust_decimal().unwrap();
        assert_eq!(value, *want, "{}", path);
        assert_eq!(value.scale(), want.scale(), "{}", path);
        assert_eq!(Decimal::from_str(&d.arbitrary_precision_value).unwrap(), *want, "{}", path);
    }
}

#[test]
fn legacy_price_decodes_and_resaves_both_forms() {
    let (bin, json) = fixture!("price");
    let expected = expected(json);
    let proto = PriceProto::decode(bin).unwrap();

    let price = PriceWrapper::new(proto.clone()).try_price().unwrap();
    assert_eq!(price, expected[0].1);
    assert_eq!(price.scale(), expected[0].1.scale());
    for (path, want) in &expected[1..] {
        let got = read_security(proto.security.as_ref().unwrap(), path.strip_prefix("security.").unwrap());
        assert_eq!(got, *want, "{}", path);
        assert_eq!(got.scale(), want.scale(), "{}", path);
    }

    // Re-save, then read the bytes back.
    let mut resaved = proto.clone();
    let PriceProto { price, security, .. } = &mut resaved;
    let mut decimals = vec![("price".to_string(), price.as_mut().unwrap())];
    decimals.extend(security_decimals_mut(security.as_mut().unwrap(), "security."));
    assert_resaved(decimals, &expected);
    let reread = PriceProto::decode(resaved.encode_to_vec().as_slice()).unwrap();
    assert_eq!(PriceWrapper::new(reread).try_price().unwrap(), expected[0].1);
}

#[test]
fn legacy_security_decodes_and_resaves_both_forms() {
    let (bin, json) = fixture!("security");
    let expected = expected(json);
    let proto = SecurityProto::decode(bin).unwrap();
    for (path, want) in &expected {
        let got = read_security(&proto, path);
        assert_eq!(got, *want, "{}", path);
        assert_eq!(got.scale(), want.scale(), "{}", path);
    }

    let mut resaved = proto.clone();
    assert_resaved(security_decimals_mut(&mut resaved, ""), &expected);
    let reread = SecurityProto::decode(resaved.encode_to_vec().as_slice()).unwrap();
    for (path, want) in &expected {
        assert_eq!(read_security(&reread, path), *want, "{}", path);
    }
}

#[test]
fn legacy_transaction_decodes_and_resaves_both_forms() {
    let (bin, json) = fixture!("transaction");
    let expected = expected(json);
    let proto = TransactionProto::decode(bin).unwrap();

    // quantity was stored as the exponent string "1E+3".
    assert_eq!(proto.quantity.as_ref().unwrap().arbitrary_precision_value, "1E+3");
    let quantity = ProtoSerializationUtil::deserialize_decimal(
        proto.quantity.as_ref().unwrap()).unwrap();
    assert_eq!(quantity, expected[0].1);
    assert_eq!(quantity.scale(), 0);
    let price = PriceWrapper::new(proto.price.clone().unwrap()).try_price().unwrap();
    assert_eq!(price, expected[1].1);
    assert_eq!(price.scale(), 2);

    let mut resaved = proto.clone();
    let TransactionProto { quantity, price, .. } = &mut resaved;
    assert_resaved(
        vec![
            ("quantity".to_string(), quantity.as_mut().unwrap()),
            ("price.price".to_string(), price.as_mut().unwrap().price.as_mut().unwrap()),
        ],
        &expected,
    );
    let reread = TransactionProto::decode(resaved.encode_to_vec().as_slice()).unwrap();
    let q = reread.quantity.as_ref().unwrap();
    assert_eq!(q.arbitrary_precision_value, "1000");
    assert_eq!(q.unscaled_value, vec![0x03, 0xe8]);
    assert_eq!(q.scale, 0);
}
