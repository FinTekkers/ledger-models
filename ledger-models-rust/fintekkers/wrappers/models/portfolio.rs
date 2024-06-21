use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;

pub struct PortfolioWrapper {
    proto: PortfolioProto
}

impl AsRef<PortfolioProto> for PortfolioWrapper {
    fn as_ref(&self) -> &PortfolioProto {
        &self.proto
    }
}

impl PortfolioWrapper {
    pub fn new(proto:PortfolioProto) -> Self {
        PortfolioWrapper {
            proto
        }
    }

    pub fn portfolio_name(&self) -> &str {
        &self.proto.portfolio_name
    }
}

pub struct PortfolioProtoBuilder {
    as_of: LocalTimestampWrapper,
    valid_from: LocalTimestampWrapper,
    valid_to: Option<LocalTimestampWrapper>,

    object_class: String,
    version: String,
    is_link: bool,

    uuid: UUIDWrapper,
    portfolio_name: String,
}

impl PortfolioProtoBuilder {
    pub fn new() -> PortfolioProtoBuilder {
        let uuid = UUIDWrapper::new_random();
        let uuid_str = uuid.to_string();

        PortfolioProtoBuilder {
            as_of: LocalTimestampWrapper::now(),
            valid_from: LocalTimestampWrapper::now(),
            valid_to: None,

            object_class: "Portfolio".to_string(),
            version: "0.0.1".to_string(),
            is_link: false,

            uuid: UUIDWrapper::new_random(),
            portfolio_name: uuid_str,
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

    pub fn object_class(mut self, object_class: String) -> PortfolioProtoBuilder {
        self.object_class = object_class;
        self
    }

    pub fn version(mut self, version: String) -> PortfolioProtoBuilder {
        self.version = version;
        self
    }

    pub fn uuid(mut self, uuid: UUIDWrapper) -> PortfolioProtoBuilder {
        self.uuid = uuid;
        self
    }

    pub fn is_link(mut self, is_link: bool) -> PortfolioProtoBuilder {
        self.is_link = is_link;
        self
    }

    pub fn portfolio_name(mut self, portfolio_name: String) -> PortfolioProtoBuilder {
        self.portfolio_name = portfolio_name;
        self
    }

    pub fn build(self) -> Result<PortfolioProto, Error> {
        let valid_to = match self.valid_to {
            Some(..) => Some(self.valid_to.unwrap().proto),
            None => None
        };

        Ok(PortfolioProto {
            as_of: Some(self.as_of.into()),
            valid_from: Some(self.valid_from.into()),
            valid_to,

            object_class: self.object_class,
            version: self.version,
            is_link: self.is_link,

            uuid: Some(self.uuid.into()),
            portfolio_name: self.portfolio_name,
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_portfolio_name() {
        let portfolio = PortfolioWrapper {
            proto: PortfolioProto {
                as_of: None,
                valid_from: None,
                valid_to: None,

                object_class: "Portfolio".to_string(),
                version: "0.01".to_string(),
                uuid: None,
                is_link: false,
                portfolio_name: "Dummy Name".to_string(),
            }
        };

        assert_eq!(portfolio.portfolio_name(), "Dummy Name");
    }

    #[test]
    fn test_portfolio_builder() {
        let proto = PortfolioProtoBuilder::new()
            .portfolio_name("Portfolio".to_string())
            .build().unwrap();

        assert!(proto.portfolio_name.contains("Portfolio"));

        let proto2 = PortfolioProtoBuilder::new()
            .build().unwrap();

        //Check it's 36 chars long and has a hyphen (i.e. its the UUID)
        assert!(proto2.portfolio_name.contains("-"));
        assert_eq!(36, proto2.portfolio_name.len())
    }
}