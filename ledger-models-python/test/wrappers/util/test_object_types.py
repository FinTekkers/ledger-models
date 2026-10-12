"""Compact object type and version (LM-297): writers set both forms, readers
translate the strings-only form. Rows come from the shared fixture
test-fixtures/object-type-legacy.json, which Java, JS and Rust also load."""
import base64
import importlib
import json
import logging
import pkgutil
import uuid
from datetime import date, datetime
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from google.protobuf import symbol_database
from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.product_type_pb2 import TREASURY_NOTE
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.object_type_pb2 import ObjectTypeProto
from fintekkers.wrappers.models.portfolio import Portfolio
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.transaction import Transaction
from fintekkers.wrappers.requests.price import CreatePriceRequest
from fintekkers.wrappers.requests.security import CreateSecurityRequest
from fintekkers.wrappers.services.portfolio import PortfolioService
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.util import object_types
from fintekkers.wrappers.util.link_resolver import LinkResolver

FIXTURE = Path(__file__).resolve().parents[4] / "test-fixtures" / "object-type-legacy.json"
CASES = json.loads(FIXTURE.read_text())["cases"]
COMPACT_NUMBERS = {"object_type": 1001, "version_major": 1002, "version_minor": 1003, "version_patch": 1004}


@pytest.fixture(autouse=True)
def reset_warnings():
    object_types._reset_warnings_for_tests()
    yield
    object_types._reset_warnings_for_tests()


def fallback_warnings(caplog):
    return [r for r in caplog.records if r.name == object_types.LOGGER.name and r.levelno == logging.WARNING]


def decode(case):
    module = "fintekkers." + case["message"].split(".", 1)[1].rsplit(".", 1)[0]
    for pb2 in pkgutil.iter_modules(importlib.import_module(module).__path__, module + "."):
        if pb2.name.endswith("_pb2"):
            importlib.import_module(pb2.name)
    cls = symbol_database.Default().GetSymbol(case["message"])
    return cls.FromString(base64.b64decode(case["bytes"]))


def top_level_field_numbers(data: bytes):
    """Field numbers present at the top level of an encoded message."""
    numbers, i = [], 0

    def varint():
        nonlocal i
        shift = result = 0
        while True:
            b = data[i]
            i += 1
            result |= (b & 0x7F) << shift
            shift += 7
            if not b & 0x80:
                return result

    while i < len(data):
        key = varint()
        numbers.append(key >> 3)
        wire_type = key & 7
        if wire_type == 0:
            varint()
        elif wire_type == 1:
            i += 8
        elif wire_type == 2:
            length = varint()
            i += length
        elif wire_type == 5:
            i += 4
        else:
            raise AssertionError(f"unexpected wire type {wire_type}")
    return numbers


# ---- Loading the old form translates it (metric 3) ----

@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_fixture_row_decodes_to_expected_type_and_version(case, caplog):
    message = decode(case)
    expect = case["expect"]

    with caplog.at_level(logging.WARNING, logger=object_types.LOGGER.name):
        assert object_types.read_type(message) == ObjectTypeProto.Value(expect["object_type"])
        assert list(object_types.read_version(message)) == expect["version"]

    assert len(fallback_warnings(caplog)) == (1 if expect["warns"] else 0)


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_upgraded_row_reserialises_with_compact_fields(case):
    upgraded = object_types.upgrade(decode(case))
    data = upgraded.SerializeToString()
    expect = case["expect"]
    expected_values = {
        "object_type": ObjectTypeProto.Value(expect["object_type"]),
        "version_major": expect["version"][0],
        "version_minor": expect["version"][1],
        "version_patch": expect["version"][2],
    }

    present = top_level_field_numbers(data)
    for name, number in COMPACT_NUMBERS.items():
        assert (number in present) == (expected_values[name] != 0), name
    reread = type(upgraded).FromString(data)
    for name, value in expected_values.items():
        assert getattr(reread, name) == value, name
    assert (reread.object_class, reread.version) == (case["object_class"], case["version"])


def test_fixture_has_a_real_writer_row_per_library_string():
    from models.util.test_object_type_descriptor import LIBRARY_WRITTEN_STRINGS

    real = {c["object_class"] for c in CASES if c["source"].split()[0] in ("python", "java", "js", "rust")}
    assert real == set(LIBRARY_WRITTEN_STRINGS)


# ---- Reading the strings is deprecated (metric 4) ----

def test_three_strings_only_decodes_of_one_type_warn_once(caplog):
    case = next(c for c in CASES if c["name"] == "python-PriceProto")
    with caplog.at_level(logging.WARNING, logger=object_types.LOGGER.name):
        for _ in range(3):
            object_types.upgrade(decode(case))
    assert len(fallback_warnings(caplog)) == 1


def test_new_form_does_not_warn(caplog):
    message = object_types.stamp(PriceProto(), ObjectTypeProto.OBJECT_TYPE_PRICE, "PriceProto", "0.0.1")
    with caplog.at_level(logging.WARNING, logger=object_types.LOGGER.name):
        object_types.read_type(message)
        object_types.read_version(message)
    assert fallback_warnings(caplog) == []


# ---- Writers set both forms (metric 2) ----

def _captured_request(call):
    captured = []
    stub = MagicMock()
    stub.GetByIds.side_effect = lambda r: captured.append(r) or MagicMock(portfolio_response=[], security_response=[])
    call(stub)
    return captured[-1]


def _portfolio_service_request(stub):
    service = PortfolioService.__new__(PortfolioService)
    service.stub = stub
    service.get_portfolio_by_uuid(uuid.UUID(int=1))


def _security_service_request(stub):
    service = SecurityService.__new__(SecurityService)
    service.stub = stub
    service.get_security_by_uuid(uuid.UUID(int=1))


SECURITY = SecurityProto(issuer_name="X")

# (name, build the message, ObjectTypeProto value, object_class, version)
LIBRARY_WRITERS = [
    ("Price.create_price", lambda: Price.create_price(Security(SECURITY), 1.0, Timestamp()).proto,
     "OBJECT_TYPE_PRICE", "PriceProto", "0.0.1"),
    ("Portfolio.create_portfolio", lambda: Portfolio.create_portfolio("P").proto,
     "OBJECT_TYPE_PORTFOLIO", "Portfolio", "0.0.1"),
    ("Transaction.create_from", lambda: Transaction.create_from(trade_date=date(2024, 1, 2), settlement_date=date(2024, 1, 4)).proto,
     "OBJECT_TYPE_TRANSACTION", "Transaction", ""),
    ("CreatePriceRequest", lambda: CreatePriceRequest.create_or_update_request(SECURITY, 1.0, datetime(2024, 1, 2)).proto,
     "OBJECT_TYPE_CREATE_PRICE_REQUEST", "CreatePriceRequestProto", "0.0.1"),
    ("CreatePriceRequest.create_price_input",
     lambda: CreatePriceRequest.create_or_update_request(SECURITY, 1.0, datetime(2024, 1, 2)).proto.create_price_input,
     "OBJECT_TYPE_PRICE", "PriceProto", "0.0.1"),
    ("CreateSecurityRequest issuance",
     lambda: CreateSecurityRequest.create_ust_security_request(
         cusip="C", cash_security=SECURITY, product_type=TREASURY_NOTE, spread=None,
         auction_announcement_date=date(2024, 1, 2)).proto.security_input.bond_details.issuance_info[0],
     "OBJECT_TYPE_ISSUANCE", "", "0.0.1"),
    ("PortfolioService.get_portfolio_by_uuid", lambda: _captured_request(_portfolio_service_request),
     "OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST", "PortfolioRequest", "0.0.1"),
    ("SecurityService.get_security_by_uuid", lambda: _captured_request(_security_service_request),
     "OBJECT_TYPE_QUERY_SECURITY_REQUEST", "SecurityRequest", "0.0.1"),
    ("LinkResolver._batch_fetch_securities",
     lambda: _captured_request(lambda stub: LinkResolver(stub, stub)._batch_fetch_securities([uuid.UUID(int=1)], None)),
     "OBJECT_TYPE_QUERY_SECURITY_REQUEST", "SecurityRequest", "0.0.1"),
    ("LinkResolver._batch_fetch_portfolios",
     lambda: _captured_request(lambda stub: LinkResolver(stub, stub)._batch_fetch_portfolios([uuid.UUID(int=1)], None)),
     "OBJECT_TYPE_QUERY_PORTFOLIO_REQUEST", "PortfolioRequest", "0.0.1"),
]


@pytest.mark.parametrize("build, type_name, object_class, version",
                         [w[1:] for w in LIBRARY_WRITERS], ids=[w[0] for w in LIBRARY_WRITERS])
def test_writer_sets_strings_and_compact_fields_that_agree(build, type_name, object_class, version):
    message = build()

    assert (message.object_class, message.version) == (object_class, version)
    assert message.object_type == ObjectTypeProto.Value(type_name)
    if object_class:
        assert object_types.from_legacy(object_class) == message.object_type
    parts = (message.version_major, message.version_minor, message.version_patch)
    assert parts == (object_types.parse_version(version) if version else (0, 0, 0))


def test_stamp_rejects_a_malformed_version():
    with pytest.raises(ValueError):
        object_types.stamp(PriceProto(), ObjectTypeProto.OBJECT_TYPE_PRICE, "PriceProto", "1.2")
