//! Codec for `DecimalValueProto` (LM-294, docs/adr/compact_decimal.md).
//!
//! value = unscaled_value x 10^-scale, where unscaled_value is a minimal
//! two's-complement big-endian integer of any size. A non-empty
//! unscaled_value means the decimal is set; empty means unset. The old
//! string form, field 10, was deleted by LM-318.
//!
//! Lossless: no binary floating point on any path. A value that cannot be
//! represented exactly is a typed `Error::Validation`, never rounded. The
//! codec does not know which field it is decoding: a caller that wants the
//! field named labels the error with `Error::in_field`.

use crate::fintekkers::models::util::DecimalValueProto;
use crate::fintekkers::requests::util::errors::FieldViolationProto;
use crate::fintekkers::wrappers::models::utils::errors::Error;
use crate::fintekkers::wrappers::models::utils::serialization::ProtoSerializationUtil;

use num_bigint::{BigInt, Sign};
use rust_decimal::Decimal;
use std::fmt;

/// Most decimal digits allowed in the unscaled value, and the largest scale.
/// The same in every language (see the ADR). Stops input such as
/// `1E+999999999` or `scale = 4_000_000_000` from allocating gigabytes.
pub const MAX_DIGITS: usize = 4096;
pub const MAX_SCALE: u32 = 4096;
/// A minimal unscaled_value longer than this always has more than
/// `MAX_DIGITS` digits, so it is rejected before it is parsed.
pub const MAX_UNSCALED_BYTES: usize = 1702;

/// The largest scale `rust_decimal::Decimal` can hold.
const RUST_DECIMAL_MAX_SCALE: u32 = 28;
/// `rust_decimal::Decimal` holds a 96-bit unsigned magnitude.
const RUST_DECIMAL_MAX_BITS: u64 = 96;

/// An exact decimal: `unscaled x 10^-scale`.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CompactDecimal {
    pub unscaled: BigInt,
    pub scale: u32,
}

/// An unlabelled `Error::Validation`: `field` is empty until a caller adds
/// it with `Error::in_field`.
fn invalid(message: String) -> Error {
    Error::Validation(vec![FieldViolationProto {
        field: String::new(),
        object_id: None,
        message,
    }])
}

/// Parses a decimal string such as `1.50` or `1E+3`.
///
/// Grammar: `[+-]? (digits [. digits?] | . digits) ([eE] [+-]? digits)?`. No
/// whitespace, no `NaN` or `Infinity`. The exponent is folded into the scale;
/// a negative scale becomes scale 0 (`1E+3` is unscaled 1000, scale 0).
/// Anything else, or a result over `MAX_DIGITS` / `MAX_SCALE`, is
/// `Error::Validation`.
pub fn parse_decimal_str(s: &str) -> Result<CompactDecimal, Error> {
    let not_a_decimal = || invalid(format!("decimal is not a finite decimal: {:?}", preview(s)));
    let bytes = s.as_bytes();
    let mut i = 0;
    let negative = match bytes.first() {
        Some(b'-') => {
            i = 1;
            true
        }
        Some(b'+') => {
            i = 1;
            false
        }
        _ => false,
    };
    let int_start = i;
    while i < bytes.len() && bytes[i].is_ascii_digit() {
        i += 1;
    }
    let int_digits = &s[int_start..i];
    let mut frac_digits = "";
    if i < bytes.len() && bytes[i] == b'.' {
        i += 1;
        let frac_start = i;
        while i < bytes.len() && bytes[i].is_ascii_digit() {
            i += 1;
        }
        frac_digits = &s[frac_start..i];
    }
    if int_digits.is_empty() && frac_digits.is_empty() {
        return Err(not_a_decimal());
    }
    let mut exponent: i64 = 0;
    if i < bytes.len() && (bytes[i] == b'e' || bytes[i] == b'E') {
        i += 1;
        let exp_negative = match bytes.get(i) {
            Some(b'-') => {
                i += 1;
                true
            }
            Some(b'+') => {
                i += 1;
                false
            }
            _ => false,
        };
        let exp_start = i;
        while i < bytes.len() && bytes[i].is_ascii_digit() {
            i += 1;
        }
        let exp_digits = s[exp_start..i].trim_start_matches('0');
        if i == exp_start {
            return Err(not_a_decimal());
        }
        // Any exponent this long is far past the caps below.
        if exp_digits.len() > 12 {
            return Err(over_cap(s));
        }
        let magnitude: i64 = if exp_digits.is_empty() {
            0
        } else {
            exp_digits.parse().map_err(|_| not_a_decimal())?
        };
        exponent = if exp_negative { -magnitude } else { magnitude };
    }
    if i != bytes.len() {
        return Err(not_a_decimal());
    }

    let digits = format!("{}{}", int_digits, frac_digits);
    let significant = digits.trim_start_matches('0');
    let scale = frac_digits.len() as i64 - exponent;
    if significant.is_empty() {
        // Zero keeps its scale (`0.00` is scale 2); `0E+3` is scale 0.
        let scale = scale.max(0);
        if scale > MAX_SCALE as i64 {
            return Err(over_cap(s));
        }
        return Ok(CompactDecimal { unscaled: BigInt::from(0), scale: scale as u32 });
    }
    let zeros_to_append = if scale < 0 { -scale } else { 0 };
    if scale > MAX_SCALE as i64 || significant.len() as i64 + zeros_to_append > MAX_DIGITS as i64 {
        return Err(over_cap(s));
    }
    let mut text = String::with_capacity(significant.len() + zeros_to_append as usize + 1);
    if negative {
        text.push('-');
    }
    text.push_str(significant);
    text.extend(std::iter::repeat('0').take(zeros_to_append as usize));
    let unscaled: BigInt = text.parse().map_err(|_| not_a_decimal())?;
    Ok(CompactDecimal { unscaled, scale: scale.max(0) as u32 })
}

fn over_cap(s: &str) -> Error {
    invalid(
        format!(
            "decimal is over the limit of {} digits or scale {}: {:?}",
            MAX_DIGITS,
            MAX_SCALE,
            preview(s)
        ),
    )
}

/// At most the first 64 characters of `s`, for error messages.
fn preview(s: &str) -> String {
    s.chars().take(64).collect()
}

/// True when `unscaled_value` is empty. A set zero is the byte 0x00.
pub fn is_unset_decimal(p: &DecimalValueProto) -> bool {
    p.unscaled_value.is_empty()
}

/// Decodes the compact form (fields 11 and 12). Rejects a scale over
/// `MAX_SCALE`, bytes over `MAX_UNSCALED_BYTES` or more than `MAX_DIGITS`
/// digits, before any large allocation.
pub fn decode_compact(unscaled_value: &[u8], scale: u32) -> Result<CompactDecimal, Error> {
    if scale > MAX_SCALE {
        return Err(invalid(format!(
            "decimal has scale {}, over the limit of {}",
            scale, MAX_SCALE
        )));
    }
    if unscaled_value.len() > MAX_UNSCALED_BYTES {
        return Err(invalid(
            format!(
                "decimal has a {}-byte unscaled_value, over the limit of {} bytes",
                unscaled_value.len(),
                MAX_UNSCALED_BYTES
            ),
        ));
    }
    let unscaled = BigInt::from_signed_bytes_be(unscaled_value);
    if digit_count(&unscaled) > MAX_DIGITS {
        return Err(invalid(format!("decimal has more than {} digits", MAX_DIGITS)));
    }
    Ok(CompactDecimal { unscaled, scale })
}

fn digit_count(n: &BigInt) -> usize {
    n.magnitude().to_str_radix(10).len()
}

/// Decodes a `DecimalValueProto`. An empty `unscaled_value` is
/// `Error::Validation` ("decimal is required but unset"); so is an over-cap
/// value.
pub fn decode_decimal(p: &DecimalValueProto) -> Result<CompactDecimal, Error> {
    if p.unscaled_value.is_empty() {
        return Err(invalid("decimal is required but unset".to_string()));
    }
    decode_compact(&p.unscaled_value, p.scale)
}

/// Encodes fields 11 and 12, with the minimal unscaled bytes.
pub fn encode_decimal(v: &CompactDecimal) -> DecimalValueProto {
    DecimalValueProto {
        unscaled_value: v.unscaled.to_signed_bytes_be(),
        scale: v.scale,
    }
}

/// A `DecimalValueProto` holding `d`.
pub fn decimal_proto(d: &Decimal) -> DecimalValueProto {
    encode_decimal(&CompactDecimal::from(d))
}

/// Rewrites `p` with minimal unscaled bytes, decoding it first.
pub fn reencode_decimal(p: &mut DecimalValueProto) -> Result<(), Error> {
    *p = encode_decimal(&decode_decimal(p)?);
    Ok(())
}

/// Decodes a required decimal field (LM-312). `None`, or a value that does
/// not decode, is `Error::Validation` whose violation field is `field`, e.g.
/// `price: decimal is required but unset (id null)`. Callers map the error
/// to their own gRPC status.
pub fn require_decimal(p: &Option<DecimalValueProto>, field: &str) -> Result<Decimal, Error> {
    match p {
        None => Err(invalid("decimal is required but unset".to_string()).in_field(field)),
        Some(p) => ProtoSerializationUtil::deserialize_decimal(p).map_err(|e| e.in_field(field)),
    }
}

impl CompactDecimal {
    pub fn is_zero(&self) -> bool {
        self.unscaled.sign() == Sign::NoSign
    }

    /// Plain notation, never an exponent, keeping trailing zeros: unscaled
    /// 150 scale 2 is `1.50`. Zero has no sign.
    pub fn to_canonical_string(&self) -> String {
        let digits = self.unscaled.magnitude().to_str_radix(10);
        let scale = self.scale as usize;
        let mut out = String::with_capacity(digits.len() + scale + 3);
        if self.unscaled.sign() == Sign::Minus {
            out.push('-');
        }
        if scale == 0 {
            out.push_str(&digits);
        } else if digits.len() > scale {
            let (int_part, frac_part) = digits.split_at(digits.len() - scale);
            out.push_str(int_part);
            out.push('.');
            out.push_str(frac_part);
        } else {
            out.push_str("0.");
            out.extend(std::iter::repeat('0').take(scale - digits.len()));
            out.push_str(&digits);
        }
        out
    }

    /// Converts to `rust_decimal::Decimal`, keeping the scale. A scale over 28
    /// or a magnitude over 96 bits is `Error::Validation`; never rounded.
    pub fn to_rust_decimal(&self) -> Result<Decimal, Error> {
        if self.scale > RUST_DECIMAL_MAX_SCALE {
            return Err(invalid(format!(
                "decimal has scale {}; Rust Decimal holds at most {}",
                self.scale, RUST_DECIMAL_MAX_SCALE
            )));
        }
        if self.unscaled.magnitude().bits() > RUST_DECIMAL_MAX_BITS {
            return Err(invalid(
                "decimal needs more than 96 bits; too large for Rust Decimal".to_string(),
            ));
        }
        let mantissa = i128::try_from(&self.unscaled)
            .map_err(|_| invalid("decimal is too large for Rust Decimal".to_string()))?;
        Ok(Decimal::from_i128_with_scale(mantissa, self.scale))
    }
}

impl From<&Decimal> for CompactDecimal {
    fn from(d: &Decimal) -> Self {
        CompactDecimal { unscaled: BigInt::from(d.mantissa()), scale: d.scale() }
    }
}

impl fmt::Display for CompactDecimal {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str(&self.to_canonical_string())
    }
}

// ---- DecimalWrapper ----

pub struct DecimalWrapper {
    proto: DecimalValueProto,
}

impl AsRef<DecimalValueProto> for DecimalWrapper {
    fn as_ref(&self) -> &DecimalValueProto {
        &self.proto
    }
}

impl DecimalWrapper {
    pub fn new(proto: DecimalValueProto) -> Self {
        DecimalWrapper { proto }
    }
}

impl From<&str> for DecimalWrapper {
    /// The compact form when `value` parses. A value that does not parse
    /// gives an unset decimal, so reading it later is the error.
    fn from(value: &str) -> Self {
        let proto = parse_decimal_str(value).map(|v| encode_decimal(&v)).unwrap_or_default();
        DecimalWrapper { proto }
    }
}

impl From<&Decimal> for DecimalWrapper {
    fn from(value: &Decimal) -> Self {
        DecimalWrapper { proto: decimal_proto(value) }
    }
}

impl From<Decimal> for DecimalWrapper {
    fn from(value: Decimal) -> Self {
        DecimalWrapper { proto: decimal_proto(&value) }
    }
}

impl From<DecimalWrapper> for DecimalValueProto {
    fn from(value: DecimalWrapper) -> Self {
        value.proto
    }
}

impl TryFrom<DecimalWrapper> for Decimal {
    type Error = Error;

    /// Keeps `Error::DecimalConversion`, as before LM-294, for existing
    /// callers of this conversion. `ProtoSerializationUtil::deserialize_decimal`
    /// is the typed path: it returns `Error::Validation` (LM-307).
    fn try_from(value: DecimalWrapper) -> Result<Self, Error> {
        decode_decimal(&value.proto)
            .and_then(|v| v.to_rust_decimal())
            .map_err(|_| Error::DecimalConversion)
    }
}

impl fmt::Display for DecimalWrapper {
    /// The canonical string, keeping trailing zeros. Empty when the decimal
    /// is unset or does not decode.
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        match decode_decimal(&self.proto) {
            Ok(v) => fmt.write_str(&v.to_canonical_string()),
            Err(_) => Ok(()),
        }
    }
}

/// The `DecimalValueProto` for a decimal string such as `1.50`. Panics on a
/// string that does not parse. Tests only.
#[cfg(test)]
pub(crate) fn decimal_proto_str(s: &str) -> DecimalValueProto {
    encode_decimal(&parse_decimal_str(s).unwrap_or_else(|e| panic!("{s:?}: {e}")))
}

#[cfg(test)]
mod test {
    use super::*;
    use prost::Message;

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }

    fn unhex(s: &str) -> Vec<u8> {
        (0..s.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&s[i..i + 2], 16).unwrap())
            .collect()
    }

    fn fixture() -> serde_json::Value {
        let text = include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../ledger-models-protos/fixtures/decimal_compact.json"
        ));
        serde_json::from_str(text).expect("parse decimal_compact.json")
    }

    fn cases(section: &str) -> Vec<serde_json::Value> {
        fixture()[section].as_array().unwrap_or_else(|| panic!("fixture has {}", section)).clone()
    }

    fn str_of<'a>(case: &'a serde_json::Value, key: &str) -> &'a str {
        case[key].as_str().unwrap_or_else(|| panic!("{} in {}", key, case))
    }

    /// The codec's errors are unlabelled; a caller labels them with
    /// `Error::in_field`.
    fn assert_validation_on(err: Error, field: &str) {
        assert!(matches!(err, Error::Validation(_)), "expected Validation, got {:?}", err);
        assert_eq!(err.violations()[0].field, "", "{:?}", err);
        let err = err.in_field(field);
        assert_eq!(err.violations()[0].field, field, "{:?}", err);
    }

    // ---- Metric 1: the shared fixture ----

    #[test]
    fn fixture_cases_encode_to_wire_hex_and_decode_exactly() {
        let cases = cases("cases");
        assert!(cases.len() >= 12, "fixture has too few cases");
        for case in &cases {
            let name = str_of(case, "name");
            let parsed = parse_decimal_str(str_of(case, "string")).expect(name);
            let expected_unscaled = BigInt::from_signed_bytes_be(&unhex(str_of(case, "unscaled_hex")));
            let expected_scale = case["scale"].as_u64().unwrap() as u32;
            assert_eq!(parsed.unscaled, expected_unscaled, "{}", name);
            assert_eq!(parsed.scale, expected_scale, "{}", name);
            assert_eq!(parsed.to_canonical_string(), str_of(case, "canonical"), "{}", name);

            // Encode: exact bytes, fields 11 and 12 only.
            let proto = encode_decimal(&parsed);
            assert_eq!(hex(&proto.unscaled_value), str_of(case, "unscaled_hex"), "{}", name);
            assert_eq!(hex(&proto.encode_to_vec()), str_of(case, "wire_hex"), "{}", name);

            // Decode the fixture's wire bytes through the compact form only.
            let decoded = DecimalValueProto::decode(unhex(str_of(case, "wire_hex")).as_slice()).unwrap();
            let compact = decode_decimal(&decoded).expect(name);
            assert_eq!(compact, CompactDecimal { unscaled: expected_unscaled, scale: expected_scale }, "{}", name);
        }
    }

    #[test]
    fn fixture_limits_match_the_codec() {
        let limits = &fixture()["limits"];
        assert_eq!(limits["max_digits"].as_u64(), Some(MAX_DIGITS as u64));
        assert_eq!(limits["max_scale"].as_u64(), Some(MAX_SCALE as u64));
        assert_eq!(limits["max_unscaled_bytes"].as_u64(), Some(MAX_UNSCALED_BYTES as u64));
    }

    #[test]
    fn fixture_string_errors_name_the_field() {
        let cases = cases("string_errors");
        assert!(cases.len() >= 4);
        for case in &cases {
            let err = parse_decimal_str(str_of(case, "string")).expect_err(str_of(case, "name"));
            assert_validation_on(err, "price");
        }
    }

    #[test]
    fn fixture_decode_errors_name_the_field() {
        let cases = cases("decode_errors");
        assert!(cases.len() >= 3);
        for case in &cases {
            let name = str_of(case, "name");
            let unscaled = match case.get("unscaled_hex_repeat") {
                Some(r) => unhex(str_of(r, "hex")).repeat(r["count"].as_u64().unwrap() as usize),
                None => unhex(str_of(case, "unscaled_hex")),
            };
            let proto = DecimalValueProto {
                unscaled_value: unscaled,
                scale: case["scale"].as_u64().unwrap() as u32,
                ..Default::default()
            };
            let err = decode_decimal(&proto).expect_err(name);
            assert_validation_on(err, "price");
        }
    }

    // ---- Metric 2: exponent strings ----

    #[test]
    fn exponent_strings_translate() {
        let v = parse_decimal_str("1E+3").unwrap();
        assert_eq!(v, CompactDecimal { unscaled: BigInt::from(1000), scale: 0 });
        let v = parse_decimal_str("1.5E-3").unwrap();
        assert_eq!(v, CompactDecimal { unscaled: BigInt::from(15), scale: 4 });
    }

    // ---- Metric 5: bad input, rust_decimal limits, precedence ----

    #[test]
    fn non_finite_and_malformed_strings_name_the_field() {
        let long_non_ascii = format!("1E+{}{}", "9".repeat(60), "é".repeat(40));
        for s in ["abc", "NaN", "Infinity", "-Infinity", "1E+5000", " 1", "1.2.3", "1e", ".", long_non_ascii.as_str()] {
            let err = parse_decimal_str(s).expect_err(s);
            assert_validation_on(err, "price");
        }
    }

    #[test]
    fn too_big_for_rust_decimal_is_an_error_not_rounded() {
        let scale_29 = CompactDecimal { unscaled: BigInt::from(1), scale: 29 };
        assert_validation_on(scale_29.to_rust_decimal().unwrap_err(), "price");
        let bits_97 = CompactDecimal { unscaled: BigInt::from(1) << 96usize, scale: 0 };
        assert_validation_on(bits_97.to_rust_decimal().unwrap_err(), "price");
        let neg_bits_97 = CompactDecimal { unscaled: -(BigInt::from(1) << 96usize), scale: 0 };
        assert_validation_on(neg_bits_97.to_rust_decimal().unwrap_err(), "price");

        // The limits themselves convert exactly.
        let max = CompactDecimal { unscaled: (BigInt::from(1) << 96usize) - 1, scale: 28 };
        let d = max.to_rust_decimal().unwrap();
        assert_eq!(CompactDecimal::from(&d), max);
    }

    #[test]
    fn a_string_only_decimal_from_old_bytes_is_unset() {
        // A v0.4.33 writer stored 1.5 as field 10 only (0x52 = field 10,
        // length-delimited). LM-318 deleted field 10, so it is an unknown
        // field: the decimal is unset and reading it is the typed error.
        let old = DecimalValueProto::decode(&b"\x52\x031.5"[..]).unwrap();
        assert!(is_unset_decimal(&old));
        let err = decode_decimal(&old).unwrap_err();
        assert!(err.to_string().contains("decimal is required but unset"), "{}", err);
        assert_validation_on(err, "price");
    }

    #[test]
    fn unset_is_an_error_naming_the_field() {
        let err = decode_decimal(&DecimalValueProto::default()).unwrap_err();
        assert_validation_on(err, "price");
        assert!(is_unset_decimal(&DecimalValueProto::default()));
        // Zero in compact form is set.
        assert!(!is_unset_decimal(&decimal_proto(&Decimal::ZERO)));
        assert_eq!(decimal_proto(&Decimal::ZERO).unscaled_value, vec![0x00]);
    }

    // ---- Guardrail 1: lossless ----

    #[test]
    fn big_values_round_trip_exactly() {
        let two_127 = BigInt::from(1) << 127usize;
        for v in [
            CompactDecimal { unscaled: two_127.clone(), scale: 0 },
            CompactDecimal { unscaled: -two_127 - 1, scale: 0 },
            CompactDecimal { unscaled: BigInt::from(1), scale: 30 },
            CompactDecimal { unscaled: BigInt::from(-1), scale: 40 },
        ] {
            let bytes = encode_decimal(&v).encode_to_vec();
            let back = decode_decimal(&DecimalValueProto::decode(bytes.as_slice()).unwrap()).unwrap();
            assert_eq!(back, v);
            // The canonical string parses back to the same value.
            assert_eq!(parse_decimal_str(&v.to_canonical_string()).unwrap(), v);
        }
    }

    #[test]
    fn non_minimal_bytes_decode_and_reencode_minimal() {
        let v = decode_compact(&[0x00, 0x00, 0x01], 0).unwrap();
        assert_eq!(v.unscaled, BigInt::from(1));
        assert_eq!(encode_decimal(&v).unscaled_value, vec![0x01]);
        let v = decode_compact(&[0xff, 0xff], 0).unwrap();
        assert_eq!(v.unscaled, BigInt::from(-1));
        assert_eq!(encode_decimal(&v).unscaled_value, vec![0xff]);
    }

    #[test]
    fn codec_has_no_binary_float() {
        let source = include_str!("decimal.rs");
        let (float_32, float_64) = (concat!("f", "32"), concat!("f", "64"));
        for (n, line) in source.lines().enumerate() {
            let code = line.split("//").next().unwrap_or("");
            assert!(
                !code.contains(float_32) && !code.contains(float_64),
                "decimal.rs line {} uses a binary float: {}",
                n + 1,
                line
            );
        }
    }

    // ---- Guardrail 2: wire layout ----

    #[test]
    fn descriptor_reserves_1_and_3_and_has_only_fields_11_and_12() {
        use prost_types::field_descriptor_proto::Type;
        use prost_types::FileDescriptorSet;
        let set = FileDescriptorSet::decode(crate::fintekkers::proto::LEDGER_MODELS_PROTO_FILE_DESCRIPTOR_SET).unwrap();
        let message = set
            .file
            .iter()
            .filter(|f| f.package() == "fintekkers.models.util")
            .flat_map(|f| f.message_type.iter())
            .find(|m| m.name() == "DecimalValueProto")
            .expect("DecimalValueProto in descriptor set");
        let reserved: Vec<(i32, i32)> = message.reserved_range.iter().map(|r| (r.start(), r.end())).collect();
        assert!(reserved.contains(&(1, 2)), "{:?}", reserved);
        assert!(reserved.contains(&(3, 4)), "{:?}", reserved);
        let field = |number: i32| message.field.iter().find(|f| f.number() == number).unwrap();
        assert_eq!(field(11).name(), "unscaled_value");
        assert_eq!(field(11).r#type(), Type::Bytes);
        assert_eq!(field(12).name(), "scale");
        assert_eq!(field(12).r#type(), Type::Uint32);
        assert_eq!(message.field.len(), 2);
    }

    // ---- require_decimal (LM-312) ----

    #[test]
    fn require_decimal_none_names_field() {
        let err = require_decimal(&None, "price").unwrap_err();
        assert!(matches!(err, Error::Validation(_)), "expected Validation, got {:?}", err);
        assert_eq!(err.violations()[0].field, "price");
        assert!(err.to_string().contains("price"), "{}", err);
    }

    #[test]
    fn require_decimal_undecodable_names_field() {
        let over_cap = DecimalValueProto { unscaled_value: vec![0x01], scale: MAX_SCALE + 1 };
        let err = require_decimal(&Some(over_cap), "price").unwrap_err();
        assert!(matches!(err, Error::Validation(_)), "expected Validation, got {:?}", err);
        assert_eq!(err.violations()[0].field, "price");
        assert!(err.to_string().contains("price"), "{}", err);
    }

    #[test]
    fn require_decimal_keeps_the_scale() {
        let p = DecimalValueProto { unscaled_value: vec![0x00, 0x96], scale: 2 };
        let d = require_decimal(&Some(p), "price").unwrap();
        assert_eq!(d.scale(), 2);
        assert_eq!(d.to_string(), "1.50");
    }

    // ---- DecimalWrapper (unchanged behaviour) ----

    #[test]
    fn test_proto_to_decimal() {
        let input = DecimalWrapper::new(decimal_proto_str("1234567.89"));

        let output: Decimal = input.try_into().unwrap();

        assert_eq!(output.to_string(), "1234567.89");
    }

    #[test]
    fn test_decimal_to_proto() {
        let input = Decimal::from_i128_with_scale(123456789, 2);
        let output = DecimalWrapper::from(&input);

        assert_eq!(output.proto.unscaled_value, BigInt::from(123456789).to_signed_bytes_be());
        assert_eq!(output.proto.scale, 2);
        assert_eq!(output.to_string(), "1234567.89");
    }

    #[test]
    fn display_keeps_trailing_zeros() {
        assert_eq!(DecimalWrapper::from("1.50").to_string(), "1.50");
        assert_eq!(DecimalWrapper::from("1E+3").to_string(), "1000");
        assert_eq!(DecimalWrapper::new(decimal_proto_str("1234567.89")).to_string(), "1234567.89");
        // An unset decimal, or a string that does not parse, prints nothing.
        assert_eq!(DecimalWrapper::new(DecimalValueProto::default()).to_string(), "");
        assert_eq!(DecimalWrapper::from("NaN").to_string(), "");
    }
}
