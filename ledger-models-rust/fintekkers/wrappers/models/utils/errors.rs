use crate::fintekkers::models::position::MeasureProto;
use crate::fintekkers::requests::util::errors::FieldViolationProto;
use crate::fintekkers::wrappers::models::utils::date::ParseError;
use tonic::{Code, Status};

#[derive(Debug)]
pub enum Error {
    MissingPositionInput,
    MissingPriceInput,
    MissingFaceValue,
    MissingCouponRate,
    MissingMaturityDate,
    MissingIssueDate,
    NotABondSecurity,
    MissingSecurityInput,
    MissingBaseCpi,
    MissingCurrentCpi,
    MissingMeasure(MeasureProto),
    DecimalConversion,
    DateConversion,
    UuidError,
    DeserializationError,
    /// Typed input error (docs/adr/typed-input-errors.md): the object has one
    /// or more bad fields. Never empty. Maps to `Code::InvalidArgument`.
    Validation(Vec<FieldViolationProto>),
}

impl Error {
    /// Field-level violations of a `Validation` error; empty for other variants.
    pub fn violations(&self) -> &[FieldViolationProto] {
        match self {
            Error::Validation(v) => v,
            _ => &[],
        }
    }
}

/// Joins violations as `<field>: <message> (id <uuid>)`, separated by `; `,
/// the same shape as Java's ModelValidationException message.
fn describe_violations(violations: &[FieldViolationProto]) -> String {
    violations
        .iter()
        .map(|v| {
            let id = v
                .object_id
                .as_ref()
                .and_then(|u| uuid::Uuid::from_slice(&u.raw_uuid).ok())
                .map(|u| u.to_string())
                .unwrap_or_else(|| "null".to_string());
            format!("{}: {} (id {})", v.field, v.message, id)
        })
        .collect::<Vec<_>>()
        .join("; ")
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::Validation(v) => f.write_str(&describe_violations(v)),
            other => write!(f, "{:?}", other),
        }
    }
}

impl From<ParseError> for Error {
    fn from(_: ParseError) -> Self {
        Error::DateConversion
    }
}

impl From<Error> for Status {
    fn from(value: Error) -> Self {
        match value {
            Error::DateConversion => Status::new(Code::Internal, "Failed to convert date"),
            Error::DecimalConversion => Status::new(Code::Internal, "Failed to convert decimal"),
            Error::DeserializationError => Status::new(Code::Internal, "Failed to deserialize protobuf message"),
            Error::MissingMeasure(m) => Status::new(
                Code::Internal,
                format!("Missing measure {}", m.as_str_name()),
            ),
            Error::Validation(v) => Status::new(Code::InvalidArgument, describe_violations(&v)),
            _ => Status::new(Code::InvalidArgument, format!("{:?}", value)),
        }
    }
}
