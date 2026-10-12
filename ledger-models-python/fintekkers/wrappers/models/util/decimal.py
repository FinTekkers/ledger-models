"""Codec for DecimalValueProto (LM-305, the Python side of LM-294; see
docs/adr/compact_decimal.md and the Rust reference in
ledger-models-rust/fintekkers/wrappers/models/utils/decimal.rs).

value = unscaled x 10^-scale, where `unscaled_value` (field 11) is a minimal
two's-complement big-endian integer of any size and `scale` is field 12. A
non-empty `unscaled_value` means the compact form is set and it wins.
Otherwise the deprecated `arbitrary_precision_value` string (field 10) is
read, with a warning logged once per process (LM-307).

Lossless: no binary floating point on any path. `float` input is a
TypeError; a value that cannot be represented exactly is a
ModelValidationError, never rounded. Decimals are built with the tuple
constructor, which ignores the active `decimal` context precision.

Stage 1 (until LM-295): writers set both forms, so readers on older
ledger-models keep working. This module is the only code allowed to write
the deprecated string field.
"""

import logging
import re
import threading
import warnings
from decimal import Decimal

from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.wrappers.models.errors import ModelValidationError, violation

# The same in every language (see the ADR).
MAX_DIGITS = 4096
MAX_SCALE = 4096
# A minimal unscaled_value longer than this always has more than MAX_DIGITS
# digits, so it is rejected before it is parsed.
MAX_UNSCALED_BYTES = 1702

# The library release that first writes the compact form.
_FIRST_COMPACT_RELEASE = "v0.4.34"

# Any |unscaled| at or above this has more than MAX_DIGITS digits.
_DIGITS_LIMIT = 10 ** MAX_DIGITS

# [+-]? (digits [. digits?] | . digits) ([eE] [+-]? digits)?  ASCII digits only.
_DECIMAL_STRING = re.compile(
    r"([+-]?)(?:([0-9]+)(?:\.([0-9]*))?|\.([0-9]+))(?:[eE]([+-]?)([0-9]+))?"
)

_logger = logging.getLogger("fintekkers.decimal")
_legacy_logged = False
_legacy_lock = threading.Lock()


def _invalid(field: str, message: str) -> ModelValidationError:
    return ModelValidationError([violation(field, None, message)])


def _preview(s: str) -> str:
    return repr(s[:64])


def is_decimal_set(proto: DecimalValueProto) -> bool:
    """True when either form is set. Both empty means the decimal is unset."""
    return len(proto.unscaled_value) > 0 or proto.arbitrary_precision_value != ""


def decode_decimal(proto: DecimalValueProto) -> Decimal:
    """Decodes a DecimalValueProto to an exact Decimal whose exponent is
    -scale, so `1.50` keeps exponent -2.

    The compact form wins when set. Otherwise falls back to the deprecated
    string and logs a deprecation warning, once per process. Both forms
    empty, a malformed string or a value over the limits is a
    ModelValidationError. Takes the proto only (owner ruling, 12 Oct,
    matching Rust's deserialize_decimal): a caller that wants the parent
    field named adds it while handling the error."""
    if len(proto.unscaled_value) > 0:
        unscaled, scale = _decode_compact(proto.unscaled_value, proto.scale)
    else:
        legacy = proto.arbitrary_precision_value
        if legacy == "":
            raise _invalid("unscaled_value", "decimal is required but unset")
        _log_legacy_read()
        unscaled, scale = _parse_decimal_string(legacy)
    return _to_decimal(unscaled, scale)


def encode_decimal(value: "Decimal | int") -> DecimalValueProto:
    """Encodes both forms (stage 1): fields 11 and 12, plus the canonical
    string in field 10 for readers older than v0.4.34.

    `float` and `bool` are a TypeError: a float cannot carry an exact
    decimal. NaN, Infinity and values over the limits are a
    ModelValidationError. Negative zero loses its sign; a positive exponent
    folds into the unscaled value with scale 0."""
    unscaled, scale = _to_parts(value)
    return DecimalValueProto(
        arbitrary_precision_value=_canonical_string(unscaled, scale),
        unscaled_value=_int_to_bytes(unscaled),
        scale=scale,
    )


def legacy_string(proto: DecimalValueProto) -> str:
    """The deprecated `arbitrary_precision_value` string, as stored. Emits a
    DeprecationWarning on every call: use decode_decimal instead. The
    generated `.arbitrary_precision_value` attribute does not warn (Python's
    protobuf generator ignores `[deprecated = true]`), so this is the
    accessor Python code should use until LM-296 deletes the field."""
    warnings.warn(
        "DecimalValueProto.arbitrary_precision_value is deprecated (LM-294); "
        "use fintekkers.wrappers.models.util.decimal.decode_decimal",
        DeprecationWarning,
        stacklevel=2,
    )
    return proto.arbitrary_precision_value


def _log_legacy_read() -> None:
    global _legacy_logged
    with _legacy_lock:
        if _legacy_logged:
            return
        _legacy_logged = True
    _logger.warning(
        "DecimalValueProto.arbitrary_precision_value read: deprecated string "
        "form; writer predates ledger-models %s", _FIRST_COMPACT_RELEASE,
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


def _over_cap(s: str) -> ModelValidationError:
    return _invalid(
        "arbitrary_precision_value",
        f"decimal is over the limit of {MAX_DIGITS} digits or scale {MAX_SCALE}: {_preview(s)}",
    )


def _parse_decimal_string(s: str) -> tuple[int, int]:
    """Parses field 10 per the ADR grammar. The exponent folds into the
    scale; a negative scale becomes scale 0 (`1E+3` is unscaled 1000, scale
    0). Trailing zeros are kept. Caps are checked before any expansion."""
    m = _DECIMAL_STRING.fullmatch(s)
    if m is None:
        raise _invalid(
            "arbitrary_precision_value", f"decimal is not a finite decimal: {_preview(s)}"
        )
    sign, int_digits, frac_digits, point_digits, exp_sign, exp_digits = m.groups()
    if point_digits is not None:
        int_digits, frac_digits = "", point_digits
    frac_digits = frac_digits or ""

    exponent = 0
    if exp_digits is not None:
        exp_digits = exp_digits.lstrip("0")
        # Any exponent this long is far past the caps below.
        if len(exp_digits) > 12:
            raise _over_cap(s)
        exponent = int(exp_digits or "0")
        if exp_sign == "-":
            exponent = -exponent

    significant = (int_digits + frac_digits).lstrip("0")
    scale = len(frac_digits) - exponent
    if significant == "":
        # Zero has no sign and keeps its scale (`0.00` is scale 2); `0E+3` is scale 0.
        zero_scale = max(scale, 0)
        if zero_scale > MAX_SCALE:
            raise _over_cap(s)
        return 0, zero_scale
    zeros_to_append = -scale if scale < 0 else 0
    if scale > MAX_SCALE or len(significant) + zeros_to_append > MAX_DIGITS:
        raise _over_cap(s)
    magnitude = int(significant + "0" * zeros_to_append)
    return (-magnitude if sign == "-" else magnitude), max(scale, 0)


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


def _canonical_string(unscaled: int, scale: int) -> str:
    """Plain notation, never an exponent, keeping trailing zeros: unscaled
    150 scale 2 is `1.50`. Never str(Decimal), which prints `1E-7`."""
    sign = "-" if unscaled < 0 else ""
    digits = str(abs(unscaled))
    if scale == 0:
        return sign + digits
    if len(digits) > scale:
        return f"{sign}{digits[:-scale]}.{digits[-scale:]}"
    return f"{sign}0.{'0' * (scale - len(digits))}{digits}"


def _int_to_bytes(n: int) -> bytes:
    """Minimal two's-complement big-endian bytes. Zero is the single byte 0x00."""
    length = ((n + (n < 0)).bit_length() // 8) + 1
    return n.to_bytes(length, "big", signed=True)
