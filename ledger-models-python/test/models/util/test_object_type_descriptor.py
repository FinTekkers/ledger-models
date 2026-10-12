"""Descriptor checks for the compact object type and version (LM-297).

Every message with `string object_class = 1` must also carry
`ObjectTypeProto object_type = 1001` and `uint32 version_major/minor/patch`
at 1002-1004; fields 1 and 2 are deprecated. See
docs/adr/compact_object_type_and_version.md.
"""
import importlib
import json
import pkgutil
import re
from pathlib import Path

import pytest
from google.protobuf import descriptor_pb2
from google.protobuf.descriptor import FieldDescriptor

import fintekkers
from fintekkers.models.util import object_type_pb2
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto

REPO_ROOT = Path(__file__).resolve().parents[4]
PROTOS_DIR = REPO_ROOT / "ledger-models-protos"
FIXTURES = REPO_ROOT / "test-fixtures" / "object-type"
LEGACY_TAG = "v0.4.33"

COMPACT_FIELDS = {
    "object_type": (1001, FieldDescriptor.TYPE_ENUM),
    "version_major": (1002, FieldDescriptor.TYPE_UINT32),
    "version_minor": (1003, FieldDescriptor.TYPE_UINT32),
    "version_patch": (1004, FieldDescriptor.TYPE_UINT32),
}

# Every object_class string the library writes today, with the enum value it
# must map to and where it is written. Strings written only by tests (e.g.
# "Request", " MyClass") are not here and decode to OBJECT_TYPE_UNKNOWN.
# Some strings are written on more than one message type; the string sits on
# one value and a reader takes the decoded message's own type.
LIBRARY_WRITTEN_STRINGS = {
    # Java IdentifierSerializer.java:32 (getClass().getSimpleName(); Identifier has no subclasses)
    "Identifier": "OBJECT_TYPE_IDENTIFIER",
    # Java Portfolio.java:89, PortfolioSerializer.java:28; Python wrappers/models/portfolio.py:113
    "Portfolio": "OBJECT_TYPE_PORTFOLIO",
    # Java PositionSerializer.java:49
    "Position": "OBJECT_TYPE_POSITION",
    # Rust wrappers/models/position.rs; JS wrappers/models/position/positionfilter.ts:76
    "PositionFilter": "OBJECT_TYPE_POSITION_FILTER",
    # Java PriceSerializer.java:24; Rust wrappers/models/price.rs:241; JS wrappers/models/price/Price.ts:42
    "Price": "OBJECT_TYPE_PRICE",
    # Python wrappers/models/price.py:92, wrappers/requests/price.py:90
    "PriceProto": "OBJECT_TYPE_PRICE",
    # Java ValuationService.java:88; Rust wrappers/util/link_resolver.rs:501
    "Security": "OBJECT_TYPE_SECURITY",
    # Java Strategy.java:66
    "Strategy": "OBJECT_TYPE_STRATEGY",
    # Java StrategyAllocation.java:61; JS wrappers/models/transaction/transaction.ts:141
    "StrategyAllocation": "OBJECT_TYPE_STRATEGY_ALLOCATION",
    # Java TenorSerializer.java:39 (getClass().getSimpleName(); Tenor has no subclasses)
    "Tenor": "OBJECT_TYPE_TENOR",
    # Java Transaction.java:340; Python wrappers/models/transaction.py:129; JS transaction.ts:113
    "Transaction": "OBJECT_TYPE_TRANSACTION",
    # Python wrappers/requests/price.py:87
    "CreatePriceRequestProto": "OBJECT_TYPE_CREATE_PRICE_REQUEST",
    # Java PortfolioService.java:71, LinkResolver.java:479; Python wrappers/services/portfolio.py:128,
    # wrappers/util/link_resolver.py:351; Rust link_resolver.rs:378; JS PortfolioService.ts:43/54/75,
    # link-resolver.ts:419 (also on CreatePortfolioRequestProto in JS)
    "PortfolioRequest": "OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST",
    # JS PriceService.ts:43/56/84 (also on CreatePriceRequestProto)
    "PriceRequest": "OBJECT_TYPE_QUERY_PRICE_REQUEST",
    # Java SecurityService.java:81, LinkResolver.java:468; Python wrappers/services/security.py:138,
    # wrappers/util/link_resolver.py:336; Rust link_resolver.rs:359; JS SecurityService.ts:51/66/94,
    # link-resolver.ts:391 (also on CreateSecurityRequestProto, and on QueryTransactionRequestProto
    # in JS TransactionService.ts:72)
    "SecurityRequest": "OBJECT_TYPE_QUERY_SECURITY_REQUEST",
    # Java TransactionService.java:77; Rust wrappers/models/transaction.rs:112; JS TransactionService.ts:39/50,
    # link-resolver.ts:405 (also on CreateTransactionRequestProto in JS)
    "TransactionRequest": "OBJECT_TYPE_QUERY_TRANSACTION_REQUEST",
}


def _walk_messages(descriptor):
    yield descriptor
    for nested in descriptor.nested_types:
        yield from _walk_messages(nested)


def object_class_messages():
    """Every generated message whose field 1 is object_class, by full name."""
    found = {}
    for module_info in pkgutil.walk_packages(fintekkers.__path__, "fintekkers."):
        if not module_info.name.endswith("_pb2"):
            continue
        module = importlib.import_module(module_info.name)
        for top in module.DESCRIPTOR.message_types_by_name.values():
            for message in _walk_messages(top):
                field = message.fields_by_number.get(1)
                if field is not None and field.name == "object_class":
                    found[message.full_name] = message
    return found


def source_object_class_count():
    pattern = re.compile(r"^\s*string\s+object_class\s*=\s*1\b", re.MULTILINE)
    return sum(len(pattern.findall(p.read_text())) for p in PROTOS_DIR.rglob("*.proto"))


def expected_value_name(message_name):
    """`QuerySecurityRequestProto` -> `OBJECT_TYPE_QUERY_SECURITY_REQUEST`."""
    base = message_name[:-len("Proto")] if message_name.endswith("Proto") else message_name
    snake = re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", "_", base)
    return "OBJECT_TYPE_" + re.sub(r"_+", "_", snake).upper()


def legacy_strings_by_value(enum_descriptor):
    return {
        value.name: list(value.GetOptions().Extensions[object_type_pb2.legacy_object_class])
        for value in enum_descriptor.values
    }


def duplicated_legacy_strings(strings_by_value):
    """Legacy strings attached to more than one enum value."""
    owners = {}
    for value_name, strings in strings_by_value.items():
        for s in strings:
            owners.setdefault(s, []).append(value_name)
    return {s: sorted(names) for s, names in owners.items() if len(names) > 1}


def load_legacy_descriptors():
    fds = descriptor_pb2.FileDescriptorSet()
    fds.ParseFromString((FIXTURES / f"legacy-descriptors-{LEGACY_TAG}.binpb").read_bytes())
    messages = {}

    def walk(prefix, message):
        full_name = f"{prefix}.{message.name}"
        messages[full_name] = message
        for nested in message.nested_type:
            walk(full_name, nested)

    for file in fds.file:
        for message in file.message_type:
            walk(file.package, message)
    return messages


MESSAGES = object_class_messages()
ENUM = ObjectTypeProto.DESCRIPTOR


def test_every_object_class_message_in_the_sources_is_found():
    expected = source_object_class_count()
    assert expected >= 49
    assert len(MESSAGES) == expected


@pytest.mark.parametrize("full_name", sorted(MESSAGES))
def test_message_has_compact_fields(full_name):
    fields = MESSAGES[full_name].fields_by_name
    for name, (number, field_type) in COMPACT_FIELDS.items():
        assert name in fields, f"{full_name} lacks {name}"
        field = fields[name]
        assert field.number == number
        assert field.type == field_type
        assert field.label == FieldDescriptor.LABEL_OPTIONAL
        assert not field.has_presence
    assert fields["object_type"].enum_type.full_name == ENUM.full_name


@pytest.mark.parametrize("full_name", sorted(MESSAGES))
def test_string_fields_keep_numbers_and_are_deprecated(full_name):
    message = MESSAGES[full_name]
    object_class = message.fields_by_number[1]
    version = message.fields_by_number[2]
    assert (object_class.name, object_class.type) == ("object_class", FieldDescriptor.TYPE_STRING)
    assert (version.name, version.type) == ("version", FieldDescriptor.TYPE_STRING)
    assert object_class.GetOptions().deprecated
    assert version.GetOptions().deprecated


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


def test_each_legacy_string_sits_on_exactly_one_value():
    assert duplicated_legacy_strings(legacy_strings_by_value(ENUM)) == {}


def test_duplicate_check_catches_a_seeded_duplicate():
    seeded = legacy_strings_by_value(ENUM)
    seeded["OBJECT_TYPE_CREATE_SECURITY_REQUEST"] = ["SecurityRequest"]
    assert duplicated_legacy_strings(seeded) == {
        "SecurityRequest": ["OBJECT_TYPE_CREATE_SECURITY_REQUEST", "OBJECT_TYPE_QUERY_SECURITY_REQUEST"],
    }


@pytest.mark.parametrize("legacy", sorted(LIBRARY_WRITTEN_STRINGS))
def test_library_written_string_maps_to_its_value(legacy):
    owners = [name for name, strings in legacy_strings_by_value(ENUM).items() if legacy in strings]
    assert owners == [LIBRARY_WRITTEN_STRINGS[legacy]]


def test_no_legacy_string_beyond_the_written_ones():
    attached = {s for strings in legacy_strings_by_value(ENUM).values() for s in strings}
    assert attached == set(LIBRARY_WRITTEN_STRINGS)


def test_enum_numbers_are_append_only():
    snapshot = json.loads((FIXTURES / "enum-numbers.json").read_text())
    assert len(set(snapshot.values())) == len(snapshot), "snapshot reuses a number"
    for name, number in snapshot.items():
        assert name in ENUM.values_by_name, f"{name} was removed; reserve it instead"
        assert ENUM.values_by_name[name].number == number, f"{name} was renumbered"
    added = {v.name for v in ENUM.values} - set(snapshot)
    assert not added, f"append {sorted(added)} to test-fixtures/object-type/enum-numbers.json"


LEGACY = load_legacy_descriptors()


def _reserved_numbers(message):
    return {n for r in message.reserved_range for n in range(r.start, r.end)}


def test_legacy_reserved_control():
    # security.proto carries `reserved 15`: proves reserved ranges are read.
    assert 15 in _reserved_numbers(LEGACY["fintekkers.models.security.SecurityProto"])


@pytest.mark.parametrize("full_name", sorted(MESSAGES))
def test_compact_numbers_were_never_used_or_reserved(full_name):
    assert full_name in LEGACY, f"{full_name} missing from {LEGACY_TAG}"
    old = LEGACY[full_name]
    used = {f.number for f in old.field}
    reserved = _reserved_numbers(old)
    for number, _ in COMPACT_FIELDS.values():
        assert number not in used
        assert number not in reserved
