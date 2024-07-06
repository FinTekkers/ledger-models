use chrono::{DateTime, Local, NaiveDateTime, TimeZone, Utc};
use chrono_tz::Tz;
use prost_types::Timestamp;
use std::borrow::Borrow;
use std::fmt;
use std::str::FromStr;
use std::string::ParseError;

use crate::fintekkers::models::util::LocalTimestampProto;

pub struct LocalTimestampWrapper {
    pub proto: LocalTimestampProto,
}

impl AsRef<LocalTimestampProto> for LocalTimestampWrapper {
    fn as_ref(&self) -> &LocalTimestampProto {
        &self.proto
    }
}

impl LocalTimestampWrapper {
    pub fn new(proto: LocalTimestampProto) -> Self {
        LocalTimestampWrapper { proto }
    }

    pub fn now() -> Self {
        let time_zone_str = iana_time_zone::get_timezone().unwrap_or_else(|_| {
            panic!(
                "{}",
                String::from(
                    "Failed to get default timezone from \
                                         the operating system"
                )
            )
        });

        let now = Local::now().naive_local();
        Self::from_datetime(now, time_zone_str)
    }

    pub fn from_utc_datetime(now: NaiveDateTime) -> Self {
        Self::from_datetime(now, "UTC".to_string())
    }

    pub fn from_datetime(now: NaiveDateTime, time_zone_str: String) -> Self {
        let seconds = now.timestamp();
        let nanos = now.timestamp_subsec_nanos();

        let timestamp = Timestamp {
            seconds,
            nanos: nanos as i32,
        };

        LocalTimestampWrapper {
            proto: LocalTimestampProto {
                timestamp: Some(timestamp),
                time_zone: time_zone_str,
            },
        }
    }
}

impl From<&LocalTimestampWrapper> for DateTime<Tz> {
    fn from(wrapper: &LocalTimestampWrapper) -> DateTime<Tz> {
        let timestamp = wrapper.proto.timestamp.as_ref().unwrap();

        let naive_date_time =
            NaiveDateTime::from_timestamp_opt(timestamp.seconds, timestamp.nanos as u32).unwrap();

        let tz: Tz = wrapper.proto.time_zone.parse().unwrap();
        let date_timezone = tz.offset_from_utc_datetime(&naive_date_time);

        DateTime::from_utc(naive_date_time, date_timezone)
    }
}

impl From<&LocalTimestampWrapper> for DateTime<Utc> {
    fn from(wrapper: &LocalTimestampWrapper) -> DateTime<Utc> {
        let timestamp = wrapper.proto.timestamp.as_ref().unwrap();

        Utc.timestamp_opt(timestamp.seconds, timestamp.nanos as u32)
            .unwrap()
    }
}
impl From<LocalTimestampWrapper> for LocalTimestampProto {
    fn from(wrapper: LocalTimestampWrapper) -> LocalTimestampProto {
        wrapper.proto
    }
}

impl fmt::Display for LocalTimestampWrapper {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        let datetime: DateTime<Tz> = self.into();
        fmt.write_str(datetime.to_string().borrow()).unwrap();
        Ok(())
    }
}

// From string
// JSON Mapping
// In JSON format, the Timestamp type is encoded as a string in the RFC 3339 format. That is, the format is "{year}-{month}-{day}T{hour}:{min}:{sec}\[.{frac_sec}\]Z" where {year} is always expressed using four digits while {month}, {day}, {hour}, {min}, and {sec} are zero-padded to two digits each. The fractional seconds, which can go up to 9 digits (i.e. up to 1 nanosecond resolution), are optional. The "Z" suffix indicates the timezone ("UTC"); the timezone is required. A proto3 JSON serializer should always use UTC (as indicated by "Z") when printing the Timestamp type and a proto3 JSON parser should be able to accept both UTC and other timezones (as indicated by an offset).
// For example, "2017-01-15T01:30:15.01Z" encodes 15.01 seconds past 01:30 UTC on January 15, 2017.
// In JavaScript, one can convert a Date object to this format using the standard [toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString ) method. In Python, a standard datetime.datetime object can be converted to this format using [strftime](https://docs.python.org/2/library/time.html#time.strftime ) with the time format spec '%Y-%m-%dT%H:%M:%S.%fZ'. Likewise, in Java, one can use the Joda Time's [ISODateTimeFormat.dateTime()](http://www.joda.org/joda-time/apidocs/org/joda/time/format/ISODateTimeFormat.html#dateTime%2D%2D ) to obtain a formatter capable of generating timestamps in this format.

impl FromStr for LocalTimestampWrapper {
    type Err = ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let datetime: DateTime<Utc> = DateTime::parse_from_rfc3339(s)
            .map(|dt| dt.with_timezone(&Utc))
            .expect("");

        let time_zone_str = iana_time_zone::get_timezone().unwrap_or_else(|_| {
            panic!(
                "{}",
                String::from(
                    "Failed to get default timezone from \
                                         the operating system"
                )
            )
        });

        Ok(LocalTimestampWrapper {
            proto: LocalTimestampProto {
                timestamp: Some(create_timestamp_from_datetime(datetime)),
                time_zone: time_zone_str,
            },
        })
    }
}

fn create_timestamp_from_datetime(now: DateTime<Utc>) -> Timestamp {
    let seconds = now.timestamp();
    let nanos = now.timestamp_subsec_nanos() as i32;
    Timestamp { seconds, nanos }
}
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_proto_to_date() {
        let input = LocalTimestampWrapper {
            proto: LocalTimestampProto {
                timestamp: Some(Timestamp {
                    seconds: 1,
                    nanos: 0,
                }),
                time_zone: "America/New_York".to_string(),
            },
        };

        let output: DateTime<Tz> = input.borrow().into();

        //Timstamp of 1 second is 1970, Jan 1st at midnight, then when converted into NY timezone
        //from UTC it will be 5 hours earlier...
        assert_eq!(output.to_string(), "1969-12-31 19:00:01 EST");
    }

    #[test]
    fn test_date_from_naive_date() {
        let date_time: DateTime<Utc> = Utc::now();
        let wrapper = LocalTimestampWrapper::from_utc_datetime(date_time);

        //Check no timezone specified uses UTC
        let wrapper_seconds = wrapper.proto.timestamp.unwrap().seconds;
        assert_eq!(date_time.timestamp(), wrapper_seconds);
        assert_eq!(date_time.timezone().to_string(), wrapper.proto.time_zone);

        //Check explicit UTC timezone specified uses UTC
        let utc_wrapper = LocalTimestampWrapper::from_datetime(date_time, "UTC".to_string());

        let utc_wrapper_seconds = utc_wrapper.proto.timestamp.unwrap().seconds;
        assert_eq!(date_time.timestamp(), utc_wrapper_seconds);
        assert_eq!(
            date_time.timezone().to_string(),
            utc_wrapper.proto.time_zone
        );

        //Check explicit NY timezone specified doesn't use UTC
        let ny_wrapper =
            LocalTimestampWrapper::from_datetime(date_time, "America/New_York".to_string());

        let ny_wrapper_seconds = ny_wrapper.proto.timestamp.unwrap().seconds;
        assert_eq!(date_time.timestamp(), ny_wrapper_seconds);
        assert_eq!("America/New_York".to_string(), ny_wrapper.proto.time_zone);
    }

    #[test]
    fn test_date_from_string() {
        let date = LocalTimestampWrapper::from_str("2023-03-17T12:34:56Z").unwrap();

        let option = date.proto.timestamp.unwrap();
        assert_eq!(option.seconds, 1679056496);
    }


    #[test]
    fn test_timezones() {
        let now = LocalTimestampWrapper::now();
        let string = now.to_string();
        println!("{}", string);
    }
}
