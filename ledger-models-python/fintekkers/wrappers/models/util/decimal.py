"""Codec for DecimalValueProto (LM-305, the Python side of LM-294; see
docs/adr/compact_decimal.md and the Rust reference in
ledger-models-rust/fintekkers/wrappers/models/utils/decimal.rs).

value = unscaled x 10^-scale, where `unscaled_value` (field 11) is a minimal
two's-complement big-endian integer of any size and `scale` is field 12. A
non-empty `unscaled_value` means the decimal is set; empty means unset. The
old string form, field 10, was deleted by LM-318.

Lossless: no binary floating point on any path. `float` input is a
TypeError; a value that cannot be represented exactly is a
ModelValidationError, never rounded. Decimals are built with the tuple
constructor, which ignores the active `decimal` context precision.
"""

from decimal import Decimal

from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation

# The same in every language (see the ADR).
MAX_DIGITS = 4096
MAX_SCALE = 4096
# A minimal unscaled_value longer than this always has more than MAX_DIGITS
# digits, so it is rejected before it is parsed.
MAX_UNSCALED_BYTES = 1702

# Any |unscaled| at or above this has more than MAX_DIGITS digits.
_DIGITS_LIMIT = 10 ** MAX_DIGITS


def _invalid(field: str, message: str) -> ModelValidationError:
    return ModelValidationError([violation(field, None, message)])


def is_decimal_set(proto: DecimalValueProto) -> bool:
    """True when unscaled_value is non-empty. A set zero is the byte 0x00."""
    return len(proto.unscaled_value) > 0


def decode_decimal(proto: DecimalValueProto) -> Decimal:
    """Decodes a DecimalValueProto to an exact Decimal whose exponent is
    -scale, so `1.50` keeps exponent -2.

    An empty unscaled_value ("decimal is required but unset") or a value
    over the limits is a ModelValidationError. Takes the proto only (owner
    ruling, 12 Oct, matching Rust's deserialize_decimal): a caller that wants
    the parent field named adds it while handling the error."""
    if len(proto.unscaled_value) == 0:
        raise _invalid("unscaled_value", "decimal is required but unset")
    unscaled, scale = _decode_compact(proto.unscaled_value, proto.scale)
    return _to_decimal(unscaled, scale)


def encode_decimal(value: "Decimal | int") -> DecimalValueProto:
    """Encodes fields 11 and 12.

    `float` and `bool` are a TypeError: a float cannot carry an exact
    decimal. NaN, Infinity and values over the limits are a
    ModelValidationError. Negative zero loses its sign; a positive exponent
    folds into the unscaled value with scale 0."""
    unscaled, scale = _to_parts(value)
    return DecimalValueProto(
        unscaled_value=_int_to_bytes(unscaled),
        scale=scale,
    )


def _decode_compact(unscaled_value: bytes, scale: int) -> tuple[int, int]:
    # Same order as Rust: scale, then length, then digits, before any large
    # allocation.
    if scale > MAX_SCALE:
        raise _invalid("scale", f"decimal has scale {scale}, over the limit of {MAX_SCALE}")
    if len(unscaled_value) > MAX_UNSCALED_BYTES:
        raise _invalid(
            "unscaled_value",
            f"decimal has a {len(unscaled_value)}-byte unscaled_value, "
            f"over the limit of {MAX_UNSCALED_BYTES} bytes",
        )
    unscaled = int.from_bytes(unscaled_value, "big", signed=True)
    if abs(unscaled) >= _DIGITS_LIMIT:
        raise _invalid("unscaled_value", f"decimal has more than {MAX_DIGITS} digits")
    return unscaled, scale


def _to_parts(value: "Decimal | int") -> tuple[int, int]:
    if isinstance(value, bool) or isinstance(value, float):
        raise TypeError(
            f"decimal value must be Decimal or int, not {type(value).__name__}: "
            "a float cannot hold an exact decimal"
        )
    if isinstance(value, int):
        if abs(value) >= _DIGITS_LIMIT:
            raise _invalid("unscaled_value", f"decimal has more than {MAX_DIGITS} digits")
        return value, 0
    if not isinstance(value, Decimal):
        raise TypeError(f"decimal value must be Decimal or int, not {type(value).__name__}")
    if not value.is_finite():
        raise _invalid("unscaled_value", f"decimal is not a finite decimal: {value}")

    sign, digits, exponent = value.as_tuple()
    if digits == (0,):
        # Zero has no sign; a positive exponent becomes scale 0.
        scale = max(-exponent, 0)
        if scale > MAX_SCALE:
            raise _invalid("scale", f"decimal has scale {scale}, over the limit of {MAX_SCALE}")
        return 0, scale
    zeros_to_append = exponent if exponent > 0 else 0
    if len(digits) + zeros_to_append > MAX_DIGITS:
        raise _invalid("unscaled_value", f"decimal has more than {MAX_DIGITS} digits")
    scale = -exponent if exponent < 0 else 0
    if scale > MAX_SCALE:
        raise _invalid("scale", f"decimal has scale {scale}, over the limit of {MAX_SCALE}")
    magnitude = int("".join(str(d) for d in digits) + "0" * zeros_to_append)
    return (-magnitude if sign else magnitude), scale


def _to_decimal(unscaled: int, scale: int) -> Decimal:
    # The tuple constructor is exact and ignores the context precision.
    digits = tuple(int(c) for c in str(abs(unscaled)))
    return Decimal((1 if unscaled < 0 else 0, digits, -scale))


def _int_to_bytes(n: int) -> bytes:
    """Minimal two's-complement big-endian bytes. Zero is the single byte 0x00."""
    length = ((n + (n < 0)).bit_length() // 8) + 1
    return n.to_bytes(length, "big", signed=True)
