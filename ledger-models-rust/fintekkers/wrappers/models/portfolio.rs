use crate::fintekkers::models::portfolio::PortfolioProto;
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use crate::fintekkers::wrappers::util::link_cache;
use std::sync::OnceLock;

pub struct PortfolioWrapper {
    proto: PortfolioProto,
    /// Lazy hydration slot. Mirror of SecurityWrapper.resolved — see
    /// docs/adr/lazy-link-hydration.md.
    resolved: OnceLock<PortfolioProto>,
}

impl AsRef<PortfolioProto> for PortfolioWrapper {
    fn as_ref(&self) -> &PortfolioProto {
        &self.proto
    }
}

impl PortfolioWrapper {
    pub fn new(proto: PortfolioProto) -> Self {
        PortfolioWrapper { proto, resolved: OnceLock::new() }
    }

    /// True iff the original wrapped proto was a link reference. Stays
    /// reflective of the constructor-time proto even after hydration —
    /// matches SecurityWrapper.
    pub fn is_link(&self) -> bool {
        self.proto.is_link
    }

    fn active(&self) -> &PortfolioProto {
        self.resolved.get().unwrap_or(&self.proto)
    }

    /// Lazy hydration. On a link-mode proto, look up LinkCache and swap in
    /// the resolved value. On cache miss, panics.
    fn ensure_hydrated(&self) {
        if !self.proto.is_link {
            return;
        }
        if self.resolved.get().is_some() {
            return;
        }
        let uuid_proto = self.proto.uuid.as_ref()
            .expect("Cannot read fields on link-mode PortfolioWrapper with no UUID set");
        let uuid_bytes: [u8; 16] = uuid_proto.raw_uuid.as_slice().try_into()
            .expect("PortfolioWrapper UUID must be 16 bytes");
        let uuid = uuid::Uuid::from_bytes(uuid_bytes);
        let cached = link_cache::portfolio().get(uuid, self.proto.as_of.as_ref());
        if let Some(arc) = cached {
            let _ = self.resolved.set((*arc).clone());
            return;
        }
        panic!(
            "Cannot read fields on link-mode PortfolioWrapper uuid={} \
             — LinkCache miss. Pre-warm via LinkResolver. \
             See docs/adr/lazy-link-hydration.md.",
            uuid
        );
    }

    pub fn portfolio_name(&self) -> &str {
        self.ensure_hydrated();
        &self.active().portfolio_name
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
        let portfolio = PortfolioWrapper::new(PortfolioProto {
            as_of: None,
            valid_from: None,
            valid_to: None,

            object_class: "Portfolio".to_string(),
            version: "0.01".to_string(),
            uuid: None,
            is_link: false,
            portfolio_name: "Dummy Name".to_string(),
        });

        assert_eq!(portfolio.portfolio_name(), "Dummy Name");
    }

    // ---- Lazy hydrate (FinTekkers/second-brain — lazy-link-hydration ADR) ----

    use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto};
    use prost_types::Timestamp;
    use uuid::Uuid;

    fn make_as_of(seconds: i64) -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp { seconds, nanos: 0 }),
            time_zone: "UTC".to_string(),
        }
    }

    fn full_portfolio(uuid: Uuid, as_of: LocalTimestampProto, name: &str) -> PortfolioProto {
        PortfolioProto {
            object_class: "Portfolio".to_string(),
            version: "0.0.1".to_string(),
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: false,
            portfolio_name: name.to_string(),
            ..Default::default()
        }
    }

    fn link_portfolio(uuid: Uuid, as_of: LocalTimestampProto) -> PortfolioProto {
        PortfolioProto {
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: true,
            ..Default::default()
        }
    }

    #[test]
    fn lazy_portfolio_name_on_link_hydrates_from_cache() {
        // Fresh uuid → targeted evict() at end; never call clear() (it
        // wipes entries owned by tests running in parallel).
        let uuid = Uuid::new_v4();
        let as_of = make_as_of(1_700_000_000);
        let resolved = full_portfolio(uuid, as_of.clone(), "Strategy Z");
        link_cache::portfolio().put(uuid, resolved, Some(as_of.clone()));

        let p = PortfolioWrapper::new(link_portfolio(uuid, as_of));
        assert!(p.is_link());
        assert_eq!(p.portfolio_name(), "Strategy Z");
        link_cache::portfolio().evict(uuid);
    }

    #[test]
    #[should_panic(expected = "LinkCache miss")]
    fn lazy_portfolio_cache_miss_panics() {
        let uuid = Uuid::new_v4();
        let p = PortfolioWrapper::new(link_portfolio(uuid, make_as_of(1_700_000_010)));
        let _ = p.portfolio_name();
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