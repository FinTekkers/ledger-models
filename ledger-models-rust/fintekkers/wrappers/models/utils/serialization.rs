use crate::fintekkers::models::util::{
    DecimalValueProto, LocalDateProto, LocalTimestampProto, UuidProto,
};
use crate::fintekkers::requests::util::errors::FieldViolationProto;
use crate::fintekkers::wrappers::models::utils::decimal;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use chrono::naive::NaiveDate;
use chrono::{DateTime, NaiveDateTime, TimeZone};
use chrono_tz::Tz;
use rust_decimal::Decimal;
use uuid::Uuid;

/// Utility for serializing and deserializing between protobuf types and native Rust types
pub struct ProtoSerializationUtil;

impl ProtoSerializationUtil {
    /// Deserializes a UuidProto to a native Rust Uuid. Legacy: any length but
    /// 16, including empty, is the untyped `Error::UuidError`. Prefer
    /// [`Self::try_deserialize_uuid`].
    pub fn deserialize_uuid(uuid_proto: &UuidProto) -> Result<Uuid, Error> {
        Uuid::from_slice(&uuid_proto.raw_uuid).map_err(|_| Error::UuidError)
    }

    /// Deserializes a UuidProto (LM-334). Empty `raw_uuid` is unset:
    /// `Ok(None)`. Any other length but 16 is `Error::Validation` naming
    /// `raw_uuid`; a caller adds its own field with `Error::in_field`, e.g.
    /// `try_deserialize_uuid(p).map_err(|e| e.in_field("uuid"))`.
    pub fn try_deserialize_uuid(uuid_proto: &UuidProto) -> Result<Option<Uuid>, Error> {
        let raw = &uuid_proto.raw_uuid;
        if raw.is_empty() {
            return Ok(None);
        }
        if raw.len() != 16 {
            return Err(validation_error(
                "raw_uuid".to_string(),
                format!("expected 16 bytes but got {}", raw.len()),
            ));
        }
        Uuid::from_slice(raw).map(Some).map_err(|_| Error::UuidError)
    }

    /// Deserializes a LocalDateProto to a native Rust NaiveDate
    pub fn deserialize_date(date_proto: &LocalDateProto) -> Result<NaiveDate, Error> {
        NaiveDate::from_ymd_opt(date_proto.year as i32, date_proto.month, date_proto.day)
            .ok_or(Error::DateConversion)
    }

    /// Deserializes a LocalTimestampProto to a native Rust DateTime<Tz> with the appropriate timezone
    pub fn deserialize_timestamp(
        timestamp_proto: &LocalTimestampProto,
    ) -> Result<DateTime<Tz>, Error> {
        let timestamp = timestamp_proto
            .timestamp
            .as_ref()
            .ok_or(Error::DateConversion)?;

        let naive_date_time =
            NaiveDateTime::from_timestamp_opt(timestamp.seconds, timestamp.nanos as u32)
                .ok_or(Error::DateConversion)?;

        let tz: Tz = timestamp_proto
            .time_zone
            .parse()
            .map_err(|_| Error::DateConversion)?;
        let date_timezone = tz.offset_from_utc_datetime(&naive_date_time);

        Ok(DateTime::from_utc(naive_date_time, date_timezone))
    }

    /// Deserializes a required timestamp. Never substitutes a default
    /// (second-brain#276). Unset returns `Error::Validation` naming
    /// `field_path`; a blank time zone names `<field_path>.time_zone`.
    /// Anything else is delegated to [`Self::deserialize_timestamp`].
    pub fn deserialize_required_timestamp(
        timestamp_proto: Option<&LocalTimestampProto>,
        field_path: &str,
    ) -> Result<DateTime<Tz>, Error> {
        let timestamp_proto = match timestamp_proto {
            Some(ts) => ts,
            None => {
                return Err(validation_error(
                    field_path.to_string(),
                    format!("{} is required but unset", field_path),
                ))
            }
        };
        if timestamp_proto.time_zone.trim().is_empty() {
            let field = format!("{}.time_zone", field_path);
            let message = format!(
                "{} is required but was empty (LocalTimestampProto.time_zone is required). \
                 See second-brain#276.",
                field
            );
            return Err(validation_error(field, message));
        }
        Self::deserialize_timestamp(timestamp_proto)
    }

    /// Deserializes a DecimalValueProto to a native Rust Decimal. Unset,
    /// malformed, or not exactly representable as a Rust
    /// Decimal is `Error::Validation`, never rounded. The error names no
    /// field: a caller that wants one adds it with `Error::in_field`, e.g.
    /// `deserialize_decimal(p).map_err(|e| e.in_field("price"))`.
    pub fn deserialize_decimal(decimal_proto: &DecimalValueProto) -> Result<Decimal, Error> {
        decimal::decode_decimal(decimal_proto)?.to_rust_decimal()
    }
}

fn validation_error(field: String, message: String) -> Error {
    Error::Validation(vec![FieldViolationProto { field, object_id: None, message }])
}

#[cfg(test)]
mod tests {
    use super::*;
    use prost_types::Timestamp;

    // second-brain#276 — lock in that deserialize_timestamp rejects empty
    // time_zone with Err(DateConversion). Rust already loud-fails here
    // (chrono_tz::Tz::from_str returns Err on ""), but without a test
    // future refactors of this helper could regress into silent defaults.

    #[test]
    fn deserialize_timestamp_returns_err_on_empty_time_zone() {
        let proto = LocalTimestampProto {
            timestamp: Some(Timestamp {
                seconds: 1_700_000_000,
                nanos: 0,
            }),
            time_zone: String::new(),
        };

        let result = ProtoSerializationUtil::deserialize_timestamp(&proto);
        assert!(
            matches!(result, Err(Error::DateConversion)),
            "Empty time_zone must surface as Err(DateConversion), not a silent default. \
             Got: {:?}",
            result
        );
    }

    #[test]
    fn deserialize_timestamp_returns_err_on_default_proto() {
        // Wholly default LocalTimestampProto — no timestamp, no time_zone.
        // Should also error; we don't want some other silent path to substitute
        // a zero-epoch datetime here.
        let proto = LocalTimestampProto::default();
        let result = ProtoSerializationUtil::deserialize_timestamp(&proto);
        assert!(
            matches!(result, Err(Error::DateConversion)),
            "Default LocalTimestampProto must surface as Err(DateConversion). \
             Got: {:?}",
            result
        );
    }

    #[test]
    fn deserialize_timestamp_round_trips_utc() {
        // Sanity: a properly-populated proto continues to decode.
        let proto = LocalTimestampProto {
            timestamp: Some(Timestamp {
                seconds: 1_700_000_000,
                nanos: 0,
            }),
            time_zone: "UTC".to_string(),
        };

        let result = ProtoSerializationUtil::deserialize_timestamp(&proto);
        assert!(result.is_ok(), "valid UTC proto must decode: {:?}", result);
    }

    #[test]
    fn deserialize_timestamp_returns_err_on_unparseable_zone() {
        let proto = LocalTimestampProto {
            timestamp: Some(Timestamp {
                seconds: 1_700_000_000,
                nanos: 0,
            }),
            time_zone: "Not/A_Zone".to_string(),
        };

        let result = ProtoSerializationUtil::deserialize_timestamp(&proto);
        assert!(
            matches!(result, Err(Error::DateConversion)),
            "Unparseable time_zone must surface as Err(DateConversion). Got: {:?}",
            result
        );
    }

    // ---- LM-334: raw_uuid length ----

    fn raw_uuid(length: u8) -> UuidProto {
        UuidProto { raw_uuid: (0..length).collect() }
    }

    #[test]
    fn try_deserialize_uuid_rejects_wrong_length_naming_raw_uuid() {
        for length in [15, 17] {
            let err = ProtoSerializationUtil::try_deserialize_uuid(&raw_uuid(length)).unwrap_err();
            assert!(matches!(err, Error::Validation(_)), "expected Validation, got {:?}", err);
            assert_eq!(err.violations()[0].field, "raw_uuid");
            let message = err.to_string();
            assert!(message.contains("raw_uuid"), "{}", message);
            assert!(message.contains(&format!("got {}", length)), "{}", message);
        }
    }

    #[test]
    fn try_deserialize_uuid_decodes_sixteen_bytes_in_byte_order() {
        let decoded = ProtoSerializationUtil::try_deserialize_uuid(&raw_uuid(16)).unwrap();
        assert_eq!(decoded, Some(Uuid::parse_str("00010203-0405-0607-0809-0a0b0c0d0e0f").unwrap()));

        let original = Uuid::new_v4();
        let proto = UuidProto { raw_uuid: original.into_bytes().to_vec() };
        assert_eq!(proto.raw_uuid.len(), 16);
        assert_eq!(ProtoSerializationUtil::try_deserialize_uuid(&proto).unwrap(), Some(original));
    }

    #[test]
    fn try_deserialize_uuid_unset_is_none() {
        assert_eq!(ProtoSerializationUtil::try_deserialize_uuid(&UuidProto::default()).unwrap(), None);
    }

    #[test]
    fn legacy_deserialize_uuid_is_unchanged() {
        assert!(matches!(
            ProtoSerializationUtil::deserialize_uuid(&raw_uuid(17)),
            Err(Error::UuidError)
        ));
        assert_eq!(
            ProtoSerializationUtil::deserialize_uuid(&raw_uuid(16)).unwrap(),
            Uuid::parse_str("00010203-0405-0607-0809-0a0b0c0d0e0f").unwrap()
        );
    }

    // ---- LM-307: one plain decimal call ----

    use crate::fintekkers::wrappers::models::utils::decimal::decimal_proto_str;
    use std::str::FromStr;

    #[test]
    fn deserialize_decimal_is_one_plain_call() {
        // Compact form: unscaled 150 (0x0096), scale 2.
        let compact = DecimalValueProto { unscaled_value: vec![0x00, 0x96], scale: 2, ..Default::default() };
        let d = ProtoSerializationUtil::deserialize_decimal(&compact).unwrap();
        assert_eq!(d, Decimal::new(150, 2));
        assert_eq!(d.scale(), 2);

        // 28 fractional digits, the most Rust Decimal holds.
        let d = ProtoSerializationUtil::deserialize_decimal(&decimal_proto_str("0.1234567890123456789012345678")).unwrap();
        assert_eq!(d, Decimal::from_str("0.1234567890123456789012345678").unwrap());
        assert_eq!(d, Decimal::from_i128_with_scale(1_234_567_890_123_456_789_012_345_678, 28));
        assert_eq!(d.scale(), 28);
    }

    #[test]
    fn invalid_decimal_is_typed_err_and_in_field_labels_it() {
        let inputs = [
            // Over the scale cap.
            DecimalValueProto { unscaled_value: vec![0x01], scale: 4097 },
            // 29 fractional digits: over Rust Decimal's scale 28, so an error,
            // not rounded.
            decimal_proto_str("0.12345678901234567890123456789"),
            DecimalValueProto::default(),
        ];
        for input in &inputs {
            let err = ProtoSerializationUtil::deserialize_decimal(input).unwrap_err();
            assert!(matches!(err, Error::Validation(_)), "expected Validation, got {:?}", err);
            let unlabelled = err.to_string();
            assert!(unlabelled.starts_with("decimal"), "{}", unlabelled);

            let labelled = err.in_field("price");
            assert_eq!(labelled.violations()[0].field, "price");
            let message = labelled.to_string();
            assert!(message.starts_with("price: decimal"), "{}", message);
        }
    }

    #[test]
    fn in_field_prefixes_every_violation() {
        let err = Error::Validation(vec![
            FieldViolationProto { field: String::new(), object_id: None, message: "a".to_string() },
            FieldViolationProto { field: "coupon_rate".to_string(), object_id: None, message: "b".to_string() },
        ])
        .in_field("bond_details");
        let fields: Vec<&str> = err.violations().iter().map(|v| v.field.as_str()).collect();
        assert_eq!(fields, ["bond_details", "bond_details.coupon_rate"]);
        assert_eq!(err.to_string(), "bond_details: a (id null); bond_details.coupon_rate: b (id null)");
    }
}
