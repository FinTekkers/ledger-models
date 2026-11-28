"""Measure 31 is removed and reserved (LM-514).

LM-509 added it as DV01 per 1,000,000 face; a per-$1M figure is DV01 (25)
requested with a 1,000,000 face quantity. The removed name appears in the
repo only on its reserved line in measure.proto (generated bindings aside:
their descriptors embed reserved names), and measure.proto is otherwise
byte for byte as on main, comments included.

The removed name is built from split literals so that this file never
matches the grep it runs.
"""
import hashlib
import json
import subprocess
from pathlib import Path

from fintekkers.models.position.measure_pb2 import MeasureProto

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE_PROTO = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
DV01_BEFORE = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "lm-509-dv01-before.json").read_text())

REMOVED_NAME = "DV01" "_PER_MILLION"
GREP_PATTERN = "|".join(("DV01" "_PER_MILLION", "Dv01" "PerMillion", "dv01" "_per_million"))
# Generated bindings (and the Rust descriptor set) embed the reserved name.
GENERATED = (":!*_pb2.py", ":!*_pb2.pyi", ":!*_pb.js", ":!*_pb.d.ts", ":!ledger-models-java/generated-src",
             ":!ledger-models-rust/fintekkers.*.rs", ":!ledger-models-rust/*.bin")

# sha256 of the whole measure.proto, comments included: main's file at
# 1b276f14 with the measure 31 block (its 23 comment lines and the value,
# lines 852-875) replaced by the LM-514 comment and the two reserved lines.
MEASURE_PROTO_FULL_SHA256 = "df1f7b8741fd0617b07db0c45177133026a8ce8757afda8a197be90167a50655"


def test_lm514_name_only_in_reserved_line():
    own = f":!{Path(__file__).relative_to(REPO_ROOT)}"
    result = subprocess.run(
        ["git", "grep", "-inE", GREP_PATTERN, "--", ".", *GENERATED, own],
        cwd=REPO_ROOT, capture_output=True, text=True)
    # git grep exits 1 when nothing matches and 2+ on an error; both fail here.
    assert result.returncode == 0, result.stderr
    hits = result.stdout.splitlines()
    assert len(hits) == 1, hits
    path, _line, text = hits[0].split(":", 2)
    assert path == "ledger-models-protos/fintekkers/models/position/measure.proto"
    assert text.strip() == f'reserved "{REMOVED_NAME}";'


def test_measure_proto_full_text_unchanged_but_for_31():
    assert hashlib.sha256(MEASURE_PROTO.read_bytes()).hexdigest() == MEASURE_PROTO_FULL_SHA256


def _dv01_block() -> str:
    """The `//` comment lines directly above `DV01 = 25;`, plus that line."""
    lines = MEASURE_PROTO.read_text().splitlines()
    [end] = [i for i, line in enumerate(lines) if line.strip() == "DV01 = 25;"]
    start = end
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end + 1]) + "\n"


def test_dv01_comment_found_by_name_is_unchanged():
    assert MeasureProto.Value("DV01") == 25
    assert _dv01_block() == DV01_BEFORE["proto_block"]
