"""Every message with object_type has an own-type stamp (LM-320).

Walks the descriptor set for messages whose field 1 is
`fintekkers.models.util.ObjectTypeProto`, and fails when `stamp_own` has no
entry for one. Stamps each and checks its own type and version (0, 0, 1)."""
import importlib
import re
from pathlib import Path

import pytest
from google.protobuf.descriptor_pb2 import FileDescriptorSet

from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.util import object_types

# The descriptor set compile.sh writes for every language.
DESCRIPTOR_SET = Path(__file__).resolve().parents[4] / "ledger-models-rust" / "ledger_models_file_descriptor_set_v_todo.bin"

OBJECT_TYPE_ENUM = ".fintekkers.models.util.ObjectTypeProto"

# The 13 types LM-320 names: every *ResponseProto and the index-composition
# requests and responses.
NAMED = [
    "fintekkers.requests.price.CreatePriceResponseProto",
    "fintekkers.requests.price.QueryPriceResponseProto",
    "fintekkers.requests.security.CreateSecurityResponseProto",
    "fintekkers.requests.security.QuerySecurityResponseProto",
    "fintekkers.requests.portfolio.CreatePortfolioResponseProto",
    "fintekkers.requests.portfolio.QueryPortfolioResponseProto",
    "fintekkers.requests.transaction.CreateTransactionResponseProto",
    "fintekkers.requests.transaction.QueryTransactionResponseProto",
    "fintekkers.requests.position.QueryPositionResponseProto",
    "fintekkers.requests.index_composition.CreateIndexCompositionRequestProto",
    "fintekkers.requests.index_composition.CreateIndexCompositionResponseProto",
    "fintekkers.requests.index_composition.GetIndexCompositionRequestProto",
    "fintekkers.requests.index_composition.GetIndexCompositionResponseProto",
]


def _walk():
    """Full name -> (generated module, attribute path) of every message whose
    field 1 is ObjectTypeProto."""
    assert DESCRIPTOR_SET.exists(), f"descriptor set not found at {DESCRIPTOR_SET}"
    found = {}

    def visit(package, module, path, message):
        full_name = f"{package}.{'.'.join(path)}"
        if any(f.number == 1 and f.type_name == OBJECT_TYPE_ENUM for f in message.field):
            found[full_name] = (module, path)
        for nested in message.nested_type:
            visit(package, module, path + [nested.name], nested)

    for file in FileDescriptorSet.FromString(DESCRIPTOR_SET.read_bytes()).file:
        module = file.name[: -len(".proto")].replace("/", ".") + "_pb2"
        for message in file.message_type:
            visit(file.package, module, [message.name], message)
    return found


WALKED = _walk()


def _new(full_name):
    module, path = WALKED[full_name]
    cls = importlib.import_module(module)
    for name in path:
        cls = getattr(cls, name)
    return cls()


def missing_types(walked, lookup):
    """The walked names that `lookup` has no own type for."""
    return [name for name in walked if lookup(name) is None]


def _lookup(full_name):
    return object_types.own_type(_new(full_name))


def _expected_type(full_name):
    """The value the naming rule gives: message name without Proto, in
    SCREAMING_SNAKE, prefixed OBJECT_TYPE_."""
    name = re.sub(r"Proto$", "", full_name.rsplit(".", 1)[1])
    return ObjectTypeProto.Value("OBJECT_TYPE_" + re.sub(r"([a-z])([A-Z])", r"\1_\2", name).upper())


def test_the_walk_finds_every_typed_message_including_the_named_ones():
    assert len(WALKED) >= 49, f"walk found only {len(WALKED)} messages"
    for name in NAMED:
        assert name in WALKED, f"walk is missing {name}"


def test_every_typed_message_has_an_own_type():
    assert missing_types(WALKED, _lookup) == []


def test_a_missing_entry_is_reported():
    dropped = "fintekkers.requests.price.QueryPriceResponseProto"

    def without(name):
        return None if name == dropped else _lookup(name)

    assert missing_types(WALKED, without) == [dropped]


@pytest.mark.parametrize("full_name", sorted(WALKED))
def test_stamping_sets_its_own_type_and_version(full_name):
    stamped = object_types.stamp_own(_new(full_name))

    assert stamped.DESCRIPTOR.full_name == full_name
    assert object_types.read_type(stamped) == _expected_type(full_name)
    assert object_types.read_version(stamped) == (0, 0, 1)


def test_own_types_are_distinct_and_known():
    types = [_lookup(name) for name in WALKED]
    assert ObjectTypeProto.OBJECT_TYPE_UNKNOWN not in types
    assert len(set(types)) == len(types)


def test_the_lm318_entries_keep_their_values():
    lm318 = {
        "fintekkers.models.portfolio.PortfolioProto": ObjectTypeProto.OBJECT_TYPE_PORTFOLIO,
        "fintekkers.models.position.PositionProto": ObjectTypeProto.OBJECT_TYPE_POSITION,
        "fintekkers.models.position.PositionFilterProto": ObjectTypeProto.OBJECT_TYPE_POSITION_FILTER,
        "fintekkers.models.price.PriceProto": ObjectTypeProto.OBJECT_TYPE_PRICE,
        "fintekkers.models.security.IdentifierProto": ObjectTypeProto.OBJECT_TYPE_IDENTIFIER,
        "fintekkers.models.security.SecurityProto": ObjectTypeProto.OBJECT_TYPE_SECURITY,
        "fintekkers.models.security.TenorProto": ObjectTypeProto.OBJECT_TYPE_TENOR,
        "fintekkers.models.strategy.StrategyProto": ObjectTypeProto.OBJECT_TYPE_STRATEGY,
        "fintekkers.models.strategy.StrategyAllocationProto": ObjectTypeProto.OBJECT_TYPE_STRATEGY_ALLOCATION,
        "fintekkers.models.transaction.TransactionProto": ObjectTypeProto.OBJECT_TYPE_TRANSACTION,
        "fintekkers.requests.portfolio.CreatePortfolioRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_PORTFOLIO_REQUEST,
        "fintekkers.requests.portfolio.QueryPortfolioRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST,
        "fintekkers.requests.price.CreatePriceRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_PRICE_REQUEST,
        "fintekkers.requests.price.QueryPriceRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_PRICE_REQUEST,
        "fintekkers.requests.security.CreateSecurityRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_SECURITY_REQUEST,
        "fintekkers.requests.security.QuerySecurityRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_SECURITY_REQUEST,
        "fintekkers.requests.transaction.CreateTransactionRequestProto": ObjectTypeProto.OBJECT_TYPE_CREATE_TRANSACTION_REQUEST,
        "fintekkers.requests.transaction.QueryTransactionRequestProto": ObjectTypeProto.OBJECT_TYPE_QUERY_TRANSACTION_REQUEST,
    }
    for name, object_type in lm318.items():
        assert _lookup(name) == object_type, name


def test_stamp_own_on_a_message_without_object_type_names_it():
    assert object_types.own_type(UUIDProto()) is None
    with pytest.raises(ValueError, match="fintekkers.models.util.UUIDProto"):
        object_types.stamp_own(UUIDProto())
