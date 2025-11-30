use crate::fintekkers::models::position::MeasureProto;
use tonic::{Code, Status};

#[derive(Debug)]
pub enum Error {
    MissingPositionInput,
    MissingPriceInput,
    MissingFaceValue,
    MissingCouponRate,
    MissingMaturityDate,
    MissingSecurityInput,
    MissingMeasure(MeasureProto),
    DecimalConversion,
    DateConversion,
    UuidError,
    DeserializationError,
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
            _ => Status::new(Code::InvalidArgument, format!("{:?}", value)),
        }
    }
}
