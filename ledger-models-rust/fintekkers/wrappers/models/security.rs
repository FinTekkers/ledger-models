use crate::fintekkers::models::security::{SecurityProto, SecurityTypeProto};
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;

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
    security_type: SecurityTypeProto,
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
            security_type: SecurityTypeProto::UnknownSecurityType,
            asset_class: "Unknown".to_string(),
            issuer_name: "Unknown Issue".to_string(),
            settlement_currency: "Unknown settlement currency".to_string(),
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

    pub fn security_type(mut self, security_type: SecurityTypeProto) -> Self {
        self.security_type = security_type;
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
            security_type: self.security_type.into(),
            asset_class: self.asset_class,
            issuer_name: self.issuer_name,
            settlement_currency: None,
            cash_id: "".to_string(),

            quantity_type: 0,
            identifier: None,
            description: "".to_string(),

            //Bond specific
            face_value: None,
            coupon_rate: None,
            coupon_frequency: 0,
            coupon_type: 0,
            maturity_date: None,
            dated_date: None,
            issue_date: None,
            issuance_info: vec![],
            base_cpi: None,
            index_date: None,
            inflation_index_type: 0,
            spread: None,
            reference_rate_index: 0,
            reset_frequency: 0,
            index_type: 0,
            product_details: None,
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::fintekkers::models::security::security_proto::ProductDetails;
    use crate::fintekkers::models::security::{
        BondDetailsProto, TipsDetailsProto, FrnDetailsProto,
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

    #[test]
    fn test_oneof_bond_details_round_trip() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::BondSecurity as i32,
            asset_class: "Fixed Income".to_string(),
            product_details: Some(ProductDetails::BondDetails(BondDetailsProto {
                coupon_rate: decimal("5.0"),
                coupon_type: CouponTypeProto::Fixed as i32,
                coupon_frequency: CouponFrequencyProto::Semiannually as i32,
                face_value: decimal("1000"),
                issue_date: date(2020, 1, 15),
                dated_date: date(2020, 1, 15),
                maturity_date: date(2030, 1, 15),
                issuance_info: vec![],
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.product_details {
            Some(ProductDetails::BondDetails(bond)) => {
                assert_eq!(bond.coupon_rate.as_ref().unwrap().arbitrary_precision_value, "5.0");
                assert_eq!(bond.coupon_type, CouponTypeProto::Fixed as i32);
                assert_eq!(bond.maturity_date.as_ref().unwrap().year, 2030);
                assert_eq!(bond.face_value.as_ref().unwrap().arbitrary_precision_value, "1000");
            }
            other => panic!("Expected BondDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_oneof_tips_details_round_trip() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::Tips as i32,
            product_details: Some(ProductDetails::TipsDetails(TipsDetailsProto {
                coupon_rate: decimal("0.625"),
                coupon_type: CouponTypeProto::Fixed as i32,
                coupon_frequency: CouponFrequencyProto::Semiannually as i32,
                face_value: decimal("1000"),
                issue_date: None,
                dated_date: None,
                maturity_date: date(2030, 1, 15),
                issuance_info: vec![],
                base_cpi: decimal("256.394"),
                index_date: date(2020, 1, 1),
                inflation_index_type: IndexTypeProto::CpiU as i32,
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.product_details {
            Some(ProductDetails::TipsDetails(tips)) => {
                assert_eq!(tips.base_cpi.as_ref().unwrap().arbitrary_precision_value, "256.394");
                assert_eq!(tips.inflation_index_type, IndexTypeProto::CpiU as i32);
                assert_eq!(tips.coupon_rate.as_ref().unwrap().arbitrary_precision_value, "0.625");
            }
            other => panic!("Expected TipsDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_oneof_frn_details_round_trip() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::Frn as i32,
            product_details: Some(ProductDetails::FrnDetails(FrnDetailsProto {
                coupon_rate: None,
                coupon_type: CouponTypeProto::Float as i32,
                coupon_frequency: CouponFrequencyProto::Quarterly as i32,
                face_value: decimal("100"),
                issue_date: None,
                dated_date: None,
                maturity_date: date(2028, 1, 15),
                issuance_info: vec![],
                spread: decimal("50"),
                reference_rate_index: IndexTypeProto::TBill13Week as i32,
                reset_frequency: CouponFrequencyProto::Quarterly as i32,
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.product_details {
            Some(ProductDetails::FrnDetails(frn)) => {
                assert_eq!(frn.spread.as_ref().unwrap().arbitrary_precision_value, "50");
                assert_eq!(frn.reference_rate_index, IndexTypeProto::TBill13Week as i32);
                assert_eq!(frn.reset_frequency, CouponFrequencyProto::Quarterly as i32);
            }
            other => panic!("Expected FrnDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_oneof_index_details_round_trip() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::IndexSecurity as i32,
            product_details: Some(ProductDetails::IndexDetails(IndexDetailsProto {
                index_type: IndexTypeProto::CpiU as i32,
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.product_details {
            Some(ProductDetails::IndexDetails(idx)) => {
                assert_eq!(idx.index_type, IndexTypeProto::CpiU as i32);
            }
            other => panic!("Expected IndexDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_oneof_cash_details_round_trip() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::CashSecurity as i32,
            product_details: Some(ProductDetails::CashDetails(CashDetailsProto {
                cash_id: "USD".to_string(),
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.product_details {
            Some(ProductDetails::CashDetails(cash)) => {
                assert_eq!(cash.cash_id, "USD");
            }
            other => panic!("Expected CashDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_oneof_equity_details_round_trip() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::EquitySecurity as i32,
            product_details: Some(ProductDetails::EquityDetails(EquityDetailsProto {})),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        match &parsed.product_details {
            Some(ProductDetails::EquityDetails(_)) => {}
            other => panic!("Expected EquityDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_dual_write_flat_and_oneof_coexist() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::BondSecurity as i32,
            // Flat fields (legacy)
            coupon_rate: decimal("5.0"),
            coupon_type: CouponTypeProto::Fixed as i32,
            face_value: decimal("1000"),
            maturity_date: date(2030, 1, 15),
            // oneof (new)
            product_details: Some(ProductDetails::BondDetails(BondDetailsProto {
                coupon_rate: decimal("5.0"),
                coupon_type: CouponTypeProto::Fixed as i32,
                coupon_frequency: 0,
                face_value: decimal("1000"),
                issue_date: None,
                dated_date: None,
                maturity_date: date(2030, 1, 15),
                issuance_info: vec![],
            })),
            ..Default::default()
        };

        let parsed = round_trip(&proto);

        // Flat fields survive
        assert_eq!(parsed.coupon_rate.as_ref().unwrap().arbitrary_precision_value, "5.0");
        assert_eq!(parsed.maturity_date.as_ref().unwrap().year, 2030);

        // oneof fields survive
        match &parsed.product_details {
            Some(ProductDetails::BondDetails(bond)) => {
                assert_eq!(bond.coupon_rate.as_ref().unwrap().arbitrary_precision_value, "5.0");
                assert_eq!(bond.maturity_date.as_ref().unwrap().year, 2030);
            }
            other => panic!("Expected BondDetails, got {:?}", other),
        }
    }

    #[test]
    fn test_no_oneof_set_returns_none() {
        let proto = SecurityProto {
            security_type: SecurityTypeProto::BondSecurity as i32,
            coupon_rate: decimal("5.0"),
            ..Default::default()
        };

        let parsed = round_trip(&proto);
        assert!(parsed.product_details.is_none());
        assert_eq!(parsed.coupon_rate.as_ref().unwrap().arbitrary_precision_value, "5.0");
    }
}
