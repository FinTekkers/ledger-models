//! Test helpers for `DecimalValueProto` (LM-312, docs/adr/rust_decimal_helpers.md).
//!
//! Only compiled with the `test-utils` feature: add ledger-models with
//! `features = ["test-utils"]` under `[dev-dependencies]`. These are for
//! tests, so bad input panics with a message instead of returning an error.
//!
//! - Builders: `string_only`, `compact_only` and `both_forms` build one
//!   decimal in a stated form; `form_of` and `value_and_scale` read it back.
//! - `find_decimals` lists every `DecimalValueProto` inside a message, with
//!   its path, by walking the message through reflection over the embedded
//!   descriptor set. It never parses `{:?}` output.
//! - `rewrite_decimals` returns a copy of a message with every decimal in
//!   one form, keeping each value and scale.

use crate::fintekkers::models::util::DecimalValueProto;
use crate::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET;
use crate::fintekkers::wrappers::models::utils::decimal::{
    decode_decimal, encode_decimal, is_unset_decimal, parse_decimal_str, CompactDecimal,
};

use num_bigint::BigInt;
use prost::Message;
use prost_reflect::{DescriptorPool, DynamicMessage, MessageDescriptor, ReflectMessage, Value};
use std::sync::OnceLock;

const DECIMAL_FULL_NAME: &str = "fintekkers.models.util.DecimalValueProto";

/// Which of the two `DecimalValueProto` forms are set.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DecimalForm {
    /// Only the deprecated `arbitrary_precision_value` string (field 10), as
    /// written before v0.4.34.
    StringOnly,
    /// Only `unscaled_value` and `scale` (fields 11 and 12).
    CompactOnly,
    /// Both, as `encode_decimal` writes them (stage 1).
    Both,
}

fn parse(s: &str) -> CompactDecimal {
    parse_decimal_str(s).unwrap_or_else(|e| panic!("not a decimal: {:?}: {}", s, e))
}

/// `v` written in `form`. The string form is the canonical string.
#[allow(deprecated)]
fn in_form(v: &CompactDecimal, form: DecimalForm) -> DecimalValueProto {
    let both = encode_decimal(v);
    match form {
        DecimalForm::StringOnly => DecimalValueProto {
            arbitrary_precision_value: both.arbitrary_precision_value,
            ..Default::default()
        },
        DecimalForm::CompactOnly => DecimalValueProto {
            unscaled_value: both.unscaled_value,
            scale: both.scale,
            ..Default::default()
        },
        DecimalForm::Both => both,
    }
}

/// `s` in the deprecated string field only, kept as written (`1E+3` stays
/// `1E+3`). Panics when `s` is not a decimal.
#[allow(deprecated)]
pub fn string_only(s: &str) -> DecimalValueProto {
    parse(s);
    DecimalValueProto { arbitrary_precision_value: s.to_string(), ..Default::default() }
}

/// `s` in the compact form only: `1.50` is unscaled 150, scale 2. Panics when
/// `s` is not a decimal.
pub fn compact_only(s: &str) -> DecimalValueProto {
    in_form(&parse(s), DecimalForm::CompactOnly)
}

/// `s` in both forms, as `encode_decimal` writes it. Panics when `s` is not a
/// decimal.
pub fn both_forms(s: &str) -> DecimalValueProto {
    in_form(&parse(s), DecimalForm::Both)
}

/// The form `d` is in, or `None` when neither form is set.
#[allow(deprecated)]
pub fn form_of(d: &DecimalValueProto) -> Option<DecimalForm> {
    match (!d.arbitrary_precision_value.is_empty(), !d.unscaled_value.is_empty()) {
        (true, false) => Some(DecimalForm::StringOnly),
        (false, true) => Some(DecimalForm::CompactOnly),
        (true, true) => Some(DecimalForm::Both),
        (false, false) => None,
    }
}

/// The compact form as `(unscaled, scale)`, or `None` when it is unset.
/// Panics when the unscaled value does not fit in an `i128`.
pub fn value_and_scale(d: &DecimalValueProto) -> Option<(i128, u32)> {
    if d.unscaled_value.is_empty() {
        return None;
    }
    let unscaled = BigInt::from_signed_bytes_be(&d.unscaled_value);
    let unscaled = i128::try_from(&unscaled)
        .unwrap_or_else(|_| panic!("unscaled value {} does not fit in an i128", unscaled));
    Some((unscaled, d.scale))
}

// ---- Reflection over the embedded descriptor set ----

fn pool() -> &'static DescriptorPool {
    static POOL: OnceLock<DescriptorPool> = OnceLock::new();
    POOL.get_or_init(|| {
        DescriptorPool::decode(LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET)
            .expect("ledger-models descriptor set decodes")
    })
}

/// The proto full name of a generated message type, from its Rust path: the
/// crate segment is dropped, whatever the crate is called, and the module
/// path is the proto package, so
/// `ledger_models::fintekkers::models::security::SecurityProto` is
/// `fintekkers.models.security.SecurityProto`. Prost's nested messages live
/// in snake_case modules and do not map.
pub fn proto_full_name<M>() -> String {
    let rust_name = std::any::type_name::<M>();
    let path = rust_name.split_once("::").map_or(rust_name, |(_, rest)| rest);
    path.replace("::", ".")
}

fn descriptor_of<M>() -> MessageDescriptor {
    let name = proto_full_name::<M>();
    pool().get_message_by_name(&name).unwrap_or_else(|| {
        panic!(
            "{} maps to {}, which is not a message in the ledger-models descriptor set; \
             only top-level generated messages are supported",
            std::any::type_name::<M>(),
            name
        )
    })
}

fn to_dynamic<M: Message>(msg: &M) -> DynamicMessage {
    DynamicMessage::decode(descriptor_of::<M>(), msg.encode_to_vec().as_slice())
        .expect("message decodes against its own descriptor")
}

fn is_decimal(m: &DynamicMessage) -> bool {
    m.descriptor().full_name() == DECIMAL_FULL_NAME
}

fn join(path: &str, field: &str) -> String {
    if path.is_empty() {
        field.to_string()
    } else {
        format!("{}.{}", path, field)
    }
}

fn find_in_message(msg: &DynamicMessage, path: &str, out: &mut Vec<(String, DecimalValueProto)>) {
    for (field, value) in msg.fields() {
        find_in_value(value, &join(path, field.name()), out);
    }
}

fn find_in_value(value: &Value, path: &str, out: &mut Vec<(String, DecimalValueProto)>) {
    match value {
        // A decimal is a leaf: its own fields are never walked.
        Value::Message(m) if is_decimal(m) => {
            out.push((path.to_string(), m.transcode_to().expect("DecimalValueProto transcodes")));
        }
        Value::Message(m) => find_in_message(m, path, out),
        Value::List(items) => {
            for (i, item) in items.iter().enumerate() {
                find_in_value(item, &format!("{}[{}]", path, i), out);
            }
        }
        Value::Map(entries) => {
            let mut keys: Vec<_> = entries.keys().collect();
            keys.sort();
            for key in keys {
                find_in_value(&entries[key], &format!("{}[{:?}]", path, key), out);
            }
        }
        _ => {}
    }
}

/// Every `DecimalValueProto` set anywhere inside `msg`, with its path, e.g.
/// `bond_details.face_value` or `curve_inputs[1].tenor`. A decimal field set
/// to an empty `DecimalValueProto` is listed too. `M` must be a top-level
/// generated message (see `proto_full_name`); anything else panics.
pub fn find_decimals<M: Message>(msg: &M) -> Vec<(String, DecimalValueProto)> {
    let mut out = Vec::new();
    find_in_message(&to_dynamic(msg), "", &mut out);
    out
}

fn rewrite_message(msg: &mut DynamicMessage, form: DecimalForm) {
    for (_, value) in msg.fields_mut() {
        rewrite_value(value, form);
    }
}

fn rewrite_value(value: &mut Value, form: DecimalForm) {
    match value {
        Value::Message(m) if is_decimal(m) => {
            let d: DecimalValueProto = m.transcode_to().expect("DecimalValueProto transcodes");
            if is_unset_decimal(&d) {
                return;
            }
            let v = decode_decimal(&d).unwrap_or_else(|e| panic!("decimal {:?} does not decode: {}", d, e));
            *m = DynamicMessage::decode(m.descriptor(), in_form(&v, form).encode_to_vec().as_slice())
                .expect("DecimalValueProto decodes");
        }
        Value::Message(m) => rewrite_message(m, form),
        Value::List(items) => items.iter_mut().for_each(|item| rewrite_value(item, form)),
        Value::Map(entries) => entries.values_mut().for_each(|item| rewrite_value(item, form)),
        _ => {}
    }
}

/// A copy of `msg` with every set decimal rewritten in `form`, keeping its
/// value and scale. Unset decimals are left as they are. Panics on a decimal
/// that does not decode, and on the types `find_decimals` rejects.
pub fn rewrite_decimals<M: Message + Default>(msg: &M, form: DecimalForm) -> M {
    let mut dynamic = to_dynamic(msg);
    rewrite_message(&mut dynamic, form);
    dynamic.transcode_to().expect("rewritten message decodes")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fintekkers::models::security::SecurityProto;
    use crate::fintekkers::requests::valuation::CurveRequestProto;

    #[test]
    fn type_names_map_to_proto_full_names() {
        assert_eq!(proto_full_name::<DecimalValueProto>(), DECIMAL_FULL_NAME);
        assert_eq!(proto_full_name::<SecurityProto>(), "fintekkers.models.security.SecurityProto");
        assert_eq!(proto_full_name::<CurveRequestProto>(), "fintekkers.requests.valuation.CurveRequestProto");
        // And each one is in the descriptor set.
        assert_eq!(descriptor_of::<DecimalValueProto>().full_name(), DECIMAL_FULL_NAME);
        assert_eq!(descriptor_of::<SecurityProto>().full_name(), "fintekkers.models.security.SecurityProto");
        assert_eq!(
            descriptor_of::<CurveRequestProto>().full_name(),
            "fintekkers.requests.valuation.CurveRequestProto"
        );
    }

    #[test]
    fn a_lone_decimal_is_not_walked_into() {
        // The walk starts at the message's fields, so a decimal's own fields
        // (bytes, uint32, string) are never listed.
        assert!(find_decimals(&both_forms("1.50")).is_empty());
    }

    #[test]
    #[should_panic(expected = "only top-level generated messages")]
    fn unknown_type_panics_naming_it() {
        #[derive(Clone, PartialEq, prost::Message)]
        struct NotInTheDescriptorSet {
            #[prost(string, tag = "1")]
            name: String,
        }
        find_decimals(&NotInTheDescriptorSet::default());
    }
}
