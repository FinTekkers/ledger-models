"""Object type and version (LM-297, LM-318).

Every message that names its type carries `ObjectTypeProto object_type = 1`
and `VersionProto version = 2`. Writers call `stamp`, which sets the type and
`SCHEMA_VERSION`. Readers call `read_type` / `read_version`. The old
`object_class` / `version` strings were replaced in place by LM-318: bytes
written before it are not readable. See
docs/adr/compact_object_type_and_version.md.
"""
from typing import Optional, Tuple

from fintekkers.models.util.version_pb2 import VersionProto

Version = Tuple[int, int, int]

# The schema version `stamp` writes. Not the library release.
SCHEMA_VERSION: Version = (0, 0, 1)


def stamp(message, object_type: int):
    """Sets object_type and version (SCHEMA_VERSION) on `message`; returns it.

    `object_type` is the message's own ObjectTypeProto value.
    """
    major, minor, patch = SCHEMA_VERSION
    message.object_type = object_type
    message.version.CopyFrom(VersionProto(major=major, minor=minor, patch=patch))
    return message


def read_type(message) -> int:
    """The message's ObjectTypeProto value; OBJECT_TYPE_UNKNOWN when unset.

    A value added after this build is returned as its number.
    """
    return message.object_type


def read_version(message) -> Optional[Version]:
    """The message's (major, minor, patch), or None when version is absent."""
    if not message.HasField("version"):
        return None
    return (message.version.major, message.version.minor, message.version.patch)

