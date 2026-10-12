use crate::fintekkers::models::position::MeasureProto;
use crate::fintekkers::models::util::UuidProto;
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

    /// Labels a `Validation` error with the field the caller decoded it from,
    /// e.g. `deserialize_decimal(p).map_err(|e| e.in_field("price"))`. Every
    /// violation is prefixed: an empty field becomes `name`, a field `f`
    /// becomes `name.f`. Other variants are returned unchanged.
    pub fn in_field(self, name: &str) -> Error {
        match self {
            Error::Validation(violations) => Error::Validation(
                violations
                    .into_iter()
                    .map(|mut v| {
                        v.field = if v.field.is_empty() {
                            name.to_string()
                        } else {
                            format!("{}.{}", name, v.field)
                        };
                        v
                    })
                    .collect(),
            ),
            other => other,
        }
    }
}

/// The `object_id` for a violation: the object's UUID, or None when it has
/// none or it is not 16 bytes. Shared by the `validate_*` rules.
pub(crate) fn object_id_of(uuid: Option<&UuidProto>) -> Option<UuidProto> {
    uuid.filter(|u| u.raw_uuid.len() == 16).cloned()
}

/// Joins violations as `<field>: <message> (id <uuid>)`, separated by `; `,
/// the same shape as Java's ModelValidationException message. A violation
/// with no field (an unlabelled decode error) is `<message> (id <uuid>)`.
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
            if v.field.is_empty() {
                format!("{} (id {})", v.message, id)
            } else {
                format!("{}: {} (id {})", v.field, v.message, id)
            }
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
