use std::hash::{Hash, Hasher};
use std::sync::OnceLock;
use rust_decimal::Decimal;

use crate::fintekkers::models::price::PriceProto;
use crate::fintekkers::models::security::SecurityProto;
use crate::fintekkers::models::util::DecimalValueProto;

use crate::fintekkers::wrappers::models::security::{SecurityProtoBuilder, SecurityWrapper};
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::decimal::DecimalWrapper;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use crate::fintekkers::wrappers::util::link_cache;

//Imports below are for RawDataModelObject related macro. IDE might not complain if you remove
//them but will fail at compile time
use prost::Message;
use crate::fintekkers::wrappers::models::raw_datamodel_object::RawDataModelObject;
use crate::raw_data_model_object_trait;

#[derive(Default, Debug)]
pub struct PriceWrapper {
    pub proto: PriceProto,
    /// Lazy hydration slot.
    resolved: OnceLock<PriceProto>,
}

impl Clone for PriceWrapper {
    fn clone(&self) -> Self {
        // Resolved slot is not cloned — the clone will re-resolve from
        // LinkCache on first access if proto is still link-mode. Matches
        // SecurityWrapper semantics.
        PriceWrapper {
            proto: self.proto.clone(),
            resolved: OnceLock::new(),
        }
    }
}

///
/// When a PriceWrapper is created directly from the proto, we have to
/// synthesize the wrappers on demand. Ideally higher level wrappers
/// refer to lower level wrappers via a reference. For instance a SecurityWrapper
/// would be created and passed into the PriceWrapper as a reference. This would
/// avoid creation of additional memory in the case where we know that securities
/// will outlive the price. Example hierarchy.
///
/// PriceWrapper:
///     SecurityWrapper
///     UUIDWrapper
///     etc
///
/// For now we will just create wrappers when accessor methods are called. E.g.
/// 'uuid_wrapper(&self)' will create a UUIDWrapper when accessed by cloning the
/// uuid.
///
/// In the longer-term we could optimize for memory by providing price/portfolio/
/// security/etc caches. When a PriceWrapper is created a reference to a SecurityWrapper
/// would be passed in, rather than a full wrapper object. The reference to the security
/// would be owned by the cached, which could use reference counting to decide when to
/// free up the memory. That way when there is a security and a price on a security, only
/// one security is held in memory.
///
impl PriceWrapper {
    pub fn new(proto: PriceProto) -> Self {
        PriceWrapper { proto, resolved: OnceLock::new() }
    }

    pub fn uuid_wrapper(&self) -> UUIDWrapper {
        UUIDWrapper::new(self.proto.uuid.as_ref().unwrap().clone())
    }

    pub fn is_link(&self) -> bool {
        self.proto.is_link
    }

    fn active(&self) -> &PriceProto {
        self.resolved.get().unwrap_or(&self.proto)
    }

    /// Lazy hydration — see docs/adr/lazy-link-hydration.md.
    fn ensure_hydrated(&self) {
        if !self.proto.is_link {
            return;
        }
        if self.resolved.get().is_some() {
            return;
        }
        let uuid_proto = self.proto.uuid.as_ref()
            .expect("Cannot read fields on link-mode PriceWrapper with no UUID set");
        let uuid_bytes: [u8; 16] = uuid_proto.raw_uuid.as_slice().try_into()
            .expect("PriceWrapper UUID must be 16 bytes");
        let uuid = uuid::Uuid::from_bytes(uuid_bytes);
        let cached = link_cache::price().get(uuid, self.proto.as_of.as_ref());
        if let Some(arc) = cached {
            let _ = self.resolved.set((*arc).clone());
            return;
        }
        panic!(
            "Cannot read fields on link-mode PriceWrapper uuid={} \
             — LinkCache miss. Pre-warm via LinkResolver. \
             See docs/adr/lazy-link-hydration.md.",
            uuid
        );
    }

    pub fn security_wrapper(&self) -> SecurityWrapper {
        self.ensure_hydrated();
        let security_proto = self.active().security.clone().unwrap();
        SecurityWrapper::new(security_proto)
    }
}

raw_data_model_object_trait!(PriceWrapper);

impl From<PriceWrapper> for PriceProto {
    fn from(wrapper:PriceWrapper) -> PriceProto {
        wrapper.proto
    }
}

impl Hash for PriceWrapper {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.proto.uuid.as_ref().unwrap().raw_uuid.hash(state);
    }
}

impl PartialEq for PriceWrapper {
    fn eq(&self, other: &Self) -> bool {
        self.proto.uuid.as_ref() == other.proto.uuid.as_ref()
    }
}
impl Eq for PriceWrapper {}

pub struct PriceProtoBuilder {
    as_of: LocalTimestampWrapper,
    valid_from: LocalTimestampWrapper,
    valid_to: Option<LocalTimestampWrapper>,

    object_class: String,
    version: String,
    is_link: bool,

    uuid: UUIDWrapper,
    security: Option<SecurityProto>,
    price: Option<DecimalWrapper>
}

impl PriceProtoBuilder {
    pub fn new() -> Self {
        Self {
            as_of: LocalTimestampWrapper::now(),
            valid_from: LocalTimestampWrapper::now(),
            valid_to: None,

            //This is currently hardcoded, this will change in future versions
            object_class: "Price".to_string(),
            //The version is hardcoded, this will change in future versions
            version: "0.0.1".to_string(),
            is_link: false,

            uuid: UUIDWrapper::new_random(),
            security: None,
            price: None,
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

    pub fn security(mut self, security: SecurityProto) -> Self {
        self.security = security.into();
        self
    }

    pub fn price(mut self, price: DecimalWrapper) -> Self {
        self.price = price.into();
        self
    }

    pub fn build(self) -> Result<PriceProto, Error> {
        let valid_to = match self.valid_to {
            Some(..) => Some(self.valid_to.unwrap().proto),
            None => None
        };

        Ok(PriceProto {
            as_of: Some(self.as_of.into()),
            valid_from: Some(self.valid_from.into()),
            valid_to,

            object_class: self.object_class,
            version: self.version,
            is_link: self.is_link,

            uuid: Some(self.uuid.into()),
            price: Some(DecimalValueProto {
                arbitrary_precision_value: self.price.unwrap().to_string()
            }),
            security: Some(
                self.security.unwrap()
            ),
            price_type: 0,
        })
    }

    pub fn dummy_price_wrapper(&self, price_decimal: Decimal) -> PriceWrapper {
        let security_proto = SecurityProtoBuilder::new()
            .settlement_currency("CAD".to_string())
            .asset_class("Asset Class".to_string())
            .build().unwrap();//.expect("Could not build security");

        let price_proto = PriceProtoBuilder::new()
            .price(DecimalWrapper::from(price_decimal))
            .security(
                security_proto
            )
            .build().unwrap();//.expect("Could not build security");

        PriceWrapper::new(price_proto)
    }
}

#[cfg(test)]
mod test {
    use rust_decimal_macros::dec;

    use super::PriceProtoBuilder;

    #[test]
    fn test_proto_to_date() {
        let number = dec!(-1.23);

        let price_proto = PriceProtoBuilder::new()
            .dummy_price_wrapper(number)
            .proto;

        let price = price_proto.price.unwrap();
        let price_str = price.arbitrary_precision_value;

        assert_eq!(price_str, number.to_string());
    }

    #[test]
    fn test_price_builder_object_class_is_price() {
        let number = dec!(100.0);
        let price_proto = PriceProtoBuilder::new()
            .dummy_price_wrapper(number)
            .proto;

        assert_eq!(price_proto.object_class, "Price");
    }

    // ---- Lazy hydrate (FinTekkers/second-brain — lazy-link-hydration ADR) ----

    use super::{PriceWrapper, link_cache};
    use crate::fintekkers::models::price::PriceProto;
    use crate::fintekkers::models::security::SecurityProto;
    use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto, DecimalValueProto};
    use prost_types::Timestamp;
    use uuid::Uuid;

    fn lh_make_as_of(seconds: i64) -> LocalTimestampProto {
        LocalTimestampProto {
            timestamp: Some(Timestamp { seconds, nanos: 0 }),
            time_zone: "UTC".to_string(),
        }
    }

    fn lh_full_price(uuid: Uuid, as_of: LocalTimestampProto, value: &str) -> PriceProto {
        PriceProto {
            object_class: "Price".to_string(),
            version: "0.0.1".to_string(),
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: false,
            price: Some(DecimalValueProto {
                arbitrary_precision_value: value.to_string(),
            }),
            security: Some(SecurityProto { is_link: false, ..Default::default() }),
            ..Default::default()
        }
    }

    fn lh_link_price(uuid: Uuid, as_of: LocalTimestampProto) -> PriceProto {
        PriceProto {
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: true,
            ..Default::default()
        }
    }

    #[test]
    fn lazy_price_security_wrapper_on_link_hydrates_from_cache() {
        // Fresh uuid → targeted evict() at end; never call clear() (it
        // wipes entries owned by tests running in parallel).
        let uuid = Uuid::new_v4();
        let as_of = lh_make_as_of(1_700_000_000);
        let resolved = lh_full_price(uuid, as_of.clone(), "9.99");
        link_cache::price().put(uuid, resolved, Some(as_of.clone()));

        let p = PriceWrapper::new(lh_link_price(uuid, as_of));
        assert!(p.is_link());
        let _ = p.security_wrapper();
        link_cache::price().evict(uuid);
    }

    #[test]
    #[should_panic(expected = "LinkCache miss")]
    fn lazy_price_cache_miss_panics() {
        let uuid = Uuid::new_v4();
        let p = PriceWrapper::new(lh_link_price(uuid, lh_make_as_of(1_700_000_010)));
        let _ = p.security_wrapper();
    }
}