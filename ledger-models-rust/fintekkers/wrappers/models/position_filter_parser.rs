//! Typed parsing of `PositionFilterProto` entries (LM-299).
//!
//! [`PositionFilter::parse`] turns every filter entry into a typed
//! [`ParsedFilter`] (field, operator, value), or returns one
//! [`FilterParseError`] for the first bad entry. Nothing is skipped: a filter
//! with one bad entry never comes back shorter. See
//! `docs/adr/position_filter_parsing.md` for the accepted encodings.
//!
//! The existing `PositionFilter::get_*` getters are unchanged.
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::indexing_slicing,
    clippy::panic
)]

use crate::fintekkers::models::position::{
    field_map_entry::FieldMapValueOneOf, FieldMapEntry, FieldProto, PositionFilterOperator,
    PositionStatusProto,
};
use crate::fintekkers::models::transaction::TransactionTypeProto;
use crate::fintekkers::models::util::{LocalDateProto, LocalTimestampProto, UuidProto};
use crate::fintekkers::wrappers::models::position::PositionFilter;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use chrono::{DateTime, NaiveDate};
use chrono_tz::Tz;
use prost::Message;
use prost_types::Any;
use std::fmt;
use uuid::Uuid;

const UUID_TYPE: &str = "fintekkers.models.util.UUIDProto";
const TIMESTAMP_TYPE: &str = "fintekkers.models.util.LocalTimestampProto";
const DATE_TYPE: &str = "fintekkers.models.util.LocalDateProto";
const STRING_TYPE: &str = "google.protobuf.StringValue";
const BOOL_TYPE: &str = "google.protobuf.BoolValue";

/// A decoded filter value.
#[derive(Debug, Clone, PartialEq)]
pub enum FilterValue {
    Uuid(Uuid),
    Timestamp(DateTime<Tz>),
    Date(NaiveDate),
    /// A `TRANSACTION_TYPE` or `POSITION_STATUS` number, checked against its enum.
    Enum(i32),
    Bool(bool),
    String(String),
}

/// One filter entry with a known field, a known operator and a typed value.
#[derive(Debug, Clone, PartialEq)]
pub struct ParsedFilter {
    pub field: FieldProto,
    pub operator: PositionFilterOperator,
    pub value: FilterValue,
}

/// Why a filter entry could not be parsed. Every variant carries the raw
/// field and operator numbers from the entry.
#[derive(Debug, Clone, PartialEq)]
pub enum FilterParseError {
    /// The field number is not a `FieldProto`, or is `UNKNOWN_FIELD` (0).
    UnknownField { field: i32, operator: i32 },
    /// The operator number is not a `PositionFilterOperator`, or is
    /// `UNKNOWN_OPERATOR` (0, what proto3 sends when no operator was set).
    UnknownOperator { field: i32, operator: i32 },
    /// The field holds a whole object (e.g. `SECURITY`, `TENOR`); filtering
    /// on it is not supported. Filter on its id or attributes instead.
    UnsupportedField { field: i32, operator: i32 },
    /// No value was set in the oneof.
    MissingValue { field: i32, operator: i32 },
    /// The value is set, but in an encoding this field does not accept.
    WrongValueKind {
        field: i32,
        operator: i32,
        expected: &'static str,
        found: String,
    },
    /// The value has the right encoding but its content is invalid.
    MalformedValue {
        field: i32,
        operator: i32,
        detail: String,
    },
}

impl FilterParseError {
    /// The raw field number of the bad entry.
    pub fn field(&self) -> i32 {
        match self {
            FilterParseError::UnknownField { field, .. }
            | FilterParseError::UnknownOperator { field, .. }
            | FilterParseError::UnsupportedField { field, .. }
            | FilterParseError::MissingValue { field, .. }
            | FilterParseError::WrongValueKind { field, .. }
            | FilterParseError::MalformedValue { field, .. } => *field,
        }
    }

    /// The raw operator number of the bad entry.
    pub fn operator(&self) -> i32 {
        match self {
            FilterParseError::UnknownField { operator, .. }
            | FilterParseError::UnknownOperator { operator, .. }
            | FilterParseError::UnsupportedField { operator, .. }
            | FilterParseError::MissingValue { operator, .. }
            | FilterParseError::WrongValueKind { operator, .. }
            | FilterParseError::MalformedValue { operator, .. } => *operator,
        }
    }
}

fn field_name(field: i32) -> String {
    match FieldProto::from_i32(field) {
        Some(f) => f.as_str_name().to_string(),
        None => format!("field {field}"),
    }
}

fn operator_name(operator: i32) -> String {
    match PositionFilterOperator::from_i32(operator) {
        Some(o) => o.as_str_name().to_string(),
        None => format!("operator {operator}"),
    }
}

impl fmt::Display for FilterParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let prefix = format!(
            "filter {} {}",
            field_name(self.field()),
            operator_name(self.operator())
        );
        match self {
            FilterParseError::UnknownField { .. } => write!(f, "{prefix}: unknown field"),
            FilterParseError::UnknownOperator { .. } => write!(f, "{prefix}: unknown operator"),
            FilterParseError::UnsupportedField { .. } => {
                write!(f, "{prefix}: filtering on this field is not supported")
            }
            FilterParseError::MissingValue { .. } => write!(f, "{prefix}: no value set"),
            FilterParseError::WrongValueKind {
                expected, found, ..
            } => write!(f, "{prefix}: expected {expected}, found {found}"),
            FilterParseError::MalformedValue { detail, .. } => write!(f, "{prefix}: {detail}"),
        }
    }
}

impl std::error::Error for FilterParseError {}

/// How a field's value is decoded.
#[derive(Debug, Clone, Copy, PartialEq)]
enum FieldKind {
    Uuid,
    Timestamp,
    Date,
    TransactionType,
    PositionStatus,
    Bool,
    String,
    /// Whole objects (`SECURITY`, `PORTFOLIO`, `TENOR`, ...).
    Unsupported,
}

/// The field→kind table. Exhaustive with no `_` arm on purpose: a new
/// `FieldProto` value must be given a kind here or the crate won't compile.
fn kind_of(field: FieldProto) -> Option<FieldKind> {
    match field {
        FieldProto::UnknownField => None,
        FieldProto::Id | FieldProto::SecurityId | FieldProto::PortfolioId | FieldProto::PriceId => {
            Some(FieldKind::Uuid)
        }
        FieldProto::AsOf => Some(FieldKind::Timestamp),
        FieldProto::EffectiveDate
        | FieldProto::IssueDate
        | FieldProto::MaturityDate
        | FieldProto::TradeDate
        | FieldProto::SettlementDate
        | FieldProto::TaxLotOpenDate
        | FieldProto::TaxLotCloseDate => Some(FieldKind::Date),
        FieldProto::TransactionType => Some(FieldKind::TransactionType),
        FieldProto::PositionStatus => Some(FieldKind::PositionStatus),
        FieldProto::IsCancelled => Some(FieldKind::Bool),
        FieldProto::AssetClass
        | FieldProto::ProductClass
        | FieldProto::ProductType
        | FieldProto::SecurityDescription
        | FieldProto::SecurityIssuerName
        | FieldProto::PortfolioName => Some(FieldKind::String),
        FieldProto::Strategy
        | FieldProto::Security
        | FieldProto::CashImpactSecurity
        | FieldProto::Identifier
        | FieldProto::Tenor
        | FieldProto::AdjustedTenor
        | FieldProto::Portfolio
        | FieldProto::Price => Some(FieldKind::Unsupported),
    }
}

/// Context for building errors about one entry.
struct EntryCtx {
    field: i32,
    operator: i32,
}

impl EntryCtx {
    fn wrong_kind(&self, expected: &'static str, found: impl Into<String>) -> FilterParseError {
        FilterParseError::WrongValueKind {
            field: self.field,
            operator: self.operator,
            expected,
            found: found.into(),
        }
    }

    fn malformed(&self, detail: impl Into<String>) -> FilterParseError {
        FilterParseError::MalformedValue {
            field: self.field,
            operator: self.operator,
            detail: detail.into(),
        }
    }

    /// Checks the `type_url` of a packed value names `expected` (its last
    /// `/` segment equals the full proto name), then decodes the bytes. An
    /// empty `type_url` is accepted.
    fn unpack<M: Message + Default>(
        &self,
        any: &Any,
        expected: &'static str,
    ) -> Result<M, FilterParseError> {
        if !any.type_url.is_empty() {
            let name = any.type_url.rsplit('/').next().unwrap_or_default();
            if name != expected {
                return Err(self.wrong_kind(expected, format!("packed {}", any.type_url)));
            }
        }
        M::decode(any.value.as_slice())
            .map_err(|e| self.malformed(format!("cannot decode packed {expected}: {e}")))
    }
}

fn found_name(value: &FieldMapValueOneOf) -> String {
    match value {
        FieldMapValueOneOf::FieldValuePacked(any) => format!("packed {}", any.type_url),
        FieldMapValueOneOf::EnumValue(_) => "enum_value".to_string(),
        FieldMapValueOneOf::StringValue(_) => "string_value".to_string(),
    }
}

fn decode_value(
    ctx: &EntryCtx,
    kind: FieldKind,
    value: &FieldMapValueOneOf,
) -> Result<FilterValue, FilterParseError> {
    match (kind, value) {
        (FieldKind::Unsupported, _) => Err(FilterParseError::UnsupportedField {
            field: ctx.field,
            operator: ctx.operator,
        }),

        (FieldKind::Uuid, FieldMapValueOneOf::FieldValuePacked(any)) => {
            let proto: UuidProto = ctx.unpack(any, UUID_TYPE)?;
            ProtoSerializationUtil::deserialize_uuid(&proto)
                .map(FilterValue::Uuid)
                .map_err(|_| {
                    ctx.malformed(format!(
                        "packed UUID has {} bytes, expected 16",
                        proto.raw_uuid.len()
                    ))
                })
        }
        (FieldKind::Uuid, FieldMapValueOneOf::StringValue(s)) => Uuid::parse_str(s)
            .map(FilterValue::Uuid)
            .map_err(|e| ctx.malformed(format!("malformed UUID string {s:?}: {e}"))),

        (FieldKind::Timestamp, FieldMapValueOneOf::FieldValuePacked(any)) => {
            let proto: LocalTimestampProto = ctx.unpack(any, TIMESTAMP_TYPE)?;
            ProtoSerializationUtil::deserialize_timestamp(&proto)
                .map(FilterValue::Timestamp)
                .map_err(|_| ctx.malformed("packed timestamp is unset or has a bad time zone"))
        }
        (FieldKind::Timestamp, FieldMapValueOneOf::StringValue(s)) => {
            DateTime::parse_from_rfc3339(s)
                .map(|t| FilterValue::Timestamp(t.with_timezone(&chrono_tz::UTC)))
                .map_err(|e| {
                    ctx.malformed(format!(
                        "malformed timestamp string {s:?} (expected RFC 3339 with an offset): {e}"
                    ))
                })
        }

        (FieldKind::Date, FieldMapValueOneOf::FieldValuePacked(any)) => {
            let proto: LocalDateProto = ctx.unpack(any, DATE_TYPE)?;
            ProtoSerializationUtil::deserialize_date(&proto)
                .map(FilterValue::Date)
                .map_err(|_| {
                    ctx.malformed(format!(
                        "invalid packed date {}-{}-{}",
                        proto.year, proto.month, proto.day
                    ))
                })
        }
        (FieldKind::Date, FieldMapValueOneOf::StringValue(s)) => {
            NaiveDate::parse_from_str(s, "%Y-%m-%d")
                .map(FilterValue::Date)
                .map_err(|e| {
                    ctx.malformed(format!(
                        "malformed date string {s:?} (expected YYYY-MM-DD): {e}"
                    ))
                })
        }

        (FieldKind::TransactionType, FieldMapValueOneOf::EnumValue(n)) => {
            match TransactionTypeProto::from_i32(*n) {
                Some(_) => Ok(FilterValue::Enum(*n)),
                None => Err(ctx.malformed(format!("{n} is not a TransactionTypeProto value"))),
            }
        }
        (FieldKind::PositionStatus, FieldMapValueOneOf::EnumValue(n)) => {
            match PositionStatusProto::from_i32(*n) {
                Some(_) => Ok(FilterValue::Enum(*n)),
                None => Err(ctx.malformed(format!("{n} is not a PositionStatusProto value"))),
            }
        }

        (FieldKind::Bool, FieldMapValueOneOf::FieldValuePacked(any)) => {
            ctx.unpack::<bool>(any, BOOL_TYPE).map(FilterValue::Bool)
        }
        (FieldKind::Bool, FieldMapValueOneOf::StringValue(s)) => match s.as_str() {
            "true" => Ok(FilterValue::Bool(true)),
            "false" => Ok(FilterValue::Bool(false)),
            _ => Err(ctx.malformed(format!(
                "malformed boolean string {s:?} (expected \"true\" or \"false\")"
            ))),
        },

        (FieldKind::String, FieldMapValueOneOf::StringValue(s)) => {
            Ok(FilterValue::String(s.clone()))
        }
        (FieldKind::String, FieldMapValueOneOf::FieldValuePacked(any)) => ctx
            .unpack::<String>(any, STRING_TYPE)
            .map(FilterValue::String),

        (FieldKind::Uuid, other) => Err(ctx.wrong_kind(
            "packed fintekkers.models.util.UUIDProto or string_value",
            found_name(other),
        )),
        (FieldKind::Timestamp, other) => Err(ctx.wrong_kind(
            "packed fintekkers.models.util.LocalTimestampProto or string_value",
            found_name(other),
        )),
        (FieldKind::Date, other) => Err(ctx.wrong_kind(
            "packed fintekkers.models.util.LocalDateProto or string_value",
            found_name(other),
        )),
        (FieldKind::TransactionType | FieldKind::PositionStatus, other) => {
            Err(ctx.wrong_kind("enum_value", found_name(other)))
        }
        (FieldKind::Bool, other) => Err(ctx.wrong_kind(
            "packed google.protobuf.BoolValue or string_value",
            found_name(other),
        )),
        (FieldKind::String, other) => Err(ctx.wrong_kind(
            "string_value or packed google.protobuf.StringValue",
            found_name(other),
        )),
    }
}

/// Parses one filter entry into a typed field, operator and value.
///
/// Accepted encodings (see `docs/adr/position_filter_parsing.md`):
/// - UUID fields (`ID`, `SECURITY_ID`, `PORTFOLIO_ID`, `PRICE_ID`): packed
///   `UUIDProto`, or `string_value` in a form `Uuid::parse_str` accepts.
/// - `AS_OF`: packed `LocalTimestampProto`, or `string_value` in RFC 3339 with
///   an offset, e.g. `2026-10-12T00:00:00Z`. Strings are returned in UTC.
/// - Date fields: packed `LocalDateProto`, or `string_value` as `YYYY-MM-DD`.
/// - `TRANSACTION_TYPE`, `POSITION_STATUS`: `enum_value` within the enum.
/// - `IS_CANCELLED`: packed `BoolValue`, or `string_value` `true` / `false`.
/// - Other scalar fields: `string_value` or packed `StringValue`.
/// - Object fields (`SECURITY`, `PORTFOLIO`, `TENOR`, ...): `UnsupportedField`.
///
/// Operator `UNKNOWN_OPERATOR` (0) is an error, like any number outside the
/// enum: proto3 sends 0 when the client forgot to set an operator.
pub fn parse_entry(entry: &FieldMapEntry) -> Result<ParsedFilter, FilterParseError> {
    let ctx = EntryCtx {
        field: entry.field,
        operator: entry.operator,
    };

    let (field, kind) =
        match FieldProto::from_i32(entry.field).and_then(|f| kind_of(f).map(|k| (f, k))) {
            Some(found) => found,
            None => {
                return Err(FilterParseError::UnknownField {
                    field: ctx.field,
                    operator: ctx.operator,
                })
            }
        };

    let operator = match PositionFilterOperator::from_i32(entry.operator) {
        Some(PositionFilterOperator::UnknownOperator) | None => {
            return Err(FilterParseError::UnknownOperator {
                field: ctx.field,
                operator: ctx.operator,
            })
        }
        Some(op) => op,
    };

    let value = match &entry.field_map_value_one_of {
        Some(value) => decode_value(&ctx, kind, value)?,
        None => {
            return Err(FilterParseError::MissingValue {
                field: ctx.field,
                operator: ctx.operator,
            })
        }
    };

    Ok(ParsedFilter {
        field,
        operator,
        value,
    })
}

impl PositionFilter {
    /// Parses every filter entry, in order. All-or-nothing: the first bad
    /// entry fails the whole call, so no entry is silently skipped. See
    /// [`parse_entry`] for the accepted encodings.
    pub fn parse(&self) -> Result<Vec<ParsedFilter>, FilterParseError> {
        self.get_filters().iter().map(parse_entry).collect()
    }
}

#[cfg(test)]
#[allow(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::indexing_slicing,
    clippy::panic
)]
mod tests {
    use super::*;
    use crate::fintekkers::models::position::PositionFilterProto;
    use chrono::TimeZone;

    const SECURITY_UUID: &str = "6f1c2a4e-9b3d-4c5e-8f70-1a2b3c4d5e6f";

    fn entry(field: i32, operator: i32, value: Option<FieldMapValueOneOf>) -> FieldMapEntry {
        FieldMapEntry {
            field,
            operator,
            field_map_value_one_of: value,
        }
    }

    fn string_value(s: &str) -> Option<FieldMapValueOneOf> {
        Some(FieldMapValueOneOf::StringValue(s.to_string()))
    }

    fn packed(type_name: &str, value: Vec<u8>) -> Option<FieldMapValueOneOf> {
        Some(FieldMapValueOneOf::FieldValuePacked(Any {
            type_url: format!("type.googleapis.com/{type_name}"),
            value,
        }))
    }

    fn packed_uuid(uuid: Uuid) -> Option<FieldMapValueOneOf> {
        let proto = UuidProto {
            raw_uuid: uuid.as_bytes().to_vec(),
        };
        packed(UUID_TYPE, proto.encode_to_vec())
    }

    fn filter(entries: Vec<FieldMapEntry>) -> PositionFilter {
        PositionFilter::new(PositionFilterProto {
            object_class: "PositionFilter".to_string(),
            version: "0.0.1".to_string(),
            filters: entries,
        })
    }

    fn security_id_equals(value: Option<FieldMapValueOneOf>) -> FieldMapEntry {
        entry(
            FieldProto::SecurityId as i32,
            PositionFilterOperator::Equals as i32,
            value,
        )
    }

    fn expected_uuid() -> Uuid {
        Uuid::parse_str(SECURITY_UUID).unwrap()
    }

    // Metric 1: packed and string SECURITY_ID give the same typed UUID.
    #[test]
    fn packed_and_string_security_id_parse_to_same_uuid() {
        for value in [packed_uuid(expected_uuid()), string_value(SECURITY_UUID)] {
            let parsed = filter(vec![security_id_equals(value)]).parse().unwrap();
            assert_eq!(parsed.len(), 1);
            assert_eq!(parsed[0].field, FieldProto::SecurityId);
            assert_eq!(parsed[0].operator, PositionFilterOperator::Equals);
            assert_eq!(parsed[0].value, FilterValue::Uuid(expected_uuid()));
        }
    }

    // Metric 1: AS_OF given as string_value gives a typed timestamp.
    #[test]
    fn as_of_string_parses_to_timestamp() {
        let parsed = filter(vec![entry(
            FieldProto::AsOf as i32,
            PositionFilterOperator::LessThanOrEquals as i32,
            string_value("2026-10-12T00:00:00Z"),
        )])
        .parse()
        .unwrap();
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0].field, FieldProto::AsOf);
        assert_eq!(parsed[0].operator, PositionFilterOperator::LessThanOrEquals);
        let expected = chrono_tz::UTC
            .with_ymd_and_hms(2026, 10, 12, 0, 0, 0)
            .unwrap();
        assert_eq!(parsed[0].value, FilterValue::Timestamp(expected));
    }

    // Metric 2: a malformed UUID string is an error naming field and operator,
    // and fails the whole filter.
    #[test]
    fn malformed_uuid_string_is_err_naming_field_and_operator() {
        let err = parse_entry(&security_id_equals(string_value("abc"))).unwrap_err();
        assert!(matches!(
            err,
            FilterParseError::MalformedValue {
                field: 53,
                operator: 1,
                ..
            }
        ));
        let text = err.to_string();
        assert!(text.contains("SECURITY_ID"), "{text}");
        assert!(text.contains("EQUALS"), "{text}");

        let result = filter(vec![
            security_id_equals(string_value(SECURITY_UUID)),
            security_id_equals(string_value("abc")),
        ])
        .parse();
        assert_eq!(result, Err(err));
    }

    // Metric 2: an operator outside the enum is an error and fails the whole filter.
    #[test]
    fn operator_out_of_range_is_err() {
        for bad_operator in [99, -1] {
            let bad = entry(
                FieldProto::SecurityId as i32,
                bad_operator,
                string_value(SECURITY_UUID),
            );
            let err = parse_entry(&bad).unwrap_err();
            assert_eq!(
                err,
                FilterParseError::UnknownOperator {
                    field: 53,
                    operator: bad_operator
                }
            );
            assert!(err.to_string().contains(&bad_operator.to_string()));

            let result = filter(vec![security_id_equals(string_value(SECURITY_UUID)), bad]).parse();
            assert_eq!(result, Err(err));
        }
    }

    // Operator 0 is what proto3 sends when no operator was set: an error, not a pass-through.
    #[test]
    fn operator_zero_is_unknown_operator() {
        let err = parse_entry(&entry(
            FieldProto::SecurityId as i32,
            0,
            string_value(SECURITY_UUID),
        ))
        .unwrap_err();
        assert_eq!(
            err,
            FilterParseError::UnknownOperator {
                field: 53,
                operator: 0
            }
        );
    }

    // Guardrail 1: the existing getter still rejects string_value.
    #[test]
    fn get_uuid_still_rejects_string_value() {
        let f = filter(vec![security_id_equals(string_value(SECURITY_UUID))]);
        assert_eq!(
            f.get_uuid(FieldProto::SecurityId),
            Err("Expected packed value for UUID field")
        );
    }

    // Java and Python clients pack strings as google.protobuf.StringValue.
    #[test]
    fn packed_string_value_and_string_value_give_same_string() {
        let packed_value = packed(STRING_TYPE, "FIXED_INCOME".to_string().encode_to_vec());
        for value in [packed_value, string_value("FIXED_INCOME")] {
            let parsed = parse_entry(&entry(
                FieldProto::AssetClass as i32,
                PositionFilterOperator::Equals as i32,
                value,
            ))
            .unwrap();
            assert_eq!(
                parsed.value,
                FilterValue::String("FIXED_INCOME".to_string())
            );
        }
    }

    // IS_CANCELLED is a Bool, and object fields are UnsupportedField: neither becomes a String.
    #[test]
    fn is_cancelled_is_bool_and_object_fields_are_unsupported() {
        let equals = PositionFilterOperator::Equals as i32;
        let is_cancelled = FieldProto::IsCancelled as i32;
        for (value, expected) in [
            (packed(BOOL_TYPE, true.encode_to_vec()), true),
            (string_value("false"), false),
        ] {
            let parsed = parse_entry(&entry(is_cancelled, equals, value)).unwrap();
            assert_eq!(parsed.value, FilterValue::Bool(expected));
        }
        assert!(matches!(
            parse_entry(&entry(is_cancelled, equals, string_value("yes"))),
            Err(FilterParseError::MalformedValue {
                field: 18,
                operator: 1,
                ..
            })
        ));

        for object_field in [
            FieldProto::Security,
            FieldProto::Tenor,
            FieldProto::Portfolio,
        ] {
            let err =
                parse_entry(&entry(object_field as i32, equals, string_value("x"))).unwrap_err();
            assert_eq!(
                err,
                FilterParseError::UnsupportedField {
                    field: object_field as i32,
                    operator: equals
                }
            );
        }
    }

    // Guardrail 3: no input panics, and every error carries the input field and operator.
    #[test]
    fn no_panic_sweep_errors_carry_field_and_operator() {
        let mut fields: Vec<i32> = (-1..=70).collect();
        fields.push(9999);
        let operators = [-1, 0, 1, 6, 7, 99];
        let short_uuid = UuidProto {
            raw_uuid: vec![0u8; 15],
        }
        .encode_to_vec();
        let values = vec![
            None,
            string_value(""),
            string_value("abc"),
            Some(FieldMapValueOneOf::EnumValue(0)),
            Some(FieldMapValueOneOf::EnumValue(-5)),
            packed(UUID_TYPE, vec![]),
            packed(UUID_TYPE, vec![0xFF; 3]),
            packed(UUID_TYPE, short_uuid),
            packed(TIMESTAMP_TYPE, vec![]),
            packed(DATE_TYPE, vec![]),
            packed(STRING_TYPE, vec![0xFF; 3]),
            packed(BOOL_TYPE, vec![0xFF; 3]),
            packed("fintekkers.models.util.UuidProto", vec![]),
            Some(FieldMapValueOneOf::FieldValuePacked(Any {
                type_url: String::new(),
                value: vec![0xFF; 3],
            })),
        ];
        for &field in &fields {
            for &operator in &operators {
                for value in &values {
                    if let Err(err) = parse_entry(&entry(field, operator, value.clone())) {
                        assert_eq!(err.field(), field, "{err}");
                        assert_eq!(err.operator(), operator, "{err}");
                        assert!(!err.to_string().is_empty());
                    }
                }
            }
        }
    }

    #[test]
    fn missing_value_and_wrong_type_url_are_errors() {
        let equals = PositionFilterOperator::Equals as i32;
        assert_eq!(
            parse_entry(&security_id_equals(None)),
            Err(FilterParseError::MissingValue {
                field: 53,
                operator: equals
            })
        );
        let wrong_url = packed(
            "fintekkers.models.util.UuidProto",
            UuidProto {
                raw_uuid: expected_uuid().as_bytes().to_vec(),
            }
            .encode_to_vec(),
        );
        assert!(matches!(
            parse_entry(&security_id_equals(wrong_url)),
            Err(FilterParseError::WrongValueKind {
                field: 53,
                operator: 1,
                ..
            })
        ));
    }

    #[test]
    fn packed_timestamp_and_dates_parse() {
        let equals = PositionFilterOperator::Equals as i32;
        let ts = LocalTimestampProto {
            timestamp: Some(prost_types::Timestamp {
                seconds: 1_791_763_200, // 2026-10-12T00:00:00Z
                nanos: 0,
            }),
            time_zone: "America/New_York".to_string(),
        };
        let from_packed = parse_entry(&entry(
            FieldProto::AsOf as i32,
            equals,
            packed(TIMESTAMP_TYPE, ts.encode_to_vec()),
        ))
        .unwrap();
        let from_string = parse_entry(&entry(
            FieldProto::AsOf as i32,
            equals,
            string_value("2026-10-12T00:00:00Z"),
        ))
        .unwrap();
        assert_eq!(from_packed.value, from_string.value);

        let date = LocalDateProto {
            year: 2030,
            month: 1,
            day: 1,
        };
        let expected = FilterValue::Date(NaiveDate::from_ymd_opt(2030, 1, 1).unwrap());
        for value in [
            packed(DATE_TYPE, date.encode_to_vec()),
            string_value("2030-01-01"),
        ] {
            let parsed =
                parse_entry(&entry(FieldProto::MaturityDate as i32, equals, value)).unwrap();
            assert_eq!(parsed.value, expected);
        }
        assert!(matches!(
            parse_entry(&entry(
                FieldProto::MaturityDate as i32,
                equals,
                string_value("2030-13-01")
            )),
            Err(FilterParseError::MalformedValue { .. })
        ));
    }

    #[test]
    fn empty_filter_parses_to_empty_vec() {
        assert_eq!(filter(vec![]).parse(), Ok(vec![]));
    }
}
