"""LM-411 (LM-376): ValuationRequestProto reserves 20 and 22 and both names;
position_input (21) is unchanged. The fields come from
test-fixtures/removed-fields/lm-376.json. See docs/release-notes/lm-411.md.
"""
import json
from pathlib import Path

from google.protobuf import descriptor_pb2

from fintekkers.requests.valuation import valuation_request_pb2

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = json.loads((REPO_ROOT / "test-fixtures" / "removed-fields" / "lm-376.json").read_text())
RELEASE_NOTES = REPO_ROOT / "docs" / "release-notes" / "lm-411.md"
DESCRIPTOR = valuation_request_pb2.ValuationRequestProto.DESCRIPTOR


def _proto() -> descriptor_pb2.DescriptorProto:
    proto = descriptor_pb2.DescriptorProto()
    DESCRIPTOR.CopyToProto(proto)
    return proto


def test_numbers_and_names_reserved():
    proto = _proto()
    reserved = {n for r in proto.reserved_range for n in range(r.start, r.end)}
    for field in FIXTURE["fields"]:
        assert field["message"] == f".{DESCRIPTOR.full_name}"
        assert field["number"] in reserved, field
        assert field["name"] in proto.reserved_name, field
        assert field["number"] not in DESCRIPTOR.fields_by_number, field
        assert field["name"] not in DESCRIPTOR.fields_by_name, field


def test_position_input_unchanged():
    kept = FIXTURE["kept"]
    assert kept["message"] == f".{DESCRIPTOR.full_name}"
    [field] = [f for f in _proto().field if f.number == kept["number"]]
    assert field.name == kept["name"]
    assert field.type_name == kept["type"]
    assert field.type == descriptor_pb2.FieldDescriptorProto.TYPE_MESSAGE
    assert field.label == descriptor_pb2.FieldDescriptorProto.LABEL_OPTIONAL
    assert not field.options.deprecated


def test_release_notes_name_break():
    notes = RELEASE_NOTES.read_text()
    assert "Breaking change" in notes
    for field in FIXTURE["fields"]:
        assert f"`{field['name']}`" in notes
        assert f"**{field['number']}**" in notes
    for builder in ("ProductInputs.forSecurity", "for_security", "forSecurity", "ValuationRequests.typed"):
        assert builder in notes, builder
