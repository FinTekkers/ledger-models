use crate::fintekkers::models::util::{
    DecimalValueProto, LocalDateProto, LocalTimestampProto, UuidProto,
};
use crate::fintekkers::wrappers::models::utils::errors::Error;
use chrono::naive::NaiveDate;
use chrono::{DateTime, NaiveDateTime, TimeZone};
use chrono_tz::Tz;
use rust_decimal::Decimal;
use std::str::FromStr;
use uuid::Uuid;

/// Utility for serializing and deserializing between protobuf types and native Rust types
pub struct ProtoSerializationUtil;

impl ProtoSerializationUtil {
    /// Deserializes a UuidProto to a native Rust Uuid
    pub fn deserialize_uuid(uuid_proto: &UuidProto) -> Result<Uuid, Error> {
        Uuid::from_slice(&uuid_proto.raw_uuid).map_err(|_| Error::UuidError)
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

    /// Deserializes a DecimalValueProto to a native Rust Decimal
    pub fn deserialize_decimal(decimal_proto: &DecimalValueProto) -> Result<Decimal, Error> {
        Decimal::from_str(&decimal_proto.arbitrary_precision_value)
            .map_err(|_| Error::DecimalConversion)
    }
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
}
