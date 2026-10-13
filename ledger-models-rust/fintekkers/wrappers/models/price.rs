use std::hash::{Hash, Hasher};
use std::sync::OnceLock;
use rust_decimal::Decimal;

use crate::fintekkers::models::price::{PriceProto, PriceTypeProto};
use crate::fintekkers::models::security::SecurityProto;
use crate::fintekkers::models::util::ObjectTypeProto;
use crate::fintekkers::requests::util::errors::FieldViolationProto;
use crate::fintekkers::requests::util::errors::{ErrorProto, Message as ErrorMessage};

use crate::fintekkers::wrappers::models::security::{SecurityProtoBuilder, SecurityWrapper};
use crate::fintekkers::wrappers::models::utils::datetime::LocalTimestampWrapper;
use crate::fintekkers::wrappers::models::utils::decimal::{is_unset_decimal, DecimalWrapper};
use crate::fintekkers::wrappers::models::utils::errors::{object_id_of, Error};
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;
use chrono::DateTime;
use chrono_tz::Tz;
use crate::fintekkers::wrappers::models::utils::uuid_wrapper::UUIDWrapper;
use crate::fintekkers::wrappers::util::link_cache;
use crate::fintekkers::wrappers::util::object_types;

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

    /// The price's as_of. Unset or a blank time zone is `Error::Validation`
    /// naming `price.as_of` / `price.as_of.time_zone`; never defaulted.
    pub fn try_as_of(&self) -> Result<DateTime<Tz>, Error> {
        ProtoSerializationUtil::deserialize_required_timestamp(self.proto.as_of.as_ref(), "price.as_of")
    }

    /// The price value. Unset, malformed or not exactly representable is
    /// `Error::Validation` naming `price`.
    pub fn try_price(&self) -> Result<Decimal, Error> {
        self.ensure_hydrated();
        let price = self.active().price.as_ref().ok_or_else(|| {
            Error::Validation(vec![FieldViolationProto {
                field: PRICE_FIELD.to_string(),
                object_id: object_id_of(self.proto.uuid.as_ref()),
                message: "price is required but unset".to_string(),
            }])
        })?;
        ProtoSerializationUtil::deserialize_decimal(price).map_err(|e| e.in_field(PRICE_FIELD))
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

// ---------- Price input rules (LM-289) ----------

pub const SECURITY_FIELD: &str = "security";
pub const PRICE_FIELD: &str = "price";
pub const PRICE_TYPE_FIELD: &str = "price_type";

/// Price input rules: Rust counterpart of Java's PriceRules
/// (docs/adr/typed-input-errors.md). Returns every field-level violation, or
/// an empty Vec when valid. Three rules, in this order: `security` has a
/// non-empty UUID, `price` has either decimal form set (zero is valid, see
/// the PriceProto comment), and `price_type` is not
/// UNKNOWN_PRICE_TYPE. The price value is not parsed. A link price is not
/// skipped: hydrate it first. `PriceWrapper::new` does not call this.
pub fn validate_price(proto: &PriceProto) -> Vec<FieldViolationProto> {
    let id = object_id_of(proto.uuid.as_ref());
    let violation = |field: &str, message: &str| FieldViolationProto {
        field: field.to_string(),
        object_id: id.clone(),
        message: message.to_string(),
    };
    let mut out = Vec::new();
    let security_uuid = proto.security.as_ref().and_then(|s| s.uuid.as_ref());
    if security_uuid.map_or(true, |u| u.raw_uuid.is_empty()) {
        out.push(violation(SECURITY_FIELD, "security with a non-empty uuid is required"));
    }
    if proto.price.as_ref().map_or(true, is_unset_decimal) {
        out.push(violation(PRICE_FIELD, "price is required"));
    }
    // Raw number, so an unrecognised value is not rejected.
    if proto.price_type == PriceTypeProto::UnknownPriceType as i32 {
        out.push(violation(PRICE_TYPE_FIELD, "price_type must not be UNKNOWN_PRICE_TYPE"));
    }
    out
}

/// `Err(Error::Validation(..))` carrying every violation if
/// [`validate_price`] finds any.
pub fn require_valid_price(proto: &PriceProto) -> Result<(), Error> {
    let violations = validate_price(proto);
    if violations.is_empty() {
        Ok(())
    } else {
        Err(Error::Validation(violations))
    }
}

/// Required-field rules only (LM-290): `security` and `price`, the same
/// rules as [`validate_price`] minus `price_type`. Returns one `ErrorProto`
/// per failed rule, or an empty Vec when valid. Zero and negative prices are
/// valid; the value is not parsed.
///
/// Use [`validate_price`] when you want field violations and the
/// `price_type` rule; use this when you want `ErrorProto`s for the required
/// fields only. Each error carries its `FieldViolationProto` in `violations`.
/// `code` is left at its default (no invalid-argument code exists).
/// `message_for_user` repeats the developer text and is not curated.
/// Pure: no I/O, no logging, no panics.
pub fn validate_price_required_fields(proto: &PriceProto) -> Vec<ErrorProto> {
    validate_price(proto)
        .into_iter()
        .filter(|v| v.field == PRICE_FIELD || v.field == SECURITY_FIELD)
        .map(|v| ErrorProto {
            detail: Some(ErrorMessage {
                message_for_user: v.message.clone(),
                message_for_developer: v.message.clone(),
            }),
            violations: vec![v],
            ..Default::default()
        })
        .collect()
}

pub struct PriceProtoBuilder {
    as_of: LocalTimestampWrapper,
    valid_from: LocalTimestampWrapper,
    valid_to: Option<LocalTimestampWrapper>,

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

        let proto = PriceProto {
            as_of: Some(self.as_of.into()),
            valid_from: Some(self.valid_from.into()),
            valid_to,

            is_link: self.is_link,

            uuid: Some(self.uuid.into()),
            price: Some(self.price.unwrap().into()),
            security: Some(
                self.security.unwrap()
            ),
            price_type: 0,
            ..Default::default()
        };
        Ok(object_types::stamp(proto, ObjectTypeProto::ObjectTypePrice))
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

    use super::{Error, PriceProtoBuilder};
    use crate::fintekkers::wrappers::models::utils::decimal::decode_decimal;

    // LM-272: unset as_of or a blank time zone is a typed validation error
    // naming the field, not a panic or a default.
    fn assert_validation(err: Error, field: &str) {
        assert!(matches!(err, Error::Validation(_)), "expected Error::Validation, got {:?}", err);
        assert_eq!(err.violations()[0].field, field);
    }

    #[test]
    fn try_as_of_unset_is_validation_error() {
        let mut proto = PriceProtoBuilder::new().dummy_price_wrapper(dec!(1)).proto;
        proto.as_of = None;
        assert_validation(PriceWrapper::new(proto).try_as_of().unwrap_err(), "price.as_of");
    }

    #[test]
    fn try_as_of_blank_time_zone_is_validation_error() {
        for zone in ["", "   "] {
            let mut proto = PriceProtoBuilder::new().dummy_price_wrapper(dec!(1)).proto;
            proto.as_of.as_mut().unwrap().time_zone = zone.to_string();
            assert_validation(PriceWrapper::new(proto).try_as_of().unwrap_err(), "price.as_of.time_zone");
        }
    }

    #[test]
    fn try_as_of_valid_time_zone_deserializes() {
        let proto = PriceProtoBuilder::new().dummy_price_wrapper(dec!(1)).proto;
        assert!(PriceWrapper::new(proto).try_as_of().is_ok());
    }

    #[test]
    fn test_proto_to_date() {
        let number = dec!(-1.23);

        let price_proto = PriceProtoBuilder::new()
            .dummy_price_wrapper(number)
            .proto;

        let price = price_proto.price.unwrap();
        let price_str = decode_decimal(&price).unwrap().to_string();

        assert_eq!(price_str, number.to_string());
        assert_eq!(price.unscaled_value, vec![0x85]);
        assert_eq!(price.scale, 2);
    }

    #[test]
    fn test_price_builder_object_type_is_price() {
        let number = dec!(100.0);
        let price_proto = PriceProtoBuilder::new()
            .dummy_price_wrapper(number)
            .proto;

        assert_eq!(price_proto.object_type(), crate::fintekkers::models::util::ObjectTypeProto::ObjectTypePrice);
    }

    // ---- Lazy hydrate (FinTekkers/second-brain — lazy-link-hydration ADR) ----

    use super::{PriceWrapper, link_cache};
    use crate::fintekkers::models::price::PriceProto;
    use crate::fintekkers::models::security::SecurityProto;
    use crate::fintekkers::models::util::{LocalTimestampProto, UuidProto, DecimalValueProto};
    use crate::fintekkers::wrappers::models::utils::decimal::decimal_proto_str;
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
            uuid: Some(UuidProto { raw_uuid: uuid.as_bytes().to_vec() }),
            as_of: Some(as_of),
            is_link: false,
            price: Some(decimal_proto_str(value)),
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

    // ---- Price input rules (LM-289). The same table runs in Java, Python and JS. ----

    use super::{require_valid_price, validate_price, validate_price_required_fields};
    use crate::fintekkers::models::price::PriceTypeProto;

    fn rules_valid(price_id: Uuid) -> PriceProto {
        PriceProto {
            uuid: Some(UuidProto { raw_uuid: price_id.as_bytes().to_vec() }),
            security: Some(SecurityProto {
                uuid: Some(UuidProto { raw_uuid: Uuid::new_v4().as_bytes().to_vec() }),
                ..Default::default()
            }),
            price: Some(decimal_proto_str("100.25")),
            price_type: PriceTypeProto::Percentage as i32,
            ..Default::default()
        }
    }

    fn rules_fields(proto: &PriceProto) -> Vec<String> {
        validate_price(proto).into_iter().map(|v| v.field).collect()
    }

    #[test]
    fn rules_security_absent_one_violation_on_security() {
        let mut p = rules_valid(Uuid::new_v4());
        p.security = None;
        assert_eq!(rules_fields(&p), vec!["security"]);
    }

    #[test]
    fn rules_security_uuid_empty_one_violation_on_security() {
        let mut p = rules_valid(Uuid::new_v4());
        p.security.as_mut().unwrap().uuid = Some(UuidProto { raw_uuid: vec![] });
        assert_eq!(rules_fields(&p), vec!["security"]);
    }

    #[test]
    fn rules_security_uuid_unset_one_violation_on_security() {
        let mut p = rules_valid(Uuid::new_v4());
        p.security.as_mut().unwrap().uuid = None;
        assert_eq!(rules_fields(&p), vec!["security"]);
    }

    #[test]
    fn rules_price_absent_one_violation_on_price() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = None;
        assert_eq!(rules_fields(&p), vec!["price"]);
    }

    #[test]
    fn rules_price_empty_one_violation_on_price() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = Some(DecimalValueProto::default());
        assert_eq!(rules_fields(&p), vec!["price"]);
    }

    #[test]
    fn rules_price_zero_is_valid() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = Some(decimal_proto_str("0"));
        assert!(rules_fields(&p).is_empty());
    }

    #[test]
    fn rules_price_value_is_not_checked() {
        let over_cap = DecimalValueProto { unscaled_value: vec![0x01], scale: 4097 };
        for value in [decimal_proto_str("-1"), over_cap] {
            let mut p = rules_valid(Uuid::new_v4());
            p.price = Some(value.clone());
            assert!(rules_fields(&p).is_empty(), "{:?}", value);
        }
    }

    #[test]
    fn rules_unknown_price_type_one_violation_on_price_type() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price_type = PriceTypeProto::UnknownPriceType as i32;
        assert_eq!(rules_fields(&p), vec!["price_type"]);
    }

    #[test]
    fn rules_unrecognised_price_type_is_valid() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price_type = 99;
        assert!(rules_fields(&p).is_empty());
    }

    #[test]
    fn rules_all_three_problems_three_violations_in_field_order() {
        let price_id = Uuid::new_v4();
        let mut p = rules_valid(price_id);
        p.security = None;
        p.price = None;
        p.price_type = PriceTypeProto::UnknownPriceType as i32;
        let violations = validate_price(&p);
        let fields: Vec<&str> = violations.iter().map(|v| v.field.as_str()).collect();
        assert_eq!(fields, vec!["security", "price", "price_type"]);
        for v in &violations {
            assert_eq!(v.object_id.as_ref().unwrap().raw_uuid, price_id.as_bytes().to_vec());
        }
    }

    #[test]
    fn rules_every_known_price_type_is_valid() {
        // prost 0.11 enums have no iterator: walk the raw numbers.
        let values: Vec<PriceTypeProto> = (0..256).filter_map(PriceTypeProto::from_i32).collect();
        assert!(values.contains(&PriceTypeProto::Percentage));
        for value in values {
            if value == PriceTypeProto::UnknownPriceType {
                continue;
            }
            let mut p = rules_valid(Uuid::new_v4());
            p.price_type = value as i32;
            assert!(rules_fields(&p).is_empty(), "{}", value.as_str_name());
        }
    }

    #[test]
    fn rules_empty_proto_three_violations() {
        let violations = validate_price(&PriceProto::default());
        let fields: Vec<&str> = violations.iter().map(|v| v.field.as_str()).collect();
        assert_eq!(fields, vec!["security", "price", "price_type"]);
        assert!(violations[0].object_id.is_none());
    }

    #[test]
    fn rules_require_valid_returns_validation_error_carrying_violations() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = None;
        let err = require_valid_price(&p).unwrap_err();
        assert!(matches!(err, Error::Validation(_)), "expected Error::Validation, got {:?}", err);
        assert_eq!(err.violations(), validate_price(&p).as_slice());
        assert!(require_valid_price(&rules_valid(Uuid::new_v4())).is_ok());
    }

    // ---- Required-field rules (LM-290) ----

    use crate::fintekkers::requests::util::errors::ErrorProto;

    fn required_messages(errors: &[ErrorProto]) -> Vec<String> {
        errors.iter().map(|e| {
            assert!(e.detail.is_some(), "detail must be set: {:?}", e);
            e.detail.as_ref().map_or(String::new(), |d| d.message_for_developer.clone())
        }).collect()
    }

    #[test]
    fn required_valid_values_have_no_errors() {
        for value in ["1.5", "0", "-1"] {
            let mut p = rules_valid(Uuid::new_v4());
            p.price = Some(decimal_proto_str(value));
            assert!(validate_price_required_fields(&p).is_empty(), "{}", value);
        }
    }

    #[test]
    fn required_price_missing_one_error_naming_price() {
        let mut unset = rules_valid(Uuid::new_v4());
        unset.price = None;
        let mut empty = rules_valid(Uuid::new_v4());
        empty.price = Some(DecimalValueProto::default());
        for p in [unset, empty] {
            let messages = required_messages(&validate_price_required_fields(&p));
            assert_eq!(messages.len(), 1, "{:?}", messages);
            assert!(messages[0].contains("price"), "{}", messages[0]);
            assert!(!messages[0].contains("security"), "{}", messages[0]);
        }
    }

    #[test]
    fn required_security_missing_one_error_naming_security() {
        let mut unset = rules_valid(Uuid::new_v4());
        unset.security = None;
        let mut empty = rules_valid(Uuid::new_v4());
        empty.security.as_mut().unwrap().uuid = Some(UuidProto { raw_uuid: vec![] });
        for p in [unset, empty] {
            let messages = required_messages(&validate_price_required_fields(&p));
            assert_eq!(messages.len(), 1, "{:?}", messages);
            assert!(messages[0].contains("security"), "{}", messages[0]);
        }
    }

    fn assert_names_price_and_security(errors: &[ErrorProto]) {
        let messages = required_messages(errors);
        assert_eq!(messages.len(), 2, "{:?}", messages);
        assert!(messages.iter().any(|m| m.contains("price") && !m.contains("security")), "{:?}", messages);
        assert!(messages.iter().any(|m| m.contains("security")), "{:?}", messages);
        assert!(messages.iter().all(|m| !m.contains("price_type")), "{:?}", messages);
    }

    #[test]
    fn required_both_missing_two_errors() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = None;
        p.security = None;
        assert_names_price_and_security(&validate_price_required_fields(&p));
    }

    #[test]
    fn required_all_unset_default_proto() {
        // validate_price returns three violations here; price_type must be filtered out.
        assert_eq!(validate_price(&PriceProto::default()).len(), 3);
        assert_names_price_and_security(&validate_price_required_fields(&PriceProto::default()));
    }

    #[test]
    fn required_ignores_price_type() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price_type = PriceTypeProto::UnknownPriceType as i32;
        assert!(validate_price_required_fields(&p).is_empty());
    }

    // ---- LM-294: compact decimal form ----

    use crate::fintekkers::wrappers::models::utils::decimal::decimal_proto;
    use rust_decimal::Decimal;

    #[test]
    fn compact_only_price_passes_and_both_forms_empty_fails() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = Some(DecimalValueProto {
            unscaled_value: vec![0x00],
            scale: 0,
            ..Default::default()
        });
        assert!(validate_price_required_fields(&p).is_empty());
        assert!(require_valid_price(&p).is_ok());

        p.price = Some(DecimalValueProto::default());
        let errors = validate_price_required_fields(&p);
        assert_eq!(errors.len(), 1);
        assert_eq!(errors[0].violations[0].field, "price");
    }

    #[test]
    fn try_price_reads_a_decimal_built_from_a_string() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = Some(decimal_proto_str("1.50"));
        let value = PriceWrapper::new(p).try_price().unwrap();
        assert_eq!(value.to_string(), "1.50");
    }

    #[test]
    fn try_price_errors_name_price() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = Some(DecimalValueProto { unscaled_value: vec![0x01], scale: 4097 });
        let err = PriceWrapper::new(p.clone()).try_price().unwrap_err();
        assert_eq!(err.violations()[0].field, "price");
        p.price = None;
        let err = PriceWrapper::new(p).try_price().unwrap_err();
        assert_eq!(err.violations()[0].field, "price");
    }

    #[test]
    fn try_price_reads_compact_form() {
        let mut p = rules_valid(Uuid::new_v4());
        p.price = Some(decimal_proto(&Decimal::new(-12345, 2)));
        assert_eq!(PriceWrapper::new(p).try_price().unwrap(), Decimal::new(-12345, 2));
    }
}
