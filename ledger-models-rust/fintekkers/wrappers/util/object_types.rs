//! Object type and version (LM-297, LM-318).
//!
//! Every message that names its type carries `ObjectTypeProto object_type = 1`
//! and `VersionProto version = 2`. Writers call [`stamp`], which sets the type
//! and [`SCHEMA_VERSION`]; [`stamp_own`] passes the message's own type
//! (LM-320). Readers call [`read_type`] / [`read_version`]. The old
//! `object_class` / `version` strings were replaced in place by LM-318: bytes
//! written before it are not readable. See
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

/// The message's own ObjectTypeProto value (LM-320), for [`stamp_own`].
/// Every generated message that carries `object_type` implements it.
pub trait OwnObjectType: ObjectTyped {
    const OBJECT_TYPE: ObjectTypeProto;
}

/// Reads back what [`stamp_own`] wrote on a default instance: (type, version).
#[cfg(feature = "test-utils")]
pub type OwnTypeStamper = fn() -> (ObjectTypeProto, Option<Version>);

// One row per message with `object_type`: Rust type = proto full name =>
// its own ObjectTypeProto variant. A row implements ObjectTyped and
// OwnObjectType and adds the full name to own_type_by_full_name, so the three
// cannot drift. tests/object_type_coverage_test.rs fails when a message in
// the descriptor set has no row.
macro_rules! object_typed {
    ($($ty:path = $full_name:literal => $own:ident),* $(,)?) => {
        $(
            impl ObjectTyped for $ty {
                fn raw_object_type(&self) -> i32 { self.object_type }
                fn version_proto(&self) -> Option<&VersionProto> { self.version.as_ref() }
                fn set_raw_object_type(&mut self, object_type: i32) { self.object_type = object_type; }
                fn set_version_proto(&mut self, version: Option<VersionProto>) { self.version = version; }
            }

            impl OwnObjectType for $ty {
                const OBJECT_TYPE: ObjectTypeProto = ObjectTypeProto::$own;
            }
        )*

        /// The own ObjectTypeProto value of the message with this proto full
        /// name (e.g. `fintekkers.requests.price.CreatePriceResponseProto`,
        /// not the Rust path), or None when it carries no `object_type`.
        pub fn own_type_by_full_name(full_name: &str) -> Option<ObjectTypeProto> {
            match full_name {
                $($full_name => Some(ObjectTypeProto::$own),)*
                _ => None,
            }
        }

        /// Test helper (`test-utils` feature): one entry per row, keyed by
        /// proto full name. Each stamps a default instance with [`stamp_own`]
        /// and reads back its type and version.
        #[cfg(feature = "test-utils")]
        pub fn own_type_stampers() -> Vec<(&'static str, OwnTypeStamper)> {
            vec![$((
                $full_name,
                (|| {
                    let message = stamp_own(<$ty as Default>::default());
                    (read_type(&message), read_version(&message))
                }) as OwnTypeStamper,
            )),*]
        }
    };
}

object_typed! {
    crate::fintekkers::models::portfolio::PortfolioProto = "fintekkers.models.portfolio.PortfolioProto" => ObjectTypePortfolio,
    crate::fintekkers::models::position::PositionProto = "fintekkers.models.position.PositionProto" => ObjectTypePosition,
    crate::fintekkers::models::position::PositionFilterProto = "fintekkers.models.position.PositionFilterProto" => ObjectTypePositionFilter,
    crate::fintekkers::models::price::PriceProto = "fintekkers.models.price.PriceProto" => ObjectTypePrice,
    crate::fintekkers::models::security::IdentifierProto = "fintekkers.models.security.IdentifierProto" => ObjectTypeIdentifier,
    crate::fintekkers::models::security::SecurityProto = "fintekkers.models.security.SecurityProto" => ObjectTypeSecurity,
    crate::fintekkers::models::security::TenorProto = "fintekkers.models.security.TenorProto" => ObjectTypeTenor,
    crate::fintekkers::models::strategy::StrategyProto = "fintekkers.models.strategy.StrategyProto" => ObjectTypeStrategy,
    crate::fintekkers::models::strategy::StrategyAllocationProto = "fintekkers.models.strategy.StrategyAllocationProto" => ObjectTypeStrategyAllocation,
    crate::fintekkers::models::transaction::TransactionProto = "fintekkers.models.transaction.TransactionProto" => ObjectTypeTransaction,
    crate::fintekkers::requests::portfolio::CreatePortfolioRequestProto = "fintekkers.requests.portfolio.CreatePortfolioRequestProto" => ObjectTypeCreatePortfolioRequest,
    crate::fintekkers::requests::portfolio::QueryPortfolioRequestProto = "fintekkers.requests.portfolio.QueryPortfolioRequestProto" => ObjectTypeQueryPortfolioRequest,
    crate::fintekkers::requests::price::CreatePriceRequestProto = "fintekkers.requests.price.CreatePriceRequestProto" => ObjectTypeCreatePriceRequest,
    crate::fintekkers::requests::price::QueryPriceRequestProto = "fintekkers.requests.price.QueryPriceRequestProto" => ObjectTypeQueryPriceRequest,
    crate::fintekkers::requests::security::CreateSecurityRequestProto = "fintekkers.requests.security.CreateSecurityRequestProto" => ObjectTypeCreateSecurityRequest,
    crate::fintekkers::requests::security::QuerySecurityRequestProto = "fintekkers.requests.security.QuerySecurityRequestProto" => ObjectTypeQuerySecurityRequest,
    crate::fintekkers::requests::transaction::CreateTransactionRequestProto = "fintekkers.requests.transaction.CreateTransactionRequestProto" => ObjectTypeCreateTransactionRequest,
    crate::fintekkers::requests::transaction::QueryTransactionRequestProto = "fintekkers.requests.transaction.QueryTransactionRequestProto" => ObjectTypeQueryTransactionRequest,
    // LM-320: the rest of the messages with object_type.
    crate::fintekkers::models::security::bond::IssuanceProto = "fintekkers.models.security.bond.IssuanceProto" => ObjectTypeIssuance,
    crate::fintekkers::models::security::IndexCompositionProto = "fintekkers.models.security.IndexCompositionProto" => ObjectTypeIndexComposition,
    crate::fintekkers::models::util::DateRangeProto = "fintekkers.models.util.DateRangeProto" => ObjectTypeDateRange,
    crate::fintekkers::models::util::api::ApiKey = "fintekkers.models.util.api.API_Key" => ObjectTypeApiKey,
    crate::fintekkers::models::util::lock::NodeState = "fintekkers.models.util.lock.NodeState" => ObjectTypeNodeState,
    crate::fintekkers::models::util::lock::NodePartition = "fintekkers.models.util.lock.NodePartition" => ObjectTypeNodePartition,
    crate::fintekkers::requests::index_composition::CreateIndexCompositionRequestProto = "fintekkers.requests.index_composition.CreateIndexCompositionRequestProto" => ObjectTypeCreateIndexCompositionRequest,
    crate::fintekkers::requests::index_composition::CreateIndexCompositionResponseProto = "fintekkers.requests.index_composition.CreateIndexCompositionResponseProto" => ObjectTypeCreateIndexCompositionResponse,
    crate::fintekkers::requests::index_composition::GetIndexCompositionRequestProto = "fintekkers.requests.index_composition.GetIndexCompositionRequestProto" => ObjectTypeGetIndexCompositionRequest,
    crate::fintekkers::requests::index_composition::GetIndexCompositionResponseProto = "fintekkers.requests.index_composition.GetIndexCompositionResponseProto" => ObjectTypeGetIndexCompositionResponse,
    crate::fintekkers::requests::portfolio::CreatePortfolioResponseProto = "fintekkers.requests.portfolio.CreatePortfolioResponseProto" => ObjectTypeCreatePortfolioResponse,
    crate::fintekkers::requests::portfolio::QueryPortfolioResponseProto = "fintekkers.requests.portfolio.QueryPortfolioResponseProto" => ObjectTypeQueryPortfolioResponse,
    crate::fintekkers::requests::position::QueryPositionRequestProto = "fintekkers.requests.position.QueryPositionRequestProto" => ObjectTypeQueryPositionRequest,
    crate::fintekkers::requests::position::QueryPositionResponseProto = "fintekkers.requests.position.QueryPositionResponseProto" => ObjectTypeQueryPositionResponse,
    crate::fintekkers::requests::price::CreatePriceResponseProto = "fintekkers.requests.price.CreatePriceResponseProto" => ObjectTypeCreatePriceResponse,
    crate::fintekkers::requests::price::QueryPriceResponseProto = "fintekkers.requests.price.QueryPriceResponseProto" => ObjectTypeQueryPriceResponse,
    crate::fintekkers::requests::security::CreateSecurityResponseProto = "fintekkers.requests.security.CreateSecurityResponseProto" => ObjectTypeCreateSecurityResponse,
    crate::fintekkers::requests::security::QuerySecurityResponseProto = "fintekkers.requests.security.QuerySecurityResponseProto" => ObjectTypeQuerySecurityResponse,
    crate::fintekkers::requests::security::GetFieldsResponseProto = "fintekkers.requests.security.GetFieldsResponseProto" => ObjectTypeGetFieldsResponse,
    crate::fintekkers::requests::security::GetFieldValuesRequestProto = "fintekkers.requests.security.GetFieldValuesRequestProto" => ObjectTypeGetFieldValuesRequest,
    crate::fintekkers::requests::security::GetFieldValuesResponseProto = "fintekkers.requests.security.GetFieldValuesResponseProto" => ObjectTypeGetFieldValuesResponse,
    crate::fintekkers::requests::transaction::CreateTransactionResponseProto = "fintekkers.requests.transaction.CreateTransactionResponseProto" => ObjectTypeCreateTransactionResponse,
    crate::fintekkers::requests::transaction::QueryTransactionResponseProto = "fintekkers.requests.transaction.QueryTransactionResponseProto" => ObjectTypeQueryTransactionResponse,
    crate::fintekkers::requests::util::DeleteRequestProto = "fintekkers.requests.util.DeleteRequestProto" => ObjectTypeDeleteRequest,
    crate::fintekkers::requests::util::DeleteResponseProto = "fintekkers.requests.util.DeleteResponseProto" => ObjectTypeDeleteResponse,
    crate::fintekkers::requests::util::lock::LockRequestProto = "fintekkers.requests.util.lock.LockRequestProto" => ObjectTypeLockRequest,
    crate::fintekkers::requests::util::lock::LockResponseProto = "fintekkers.requests.util.lock.LockResponseProto" => ObjectTypeLockResponse,
    crate::fintekkers::requests::valuation::ValuationRequestProto = "fintekkers.requests.valuation.ValuationRequestProto" => ObjectTypeValuationRequest,
    crate::fintekkers::requests::valuation::ValuationResponseProto = "fintekkers.requests.valuation.ValuationResponseProto" => ObjectTypeValuationResponse,
    crate::fintekkers::requests::valuation::CurveRequestProto = "fintekkers.requests.valuation.CurveRequestProto" => ObjectTypeCurveRequest,
    crate::fintekkers::requests::valuation::CurveResponseProto = "fintekkers.requests.valuation.CurveResponseProto" => ObjectTypeCurveResponse,
}

/// Sets `object_type` and `version` ([`SCHEMA_VERSION`]) on `message`; returns it.
/// `object_type` is the message's own ObjectTypeProto value.
pub fn stamp<M: ObjectTyped>(mut message: M, object_type: ObjectTypeProto) -> M {
    let (major, minor, patch) = SCHEMA_VERSION;
    message.set_raw_object_type(object_type as i32);
    message.set_version_proto(Some(VersionProto { major, minor, patch }));
    message
}

/// [`stamp`] with the message's own ObjectTypeProto value (LM-320).
pub fn stamp_own<M: OwnObjectType>(message: M) -> M {
    stamp(message, M::OBJECT_TYPE)
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
    stamp_own(request)
}

/// The by-id lookup request the link resolvers send to the portfolio service.
pub(crate) fn query_portfolio_request(
    uu_ids: Vec<UuidProto>,
    as_of: Option<LocalTimestampProto>,
) -> QueryPortfolioRequestProto {
    let request = QueryPortfolioRequestProto { uu_ids, as_of, ..Default::default() };
    stamp_own(request)
}

/// The by-id lookup request the link resolvers send to the transaction service.
pub(crate) fn query_transaction_request(
    uu_ids: Vec<UuidProto>,
    as_of: Option<LocalTimestampProto>,
) -> QueryTransactionRequestProto {
    let request = QueryTransactionRequestProto { uu_ids, as_of, ..Default::default() };
    stamp_own(request)
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
