import json
from datetime import date
from pathlib import Path

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry
from fintekkers.wrappers.models.position import Position


def _effective_date_cases():
    """Cases from ledger-models-protos/fixtures/position_effective_date_cases.json:
    the EFFECTIVE_DATE entries Java packs (LM-447), shared with the Java, JS and Rust tests."""
    for parent in Path(__file__).resolve().parents:
        path = parent / "ledger-models-protos" / "fixtures" / "position_effective_date_cases.json"
        if path.exists():
            with path.open(encoding="utf-8") as f:
                return {case["name"]: case for case in json.load(f)["cases"]}
    raise FileNotFoundError("position_effective_date_cases.json not found above this test")


def _position_with(case) -> Position:
    entry = FieldMapEntry.FromString(bytes.fromhex(case["entry_hex"]))
    return Position(PositionProto(fields=[entry]))


def test_java_packed_effective_date_decodes_to_local_date():
    case = _effective_date_cases()["set"]
    value = _position_with(case).get_field_value(FieldProto.EFFECTIVE_DATE)
    assert value == date(2024, 3, 15)
    assert value.isoformat() == case["expected"]


def test_unset_effective_date_is_none():
    case = _effective_date_cases()["unset"]
    assert _position_with(case).get_field_value(FieldProto.EFFECTIVE_DATE) is None
