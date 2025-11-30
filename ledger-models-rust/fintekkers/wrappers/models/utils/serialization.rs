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
