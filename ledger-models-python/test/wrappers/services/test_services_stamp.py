"""Every request a service method builds is stamped before it is sent (LM-326).

LM-322 Part E. `discover()` finds every public method of every `*Service`
class under `fintekkers.wrappers.services` by reflection. Each one is in
`DRIVEN` (it builds a request: a sample call), `PASS_THROUGH` (it sends the
caller's request as it is: a sample call with unstamped caller protos) or
`EXCLUDED` (with a reason). A new method in none of them fails
`test_every_service_method_is_classified`.

Each service singleton is replaced with one whose stub is a `_RecordingStub`.
`EnvConfig.get_channel` raises, so a call that escapes the fakes (a real stub,
a `LinkResolver()` with its default stubs) fails at once instead of touching
the network.

`assert_stamped` is a copy of the walker in `test/wrappers/test_builders_stamp.py`
(LM-322): `--import-mode=importlib` keeps test modules from importing each
other. Keep the two in step. It does not unpack `google.protobuf.Any`.

Pass-through inputs are not re-stamped (LM-322's ruling): the caller's proto
arrives unstamped, equal to a copy taken before the call.
"""
import copy
import importlib
import importlib.util
import inspect
import pkgutil
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable, Optional
from uuid import UUID

import pytest
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.portfolio.create_portfolio_request_pb2 import CreatePortfolioRequestProto
from fintekkers.requests.portfolio.create_portfolio_response_pb2 import CreatePortfolioResponseProto
from fintekkers.requests.portfolio.query_portfolio_request_pb2 import QueryPortfolioRequestProto
from fintekkers.requests.portfolio.query_portfolio_response_pb2 import QueryPortfolioResponseProto
from fintekkers.requests.price.create_price_request_pb2 import CreatePriceRequestProto
from fintekkers.requests.price.create_price_response_pb2 import CreatePriceResponseProto
from fintekkers.requests.price.query_price_request_pb2 import (
    PRICE_HORIZON_1_MONTH,
    QueryPriceRequestProto,
)
from fintekkers.requests.price.query_price_response_pb2 import QueryPriceResponseProto
from fintekkers.requests.security.create_security_request_pb2 import CreateSecurityRequestProto
from fintekkers.requests.security.create_security_response_pb2 import CreateSecurityResponseProto
from fintekkers.requests.security.get_field_values_response_pb2 import GetFieldValuesResponseProto
from fintekkers.requests.security.get_fields_response_pb2 import GetFieldsResponseProto
from fintekkers.requests.security.query_security_request_pb2 import QuerySecurityRequestProto
from fintekkers.requests.security.query_security_response_pb2 import QuerySecurityResponseProto
from fintekkers.requests.transaction.create_transaction_request_pb2 import CreateTransactionRequestProto
from fintekkers.requests.transaction.create_transaction_response_pb2 import CreateTransactionResponseProto
from fintekkers.requests.transaction.query_transaction_request_pb2 import QueryTransactionRequestProto
from fintekkers.requests.transaction.query_transaction_response_pb2 import QueryTransactionResponseProto
from fintekkers.requests.valuation.valuation_response_pb2 import ValuationResponseProto

from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.requests.portfolio import QueryPortfolioRequest
from fintekkers.wrappers.requests.price import CreatePriceRequest, QueryPriceRequest
from fintekkers.wrappers.requests.security import CreateSecurityRequest, QuerySecurityRequest
from fintekkers.wrappers.requests.transaction import CreateTransactionRequest, QueryTransactionRequest
from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.services.price import PriceService
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.services.transaction import TransactionService
from fintekkers.wrappers.services.util.Environment import EnvConfig
from fintekkers.wrappers.services.valuation import ValuationService
from fintekkers.wrappers.util import link_cache
from fintekkers.wrappers.util.link_resolver import LinkResolver
from fintekkers.wrappers.util.object_types import SCHEMA_VERSION, own_type, read_type, read_version, stamp_own

ROOT = "fintekkers.wrappers.services"

# Packages under ROOT that discover() does not walk, each with its reason.
EXCLUDED_PACKAGES = {
    "fintekkers.wrappers.services.util": "service address and channel config; builds no proto",
}

SERVICES = (PortfolioService, PriceService, SecurityService, TransactionService, ValuationService)


# --- Discovery --------------------------------------------------------------

def _modules():
    """Every module under ROOT outside EXCLUDED_PACKAGES. An import error fails
    the caller: pkgutil.walk_packages would swallow it."""
    out = []

    def walk(package_name):
        package = importlib.import_module(package_name)
        out.append(package)
        for info in pkgutil.iter_modules(package.__path__):
            name = f"{package_name}.{info.name}"
            if name in EXCLUDED_PACKAGES:
                continue
            if info.ispkg:
                walk(name)
            else:
                out.append(importlib.import_module(name))

    walk(ROOT)
    return out


def discover() -> set:
    """`<module>.<Class>.<method>` for every public method defined on a class
    defined in a module under ROOT."""
    found = set()
    for module in _modules():
        for class_name, cls in vars(module).items():
            if not inspect.isclass(cls) or cls.__module__ != module.__name__ or class_name.startswith("_"):
                continue
            for attribute, member in vars(cls).items():
                if attribute.startswith("_"):
                    continue
                if inspect.isfunction(member) or isinstance(member, (staticmethod, classmethod)):
                    found.add(f"{module.__name__}.{class_name}.{attribute}")
    return found


# --- Walker (copy of test/wrappers/test_builders_stamp.py's) ----------------

def assert_stamped(message, path: str) -> None:
    """Fails when `message`, or any message set inside it, has an
    object_type field but not the object_type and version `stamp` sets."""
    descriptor = message.DESCRIPTOR
    if descriptor.full_name == "google.protobuf.Any":
        return
    if "object_type" in descriptor.fields_by_name:
        expected = own_type(message)
        assert expected is not None, f"{path}: {descriptor.full_name} has object_type but no own ObjectTypeProto"
        assert read_type(message) == expected, (
            f"{path}: {descriptor.full_name} object_type is "
            f"{ObjectTypeProto.Name(read_type(message))}, want {ObjectTypeProto.Name(expected)}"
        )
        assert read_version(message) == SCHEMA_VERSION, (
            f"{path}: {descriptor.full_name} version is {read_version(message)}, want {SCHEMA_VERSION}"
        )
    for field_descriptor, value in message.ListFields():
        if field_descriptor.message_type is None:
            continue
        child_path = f"{path}.{field_descriptor.name}"
        if field_descriptor.message_type.GetOptions().map_entry:
            if field_descriptor.message_type.fields_by_name["value"].message_type is not None:
                for key, item in value.items():
                    assert_stamped(item, f"{child_path}[{key!r}]")
        elif field_descriptor.label == field_descriptor.LABEL_REPEATED:
            for index, item in enumerate(value):
                assert_stamped(item, f"{child_path}[{index}]")
        else:
            assert_stamped(value, child_path)


def _assert_unstamped(message, path: str) -> None:
    assert read_type(message) == ObjectTypeProto.OBJECT_TYPE_UNKNOWN, f"{path} was stamped"
    assert read_version(message) is None, f"{path} was stamped"


# --- Fakes ------------------------------------------------------------------

class _FakeStream:
    """The streaming-call surface the services' search() methods use."""

    def __init__(self, items: list):
        self._items = list(items)
        self.cancelled = False

    def _is_complete(self) -> bool:
        return not self._items

    def next(self):
        return self._items.pop(0)

    def cancel(self) -> None:
        self.cancelled = True


def _stream(*items) -> Callable[[], _FakeStream]:
    return lambda: _FakeStream(items)


def _empty_stream() -> _FakeStream:
    return _FakeStream([])


# (service, rpc) -> factory of the canned response. Minimal valid responses.
_DEFAULT_RESPONSES = {
    ("PortfolioService", "Search"): _empty_stream,
    ("PortfolioService", "GetByIds"): QueryPortfolioResponseProto,
    ("PortfolioService", "CreateOrUpdate"): CreatePortfolioResponseProto,
    ("PriceService", "Search"): _empty_stream,
    ("PriceService", "GetByIds"): QueryPriceResponseProto,
    ("PriceService", "ListIds"): QueryPriceResponseProto,
    ("PriceService", "CreateOrUpdate"): CreatePriceResponseProto,
    ("SecurityService", "Search"): _empty_stream,
    ("SecurityService", "GetByIds"): QuerySecurityResponseProto,
    ("SecurityService", "GetFields"): GetFieldsResponseProto,
    ("SecurityService", "GetFieldValues"): GetFieldValuesResponseProto,
    ("SecurityService", "CreateOrUpdate"): CreateSecurityResponseProto,
    ("SecurityService", "ValidateCreateOrUpdate"): CreateSecurityResponseProto,
    ("TransactionService", "Search"): _empty_stream,
    ("TransactionService", "GetByIds"): QueryTransactionResponseProto,
    ("TransactionService", "CreateOrUpdate"): CreateTransactionResponseProto,
    ("ValuationService", "RunValuation"): ValuationResponseProto,
}


class _RecordingStub:
    """Any RPC attribute records `(service, rpc, request)` in the shared
    `calls` list and returns the canned response for `(service, rpc)`."""

    def __init__(self, service: str, calls: list, responses: dict):
        self._service = service
        self._calls = calls
        self._responses = responses

    def __getattr__(self, rpc: str):
        if rpc.startswith("_"):
            raise AttributeError(rpc)

        def call(*args, **kwargs):
            request = kwargs["request"] if "request" in kwargs else args[0]
            self._calls.append((self._service, rpc, request))
            key = (self._service, rpc)
            assert key in self._responses, f"no canned response for {key}"
            return self._responses[key]()

        return call


def _no_channel(*_args, **_kwargs):
    raise AssertionError("a real gRPC channel was requested: a call escaped the fake stubs")


@pytest.fixture
def calls(monkeypatch):
    """Installs a recording fake stub on every service singleton and returns
    the shared list of `(service, rpc, request)` it records, in call order."""
    monkeypatch.setattr(EnvConfig, "get_channel", staticmethod(_no_channel))
    link_cache.SECURITY.clear()
    link_cache.PORTFOLIO.clear()
    recorded: list = []
    responses = dict(_DEFAULT_RESPONSES)
    for service in SERVICES:
        service._reset_for_tests()
        # Bypass __new__: it would open a channel.
        instance = object.__new__(service)
        instance.stub = _RecordingStub(service.__name__, recorded, responses)
        service._instance = instance
    yield _Recorder(recorded, responses)
    for service in SERVICES:
        service._reset_for_tests()


@dataclass
class _Recorder:
    calls: list
    responses: dict

    def rpcs(self) -> list:
        return [(service, rpc) for service, rpc, _ in self.calls]


# --- Sample inputs ----------------------------------------------------------

_SECURITY_UUID = UUID(int=201)


def _uuid_proto(n: int) -> UUIDProto:
    return UUIDProto(raw_uuid=UUID(int=n).bytes)


def _timestamp() -> LocalTimestampProto:
    return LocalTimestampProto(timestamp=Timestamp(seconds=1_792_000_000), time_zone="America/New_York")


def _security_proto() -> SecurityProto:
    """A security the client-side create guards accept. Unstamped."""
    return SecurityProto(
        uuid=_uuid_proto(202),
        as_of=_timestamp(),
        issuer_name="ACME",
        identifiers=[IdentifierProto(identifier_type=IdentifierTypeProto.EXCH_TICKER, identifier_value="ACME")],
    )


def _portfolio_proto() -> PortfolioProto:
    return PortfolioProto(uuid=_uuid_proto(203), as_of=_timestamp(), portfolio_name="Test portfolio")


def _price_proto() -> PriceProto:
    return PriceProto(uuid=_uuid_proto(204), as_of=_timestamp(), security=_security_proto())


def _transaction_proto() -> TransactionProto:
    return TransactionProto(uuid=_uuid_proto(205), as_of=_timestamp(), portfolio=_portfolio_proto())


def _stamp_all(message):
    """Stamps `message` and every typed message inside it, as a caller that
    stamps its own inputs would; returns it."""
    if "object_type" in message.DESCRIPTOR.fields_by_name:
        stamp_own(message)
    for field_descriptor, value in message.ListFields():
        if field_descriptor.message_type is None or field_descriptor.message_type.GetOptions().map_entry:
            continue
        if field_descriptor.label == field_descriptor.LABEL_REPEATED:
            for item in value:
                _stamp_all(item)
        else:
            _stamp_all(value)
    return message


def _found_security_stream():
    return _stream(QuerySecurityResponseProto(security_response=[
        SecurityProto(uuid=UUIDProto(raw_uuid=_SECURITY_UUID.bytes), as_of=_timestamp()),
    ]))


def _identifier_filter_is_stamped(recorder: _Recorder) -> None:
    """get_security_uuid_by_identifier packs its IdentifierProto into an Any,
    which the walker does not unpack: unpack it here."""
    request = next(r for s, rpc, r in recorder.calls if (s, rpc) == ("SecurityService", "Search"))
    packed = request.search_security_input.filters[0].field_value_packed
    identifier = IdentifierProto()
    assert packed.Unpack(identifier), f"filter value is {packed.type_url}, not an IdentifierProto"
    assert identifier.identifier_value == "912796Y29"
    assert_stamped(identifier, "search_security_input.filters[0].field_value_packed")


# --- Classification tables ---------------------------------------------------

@dataclass
class Case:
    call: Callable[[], object]
    # (service, rpc) in call order; never empty.
    expected_rpcs: list
    # (service, rpc) -> response factory, over the defaults.
    responses: dict = field(default_factory=dict)
    # An extra check on the recorder, e.g. a packed Any.
    extra: Optional[Callable[[_Recorder], None]] = None
    # The exception the call raises after sending `expected_rpcs`, if any.
    raises: Optional[type] = None


def _method(case_name: str) -> str:
    """The method a case drives: the case name without its `[variant]`."""
    return case_name.split("[", 1)[0]


_P = f"{ROOT}.portfolio.PortfolioService"
_PR = f"{ROOT}.price.PriceService"
_S = f"{ROOT}.security.SecurityService"
_T = f"{ROOT}.transaction.TransactionService"
_V = f"{ROOT}.valuation.ValuationService"

# Methods that build a request: every captured request must be stamped all
# the way down. Generators are consumed with list(...).
DRIVEN = {
    f"{_T}.get_transaction_by_uuid": Case(
        lambda: TransactionService().get_transaction_by_uuid(UUID(int=1), as_of=_timestamp()),
        [("TransactionService", "GetByIds")]),
    f"{_PR}.get_price_by_uuid": Case(
        lambda: PriceService().get_price_by_uuid(UUID(int=2)),
        [("PriceService", "GetByIds")]),
    f"{_PR}.get_prices": Case(
        lambda: list(PriceService().get_prices("912796Y29", IdentifierTypeProto.CUSIP, PRICE_HORIZON_1_MONTH)),
        [("SecurityService", "Search"), ("PriceService", "Search")],
        responses={("SecurityService", "Search"): _found_security_stream()},
        extra=_identifier_filter_is_stamped),
    f"{_PR}.list_ids": Case(
        lambda: PriceService().list_ids(),
        [("PriceService", "ListIds")]),
    f"{_S}.get_security_by_uuid": Case(
        lambda: SecurityService().get_security_by_uuid(UUID(int=3), as_of=_timestamp()),
        [("SecurityService", "GetByIds")]),
    f"{_S}.get_security_uuid_by_identifier": Case(
        lambda: SecurityService().get_security_uuid_by_identifier("912796Y29", IdentifierTypeProto.CUSIP),
        [("SecurityService", "Search")],
        responses={("SecurityService", "Search"): _found_security_stream()},
        extra=_identifier_filter_is_stamped),
    f"{_S}.get_field_values": Case(
        lambda: SecurityService().get_field_values(FieldProto.ASSET_CLASS),
        [("SecurityService", "GetFieldValues")]),
    f"{_P}.get_portfolio_by_uuid": Case(
        lambda: PortfolioService().get_portfolio_by_uuid(UUID(int=4), as_of=_timestamp()),
        [("PortfolioService", "GetByIds")]),
    f"{_P}.create_portfolio_by_name": Case(
        lambda: PortfolioService().create_portfolio_by_name("Test portfolio"),
        [("PortfolioService", "CreateOrUpdate")]),
    f"{_P}.get_or_create_portfolio_by_name[found]": Case(
        lambda: PortfolioService().get_or_create_portfolio_by_name("Test portfolio"),
        [("PortfolioService", "Search")],
        responses={("PortfolioService", "Search"): _stream(
            QueryPortfolioResponseProto(portfolio_response=[_portfolio_proto()]))}),
    f"{_P}.get_or_create_portfolio_by_name[not found]": Case(
        lambda: PortfolioService().get_or_create_portfolio_by_name("Test portfolio"),
        [("PortfolioService", "Search"), ("PortfolioService", "CreateOrUpdate")]),
    f"{_V}.run_valuation[bare]": Case(
        lambda: ValuationService().run_valuation(measures=[MeasureProto.MARKET_VALUE], asOf=datetime(2026, 10, 14)),
        [("ValuationService", "RunValuation")]),
    # Caller inputs arrive stamped here; test_caller_protos_not_restamped
    # sends them unstamped.
    f"{_V}.run_valuation[with inputs]": Case(
        lambda: ValuationService().run_valuation(
            security=Security(_stamp_all(_security_proto())),
            position=Position(_stamp_all(PositionProto())),
            price=Price(_stamp_all(_price_proto())),
            measures=[MeasureProto.MARKET_VALUE],
            asOf=datetime(2026, 10, 14)),
        [("ValuationService", "RunValuation")]),
}


@dataclass
class PassThroughCase:
    # Returns the caller's protos: the one whose copy must arrive, and every
    # proto that must stay unstamped.
    inputs: Callable[[], tuple]
    # Calls the method with those inputs.
    call: Callable[[tuple], object]
    expected_rpcs: list
    # Picks the sent message the snapshot must equal, from the captured request.
    sent: Callable[[object], object] = lambda request: request


def _query_security():
    proto = QuerySecurityRequestProto(search_security_input=PositionFilterProto())
    return (proto, proto, proto.search_security_input)


def _query_portfolio():
    proto = QueryPortfolioRequestProto(search_portfolio_input=PositionFilterProto())
    return (proto, proto, proto.search_portfolio_input)


def _query_price():
    proto = QueryPriceRequestProto(search_price_input=PositionFilterProto())
    return (proto, proto, proto.search_price_input)


def _query_transaction():
    proto = QueryTransactionRequestProto(search_transaction_input=PositionFilterProto())
    return (proto, proto, proto.search_transaction_input)


def _create_security():
    proto = CreateSecurityRequestProto(security_input=_security_proto())
    return (proto, proto, proto.security_input, proto.security_input.identifiers[0])


def _create_portfolio():
    proto = CreatePortfolioRequestProto(create_portfolio_input=_portfolio_proto())
    return (proto, proto, proto.create_portfolio_input)


def _create_price():
    proto = CreatePriceRequestProto(create_price_input=_price_proto())
    return (proto, proto, proto.create_price_input, proto.create_price_input.security)


def _create_transaction():
    proto = CreateTransactionRequestProto(create_transaction_input=_transaction_proto())
    return (proto, proto, proto.create_transaction_input, proto.create_transaction_input.portfolio)


def _resolver() -> LinkResolver:
    return LinkResolver(
        security_stub=_RecordingStub("LinkResolver.security", [], {}),
        portfolio_stub=_RecordingStub("LinkResolver.portfolio", [], {}),
    )


# Methods that send the caller's request as it is (LM-322's pass-through
# ruling): they must not stamp it.
PASS_THROUGH = {
    f"{_S}.search": PassThroughCase(
        _query_security, lambda i: list(SecurityService().search(QuerySecurityRequest(i[0]))),
        [("SecurityService", "Search")]),
    f"{_S}.create_or_update": PassThroughCase(
        _create_security, lambda i: SecurityService().create_or_update(CreateSecurityRequest(i[0])),
        [("SecurityService", "CreateOrUpdate")]),
    f"{_S}.validate_create_or_update": PassThroughCase(
        _create_security, lambda i: SecurityService().validate_create_or_update(CreateSecurityRequest(i[0])),
        [("SecurityService", "ValidateCreateOrUpdate")]),
    f"{_P}.search": PassThroughCase(
        _query_portfolio, lambda i: list(PortfolioService().search(QueryPortfolioRequest(i[0]))),
        [("PortfolioService", "Search")]),
    f"{_P}.create_or_update": PassThroughCase(
        _create_portfolio, lambda i: PortfolioService().create_or_update(i[0]),
        [("PortfolioService", "CreateOrUpdate")]),
    f"{_PR}.search": PassThroughCase(
        _query_price, lambda i: list(PriceService().search(QueryPriceRequest(i[0]))),
        [("PriceService", "Search")]),
    f"{_PR}.search_with_securities": PassThroughCase(
        _query_price,
        lambda i: PriceService().search_with_securities(QueryPriceRequest(i[0]), link_resolver=_resolver()),
        [("PriceService", "Search")]),
    f"{_PR}.create_or_update": PassThroughCase(
        _create_price, lambda i: PriceService().create_or_update(CreatePriceRequest(i[0])),
        [("PriceService", "CreateOrUpdate")]),
    f"{_T}.search": PassThroughCase(
        _query_transaction, lambda i: list(TransactionService().search(QueryTransactionRequest(i[0]))),
        [("TransactionService", "Search")]),
    f"{_T}.search_with_security_and_portfolio": PassThroughCase(
        _query_transaction,
        lambda i: TransactionService().search_with_security_and_portfolio(
            QueryTransactionRequest(i[0]), link_resolver=_resolver()),
        [("TransactionService", "Search")]),
    f"{_T}.create_or_update": PassThroughCase(
        _create_transaction, lambda i: TransactionService().create_or_update(CreateTransactionRequest(i[0])),
        [("TransactionService", "CreateOrUpdate")]),
}


def _valuation_inputs():
    security, position, price = _security_proto(), PositionProto(), _price_proto()
    return (security, position, price)


# run_valuation builds its own request but copies the caller's protos into it:
# each copy must arrive as the caller passed it, unstamped.
VALUATION_INPUTS = {
    f"{_V}.run_valuation[security_input]": (0, lambda request: request.security_input),
    f"{_V}.run_valuation[position_input]": (1, lambda request: request.position_input),
    f"{_V}.run_valuation[price_input]": (2, lambda request: request.price_input),
}

# Method -> why it is neither driven nor pass-through.
EXCLUDED = {
    f"{_S}.get_fields": "sends google.protobuf.Empty, which has no object_type",
    f"{_V}.get_measure_result": "reads a ValuationResponseProto the caller holds; sends nothing",
    f"{_PR}.get_latest_price": "raises NotImplementedError; builds nothing",
    f"{_PR}.get_price_as_of_datetime": "raises NotImplementedError; builds nothing",
    f"{_PR}.get_price_as_of_date": "raises NotImplementedError; builds nothing",
}


def _classified() -> set:
    return {_method(name) for name in DRIVEN} | set(PASS_THROUGH) | set(EXCLUDED)


def _classification_problems(discovered: set) -> tuple:
    """(unclassified, stale): discovered methods in no table, and table
    entries that name no discovered method."""
    classified = _classified()
    return sorted(discovered - classified), sorted(classified - discovered)


def _blank_reasons() -> list:
    return sorted(
        name for name, reason in {**EXCLUDED, **EXCLUDED_PACKAGES}.items()
        if not isinstance(reason, str) or not reason.strip()
    )


# --- Tests ------------------------------------------------------------------

@pytest.mark.parametrize("name", sorted(DRIVEN))
def test_service_built_requests_are_stamped(name, calls):
    case = DRIVEN[name]
    calls.responses.update(case.responses)
    if case.raises is None:
        case.call()
    else:
        with pytest.raises(case.raises):
            case.call()

    assert calls.rpcs() == case.expected_rpcs
    assert calls.calls, f"{name} sent nothing"
    for index, (service, rpc, request) in enumerate(calls.calls):
        assert_stamped(request, f"{service}.{rpc}[{index}]")
    if case.extra is not None:
        case.extra(calls)


@pytest.mark.parametrize("name", sorted(PASS_THROUGH))
def test_caller_protos_not_restamped(name, calls):
    case = PASS_THROUGH[name]
    inputs = case.inputs()
    request, unstamped = inputs[0], inputs[1:]
    before = copy.deepcopy(request)

    case.call(inputs)

    assert calls.rpcs() == case.expected_rpcs
    _, _, sent = calls.calls[0]
    assert case.sent(sent) == before
    for index, proto in enumerate(unstamped):
        _assert_unstamped(proto, f"{name} caller input {index} ({proto.DESCRIPTOR.full_name})")


@pytest.mark.parametrize("name", sorted(VALUATION_INPUTS))
def test_run_valuation_inputs_not_restamped(name, calls):
    position_index, sent_input = VALUATION_INPUTS[name]
    security, position, price = _valuation_inputs()
    caller_input = (security, position, price)[position_index]
    before = copy.deepcopy(caller_input)

    ValuationService().run_valuation(
        security=Security(security), position=Position(position), price=Price(price),
        measures=[MeasureProto.MARKET_VALUE], asOf=datetime(2026, 10, 14))

    assert calls.rpcs() == [("ValuationService", "RunValuation")]
    _, _, request = calls.calls[0]
    # The request itself is the service's: stamped.
    assert read_type(request) == own_type(request)
    assert read_version(request) == SCHEMA_VERSION
    assert sent_input(request) == before
    _assert_unstamped(sent_input(request), f"{name} as sent")
    _assert_unstamped(caller_input, f"{name} caller input")


def test_walker_catches_unstamped_nested():
    request = stamp_own(QueryPortfolioRequestProto(search_portfolio_input=PositionFilterProto()))
    with pytest.raises(AssertionError, match="search_portfolio_input"):
        assert_stamped(request, "request")


def test_driven_case_fails_on_an_unstamped_request(calls):
    """The driven check is not vacuous: a request sent unstamped fails it."""
    calls.responses[("PriceService", "GetByIds")] = QueryPriceResponseProto
    PriceService().stub.GetByIds(QueryPriceRequestProto(uuIds=[_uuid_proto(1)]))
    with pytest.raises(AssertionError, match="QueryPriceRequestProto object_type"):
        for index, (service, rpc, request) in enumerate(calls.calls):
            assert_stamped(request, f"{service}.{rpc}[{index}]")


def test_every_service_method_is_classified():
    discovered = discover()

    # Discovery is not vacuous: every driven method is found.
    missing = {_method(name) for name in DRIVEN} - discovered
    assert not missing, f"driven but not discovered: {sorted(missing)}"
    assert not any(name.startswith(tuple(EXCLUDED_PACKAGES)) for name in discovered)
    assert not any(name.rsplit(".", 1)[-1].startswith("_") for name in discovered)

    tables = [{_method(name) for name in DRIVEN}, set(PASS_THROUGH), set(EXCLUDED)]
    for first in range(len(tables)):
        for second in range(first + 1, len(tables)):
            assert not tables[first] & tables[second], f"in two tables: {sorted(tables[first] & tables[second])}"

    unclassified, stale = _classification_problems(discovered)
    assert not unclassified, f"service methods in none of DRIVEN, PASS_THROUGH, EXCLUDED: {unclassified}"
    assert not stale, f"listed but not discovered: {stale}"


def test_completeness_check_reports_new_and_stale_methods(monkeypatch):
    monkeypatch.setattr(PriceService, "new_rpc", lambda self: None, raising=False)
    monkeypatch.setitem(EXCLUDED, f"{_PR}.removed_rpc", "a method that no longer exists")

    unclassified, stale = _classification_problems(discover())

    assert unclassified == [f"{_PR}.new_rpc"]
    assert stale == [f"{_PR}.removed_rpc"]


def test_exclusions_have_reasons():
    assert not _blank_reasons(), f"exclusions with no reason: {_blank_reasons()}"
    for package in EXCLUDED_PACKAGES:
        assert importlib.util.find_spec(package) is not None, f"{package} is not a package"


def test_blank_exclusion_reason_is_reported(monkeypatch):
    monkeypatch.setitem(EXCLUDED, f"{_S}.get_fields", "   ")
    assert _blank_reasons() == [f"{_S}.get_fields"]


def test_leaked_channel_fails(calls):
    """A path that escapes the fakes fails at once (LinkResolver's default stubs)."""
    with pytest.raises(AssertionError, match="real gRPC channel"):
        LinkResolver()
