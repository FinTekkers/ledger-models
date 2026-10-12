"""Compact object type and version (LM-297), stage 1: write both forms, read the new one.

Every message with `string object_class = 1` and `string version = 2` also
carries `ObjectTypeProto object_type = 1001` and `uint32 version_major /
version_minor / version_patch = 1002-1004`. Writers call `stamp`, which sets
the strings and the new fields. Readers call `read_type` / `read_version`
(or `upgrade`), which use the new fields and fall back to the deprecated
strings, logging one warning per distinct pair of strings. A fallback never
raises: an unknown object_class gives OBJECT_TYPE_UNKNOWN and a malformed
version gives (0, 0, 0). Empty strings are the proto3 default and fall back
silently. See docs/adr/compact_object_type_and_version.md.
"""
import logging
import re
import threading
from typing import Dict, Optional, Tuple

from fintekkers.models.util import object_type_pb2
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto

LOGGER = logging.getLogger(__name__)

Version = Tuple[int, int, int]

_UINT32_MAX = 2**32 - 1
_VERSION = re.compile(r"[0-9]+\.[0-9]+\.[0-9]+")


def _legacy_map() -> Dict[str, int]:
    """object_class string -> ObjectTypeProto value, from the enum's (legacy_object_class) options."""
    mapping = {}
    for value in ObjectTypeProto.DESCRIPTOR.values:
        for legacy in value.GetOptions().Extensions[object_type_pb2.legacy_object_class]:
            mapping[legacy] = value.number
    return mapping


_LEGACY = _legacy_map()
_PREFIX = ObjectTypeProto.Name(ObjectTypeProto.OBJECT_TYPE_UNKNOWN)[: -len("UNKNOWN")]
_CAMEL_BOUNDARY = re.compile(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")
_warned = set()
_warned_lock = threading.Lock()


def from_legacy(object_class: str) -> int:
    """The ObjectTypeProto value an object_class string stands for, or OBJECT_TYPE_UNKNOWN."""
    return _LEGACY.get(object_class, ObjectTypeProto.OBJECT_TYPE_UNKNOWN)


def own_type(message_name: str) -> int:
    """The ObjectTypeProto value named for a message type, or OBJECT_TYPE_UNKNOWN.

    Uses the enum's naming rule: `QuerySecurityRequestProto` ->
    OBJECT_TYPE_QUERY_SECURITY_REQUEST.
    """
    base = message_name[: -len("Proto")] if message_name.endswith("Proto") else message_name
    snake = _CAMEL_BOUNDARY.sub("_", base).upper()
    value = ObjectTypeProto.DESCRIPTOR.values_by_name.get(_PREFIX + snake)
    return value.number if value is not None else ObjectTypeProto.OBJECT_TYPE_UNKNOWN


def parse_version(version: str) -> Optional[Version]:
    """'1.2.3' -> (1, 2, 3); None unless exactly three decimal uint32 parts."""
    if not _VERSION.fullmatch(version):
        return None
    parts = tuple(int(p) for p in version.split("."))
    if any(p > _UINT32_MAX for p in parts):
        return None
    return parts


def stamp(message, object_type: int, object_class: str, version: str):
    """Sets object_class / version and their compact form on `message`; returns it.

    `object_type` is the message's own ObjectTypeProto value. `version` must
    be empty or three uint32 parts.
    """
    parts = parse_version(version) if version else (0, 0, 0)
    if parts is None:
        raise ValueError(f"version must be MAJOR.MINOR.PATCH, got {version!r}")
    message.object_class = object_class
    message.version = version
    message.object_type = object_type
    message.version_major, message.version_minor, message.version_patch = parts
    return message


def _compact_version(message) -> Version:
    return (message.version_major, message.version_minor, message.version_patch)


def _warn_once(message, problem: str) -> None:
    key = (message.object_class, message.version)
    with _warned_lock:
        if key in _warned:
            return
        _warned.add(key)
    LOGGER.warning(
        "%s read from deprecated strings object_class=%r version=%r%s; re-save it to write "
        "object_type and version_major/minor/patch (LM-297)",
        message.DESCRIPTOR.name, message.object_class, message.version, problem,
    )


def _fallback(message) -> Tuple[int, Version]:
    """Decodes the new fields, falling back field by field to the strings."""
    object_type = message.object_type
    version = _compact_version(message)
    problems = []
    used_strings = False

    if object_type == ObjectTypeProto.OBJECT_TYPE_UNKNOWN and message.object_class:
        used_strings = True
        object_type = from_legacy(message.object_class)
        if object_type == ObjectTypeProto.OBJECT_TYPE_UNKNOWN:
            problems.append(" (unknown object_class, using OBJECT_TYPE_UNKNOWN)")
        else:
            # Some strings were written on more than one message type (e.g.
            # "SecurityRequest" on the create and query requests): the
            # message's own type wins over the value the string sits on.
            own = own_type(message.DESCRIPTOR.name)
            if own != ObjectTypeProto.OBJECT_TYPE_UNKNOWN:
                object_type = own

    if version == (0, 0, 0) and message.version:
        used_strings = True
        parsed = parse_version(message.version)
        if parsed is None:
            problems.append(" (malformed version, using 0.0.0)")
        else:
            version = parsed

    if used_strings:
        _warn_once(message, "".join(problems))
    return object_type, version


def read_type(message) -> int:
    """The message's ObjectTypeProto value: object_type, else the object_class string."""
    return _fallback(message)[0]


def read_version(message) -> Version:
    """The message's (major, minor, patch): the compact fields, else the version string."""
    return _fallback(message)[1]


def upgrade(message):
    """Fills the compact fields from the strings where they are unset; returns `message`.

    The strings are left as they are, so re-serialising writes both forms.
    """
    object_type, version = _fallback(message)
    message.object_type = object_type
    message.version_major, message.version_minor, message.version_patch = version
    return message


def _reset_warnings_for_tests() -> None:
    """Forgets which strings have warned. Tests only."""
    with _warned_lock:
        _warned.clear()
