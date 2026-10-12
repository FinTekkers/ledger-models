#![allow(deprecated)] // Writes the legacy decimal string field (LM-294).

//! LM-307 metric 3: reading the deprecated `arbitrary_precision_value` logs
//! exactly one warning per process, whichever message types it is read from.
//!
//! The warning is guarded by a process-wide `Once`, and each file under
//! tests/ is its own process. Keep exactly ONE #[test] in this file: two
//! tests here would share the process and race on the `Once` and the logger.

use ledger_models::fintekkers::models::price::PriceProto;
use ledger_models::fintekkers::models::security::{ProductTypeProto, SecurityProto, TipsExtensionProto};
use ledger_models::fintekkers::models::util::DecimalValueProto;
use ledger_models::fintekkers::wrappers::models::price::PriceWrapper;
use ledger_models::fintekkers::wrappers::models::tips_bond::TIPSBond;
use ledger_models::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use log::{Level, LevelFilter, Log, Metadata, Record};
use rust_decimal::Decimal;
use std::str::FromStr;
use std::sync::Mutex;

/// Captures every log record as (level, message).
struct CaptureLogger {
    records: Mutex<Vec<(Level, String)>>,
}

impl Log for CaptureLogger {
    fn enabled(&self, _: &Metadata) -> bool {
        true
    }

    fn log(&self, record: &Record) {
        self.records
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .push((record.level(), record.args().to_string()));
    }

    fn flush(&self) {}
}

static STATIC_LOGGER: CaptureLogger = CaptureLogger { records: Mutex::new(Vec::new()) };

/// Captured warnings about the deprecated string field.
fn deprecation_warnings() -> Vec<String> {
    STATIC_LOGGER
        .records
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .iter()
        .filter(|(level, message)| *level == Level::Warn && message.contains("arbitrary_precision_value"))
        .map(|(_, message)| message.clone())
        .collect()
}

fn legacy(s: &str) -> DecimalValueProto {
    DecimalValueProto { arbitrary_precision_value: s.to_string(), ..Default::default() }
}

fn price_proto(price: DecimalValueProto) -> PriceProto {
    PriceProto { price: Some(price), ..Default::default() }
}

fn dec(s: &str) -> Decimal {
    Decimal::from_str(s).unwrap()
}

#[test]
fn string_fallback_warns_once_per_process_across_message_types() {
    assert!(log::set_logger(&STATIC_LOGGER).is_ok(), "logger already installed");
    log::set_max_level(LevelFilter::Warn);

    // A compact-only read never warns.
    let compact = DecimalValueProto { unscaled_value: vec![0x07], scale: 0, ..Default::default() };
    assert_eq!(ProtoSerializationUtil::deserialize_decimal(&compact).unwrap(), Decimal::from(7));
    assert_eq!(deprecation_warnings(), Vec::<String>::new());

    // Three string-only reads from two message types.
    let price = PriceWrapper::new(price_proto(legacy("101.25"))).try_price().unwrap();
    assert_eq!(price, dec("101.25"));
    assert_eq!(price.scale(), 2);

    let tips = SecurityProto {
        product_type: ProductTypeProto::Tips.into(),
        tips_extension: Some(TipsExtensionProto { base_cpi: Some(legacy("251.01234")), ..Default::default() }),
        ..Default::default()
    };
    let base_cpi = TIPSBond::from_proto(tips).unwrap().base_cpi().unwrap();
    assert_eq!(base_cpi, dec("251.01234"));
    assert_eq!(base_cpi.scale(), 5);

    let second_price = price_proto(legacy("-0.5"));
    let value = ProtoSerializationUtil::deserialize_decimal(second_price.price.as_ref().unwrap()).unwrap();
    assert_eq!(value, dec("-0.5"));
    assert_eq!(value.scale(), 1);

    let warnings = deprecation_warnings();
    assert_eq!(warnings.len(), 1, "{:?}", warnings);
}
