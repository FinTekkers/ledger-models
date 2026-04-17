use chrono::naive::NaiveDate;
use chrono::{DateTime, Datelike, TimeZone, Utc};
use crate::fintekkers::models::util::LocalDateProto;
use std::fmt;
use std::str::FromStr;
use crate::fintekkers::wrappers::models::utils::errors::Error;

static DATE_FORMAT: &str = "%Y-%m-%d";

pub struct DateWrapper {
    proto: LocalDateProto,
}

impl AsRef<LocalDateProto> for DateWrapper {
    fn as_ref(&self) -> &LocalDateProto {
        &self.proto
    }
}

impl DateWrapper {
    pub fn new(proto: LocalDateProto) -> Self {
        DateWrapper { proto }
    }
}

#[derive(Debug)]
pub enum ParseError {
    NotValidFormat,
}

impl FromStr for DateWrapper {
    type Err = ParseError;

    // Parses a date from the yyyy-mm-dd format
    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let naive_date = NaiveDate::parse_from_str(value, DATE_FORMAT)
            .map_err(|_| ParseError::NotValidFormat)?;

        Ok(DateWrapper {
            proto: LocalDateProto {
                year: naive_date.year() as u32,
                month: naive_date.month(),
                day: naive_date.day(),
            },
        })
    }
}

impl TryFrom<DateWrapper> for DateTime<Utc> {
    type Error = Error;

    fn try_from(value: DateWrapper) -> Result<DateTime<Utc>, Error> {
        let year = value.proto.year as i32;
        let month = value.proto.month;
        let day = value.proto.day;

        Utc.with_ymd_and_hms(year, month, day, 0, 0, 0)
            .single()
            .ok_or(Error::DateConversion)
    }
}


impl TryFrom<DateWrapper> for NaiveDate {
    type Error = Error;

    fn try_from(value: DateWrapper) -> Result<NaiveDate, Error> {
        let year = value.proto.year as i32;
        let month = value.proto.month;
        let day = value.proto.day;

        NaiveDate::from_ymd_opt(year, month, day).ok_or(Error::DateConversion)
    }
}

impl From<DateWrapper> for LocalDateProto {
    fn from(value: DateWrapper) -> Self {
        value.proto
    }
}

impl fmt::Display for DateWrapper {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        let date_str = &format!(
            "{}-{}-{}",
            &self.proto.year, &self.proto.month, &self.proto.day
        );
        fmt.write_str(date_str).unwrap();
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_proto_to_date() {
        let input = DateWrapper {
            proto: LocalDateProto {
                year: 2020,
                month: 12,
                day: 31,
            },
        };

        let output: NaiveDate = input.try_into().expect("failed to convert date");

        assert_eq!(output.to_string(), "2020-12-31");
    }

    #[test]
    fn test_date_from_string() {
        let date = DateWrapper::from_str("2023-10-28").unwrap();
        assert_eq!(date.proto.year, 2023);
    }

    #[test]
    fn test_date_from_invalid_string_returns_err() {
        let result = DateWrapper::from_str("not-a-date");
        assert!(result.is_err());
    }

    #[test]
    fn test_date_from_empty_string_returns_err() {
        let result = DateWrapper::from_str("");
        assert!(result.is_err());
    }
}
