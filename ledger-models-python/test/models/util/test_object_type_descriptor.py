"""Descriptor checks for object type and version (LM-297, LM-318).

Every message that names its type declares `ObjectTypeProto object_type = 1`
and `VersionProto version = 2`. LM-318 replaced the old `object_class` /
`version` strings in place and removed fields 1001-1004. See
docs/adr/compact_object_type_and_version.md.
"""
import importlib
import json
import pkgutil
import re
from pathlib import Path

import pytest
from google.protobuf.descriptor import FieldDescriptor

import fintekkers
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.models.util.version_pb2 import VersionProto

REPO_ROOT = Path(__file__).resolve().parents[4]
PROTOS_DIR = REPO_ROOT / "ledger-models-protos"
FIXTURES = REPO_ROOT / "test-fixtures" / "object-type"
REMOVED_NUMBERS = (1001, 1002, 1003, 1004)


def _walk_messages(descriptor):
    yield descriptor
    for nested in descriptor.nested_types:
        yield from _walk_messages(nested)


def object_typed_messages():
    """Every generated message whose field 1 is object_type, by full name."""
    found = {}
    for module_info in pkgutil.walk_packages(fintekkers.__path__, "fintekkers."):
        if not module_info.name.endswith("_pb2"):
            continue
        module = importlib.import_module(module_info.name)
        for top in module.DESCRIPTOR.message_types_by_name.values():
            for message in _walk_messages(top):
                field = message.fields_by_number.get(1)
                if field is not None and field.name == "object_type":
                    found[message.full_name] = message
    return found


def source_object_type_count():
    pattern = re.compile(r"^\s*fintekkers\.models\.util\.ObjectTypeProto\s+object_type\s*=\s*1\s*;", re.MULTILINE)
    return sum(len(pattern.findall(p.read_text())) for p in PROTOS_DIR.rglob("*.proto"))


def expected_value_name(message_name):
    """`QuerySecurityRequestProto` -> `OBJECT_TYPE_QUERY_SECURITY_REQUEST`."""
    base = message_name[:-len("Proto")] if message_name.endswith("Proto") else message_name
    snake = re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_", base)
    return "OBJECT_TYPE_" + re.sub(r"_+", "_", snake).upper()


MESSAGES = object_typed_messages()
ENUM = ObjectTypeProto.DESCRIPTOR


def test_every_object_typed_message_in_the_sources_is_found():
    expected = source_object_type_count()
    assert expected >= 49
    assert len(MESSAGES) == expected


@pytest.mark.parametrize("full_name", sorted(MESSAGES))
def test_message_has_object_type_and_version(full_name):
    message = MESSAGES[full_name]
    object_type = message.fields_by_number[1]
    version = message.fields_by_number[2]
    assert (object_type.name, object_type.type) == ("object_type", FieldDescriptor.TYPE_ENUM)
    assert object_type.enum_type.full_name == ENUM.full_name
    assert (version.name, version.type) == ("version", FieldDescriptor.TYPE_MESSAGE)
    assert version.message_type.full_name == VersionProto.DESCRIPTOR.full_name
    assert "object_class" not in message.fields_by_name
    for number in REMOVED_NUMBERS:
        assert number not in message.fields_by_number, f"{full_name} still has field {number}"


def test_version_proto_shape():
    fields = [(f.name, f.number, f.type) for f in VersionProto.DESCRIPTOR.fields]
    assert fields == [
        ("major", 1, FieldDescriptor.TYPE_UINT32),
        ("minor", 2, FieldDescriptor.TYPE_UINT32),
        ("patch", 3, FieldDescriptor.TYPE_UINT32),
    ]


def test_each_message_maps_to_one_enum_value_and_back():
    by_message = {name: expected_value_name(m.name) for name, m in MESSAGES.items()}
    values = {v.name for v in ENUM.values}

    missing = {m: v for m, v in by_message.items() if v not in values}
    assert not missing, f"no enum value for {missing}"
    assert len(set(by_message.values())) == len(by_message), "two messages share an enum value"
    assert values - {"OBJECT_TYPE_UNKNOWN"} == set(by_message.values()), "enum value with no message"


def test_enum_shape():
    assert ENUM.values_by_number[0].name == "OBJECT_TYPE_UNKNOWN"
    assert all(v.name.startswith("OBJECT_TYPE_") for v in ENUM.values)
    assert ENUM.file.package == "fintekkers.models.util"


def test_naming_rule():
    assert expected_value_name("API_Key") == "OBJECT_TYPE_API_KEY"
    assert expected_value_name("NodeState") == "OBJECT_TYPE_NODE_STATE"
    assert expected_value_name("GetFieldValuesRequestProto") == "OBJECT_TYPE_GET_FIELD_VALUES_REQUEST"
    assert expected_value_name("PriceProto") == "OBJECT_TYPE_PRICE"


def test_enum_numbers_are_append_only():
    snapshot = json.loads((FIXTURES / "enum-numbers.json").read_text())
    assert len(set(snapshot.values())) == len(snapshot), "snapshot reuses a number"
    for name, number in snapshot.items():
        assert name in ENUM.values_by_name, f"{name} was removed; reserve it instead"
        assert ENUM.values_by_name[name].number == number, f"{name} was renumbered"
    added = {v.name for v in ENUM.values} - set(snapshot)
    assert not added, f"append {sorted(added)} to test-fixtures/object-type/enum-numbers.json"
