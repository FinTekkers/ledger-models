"""LM-438: transaction child-structure rules. The same fixture
(test-fixtures/transaction-children/cases.json) runs in Java, Rust and JS."""

import json
from pathlib import Path
from uuid import UUID

import pytest

from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.transaction.transaction_pb2 import TransactionProto
from fintekkers.models.transaction.transaction_type_pb2 import TransactionTypeProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.wrappers.models import transaction_rules
from fintekkers.wrappers.models.errors import ModelValidationError


def _repo_root() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "test-fixtures" / "transaction-children").exists():
            return parent
    raise FileNotFoundError("test-fixtures/transaction-children not found above this test")


CASES = {c["name"]: c for c in json.loads(
    (_repo_root() / "test-fixtures" / "transaction-children" / "cases.json").read_text(encoding="utf-8"))["cases"]}


def _security(s: dict) -> SecurityProto:
    p = SecurityProto(uuid=UUIDProto(raw_uuid=UUID(s["uuid"]).bytes))
    if s.get("link"):
        p.is_link = True
        return p
    if "product_type" in s:
        p.product_type = ProductTypeProto.Value(s["product_type"])
    if s.get("cash_details"):
        p.cash_details.SetInParent()
    return p


def _node(n: dict) -> TransactionProto:
    p = TransactionProto(transaction_type=TransactionTypeProto.Value(n["transaction_type"]),
                         security=_security(n["security"]))
    if "uuid" in n:
        p.uuid.CopyFrom(UUIDProto(raw_uuid=UUID(n["uuid"]).bytes if n["uuid"] else b""))
    for c in n.get("children", []):
        p.childTransactions.append(_node(c))
    return p


def test_fixture_has_the_six_cases():
    assert set(CASES) == {"valid_buy", "valid_sell", "two_cash_children", "duplicate_child_ids",
                          "maturation_with_two_cash", "children_without_uuid"}


@pytest.mark.parametrize("name", sorted(CASES))
def test_shared_fixture_case(name):
    case = CASES[name]
    actual = transaction_rules.validate(_node(case["transaction"]))
    assert len(actual) == len(case["violations"]), [v.field for v in actual]
    for want, got in zip(case["violations"], actual):
        assert got.field == want["field"]
        assert UUID(bytes=got.object_id.raw_uuid) == UUID(want["object_id"])
        for i in want["message_ids"]:
            assert i in got.message


def test_children_without_uuid_has_an_empty_raw_uuid_child():
    p = _node(CASES["children_without_uuid"]["transaction"])
    assert not p.childTransactions[0].HasField("uuid")
    assert p.childTransactions[2].HasField("uuid") and p.childTransactions[2].uuid.raw_uuid == b""


def test_two_cash_children_require_valid_raises():
    with pytest.raises(ModelValidationError) as e:
        transaction_rules.require_valid(_node(CASES["two_cash_children"]["transaction"]))
    assert e.value.field == "child_transactions[1]"
    assert e.value.violations[0].message.startswith(transaction_rules.SECOND_CASH_CHILD)
