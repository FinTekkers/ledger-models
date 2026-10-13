//! Object type and version (LM-297, LM-318).
//!
//! Every message that names its type carries `ObjectTypeProto object_type = 1`
//! and `VersionProto version = 2`. Writers call [`stamp`], which sets the type
//! and [`SCHEMA_VERSION`]. Readers call [`read_type`] / [`read_version`]. The
//! old `object_class` / `version` strings were replaced in place by LM-318:
//! bytes written before it are not readable. See
//! docs/adr/compact_object_type_and_version.md.

use crate::fintekkers::models::util::{LocalTimestampProto, ObjectTypeProto, UuidProto, VersionProto};
use crate::fintekkers::requests::portfolio::QueryPortfolioRequestProto;
use crate::fintekkers::requests::security::QuerySecurityRequestProto;
use crate::fintekkers::requests::transaction::QueryTransactionRequestProto;

/// (major, minor, patch).
pub type Version = (u32, u32, u32);

/// The schema version [`stamp`] writes. Not the library release.
pub const SCHEMA_VERSION: Version = (0, 0, 1);

/// A generated message that carries `object_type` and `version`.
pub trait ObjectTyped {
    /// The raw `object_type` number, which may be newer than this enum.
    fn raw_object_type(&self) -> i32;
    fn version_proto(&self) -> Option<&VersionProto>;
    fn set_raw_object_type(&mut self, object_type: i32);
    fn set_version_proto(&mut self, version: Option<VersionProto>);
}

macro_rules! object_typed {
    ($($ty:path),* $(,)?) => {$(
        impl ObjectTyped for $ty {
            fn raw_object_type(&self) -> i32 { self.object_type }
            fn version_proto(&self) -> Option<&VersionProto> { self.version.as_ref() }
            fn set_raw_object_type(&mut self, object_type: i32) { self.object_type = object_type; }
            fn set_version_proto(&mut self, version: Option<VersionProto>) { self.version = version; }
        }
    )*};
}

object_typed! {
    crate::fintekkers::models::portfolio::PortfolioProto,
    crate::fintekkers::models::position::PositionProto,
    crate::fintekkers::models::position::PositionFilterProto,
    crate::fintekkers::models::price::PriceProto,
    crate::fintekkers::models::security::IdentifierProto,
    crate::fintekkers::models::security::SecurityProto,
    crate::fintekkers::models::security::TenorProto,
    crate::fintekkers::models::strategy::StrategyProto,
    crate::fintekkers::models::strategy::StrategyAllocationProto,
    crate::fintekkers::models::transaction::TransactionProto,
    crate::fintekkers::requests::portfolio::CreatePortfolioRequestProto,
    crate::fintekkers::requests::portfolio::QueryPortfolioRequestProto,
    crate::fintekkers::requests::price::CreatePriceRequestProto,
    crate::fintekkers::requests::price::QueryPriceRequestProto,
    crate::fintekkers::requests::security::CreateSecurityRequestProto,
    crate::fintekkers::requests::security::QuerySecurityRequestProto,
    crate::fintekkers::requests::transaction::CreateTransactionRequestProto,
    crate::fintekkers::requests::transaction::QueryTransactionRequestProto,
}

/// Sets `object_type` and `version` ([`SCHEMA_VERSION`]) on `message`; returns it.
/// `object_type` is the message's own ObjectTypeProto value.
pub fn stamp<M: ObjectTyped>(mut message: M, object_type: ObjectTypeProto) -> M {
    let (major, minor, patch) = SCHEMA_VERSION;
    message.set_raw_object_type(object_type as i32);
    message.set_version_proto(Some(VersionProto { major, minor, patch }));
    message
}

/// The message's ObjectTypeProto value. Unset, or a number newer than this
/// enum, reads as `ObjectTypeUnknown`.
pub fn read_type<M: ObjectTyped + ?Sized>(message: &M) -> ObjectTypeProto {
    ObjectTypeProto::from_i32(message.raw_object_type()).unwrap_or(ObjectTypeProto::ObjectTypeUnknown)
}

/// The message's (major, minor, patch), or None when `version` is absent.
pub fn read_version<M: ObjectTyped + ?Sized>(message: &M) -> Option<Version> {
    message.version_proto().map(|v| (v.major, v.minor, v.patch))
}

/// The by-id lookup request the link resolvers send to the security service.
pub(crate) fn query_security_request(
    uu_ids: Vec<UuidProto>,
    as_of: Option<LocalTimestampProto>,
) -> QuerySecurityRequestProto {
    let request = QuerySecurityRequestProto { uu_ids, as_of, ..Default::default() };
    stamp(request, ObjectTypeProto::ObjectTypeQuerySecurityRequest)
}

/// The by-id lookup request the link resolvers send to the portfolio service.
pub(crate) fn query_portfolio_request(
    uu_ids: Vec<UuidProto>,
    as_of: Option<LocalTimestampProto>,
) -> QueryPortfolioRequestProto {
    let request = QueryPortfolioRequestProto { uu_ids, as_of, ..Default::default() };
    stamp(request, ObjectTypeProto::ObjectTypeQueryPortfolioRequest)
}

/// The by-id lookup request the link resolvers send to the transaction service.
pub(crate) fn query_transaction_request(
    uu_ids: Vec<UuidProto>,
    as_of: Option<LocalTimestampProto>,
) -> QueryTransactionRequestProto {
    let request = QueryTransactionRequestProto { uu_ids, as_of, ..Default::default() };
    stamp(request, ObjectTypeProto::ObjectTypeQueryTransactionRequest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fintekkers::models::price::PriceProto;
    use prost::Message;

    /// Field numbers present at the top level of an encoded message.
    fn top_level_field_numbers(data: &[u8]) -> Vec<u64> {
        let mut numbers = vec![];
        let mut i = 0;
        let varint = |i: &mut usize| -> u64 {
            let (mut result, mut shift) = (0u64, 0);
            loop {
                let b = data[*i];
                *i += 1;
                result |= ((b & 0x7f) as u64) << shift;
                shift += 7;
                if b & 0x80 == 0 {
                    return result;
                }
            }
        };
        while i < data.len() {
            let key = varint(&mut i);
            numbers.push(key >> 3);
            match key & 7 {
                0 => {
                    varint(&mut i);
                }
                1 => i += 8,
                2 => {
                    let len = varint(&mut i) as usize;
                    i += len;
                }
                5 => i += 4,
                other => panic!("unexpected wire type {other}"),
            }
        }
        numbers
    }

    #[test]
    fn stamp_round_trips_type_and_version() {
        let price = stamp(PriceProto::default(), ObjectTypeProto::ObjectTypePrice);
        let data = price.encode_to_vec();
        // Fields 1 and 2 only: nothing at the removed 1001-1004.
        assert_eq!(top_level_field_numbers(&data), vec![1, 2]);
        let reread = PriceProto::decode(data.as_slice()).unwrap();
        assert_eq!(read_type(&reread), ObjectTypeProto::ObjectTypePrice);
        assert_eq!(read_version(&reread), Some((0, 0, 1)));
        assert_eq!(reread, price);
    }

    #[test]
    fn an_unstamped_message_reads_as_unknown_and_absent() {
        let price = PriceProto::decode(PriceProto::default().encode_to_vec().as_slice()).unwrap();
        assert_eq!(read_type(&price), ObjectTypeProto::ObjectTypeUnknown);
        assert_eq!(read_version(&price), None);
    }

    #[test]
    fn a_newer_object_type_reads_as_unknown() {
        let price = PriceProto { object_type: 9999, ..Default::default() };
        assert_eq!(read_type(&price), ObjectTypeProto::ObjectTypeUnknown);
    }

    #[test]
    fn bytes_from_v0_4_33_are_not_readable() {
        // Written by ledger-models v0.4.33: object_class "Price" and version
        // "0.0.1" as strings in fields 1 and 2 (LM-318 metric 3).
        let old = include_bytes!("../../../../ledger-models-protos/fixtures/legacy_v0433/price.bin");
        assert!(PriceProto::decode(old.as_slice()).is_err());
    }

    #[test]
    fn library_writers_stamp_type_and_schema_version() {
        use crate::fintekkers::wrappers::models::portfolio::PortfolioProtoBuilder;
        use crate::fintekkers::wrappers::models::price::PriceProtoBuilder;
        use crate::fintekkers::wrappers::models::security::SecurityProtoBuilder;
        use rust_decimal::Decimal;

        fn check<M: ObjectTyped>(writer: &str, message: &M, object_type: ObjectTypeProto) {
            assert_eq!(read_type(message), object_type, "{writer}");
            assert_eq!(read_version(message), Some(SCHEMA_VERSION), "{writer}");
        }

        let security = SecurityProtoBuilder::new().build().unwrap();
        check("SecurityProtoBuilder", &security, ObjectTypeProto::ObjectTypeSecurity);
        let price = PriceProtoBuilder::new()
            .price(Decimal::ONE.into())
            .security(security.clone())
            .build()
            .unwrap();
        check("PriceProtoBuilder", &price, ObjectTypeProto::ObjectTypePrice);
        let portfolio = PortfolioProtoBuilder::new().build().unwrap();
        check("PortfolioProtoBuilder", &portfolio, ObjectTypeProto::ObjectTypePortfolio);

        let uu_ids = vec![UuidProto { raw_uuid: vec![1; 16] }];
        check(
            "query_security_request",
            &query_security_request(uu_ids.clone(), None),
            ObjectTypeProto::ObjectTypeQuerySecurityRequest,
        );
        check(
            "query_portfolio_request",
            &query_portfolio_request(uu_ids.clone(), None),
            ObjectTypeProto::ObjectTypeQueryPortfolioRequest,
        );
        check(
            "query_transaction_request",
            &query_transaction_request(uu_ids, None),
            ObjectTypeProto::ObjectTypeQueryTransactionRequest,
        );
    }
}
