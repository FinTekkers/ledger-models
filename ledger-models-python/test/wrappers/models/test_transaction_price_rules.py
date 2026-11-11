"""LM-463: trade-price rule. The same fixture
(test-fixtures/transaction-price/cases.json) runs in Java, Rust and JS."""

import json
from pathlib import Path
from uuid import UUID

import pytest

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.price.price_type_pb2 import PriceTypeProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models import transaction_rules

FIELD = transaction_rules.PRICE_PREFIX + "price_type"


def _repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "test-fixtures" / "transaction-price").exists():
            return parent
    raise FileNotFoundError("test-fixtures/transaction-price not found above this test")


CASE_LIST = json.loads(
    (_repo_root() / "test-fixtures" / "transaction-price" / "cases.json").read_text(encoding="utf-8"))["cases"]
CASES = {c["name"]: c for c in CASE_LIST}


def _price(p: dict) -> PriceProto:
    out = PriceProto()
    if "uuid" in p:
        out.uuid.CopyFrom(UUIDProto(raw_uuid=UUID(p["uuid"]).bytes))
    if p.get("link"):
        out.is_link = True
    if "price_type" in p:
        pt = p["price_type"]
        out.price_type = pt if isinstance(pt, int) else PriceTypeProto.Value(pt)
    return out


def _transaction(t: dict) -> TransactionProto:
    out = TransactionProto(uuid=UUIDProto(raw_uuid=UUID(t["uuid"]).bytes))
    if "price" in t:
        out.price.CopyFrom(_price(t["price"]))
    return out


def _on_price_type(violations):
    return [v for v in violations if v.field == FIELD]


def test_fixture_has_every_case_including_the_metric_cases():
    assert len(CASES) == len(CASE_LIST), "case names must be unique"
    assert {"inline_unknown", "inline_unknown_no_uuid", "inline_absolute", "inline_percentage", "inline_rate",
            "inline_unrecognised_value", "link_no_price_type", "link_unknown_explicit", "no_price"} <= set(CASES)


def test_every_fixture_case_runs():
    ran = 0
    for case in CASE_LIST:
        actual = transaction_rules.validate(_transaction(case["transaction"]))
        assert len(actual) == len(case["violations"]), (case["name"], [v.field for v in actual])
        for want, got in zip(case["violations"], actual):
            assert got.field == want["field"]
            assert got.message == want["message"]
            if want["object_id"] is None:
                assert not got.HasField("object_id")
            else:
                assert UUID(bytes=got.object_id.raw_uuid) == UUID(want["object_id"])
        ran += 1
    assert ran == len(CASE_LIST)


def test_inline_unknown_gives_exactly_one_violation_on_price_type():
    actual = transaction_rules.validate(_transaction(CASES["inline_unknown"]["transaction"]))
    assert len(actual) == 1
    assert actual[0].field == "price.price_type"
    assert "price_type" in actual[0].message
    assert actual[0].message == transaction_rules.UNKNOWN_TRADE_PRICE_TYPE


@pytest.mark.parametrize("name", ["inline_absolute", "inline_percentage", "inline_rate"])
def test_inline_known_price_type_gives_no_violation(name):
    assert _on_price_type(transaction_rules.validate(_transaction(CASES[name]["transaction"]))) == []


@pytest.mark.parametrize("name", ["link_no_price_type", "link_unknown_explicit"])
def test_link_price_is_never_checked(name):
    assert _on_price_type(transaction_rules.validate(_transaction(CASES[name]["transaction"]))) == []


def test_unrecognised_raw_value_passes():
    proto = TransactionProto()
    proto.price.price_type = 999
    assert transaction_rules.validate(proto) == []


def test_every_named_price_type_except_unknown_passes():
    visited = []
    for value in PriceTypeProto.values():
        if value == PriceTypeProto.UNKNOWN_PRICE_TYPE:
            continue
        proto = TransactionProto()
        proto.price.price_type = value
        assert transaction_rules.validate(proto) == [], PriceTypeProto.Name(value)
        visited.append(value)
    assert len(visited) >= 5, visited
    assert PriceTypeProto.RATE in visited
