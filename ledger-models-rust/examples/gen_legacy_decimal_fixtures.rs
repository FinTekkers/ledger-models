//! Writes ledger-models-protos/fixtures/legacy_v0433/{price,security,transaction}.bin
//! with the published ledger-models v0.4.33, whose decimals carry only the
//! string field 10 (LM-294). The tests decode these bytes with the current
//! library and compare against the matching .json.
//!
//! Run from ledger-models-rust: `cargo run --example gen_legacy_decimal_fixtures`

use ledger_models_v0433::fintekkers::models::price::{PriceProto, PriceTypeProto};
use ledger_models_v0433::fintekkers::models::security::{
    BondDetailsProto, MbsExtensionProto, ProductTypeProto, SecurityProto,
};
use ledger_models_v0433::fintekkers::models::transaction::TransactionProto;
use ledger_models_v0433::fintekkers::models::util::{
    DecimalValueProto, LocalTimestampProto, UuidProto,
};
use prost::Message;
use std::path::Path;

fn decimal(s: &str) -> Option<DecimalValueProto> {
    Some(DecimalValueProto { arbitrary_precision_value: s.to_string() })
}

fn uuid(last: u8) -> Option<UuidProto> {
    let mut raw = vec![0x29u8; 16];
    raw[15] = last;
    Some(UuidProto { raw_uuid: raw })
}

fn as_of() -> Option<LocalTimestampProto> {
    Some(LocalTimestampProto {
        timestamp: Some(prost_types::Timestamp { seconds: 1_760_000_000, nanos: 0 }),
        time_zone: "America/New_York".to_string(),
    })
}

fn security() -> SecurityProto {
    SecurityProto {
        object_class: "Security".to_string(),
        version: "0.0.1".to_string(),
        uuid: uuid(2),
        as_of: as_of(),
        product_type: ProductTypeProto::MortgageBacked as i32,
        asset_class: "Fixed Income".to_string(),
        issuer_name: "FNMA".to_string(),
        bond_details: Some(BondDetailsProto {
            coupon_rate: decimal("4.500"),
            face_value: decimal("1000"),
            ..Default::default()
        }),
        mbs_extension: Some(MbsExtensionProto {
            pool_number: "MA4512".to_string(),
            wac: decimal("0.0475"),
            wam: 340,
            pass_through_rate: decimal("0.045"),
            current_factor: decimal("0.85321047"),
            original_face_value: decimal("1000000.00"),
            current_upb: decimal("853210.47"),
            psa_speed: decimal("150"),
            ..Default::default()
        }),
        ..Default::default()
    }
}

fn price() -> PriceProto {
    PriceProto {
        object_class: "Price".to_string(),
        version: "0.0.1".to_string(),
        uuid: uuid(1),
        as_of: as_of(),
        price: decimal("100.25"),
        security: Some(security()),
        price_type: PriceTypeProto::Percentage as i32,
        ..Default::default()
    }
}

fn transaction() -> TransactionProto {
    TransactionProto {
        object_class: "Transaction".to_string(),
        version: "0.0.1".to_string(),
        uuid: uuid(3),
        as_of: as_of(),
        security: Some(security()),
        transaction_type: 1,
        // Java's BigDecimal.toString writes exponent strings like this one.
        quantity: decimal("1E+3"),
        price: Some(PriceProto { price: decimal("-0.50"), ..price() }),
        trade_name: "LM-294 legacy fixture".to_string(),
        ..Default::default()
    }
}

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("../ledger-models-protos/fixtures/legacy_v0433");
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("price.bin"), price().encode_to_vec()).unwrap();
    std::fs::write(dir.join("security.bin"), security().encode_to_vec()).unwrap();
    std::fs::write(dir.join("transaction.bin"), transaction().encode_to_vec()).unwrap();
    println!("wrote {}", dir.display());
}
