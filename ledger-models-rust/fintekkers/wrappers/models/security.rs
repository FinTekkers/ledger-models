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
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_proto_to_date() {
        let result = SecurityProtoBuilder::new()
            .settlement_currency("CAD".to_string())
            .asset_class("Asset Class".to_string())
            .build()
            .unwrap(); //.expect("Could not build security");

        assert!(result.asset_class.contains("Asset"));
        // assert_eq!(result.settlement_currency.unwrap(), "CAD".to_string());
    }
}
