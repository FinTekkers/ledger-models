//! v0.2.5 link-helpers / wire-compat and v0.3.0 IndexDetailsProto.constituents
//! round-trip tests. The original v0.2.x flat-field round-trip tests for all
//! 6 security types were removed in v0.4.0 (#277/#278); structured-shape
//! coverage lives in ledger-models-rust/fintekkers/wrappers/models/security.rs's
//! inline test module.

use ledger_models::fintekkers::models::security::{
    IndexDetailsProto, SecurityProto, ProductTypeProto,
};
use ledger_models::fintekkers::models::security::security_proto::NonBondDetails;
use ledger_models::fintekkers::models::security::index::IndexTypeProto;
use ledger_models::fintekkers::models::util::{LocalTimestampProto, UuidProto};
use ledger_models::fintekkers::wrappers::models::security::{link_of, link_of_latest, SecurityWrapper};
use prost::Message;
use uuid::Uuid;
use prost_types::Timestamp;

fn roundtrip(original: &SecurityProto) -> SecurityProto {
    let mut buf = Vec::new();
    original.encode(&mut buf).expect("encode failed");
    SecurityProto::decode(&buf[..]).expect("decode failed")
}

// ---------- v0.2.5: link helpers + constituents + wire-compat ----------

fn timestamp_at(seconds: i64) -> LocalTimestampProto {
    LocalTimestampProto {
        timestamp: Some(Timestamp { seconds, nanos: 0 }),
        time_zone: "UTC".to_string(),
    }
}

#[test]
fn link_of_populates_uuid_and_as_of_and_sets_is_link() {
    let uuid = Uuid::new_v4();
    let as_of = timestamp_at(1_700_000_000);

    let link = link_of(uuid, as_of.clone());

    assert!(link.is_link, "linkOf must set is_link=true");
    assert_eq!(link.uuid.as_ref().unwrap().raw_uuid, uuid.as_bytes().to_vec(),
               "linkOf must populate uuid");
    assert_eq!(link.as_of.as_ref().unwrap(), &as_of,
               "linkOf must populate as_of from caller-supplied timestamp");
    // No other fields should be populated.
    assert!(link.asset_class.is_empty());
    assert!(link.issuer_name.is_empty());
    assert_eq!(link.product_type, 0);
}

#[test]
fn link_of_latest_skips_as_of() {
    let uuid = Uuid::new_v4();
    let link = link_of_latest(uuid);

    assert!(link.is_link, "linkOfLatest must set is_link=true");
    assert_eq!(link.uuid.as_ref().unwrap().raw_uuid, uuid.as_bytes().to_vec());
    assert!(link.as_of.is_none(),
            "linkOfLatest must leave as_of unset (resolver returns latest)");
}

#[test]
fn link_round_trip_preserves_uuid_and_as_of() {
    let uuid = Uuid::new_v4();
    let as_of = timestamp_at(1_700_000_000);
    let link = link_of(uuid, as_of.clone());

    let parsed = roundtrip(&link);
    assert!(parsed.is_link);
    assert_eq!(parsed.uuid.as_ref().unwrap().raw_uuid, uuid.as_bytes().to_vec());
    assert_eq!(parsed.as_of.as_ref().unwrap(), &as_of);
}

#[test]
fn security_wrapper_is_link_reads_proto() {
    let wrapper_full = SecurityWrapper::new(SecurityProto::default());
    assert!(!wrapper_full.is_link());

    let link = link_of(Uuid::new_v4(), timestamp_at(1_700_000_000));
    let wrapper_link = SecurityWrapper::new(link);
    assert!(wrapper_link.is_link());
}

#[test]
#[should_panic(expected = "Cannot read product_type on a link-mode SecurityWrapper")]
fn security_wrapper_product_type_panics_on_link() {
    let link = link_of(Uuid::new_v4(), timestamp_at(1_700_000_000));
    let wrapper = SecurityWrapper::new(link);
    let _ = wrapper.product_type_i32();
}

#[test]
#[should_panic(expected = "Cannot read asset_class on a link-mode SecurityWrapper")]
fn security_wrapper_asset_class_panics_on_link() {
    let link = link_of(Uuid::new_v4(), timestamp_at(1_700_000_000));
    let wrapper = SecurityWrapper::new(link);
    let _ = wrapper.asset_class();
}

#[test]
fn index_details_constituents_round_trip() {
    // Server populates constituents under QuerySecurityRequestProto.lookthrough=true.
    // Each constituent is a link with is_link=true, uuid + as_of set.
    let as_of = timestamp_at(1_700_000_000);
    let c1 = link_of(Uuid::new_v4(), as_of.clone());
    let c2 = link_of(Uuid::new_v4(), as_of.clone());

    let index_security = SecurityProto {
        product_type: ProductTypeProto::EquityIndex as i32,
        non_bond_details: Some(NonBondDetails::IndexDetails(IndexDetailsProto {
            index_type: IndexTypeProto::CpiU as i32,
            constituents: vec![c1.clone(), c2.clone()],
        })),
        ..Default::default()
    };

    let parsed = roundtrip(&index_security);
    match &parsed.non_bond_details {
        Some(NonBondDetails::IndexDetails(idx)) => {
            assert_eq!(idx.constituents.len(), 2);
            assert!(idx.constituents[0].is_link);
            assert_eq!(idx.constituents[0].as_of.as_ref().unwrap(), &as_of);
            assert_eq!(idx.constituents[0].uuid, c1.uuid);
            assert_eq!(idx.constituents[1].uuid, c2.uuid);
        }
        other => panic!("Expected IndexDetails, got {:?}", other),
    }
}

#[test]
fn legs_wire_compatible_with_legacy_security_id_proto_bytes() {
    // SecurityIdProto carried uuid at tag 1 — identical wire format to
    // SecurityProto.uuid. Bytes from the legacy type MUST parse cleanly
    // under the new SecurityProto leg type. We reconstruct the legacy
    // wire form by encoding a SecurityProto with only the uuid set —
    // bit-for-bit identical to what SecurityIdProto would have produced.
    let leg_uuid = Uuid::new_v4();
    let legacy_shape = SecurityProto {
        uuid: Some(UuidProto { raw_uuid: leg_uuid.as_bytes().to_vec() }),
        ..Default::default()
    };
    let legacy_bytes = legacy_shape.encode_to_vec();

    let parsed = SecurityProto::decode(legacy_bytes.as_slice())
        .expect("legacy SecurityIdProto bytes must parse as SecurityProto");
    assert_eq!(parsed.uuid.as_ref().unwrap().raw_uuid, leg_uuid.as_bytes().to_vec());
}
