"""Contract and wire checks for QueryPriceResponseProto.truncated / row_cap.

See docs/adr/query_price_truncation.md.
"""
import re
from pathlib import Path

from google.protobuf.descriptor import FieldDescriptor

from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.requests.price.query_price_response_pb2 import QueryPriceResponseProto

REPO_ROOT = Path(__file__).resolve().parents[3]
RESPONSE_PROTO = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "requests" / "price" / "query_price_response.proto"

# QueryPriceResponseProto before LM-348: name -> (number, type). Must not change.
EXISTING_FIELDS = {
    "object_type": (1, FieldDescriptor.TYPE_ENUM),
    "version": (2, FieldDescriptor.TYPE_MESSAGE),
    "query_price_request": (20, FieldDescriptor.TYPE_MESSAGE),
    "price_response": (30, FieldDescriptor.TYPE_MESSAGE),
    "errors_or_warnings": (40, FieldDescriptor.TYPE_MESSAGE),
    "next_page_token": (50, FieldDescriptor.TYPE_STRING),
}

# Phrases each field's comment must carry (metric 3).
REQUIRED_PHRASES = {
    "truncated": [
        "row_cap", "limit", "ceiling", "date_range", "horizon", "next_page_token",
        "`truncated` is set only when `next_page_token` is empty",
    ],
    "row_cap": ["effective cap", "limit", "truncated"],
}


def field_comment(field_name: str) -> str:
    """Comment lines directly above `<type> field_name = N;`, joined, without the `//` prefix."""
    lines = RESPONSE_PROTO.read_text().splitlines()
    pattern = re.compile(r"^\s*\w+\s+" + field_name + r"\s*=\s*\d+;")
    matches = [i for i, line in enumerate(lines) if pattern.match(line)]
    assert len(matches) == 1, f"{field_name} not found exactly once in {RESPONSE_PROTO}"
    comment = []
    i = matches[0] - 1
    while i >= 0 and lines[i].strip().startswith("//"):
        comment.insert(0, lines[i].strip()[2:].strip())
        i -= 1
    return " ".join(comment)


def test_new_fields_types_numbers_and_no_presence():
    fields = QueryPriceResponseProto.DESCRIPTOR.fields_by_name
    previous_max = max(number for number, _ in EXISTING_FIELDS.values())

    for name, field_type in [("truncated", FieldDescriptor.TYPE_BOOL), ("row_cap", FieldDescriptor.TYPE_INT32)]:
        field = fields[name]
        assert field.type == field_type
        assert field.number > previous_max
        assert field.label == FieldDescriptor.LABEL_OPTIONAL
        assert field.containing_oneof is None
        assert not field.has_presence, f"{field.full_name} must be a plain proto3 scalar"


def test_existing_fields_unchanged():
    actual = {f.name: (f.number, f.type) for f in QueryPriceResponseProto.DESCRIPTOR.fields
              if f.name not in {"truncated", "row_cap"}}

    assert actual == EXISTING_FIELDS


def test_comments_state_contract():
    for field_name, phrases in REQUIRED_PHRASES.items():
        text = field_comment(field_name)
        for phrase in phrases:
            assert phrase in text, f"{field_name} comment is missing {phrase!r}"


def test_truncation_fields_round_trip_with_existing_fields():
    response = QueryPriceResponseProto(
        price_response=[PriceProto(is_link=True)], next_page_token="opaque-def", truncated=True, row_cap=1000)

    parsed = QueryPriceResponseProto.FromString(response.SerializeToString())

    assert parsed.truncated is True
    assert parsed.row_cap == 1000
    assert parsed.next_page_token == "opaque-def"
    assert len(parsed.price_response) == 1
    assert parsed.price_response[0].is_link is True


def test_response_without_new_fields_reads_defaults():
    old = QueryPriceResponseProto(price_response=[PriceProto(is_link=True)], next_page_token="opaque-def")
    explicit = QueryPriceResponseProto(
        price_response=[PriceProto(is_link=True)], next_page_token="opaque-def", truncated=False, row_cap=0)

    parsed = QueryPriceResponseProto.FromString(old.SerializeToString())

    assert parsed.truncated is False
    assert parsed.row_cap == 0
    assert explicit.SerializeToString() == old.SerializeToString()
