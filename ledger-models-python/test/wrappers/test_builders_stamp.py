"""Every message the library's own builders create is stamped (LM-322).

`discover()` finds every public callable under `fintekkers.wrappers` by
reflection: module functions, classes (their constructors), static and class
methods, `as_proto`/`to_proto`, and any other public method whose body calls a
`...Proto(` constructor (found with `ast`). Each one is either in `BUILDERS`,
with a sample call, or in `NOT_BUILDERS`, with a reason; a new public builder
that is in neither fails `test_every_discovered_callable_is_classified`.

`assert_stamped` walks a builder's output and fails on any message whose
descriptor has an `object_type` field but whose `object_type` / `version` are
not what `stamp` sets for it. It does not unpack `google.protobuf.Any`: the
packed type is only known after unpacking, and the query builders pack the
caller's filter values as they are.

Pass-through inputs (a proto the caller hands in, e.g. `cash_security`,
`create_transaction_request`'s `security`/`portfolio`, `Price.create_price`'s
`security`, `create_portfolio_request_from_proto`'s `portfolio` and every
wrapper constructor) are not re-stamped by the builders: that would change
the caller's field values. The samples pass them in stamped, and the walker
checks they stay stamped.

`test_builder_other_fields_unchanged` compares each output, with the stamps
cleared, against `builders_stamp_snapshot.json`: the same samples run on main
before LM-322 with a fixed clock, time zone and UUIDs. Regenerate it (only when
a builder's other fields are meant to change) by running this file as a script
from `ledger-models-python`: `python test/wrappers/test_builders_stamp.py`.
"""
import ast
import contextlib
import importlib
import importlib.util
import inspect
import itertools
import json
import os
import pkgutil
import textwrap
import time
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from unittest import mock
from uuid import UUID

import pytest
from google.protobuf import symbol_database
from google.protobuf.message import Message
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.portfolio.portfolio_pb2 import PortfolioProto
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_filter_pb2 import PositionFilterProto
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.position.position_status_pb2 import PositionStatusProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.bond.issuance_pb2 import IssuanceProto
from fintekkers.models.security.coupon_frequency_pb2 import SEMIANNUALLY
from fintekkers.models.security.coupon_type_pb2 import FIXED, FLOAT
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import CUSIP
from fintekkers.models.security.index.index_type_pb2 import IndexTypeProto
from fintekkers.models.security.product_type_pb2 import TREASURY_FRN, TREASURY_NOTE
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.portfolio.query_portfolio_request_pb2 import QueryPortfolioRequestProto
from fintekkers.requests.price.create_price_request_pb2 import CreatePriceRequestProto
from fintekkers.requests.price.query_price_request_pb2 import (
    PriceFrequencyProto,
    PriceHorizonProto,
    QueryPriceRequestProto,
)
from fintekkers.requests.security.create_security_request_pb2 import CreateSecurityRequestProto
from fintekkers.requests.security.query_security_request_pb2 import QuerySecurityRequestProto
from fintekkers.requests.transaction.create_transaction_request_pb2 import CreateTransactionRequestProto
from fintekkers.requests.transaction.query_transaction_request_pb2 import QueryTransactionRequestProto

from fintekkers.wrappers.models import errors
from fintekkers.wrappers.models.issues.issuance import Issuance, IssuanceHistory
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.floating_rate_note import FloatingRateNote
from fintekkers.wrappers.models.security.index_security import IndexSecurity
from fintekkers.wrappers.models.security.mortgage_backed_security import MortgageBackedSecurity
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.security.security_identifier import Identifier
from fintekkers.wrappers.models.security.tenor import Tenor
from fintekkers.wrappers.models.security.tips_bond import TIPSBond
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.models.util import date_utils
from fintekkers.wrappers.models.util.decimal import encode_decimal
from fintekkers.wrappers.models.util.fintekkers_uuid import FintekkersUuid
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.requests import portfolio as portfolio_requests
from fintekkers.wrappers.requests import price as price_requests
from fintekkers.wrappers.requests import security as security_requests
from fintekkers.wrappers.requests import transaction as transaction_requests
from fintekkers.wrappers.requests.portfolio import CreatePortfolioRequest, QueryPortfolioRequest
from fintekkers.wrappers.requests.price import CreatePriceRequest, QueryPriceRequest
from fintekkers.wrappers.requests.security import CreateSecurityRequest, QuerySecurityRequest
from fintekkers.wrappers.requests.transaction import CreateTransactionRequest, QueryTransactionRequest
from fintekkers.wrappers.util.object_types import SCHEMA_VERSION, own_type, read_type, read_version, stamp, stamp_own

ROOT = "fintekkers.wrappers"

# Packages under ROOT that discover() does not walk, each with its reason.
EXCLUDED_PACKAGES = {
    "fintekkers.wrappers.services": (
        "service methods send their requests to a gRPC stub and return no built "
        "message; covered by test/wrappers/services/test_services_stamp.py (LM-326)"
    ),
}

SNAPSHOT = Path(__file__).with_name("builders_stamp_snapshot.json")


# --- Discovery --------------------------------------------------------------

def _modules():
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


def _calls_a_proto_constructor(function) -> bool:
    tree = ast.parse(textwrap.dedent(inspect.getsource(function)))
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            callee = node.func
            name = callee.id if isinstance(callee, ast.Name) else getattr(callee, "attr", "")
            if name.endswith("Proto"):
                return True
    return False


def discover() -> set:
    """Qualified names (relative to ROOT) of every public callable that can
    create a message."""
    found = set()
    for module in _modules():
        relative = module.__name__[len(ROOT) + 1:]
        for name, value in vars(module).items():
            if name.startswith("_") or getattr(value, "__module__", None) != module.__name__:
                continue
            if inspect.isfunction(value):
                found.add(f"{relative}.{name}")
            elif inspect.isclass(value):
                found.add(f"{relative}.{name}")
                for attribute, member in vars(value).items():
                    if attribute.startswith("_"):
                        continue
                    if isinstance(member, (staticmethod, classmethod)):
                        found.add(f"{relative}.{name}.{attribute}")
                    elif inspect.isfunction(member) and (
                        attribute in ("as_proto", "to_proto") or _calls_a_proto_constructor(member)
                    ):
                        found.add(f"{relative}.{name}.{attribute}")
    return found


# --- Walker -----------------------------------------------------------------

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
    for field, value in message.ListFields():
        if field.message_type is None:
            continue
        child_path = f"{path}.{field.name}"
        if field.message_type.GetOptions().map_entry:
            if field.message_type.fields_by_name["value"].message_type is not None:
                for key, item in value.items():
                    assert_stamped(item, f"{child_path}[{key!r}]")
        elif field.label == field.LABEL_REPEATED:
            for index, item in enumerate(value):
                assert_stamped(item, f"{child_path}[{index}]")
        else:
            assert_stamped(value, child_path)


def strip_stamps(message):
    """A copy of `message` with object_type and version cleared everywhere."""
    copy = type(message)()
    copy.CopyFrom(message)
    _clear_stamps(copy)
    return copy


def _clear_stamps(message) -> None:
    if message.DESCRIPTOR.full_name == "google.protobuf.Any":
        return
    if "object_type" in message.DESCRIPTOR.fields_by_name:
        message.ClearField("object_type")
        message.ClearField("version")
    for field, value in message.ListFields():
        if field.message_type is None:
            continue
        if field.message_type.GetOptions().map_entry:
            if field.message_type.fields_by_name["value"].message_type is not None:
                for item in value.values():
                    _clear_stamps(item)
        elif field.label == field.LABEL_REPEATED:
            for item in value:
                _clear_stamps(item)
        else:
            _clear_stamps(value)


def _messages(result) -> list:
    if isinstance(result, Message):
        return [result]
    if isinstance(result, (list, tuple)):
        return [message for item in result for message in _messages(item)]
    raise TypeError(f"builder sample returned {type(result).__name__}, not a message")


# --- Fixed clock, time zone and UUIDs ---------------------------------------

_NOW = datetime(2026, 10, 14, 9, 30, 0)


class _FixedDatetime(datetime):
    @classmethod
    def now(cls, tz=None):
        return _NOW


@contextlib.contextmanager
def _deterministic():
    """datetime.now() in the builder modules, the local time zone and
    FintekkersUuid.new_uuid() are fixed, so outputs repeat exactly."""
    counter = itertools.count(1)
    with contextlib.ExitStack() as stack:
        stack.callback(time.tzset)
        stack.enter_context(mock.patch.dict(os.environ, {"TZ": "America/New_York"}))
        time.tzset()
        for module in (portfolio_requests, price_requests, security_requests, transaction_requests, date_utils):
            stack.enter_context(mock.patch.object(module, "datetime", _FixedDatetime))
        stack.enter_context(mock.patch.object(
            FintekkersUuid, "new_uuid", staticmethod(lambda: FintekkersUuid(UUID(int=next(counter))))))
        yield


# --- Sample inputs (pass-through protos arrive stamped) ---------------------

def _uuid(n: int) -> UUIDProto:
    return UUIDProto(raw_uuid=UUID(int=n).bytes)


def _timestamp() -> LocalTimestampProto:
    return LocalTimestampProto(timestamp=Timestamp(seconds=1_792_000_000), time_zone="America/New_York")


def _cash() -> SecurityProto:
    return stamp_own(SecurityProto(uuid=_uuid(101), as_of=_timestamp(), asset_class="Cash", issuer_name="USD"))


def _security() -> SecurityProto:
    return stamp_own(SecurityProto(
        uuid=_uuid(102), as_of=_timestamp(), issuer_name="US Government",
        identifiers=[_identifier()], settlement_currency=_cash(),
    ))


def _identifier() -> IdentifierProto:
    return stamp_own(IdentifierProto(identifier_type=CUSIP, identifier_value="91282CJL6"))


def _portfolio() -> PortfolioProto:
    return stamp_own(PortfolioProto(uuid=_uuid(103), as_of=_timestamp(), portfolio_name="Test portfolio"))


def _price() -> PriceProto:
    return stamp_own(PriceProto(
        uuid=_uuid(104), as_of=_timestamp(), price=encode_decimal(Decimal("99.5")), security=_security(),
    ))


def _transaction() -> TransactionProto:
    return stamp_own(TransactionProto(
        uuid=_uuid(105), as_of=_timestamp(), portfolio=_portfolio(), security=_security(),
        price=_price(), quantity=encode_decimal(Decimal(100)),
    ))


def _issuance() -> IssuanceProto:
    return stamp_own(IssuanceProto(as_of=_timestamp(), total_accepted=encode_decimal(Decimal(500000))))


def _position_filter() -> PositionFilterProto:
    return stamp_own(PositionFilterProto())


def _fields() -> dict:
    return {FieldProto.ASSET_CLASS: "Fixed Income", FieldProto.ID: _uuid(106)}


def _ust_note() -> CreateSecurityRequest:
    return CreateSecurityRequest.create_ust_security_request(
        cusip="91282CJL6", cash_security=_cash(), product_type=TREASURY_NOTE,
        coupon_rate=Decimal("4.5"), spread=Decimal(0), face_value=Decimal(1000),
        issue_date=date(2024, 1, 15), dated_date=date(2024, 1, 15), maturity_date=date(2034, 1, 15),
        post_auction_outstanding_quantity=Decimal(1000000), auction_total_accepted=Decimal(500000),
        auction_announcement_date=date(2024, 1, 8),
    )


def _ust_frn() -> CreateSecurityRequest:
    return CreateSecurityRequest.create_ust_security_request(
        cusip="91282CJM4", cash_security=_cash(), product_type=TREASURY_FRN,
        coupon_rate=Decimal(0), spread=Decimal("0.125"), face_value=Decimal(1000),
        issue_date=date(2024, 1, 30), dated_date=date(2024, 1, 30), maturity_date=date(2026, 1, 31),
        post_auction_outstanding_quantity=Decimal(0), auction_total_accepted=Decimal(0),
        auction_announcement_date=None,
    )


_BOND_ARGS = dict(
    face_value=Decimal(1000), coupon_rate=Decimal("4.5"), coupon_type=FIXED, coupon_frequency=SEMIANNUALLY,
    issue_date=date(2024, 1, 15), maturity_date=date(2034, 1, 15),
)


# Qualified name (relative to ROOT) -> a zero-argument sample call returning
# the message(s) the builder created.
BUILDERS = {
    # Model constructors: they wrap the caller's proto as it is.
    "models.issues.issuance.Issuance": lambda: Issuance(_issuance()).proto,
    "models.issues.issuance.IssuanceHistory": lambda: IssuanceHistory([_issuance(), _issuance()]).proto,
    "models.portfolio.Portfolio": lambda: Portfolio(_portfolio()).proto,
    "models.position.Position": lambda: Position(stamp_own(PositionProto())).positionProto,
    "models.price.Price": lambda: Price(_price()).proto,
    "models.security.bond_security.BondSecurity": lambda: BondSecurity(_security()).proto,
    "models.security.floating_rate_note.FloatingRateNote": lambda: FloatingRateNote(_security()).proto,
    "models.security.index_security.IndexSecurity": lambda: IndexSecurity(_security()).proto,
    "models.security.mortgage_backed_security.MortgageBackedSecurity": lambda: MortgageBackedSecurity(_security()).proto,
    "models.security.security.Security": lambda: Security(_security()).proto,
    "models.security.security_identifier.Identifier": lambda: Identifier(_identifier()).proto,
    "models.security.tips_bond.TIPSBond": lambda: TIPSBond(_security()).proto,
    "models.transaction.Transaction": lambda: Transaction(_transaction()).proto,
    # Model builders.
    "models.portfolio.Portfolio.create_portfolio": lambda: Portfolio.create_portfolio("Test portfolio").proto,
    "models.price.Price.create_price": lambda: Price.create_price(
        Security(_security()), Decimal("99.5"), Timestamp(seconds=1_792_000_000)).proto,
    "models.transaction.Transaction.create_from": lambda: Transaction.create_from(
        security=_security(), portfolio=_portfolio(), trade_date=date(2026, 10, 14),
        settlement_date=date(2026, 10, 15), position_status=PositionStatusProto.INTENDED,
        transaction_type=TransactionTypeProto.BUY, price=Decimal("99.5"), quantity=Decimal(100),
        as_of=datetime(2026, 10, 14, 9, 30)).proto,
    "models.security.security.Security.link_of": lambda: Security.link_of(UUID(int=110), datetime(2026, 10, 14, 9, 30)),
    "models.security.security.Security.link_of_latest": lambda: Security.link_of_latest(UUID(int=111)),
    "models.security.bond_security.BondSecurity.from_pricer_inputs": lambda: BondSecurity.from_pricer_inputs(**_BOND_ARGS),
    "models.security.floating_rate_note.FloatingRateNote.from_pricer_inputs": lambda: FloatingRateNote.from_pricer_inputs(
        **{**_BOND_ARGS, "coupon_type": FLOAT}, spread=Decimal("0.125"),
        reference_rate_index=IndexTypeProto.UNKNOWN_INDEX_TYPE, reset_frequency=SEMIANNUALLY),
    "models.security.tips_bond.TIPSBond.from_pricer_inputs": lambda: TIPSBond.from_pricer_inputs(
        **_BOND_ARGS, base_cpi=Decimal("299.1"), index_date=date(2024, 1, 1),
        inflation_index_type=IndexTypeProto.UNKNOWN_INDEX_TYPE),
    "models.security.mortgage_backed_security.MortgageBackedSecurity.from_pricer_inputs": lambda: MortgageBackedSecurity.from_pricer_inputs(
        **_BOND_ARGS, pool_number="AB1234", agency=0, wac=Decimal("5.1"), wam=340,
        pass_through_rate=Decimal("4.5"), current_factor=Decimal("0.9"), original_face_value=Decimal(1000000),
        current_upb=Decimal(900000), psa_speed=Decimal(150)),
    "models.security.tenor.Tenor.as_proto": lambda: Tenor(TenorTypeProto.TERM, "5Y").as_proto(),
    # Value builders: their messages have no object_type field.
    "models.errors.violation": lambda: errors.violation("price", UUID(int=108), "price is required"),
    "models.util.date_utils.get_date_proto": lambda: date_utils.get_date_proto(date(2026, 10, 14)),
    "models.util.date_utils.today_proto": lambda: date_utils.today_proto(),
    "models.util.decimal.encode_decimal": lambda: encode_decimal(Decimal("99.5")),
    "models.util.serialization.ProtoSerializationUtil.serialize": lambda: [
        ProtoSerializationUtil.serialize(value) for value in (
            UUID(int=109), date(2026, 10, 14), datetime(2026, 10, 14, 9, 30), Decimal("1.5"), "text",
            Tenor(TenorTypeProto.TERM, "5Y"), Identifier(_identifier()),
        )
    ],
    # Request constructors: they wrap the caller's proto as it is.
    "requests.price.CreatePriceRequest": lambda: CreatePriceRequest(
        stamp_own(CreatePriceRequestProto(create_price_input=_price()))).proto,
    "requests.price.QueryPriceRequest": lambda: QueryPriceRequest(
        stamp_own(QueryPriceRequestProto(search_price_input=_position_filter()))).proto,
    "requests.portfolio.QueryPortfolioRequest": lambda: QueryPortfolioRequest(
        stamp_own(QueryPortfolioRequestProto(search_portfolio_input=_position_filter()))).proto,
    "requests.security.CreateSecurityRequest": lambda: CreateSecurityRequest(
        stamp_own(CreateSecurityRequestProto(security_input=_security()))).proto,
    "requests.security.QuerySecurityRequest": lambda: QuerySecurityRequest(
        stamp_own(QuerySecurityRequestProto(search_security_input=_position_filter()))).proto,
    "requests.transaction.CreateTransactionRequest": lambda: CreateTransactionRequest(
        stamp_own(CreateTransactionRequestProto(create_transaction_input=_transaction()))).proto,
    "requests.transaction.QueryTransactionRequest": lambda: QueryTransactionRequest(
        stamp_own(QueryTransactionRequestProto(search_transaction_input=_position_filter()))).proto,
    # Request builders.
    "requests.portfolio.CreatePortfolioRequest.create_portfolio_request_from_name": lambda: (
        CreatePortfolioRequest.create_portfolio_request_from_name("Test portfolio")),
    "requests.portfolio.CreatePortfolioRequest.create_portfolio_request_from_proto": lambda: (
        CreatePortfolioRequest.create_portfolio_request_from_proto(_portfolio())),
    "requests.portfolio.QueryPortfolioRequest.create_query_request": lambda: (
        QueryPortfolioRequest.create_query_request(_fields()).proto),
    "requests.price.CreatePriceRequest.create_price_request": lambda: (
        CreatePriceRequest.create_price_request(_security(), Decimal("99.5")).proto),
    "requests.price.CreatePriceRequest.create_or_update_request": lambda: CreatePriceRequest.create_or_update_request(
        Security(_security()), Decimal("99.5"), as_of_date=datetime(2026, 10, 14, 9, 30), price_uuid=UUID(int=107)).proto,
    "requests.price.QueryPriceRequest.create_query_request": lambda: QueryPriceRequest.create_query_request(
        _fields(), PriceFrequencyProto.PRICE_FREQUENCY_DAILY, PriceHorizonProto.PRICE_HORIZON_1_MONTH).proto,
    # The date-range branch builds a DateRangeProto.
    "requests.price.QueryPriceRequest.create_query_request_with_date_range": lambda: (
        QueryPriceRequest.create_query_request_with_date_range(
            _fields(), PriceFrequencyProto.PRICE_FREQUENCY_DAILY, date(2026, 1, 1), date(2026, 6, 30)).proto),
    # A note with an auction (nested IssuanceProto) and an FRN.
    "requests.security.CreateSecurityRequest.create_ust_security_request": lambda: [_ust_note().proto, _ust_frn().proto],
    # The MDI-65 chain: create_ust_security_request's security, re-sent.
    "requests.security.CreateSecurityRequest.create_or_update_request": lambda: CreateSecurityRequest.create_or_update_request(
        Security(_ust_note().proto.security_input)).proto,
    "requests.security.QuerySecurityRequest.create_query_request": lambda: (
        QuerySecurityRequest.create_query_request(_fields()).proto),
    "requests.transaction.CreateTransactionRequest.create_transaction_request": lambda: (
        CreateTransactionRequest.create_transaction_request(
            security=_security(), portfolio=_portfolio(), trade_date=date(2026, 10, 14),
            settlement_date=date(2026, 10, 15), position_status=PositionStatusProto.INTENDED,
            transaction_type=TransactionTypeProto.BUY, price=Decimal("99.5"), quantity=Decimal(100),
            as_of=datetime(2026, 10, 14, 9, 30)).proto),
    # Takes only message filter values: it packs every value into an Any.
    "requests.transaction.QueryTransactionRequest.create_query_request": lambda: (
        QueryTransactionRequest.create_query_request({FieldProto.ID: _uuid(106)})),
}

_PRODUCT_HIERARCHY_LOOKUPS = (
    "active_product_types", "all_asset_classes", "all_instrument_types", "all_product_types",
    "asset_class_descendants_of", "asset_class_label_of", "asset_class_matches", "asset_class_of",
    "asset_class_parent_of", "asset_class_proto_label_of", "descendants_of", "identifier_type_label_of",
    "identifier_type_placeholder_of", "instrument_type_code_label_of", "instrument_type_label_of",
    "instrument_type_of", "is_asset_class_descendant_of", "is_descendant_of", "label_of", "parent_of",
    "product_type_label_of", "resolve_asset_class",
)

# Qualified name (relative to ROOT) -> why it is not a builder.
NOT_BUILDERS = {
    "models.cost_basis.weighted_average_purchase_price": "returns a Decimal",
    "models.errors.ModelValidationError": "exception type; its violations come from errors.violation (a builder)",
    "models.portfolio.set_portfolio_fetcher": "setter for the lazy-hydrate fetcher",
    "models.price.set_price_fetcher": "setter for the lazy-hydrate fetcher",
    "models.security.security.set_security_fetcher": "setter for the lazy-hydrate fetcher",
    "models.transaction.set_transaction_fetcher": "setter for the lazy-hydrate fetcher",
    "models.transaction.TransactionType": "wraps a TransactionTypeProto enum value, not a message",
    "models.position.Position.pack_field": "packs the caller's value into an Any, which the walker does not unpack",
    "models.position.Position.wrap_string_to_any": "packs a StringValue into an Any; no object_type field",
    "models.position.Position.unpack_field": "read path: unpacks an Any",
    "models.position.Position.unpack_measure": "read path: decodes a measure",
    "models.position_filter.filter_rows": "predicate over rows",
    "models.position_filter.matches": "predicate over a row",
    "models.price_rules.validate": "validator; its FieldViolationProtos come from errors.violation (a builder)",
    "models.price_rules.require_valid": "validator; raises or returns None",
    "models.security.security_rules.validate": "validator; its FieldViolationProtos come from errors.violation (a builder)",
    "models.security.security_rules.require_valid": "validator; raises or returns None",
    "models.security.security_identifier.validate_identifier_proto": "validator; raises or returns None",
    "models.security.security_identifier.validate_identifiers_for_create": "validator; raises or returns None",
    "models.security.security_identifier.IdentifierValidationError": "exception type",
    "models.security.security.IFinancialModelObject": "interface with no state",
    "models.security.security.RawDataModelObject": "plain id/as_of holder, no message",
    "models.security.tenor.Tenor": "holds a TenorTypeProto value and a relativedelta; Tenor.as_proto is the builder",
    "models.security.tenor.Tenor.from_tenor_description": "returns a relativedelta",
    "models.security.tenor.Tenor.parse_period": "returns a relativedelta",
    "models.security.tenor.Tenor.period_to_string": "returns a str",
    "models.util.date_utils.get_date": "returns a datetime",
    "models.util.date_utils.get_date_as_dict": "returns a dict",
    "models.util.date_utils.get_date_from_proto": "read path: returns a datetime",
    "models.util.decimal.decode_decimal": "read path: returns a Decimal",
    "models.util.decimal.is_decimal_set": "predicate",
    "models.util.fintekkers_uuid.FintekkersUuid": "wraps a uuid.UUID, not a message",
    "models.util.fintekkers_uuid.FintekkersUuid.from_bytes": "returns a FintekkersUuid",
    "models.util.fintekkers_uuid.FintekkersUuid.from_uuid": "returns a FintekkersUuid",
    "models.util.fintekkers_uuid.FintekkersUuid.new_uuid": "returns a FintekkersUuid",
    "models.util.serialization.ProtoEnum": "wraps an enum value, not a message",
    "models.util.serialization.ProtoEnum.from_enum_name": "returns a ProtoEnum",
    "models.util.serialization.ProtoEnum.get_field_descriptor": "returns an enum descriptor",
    "models.util.serialization.ProtoEnum.get_field_descriptor_from_name": "returns an enum descriptor",
    "models.util.serialization.ProtoSerializationUtil": "namespace class with no state; serialize is the builder",
    "models.util.serialization.ProtoSerializationUtil.deserialize": "read path",
    "models.util.serialization.ProtoSerializationUtil.deserialize_required_timestamp": "read path",
    "requests.portfolio.CreatePortfolioRequest": "namespace class with no constructor of its own; its static methods are the builders",
    "util.link_cache.LinkCache": "cache of protos it was given; creates none",
    "util.link_resolver.LinkResolver": "resolves links through a caller's fetcher; creates none",
    "util.object_types.stamp": "the stamp helper itself: stamps the caller's message",
    "util.object_types.stamp_own": "the stamp helper itself: stamps the caller's message",
    "util.object_types.own_type": "read path: returns an int",
    "util.object_types.read_type": "read path: returns an int",
    "util.object_types.read_version": "read path: returns a tuple",
    **{
        f"models.security.product_hierarchy.{name}": "product-hierarchy lookup; returns enum values or labels"
        for name in _PRODUCT_HIERARCHY_LOOKUPS
    },
}


# --- Tests ------------------------------------------------------------------

def test_every_discovered_callable_is_classified():
    discovered = discover()

    # Discovery is not vacuous: the builders this item is about are found.
    for name in (
        "requests.security.CreateSecurityRequest.create_ust_security_request",
        "requests.security.CreateSecurityRequest.create_or_update_request",
        "requests.portfolio.QueryPortfolioRequest.create_query_request",
        "requests.transaction.CreateTransactionRequest.create_transaction_request",
        "models.security.tenor.Tenor.as_proto",
    ):
        assert name in discovered
    assert len(BUILDERS) > 0

    assert not set(BUILDERS) & set(NOT_BUILDERS)
    unclassified = discovered - set(BUILDERS) - set(NOT_BUILDERS)
    assert not unclassified, f"public callables in neither BUILDERS nor NOT_BUILDERS: {sorted(unclassified)}"
    stale = (set(BUILDERS) | set(NOT_BUILDERS)) - discovered
    assert not stale, f"listed but not discovered: {sorted(stale)}"


def test_exclusions_are_visible():
    for name, reason in NOT_BUILDERS.items():
        assert reason.strip(), f"{name} has no reason"
        assert not name.rsplit(".", 1)[-1].startswith(("create", "from_pricer", "link_of")), (
            f"{name} looks like a builder; it cannot be in NOT_BUILDERS")
    for package, reason in EXCLUDED_PACKAGES.items():
        assert reason.strip(), f"{package} has no reason"
        assert importlib.util.find_spec(package) is not None, f"{package} is not a package"
    assert set(EXCLUDED_PACKAGES) == {"fintekkers.wrappers.services"}
    assert not any(name.startswith("services.") for name in discover())


@pytest.mark.parametrize("name", sorted(BUILDERS))
def test_builder_output_is_stamped(name):
    with _deterministic():
        messages = _messages(BUILDERS[name]())
    for index, message in enumerate(messages):
        assert_stamped(message, f"{name}[{index}]")


@pytest.mark.parametrize("name", sorted(BUILDERS))
def test_builder_other_fields_unchanged(name):
    snapshot = json.loads(SNAPSHOT.read_text())
    assert name in snapshot, f"{name} has no snapshot; regenerate {SNAPSHOT.name} (see the module docstring)"
    with _deterministic():
        messages = _messages(BUILDERS[name]())
    expected = [_parse(entry) for entry in snapshot[name]]
    assert [m.DESCRIPTOR.full_name for m in messages] == [m.DESCRIPTOR.full_name for m in expected]
    for message, before in zip(messages, expected):
        assert strip_stamps(message) == strip_stamps(before)


def test_walker_catches_an_unstamped_nested_message():
    request = stamp_own(QueryPortfolioRequestProto(search_portfolio_input=PositionFilterProto()))
    with pytest.raises(AssertionError, match="search_portfolio_input"):
        assert_stamped(request, "request")


def test_walker_catches_an_unstamped_repeated_element():
    security = stamp_own(SecurityProto(identifiers=[_identifier(), IdentifierProto(identifier_value="X")]))
    with pytest.raises(AssertionError, match=r"identifiers\[1\]"):
        assert_stamped(security, "security")


def test_walker_catches_a_wrong_object_type():
    security = stamp(SecurityProto(), ObjectTypeProto.OBJECT_TYPE_PRICE)
    with pytest.raises(AssertionError, match="OBJECT_TYPE_PRICE"):
        assert_stamped(security, "security")


# --- Snapshot ---------------------------------------------------------------

def _parse(entry):
    message_class = symbol_database.Default().GetSymbol(entry["type"])
    return message_class.FromString(bytes.fromhex(entry["bytes"]))


def _write_snapshot():
    snapshot = {}
    for name in sorted(BUILDERS):
        with _deterministic():
            messages = _messages(BUILDERS[name]())
        snapshot[name] = [
            {"type": m.DESCRIPTOR.full_name, "bytes": m.SerializeToString(deterministic=True).hex()}
            for m in messages
        ]
    SNAPSHOT.write_text(json.dumps(snapshot, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    _write_snapshot()
