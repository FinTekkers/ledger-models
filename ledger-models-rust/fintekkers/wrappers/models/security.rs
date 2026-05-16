use crate::fintekkers::models::security::{IdentifierProto, IdentifierTypeProto, SecurityProto, ProductTypeProto};
use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto};
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use chrono::{DateTime, Utc};
use uuid::Uuid;

//Imports below are for RawDataModelObject related macro. IDE might not complain if you remove
//them but will fail at compile time
use crate::fintekkers::wrappers::models::raw_datamodel_object::RawDataModelObject;
use crate::raw_data_model_object_trait;
use prost::Message;

pub struct SecurityWrapper {
    pub proto: SecurityProto,
}

impl SecurityWrapper {
    pub fn new(proto: SecurityProto) -> Self {
        SecurityWrapper { proto }
    }

    pub fn uuid_wrapper(&self) -> UUIDWrapper {
        UUIDWrapper::new(self.proto.uuid.as_ref().unwrap().clone())
    }

    /// True iff the wrapped proto is a link reference (is_link=true).
    /// When true, only `uuid` (and optionally `as_of`) is meaningful;
    /// other accessors panic to force resolution via SecurityService.
    /// See docs/adr/is_link_pattern.md.
    pub fn is_link(&self) -> bool {
        self.proto.is_link
    }

    fn assert_not_link(&self, accessor: &str) {
        if self.proto.is_link {
            panic!(
                "Cannot read {} on a link-mode SecurityWrapper (is_link=true). \
                 Resolve via SecurityService::get_by_ids first. \
                 See docs/adr/is_link_pattern.md.",
                accessor
            );
        }
    }

    /// Returns the product_type i32; panics if this is a link.
    pub fn product_type_i32(&self) -> i32 {
        self.assert_not_link("product_type");
        self.proto.product_type
    }

    pub fn asset_class(&self) -> &str {
        self.assert_not_link("asset_class");
        &self.proto.asset_class
    }

    pub fn issuer_name(&self) -> &str {
        self.assert_not_link("issuer_name");
        &self.proto.issuer_name
    }

    /// All identifiers attached to this security. The first entry is the
    /// primary identifier (CUSIP for US Treasuries, ISIN for Gilts, ...);
    /// secondary identifiers follow. Empty when no identifiers are set.
    pub fn identifiers(&self) -> Vec<&IdentifierProto> {
        self.assert_not_link("identifiers");
        self.proto.identifiers.iter().collect()
    }

    /// Find the first identifier matching the given type. Returns `None`
    /// when no identifier of that type is attached.
    pub fn identifier_by_type(&self, ty: IdentifierTypeProto) -> Option<&IdentifierProto> {
        self.assert_not_link("identifier_by_type");
        self.proto
            .identifiers
            .iter()
            .find(|i| i.identifier_type == ty as i32)
    }

    /// Time-based soft-delete check. A Security is considered deleted iff
    /// it carries a non-`None` `valid_to` that has already elapsed at
    /// `as_of`. A future-dated `valid_to` means the row is still live
    /// today and becomes deleted automatically when `as_of` catches up.
    /// A `None` `valid_to` is always active.
    ///
    /// Canonical soft-delete check across the platform — the predecessor
    /// `SecurityProto.deleted_at` field has been removed (tag 15
    /// reserved). See `/specs/soft-delete-validto-collapse.md`
    /// (FinTekkers/second-brain#316).
    pub fn is_deleted(&self, as_of: DateTime<Utc>) -> bool {
        match self.proto.valid_to.as_ref() {
            None => false,
            Some(ts) => {
                let wrapper = LocalTimestampWrapper::new(ts.clone());
                let valid_to: DateTime<Utc> = (&wrapper).into();
                valid_to < as_of
            }
        }
    }

    /// Convenience: `is_deleted(Utc::now())`.
    pub fn is_deleted_now(&self) -> bool {
        self.is_deleted(Utc::now())
    }
}

fn uuid_proto_from(uuid: Uuid) -> UuidProto {
    UuidProto { raw_uuid: uuid.as_bytes().to_vec() }
}

/// Build a SecurityProto link reference (is_link=true) with the given uuid and
/// as_of populated. Use this whenever you embed a Security inside another
/// message that itself carries an as_of (Position, Transaction, Price, etc.) —
/// the link MUST carry the same as_of as the parent so the resolver hydrates
/// the correct point-in-time vintage. See docs/adr/is_link_pattern.md.
///
/// `as_of` is required; for the rare "always-latest" case use
/// [`link_of_latest`].
pub fn link_of(uuid: Uuid, as_of: LocalTimestampProto) -> SecurityProto {
    SecurityProto {
        is_link: true,
        uuid: Some(uuid_proto_from(uuid)),
        as_of: Some(as_of),
        ..Default::default()
    }
}

/// Build a SecurityProto link reference (is_link=true) with only uuid set.
/// Resolution returns the latest version of the record. Explicit escape hatch
/// for floats — most callers should prefer [`link_of`].
pub fn link_of_latest(uuid: Uuid) -> SecurityProto {
    SecurityProto {
        is_link: true,
        uuid: Some(uuid_proto_from(uuid)),
        ..Default::default()
    }
}

raw_data_model_object_trait!(SecurityWrapper);

impl PartialEq for SecurityWrapper {
    fn eq(&self, other: &Self) -> bool {
        self.proto.uuid.as_ref() == other.proto.uuid.as_ref()
    }
}
impl Eq for SecurityWrapper {}

pub struct SecurityProtoBuilder {
    as_of: LocalTimestampWrapper,
    valid_from: LocalTimestampWrapper,
    valid_to: Option<LocalTimestampWrapper>,

    object_class: String,
    version: String,
    is_link: bool,

    uuid: UUIDWrapper,
    product_type: ProductTypeProto,
    asset_class: String,
    issuer_name: String,
    settlement_currency: String,
}

impl SecurityProtoBuilder {
    pub fn new() -> Self {
        Self {
            as_of: LocalTimestampWrapper::now(),
            valid_from: LocalTimestampWrapper::now(),
            valid_to: None,
            //This is currently hardcoded, this will change in future versions
            object_class: "Security".to_string(),
            //The version is hardcoded, this will change in future versions
            version: "0.0.1".to_string(),
            is_link: false,
            uuid: UUIDWrapper::new_random(),
            product_type: ProductTypeProto::ProductTypeUnknown,
            asset_class: "Unknown".to_string(),
            issuer_name: "Unknown Issue".to_string(),
            settlement_currency: String::new(),
        }
    }

    pub fn as_of(mut self, as_of: LocalTimestampWrapper) -> Self {
        self.as_of = as_of.into();
        self
    }

    pub fn valid_from(mut self, valid_from: LocalTimestampWrapper) -> Self {
        self.valid_from = valid_from.into();
        self
    }

    pub fn valid_to(mut self, valid_to: LocalTimestampWrapper) -> Self {
        self.valid_to = valid_to.into();
        self
    }

    pub fn object_class(mut self, object_class: String) -> Self {
        self.object_class = object_class;
        self
    }

    pub fn version(mut self, version: String) -> Self {
        self.version = version;
        self
    }

    pub fn is_link(mut self, is_link: bool) -> Self {
        self.is_link = is_link;
        self
    }

    pub fn uuid(mut self, uuid: UUIDWrapper) -> Self {
        self.uuid = uuid;
        self
    }

    pub fn product_type(mut self, product_type: ProductTypeProto) -> Self {
        self.product_type = product_type;
        self
    }

    pub fn asset_class(mut self, asset_class: String) -> Self {
        self.asset_class = asset_class;
        self
    }

    pub fn issuer_name(mut self, issuer_name: String) -> Self {
        self.issuer_name = issuer_name;
        self
    }

    pub fn settlement_currency(mut self, settlement_currency: String) -> Self {
        self.settlement_currency = settlement_currency;
        self
    }

    pub fn build(self) -> Result<SecurityProto, Error> {
        let valid_to = match self.valid_to {
            Some(..) => Some(self.valid_to.unwrap().proto),
            None => None,
        };

        Ok(SecurityProto {
            as_of: Some(self.as_of.into()),
            valid_from: Some(self.valid_from.into()),
            valid_to,

            object_class: self.object_class,
            version: self.version,
            is_link: self.is_link,

            uuid: Some(self.uuid.into()),
            product_type: self.product_type.into(),
            instrument_type: 0,
            legs: vec![],
            asset_class: self.asset_class,
            issuer_name: self.issuer_name,
            // The settlement currency's code lives in CashDetailsProto on the
            // non_bond_details oneof.
            settlement_currency: if self.settlement_currency.is_empty() {
                None
            } else {
                use crate::fintekkers::models::security::{CashDetailsProto};
                use crate::fintekkers::models::security::security_proto::NonBondDetails;
                Some(Box::new(SecurityProto {
                    uuid: Some(UUIDWrapper::new_random().into()),
                    product_type: ProductTypeProto::Currency.into(),
                    non_bond_details: Some(NonBondDetails::CashDetails(CashDetailsProto {
                        cash_id: self.settlement_currency,
                    })),
                    ..Default::default()
                }))
            },

            quantity_type: 0,
            description: "".to_string(),
            identifiers: vec![],

            bond_details: None,
            tips_extension: None,
            frn_extension: None,
            mbs_extension: None,
            non_bond_details: None,
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::fintekkers::models::security::security_proto::NonBondDetails;
    use crate::fintekkers::models::security::{
        BondDetailsProto, TipsExtensionProto, FrnExtensionProto,
        IndexDetailsProto, CashDetailsProto, EquityDetailsProto,
        CouponTypeProto, CouponFrequencyProto,
    };
    use crate::fintekkers::models::security::index::IndexTypeProto;
    use crate::fintekkers::models::util::DecimalValueProto;
    use crate::fintekkers::models::util::LocalDateProto;

    fn decimal(value: &str) -> Option<DecimalValueProto> {
        Some(DecimalValueProto {
            arbitrary_precision_value: value.to_string(),
        })
    }

    fn date(year: u32, month: u32, day: u32) -> Option<LocalDateProto> {
        Some(LocalDateProto { year, month, day })
    }

    fn round_trip(proto: &SecurityProto) -> SecurityProto {
        let bytes = proto.encode_to_vec();
        SecurityProto::decode(bytes.as_slice()).unwrap()
    }

    #[test]
    fn test_proto_to_date() {
        let result = SecurityProtoBuilder::new()
            .settlement_currency("CAD".to_string())
            .asset_class("Asset Class".to_string())
            .build()
            .unwrap();

        assert!(result.asset_class.contains("Asset"));
    }

    fn cash_id_of(currency: &SecurityProto) -> &str {
        // Cash currency code lives in CashDetailsProto on the non_bond_details oneof.
        match currency.non_bond_details.as_ref() {
            Some(NonBondDetails::CashDetails(cd)) => &cd.cash_id,
            _ => "",
        }
    }

    #[test]
    fn test_settlement_currency_passed_through() {
        let result = SecurityProtoBuilder::new()
            .settlement_currency("USD".to_string())
            .build()
            .unwrap();

        let currency = result.settlement_currency.expect("settlement_currency should be Some");
        assert_eq!(currency.product_type, ProductTypeProto::Currency as i32);
        assert_eq!(cash_id_of(&currency), "USD");
    }

    #[test]
    fn test_settlement_currency_none_when_empty() {
        let result = SecurityProtoBuilder::new()
            .build()
            .unwrap();

        assert!(result.settlement_currency.is_none());
    }

    #[test]
    fn test_settlement_currency_round_trip() {
        let result = SecurityProtoBuilder::new()
            .settlement_currency("BTC".to_string())
            .build()
            .unwrap();

        let parsed = round_trip(&result);
        let currency = parsed.settlement_currency.expect("settlement_currency should survive round-trip");
        assert_eq!(currency.product_type, ProductTypeProto::Currency as i32);
        assert_eq!(cash_id_of(&currency), "BTC");
        assert!(currency.uuid.is_some(), "uuid should survive round-trip");
    }

    #[test]
    fn test_bond_details_round_trip() {
        let proto = SecurityProto {
            product_type: ProductTypeProto::TreasuryNote as i32,
            asset_class: "Fixed Income".to_string(),
            bond_details: Some(BondDetailsProto {
                coupon_rate: decimal("5.0"),
                coupon_type: CouponTypeProto::Fixed as i32,
                coupon_frequency: CouponFrequencyProto::Semiannually as i32,
                face_value: decimal("1000"),
                issue_date: date(2020, 1, 15),
                dated_date: date(2020, 1, 15),
                maturity_date: date(2030, 1, 15),
                issuance_info: vec![],
            }),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        let bond = parsed.bond_details.expect("bond_details must round-trip");
        assert_eq!(bond.coupon_rate.as_ref().unwrap().arbitrary_precision_value, "5.0");
        assert_eq!(bond.coupon_type, CouponTypeProto::Fixed as i32);
        assert_eq!(bond.maturity_date.as_ref().unwrap().year, 2030);
        assert_eq!(bond.face_value.as_ref().unwrap().arbitrary_precision_value, "1000");
        assert!(parsed.tips_extension.is_none(), "non-TIPS must not populate tips_extension");
        assert!(parsed.frn_extension.is_none(), "non-FRN must not populate frn_extension");
    }

    #[test]
    fn test_tips_round_trip_uses_bond_details_plus_tips_extension() {
        // TIPS carries shared bond fields in bond_details AND TIPS-specific
        // extras in tips_extension. Both co-exist.
        let proto = SecurityProto {
            product_type: ProductTypeProto::Tips as i32,
            bond_details: Some(BondDetailsProto {
                coupon_rate: decimal("0.625"),
                coupon_type: CouponTypeProto::Fixed as i32,
                coupon_frequency: CouponFrequencyProto::Semiannually as i32,
                face_value: decimal("1000"),
                issue_date: None,
                dated_date: None,
                maturity_date: date(2030, 1, 15),
                issuance_info: vec![],
            }),
            tips_extension: Some(TipsExtensionProto {
                base_cpi: decimal("256.394"),
                index_date: date(2020, 1, 1),
                inflation_index_type: IndexTypeProto::CpiU as i32,
            }),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        let bond = parsed.bond_details.expect("bond_details must round-trip on TIPS");
        assert_eq!(bond.coupon_rate.as_ref().unwrap().arbitrary_precision_value, "0.625");
        let tips = parsed.tips_extension.expect("tips_extension must round-trip");
        assert_eq!(tips.base_cpi.as_ref().unwrap().arbitrary_precision_value, "256.394");
        assert_eq!(tips.inflation_index_type, IndexTypeProto::CpiU as i32);
        assert!(parsed.frn_extension.is_none());
    }

    #[test]
    fn test_frn_round_trip_uses_bond_details_plus_frn_extension() {
        let proto = SecurityProto {
            product_type: ProductTypeProto::TreasuryFrn as i32,
            bond_details: Some(BondDetailsProto {
                coupon_rate: None,
                coupon_type: CouponTypeProto::Float as i32,
                coupon_frequency: CouponFrequencyProto::Quarterly as i32,
                face_value: decimal("100"),
                issue_date: None,
                dated_date: None,
                maturity_date: date(2028, 1, 15),
                issuance_info: vec![],
            }),
            frn_extension: Some(FrnExtensionProto {
                spread: decimal("50"),
                reference_rate_index: IndexTypeProto::TBill13Week as i32,
                reset_frequency: CouponFrequencyProto::Quarterly as i32,
            }),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        let bond = parsed.bond_details.expect("bond_details must round-trip on FRN");
        assert_eq!(bond.maturity_date.as_ref().unwrap().year, 2028);
        let frn = parsed.frn_extension.expect("frn_extension must round-trip");
        assert_eq!(frn.spread.as_ref().unwrap().arbitrary_precision_value, "50");
        assert_eq!(frn.reference_rate_index, IndexTypeProto::TBill13Week as i32);
        assert_eq!(frn.reset_frequency, CouponFrequencyProto::Quarterly as i32);
        assert!(parsed.tips_extension.is_none());
    }

    #[test]
    fn test_non_bond_details_index_round_trip() {
        let proto = SecurityProto {
            product_type: ProductTypeProto::EquityIndex as i32,
            non_bond_details: Some(NonBondDetails::IndexDetails(IndexDetailsProto {
                index_type: IndexTypeProto::CpiU as i32,
                constituents: vec![],
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.non_bond_details {
            Some(NonBondDetails::IndexDetails(idx)) => {
                assert_eq!(idx.index_type, IndexTypeProto::CpiU as i32);
            }
            other => panic!("Expected IndexDetails, got {:?}", other),
        }
        assert!(parsed.bond_details.is_none(), "non-bond must not populate bond_details");
    }

    #[test]
    fn test_non_bond_details_cash_round_trip() {
        let proto = SecurityProto {
            product_type: ProductTypeProto::Currency as i32,
            non_bond_details: Some(NonBondDetails::CashDetails(CashDetailsProto {
                cash_id: "USD".to_string(),
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.non_bond_details {
            Some(NonBondDetails::CashDetails(cash)) => {
                assert_eq!(cash.cash_id, "USD");
            }
            other => panic!("Expected CashDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_non_bond_details_equity_round_trip() {
        let proto = SecurityProto {
            product_type: ProductTypeProto::CommonStock as i32,
            non_bond_details: Some(NonBondDetails::EquityDetails(EquityDetailsProto {})),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.non_bond_details {
            Some(NonBondDetails::EquityDetails(_)) => {}
            other => panic!("Expected EquityDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_no_structured_set_returns_none() {
        // Sanity: a SecurityProto with no product_details populated round-trips
        // with bond_details / extensions / non_bond_details all None.
        let proto = SecurityProto {
            product_type: ProductTypeProto::TreasuryNote as i32,
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        assert!(parsed.bond_details.is_none());
        assert!(parsed.tips_extension.is_none());
        assert!(parsed.frn_extension.is_none());
        assert!(parsed.non_bond_details.is_none());
    }

    #[test]
    fn test_get_valid_from_reads_proto() {
        use crate::fintekkers::models::util::LocalTimestampProto;
        use prost_types::Timestamp;

        let ts = LocalTimestampProto {
            timestamp: Some(Timestamp { seconds: 1_000_000, nanos: 0 }),
            time_zone: "UTC".to_string(),
        };
        let proto = SecurityProtoBuilder::new()
            .valid_from(LocalTimestampWrapper::new(ts.clone()))
            .build()
            .unwrap();
        let wrapper = SecurityWrapper::new(proto);

        let valid_from = wrapper.get_valid_from();
        let from_seconds = valid_from.proto.timestamp.as_ref().unwrap().seconds;
        assert_eq!(from_seconds, 1_000_000);
    }

    #[test]
    fn test_get_valid_to_returns_none_when_unset() {
        let proto = SecurityProtoBuilder::new().build().unwrap();
        let wrapper = SecurityWrapper::new(proto);

        assert!(wrapper.get_valid_to().is_none());
    }

    #[test]
    fn test_get_valid_to_reads_proto_when_set() {
        use crate::fintekkers::models::util::LocalTimestampProto;
        use prost_types::Timestamp;

        let ts = LocalTimestampProto {
            timestamp: Some(Timestamp { seconds: 2_000_000, nanos: 0 }),
            time_zone: "America/New_York".to_string(),
        };
        let proto = SecurityProtoBuilder::new()
            .valid_to(LocalTimestampWrapper::new(ts.clone()))
            .build()
            .unwrap();
        let wrapper = SecurityWrapper::new(proto);

        let valid_to = wrapper.get_valid_to();
        assert!(valid_to.is_some());
        let to_seconds = valid_to.unwrap().proto.timestamp.as_ref().unwrap().seconds;
        assert_eq!(to_seconds, 2_000_000);
    }

    // ---- Phase A (second-brain#316): canonical soft-delete check ----
    // SecurityProto.deleted_at is removed (tag 15 reserved); the time-based
    // is_deleted(as_of) check on valid_to is the single source of truth.

    fn ts_at(seconds: i64) -> LocalTimestampWrapper {
        use crate::fintekkers::models::util::LocalTimestampProto;
        use prost_types::Timestamp;
        LocalTimestampWrapper::new(LocalTimestampProto {
            timestamp: Some(Timestamp { seconds, nanos: 0 }),
            time_zone: "UTC".to_string(),
        })
    }

    #[test]
    fn is_deleted_null_valid_to_returns_false() {
        let proto = SecurityProtoBuilder::new().build().unwrap();
        let wrapper = SecurityWrapper::new(proto);
        assert!(!wrapper.is_deleted(Utc::now()));
        assert!(!wrapper.is_deleted_now());
    }

    #[test]
    fn is_deleted_past_valid_to_returns_true() {
        let proto = SecurityProtoBuilder::new()
            .valid_to(ts_at(1_000_000_000)) // 2001-09-09
            .build()
            .unwrap();
        let wrapper = SecurityWrapper::new(proto);
        assert!(wrapper.is_deleted_now());
    }

    #[test]
    fn is_deleted_future_valid_to_returns_false() {
        let future_seconds = Utc::now().timestamp() + 86_400; // tomorrow
        let proto = SecurityProtoBuilder::new()
            .valid_to(ts_at(future_seconds))
            .build()
            .unwrap();
        let wrapper = SecurityWrapper::new(proto);
        assert!(!wrapper.is_deleted_now());

        // Becomes deleted once as_of catches up.
        let later = Utc::now() + chrono::Duration::seconds(86_401);
        assert!(wrapper.is_deleted(later));
    }

    #[test]
    fn is_deleted_as_of_switches_answer() {
        use chrono::TimeZone;
        // valid_to = 2026-01-01 UTC
        let cutoff_seconds = Utc.with_ymd_and_hms(2026, 1, 1, 0, 0, 0).unwrap().timestamp();
        let proto = SecurityProtoBuilder::new()
            .valid_to(ts_at(cutoff_seconds))
            .build()
            .unwrap();
        let wrapper = SecurityWrapper::new(proto);

        let earlier = Utc.with_ymd_and_hms(2025, 6, 1, 0, 0, 0).unwrap();
        let later = Utc.with_ymd_and_hms(2026, 6, 1, 0, 0, 0).unwrap();
        assert!(!wrapper.is_deleted(earlier));
        assert!(wrapper.is_deleted(later));
    }

    #[test]
    fn legacy_deleted_at_bytes_are_silently_dropped_on_parse() {
        // Hand-craft a SecurityProto with a tag-15 LocalTimestampProto field
        // (the now-removed `deleted_at`). proto3 must ignore unknown fields;
        // the reserved tag drops the value without error. See spec §4.2.
        let base = SecurityProtoBuilder::new().build().unwrap();
        let mut bytes = base.encode_to_vec();

        // Inner google.protobuf.Timestamp { seconds: 1700000000 }:
        //   key = (1<<3)|0 = 0x08
        let mut inner_ts: Vec<u8> = vec![0x08];
        let mut value: u64 = 1_700_000_000;
        while value >= 0x80 {
            inner_ts.push(((value & 0x7F) | 0x80) as u8);
            value >>= 7;
        }
        inner_ts.push(value as u8);

        // LocalTimestampProto { timestamp: <Timestamp> } (field 1, len-delim).
        let mut outer: Vec<u8> = vec![0x0A, inner_ts.len() as u8];
        outer.extend_from_slice(&inner_ts);

        // SecurityProto.deleted_at (field 15, len-delim):
        //   key = (15<<3)|2 = 0x7A
        bytes.push(0x7A);
        bytes.push(outer.len() as u8);
        bytes.extend_from_slice(&outer);

        // Reparse — must succeed; the legacy field is silently dropped.
        let reparsed = SecurityProto::decode(bytes.as_slice())
            .expect("proto3 must accept and drop the reserved tag 15");

        // valid_to should remain unpopulated (deleted_at must NOT be
        // silently mapped onto another field).
        assert!(reparsed.valid_to.is_none());
    }
}
