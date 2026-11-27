"""REAL_YIELD is solved on the dirty real price with the street stub
convention (LM-506), the same convention LM-499 gives YIELD_TO_MATURITY, so
TIPS YIELD_TO_MATURITY still equals REAL_YIELD. The catalog entry and the
MeasureProto comment name the solve target (clean + real ACT/ACT accrued) ×
index_ratio × face / 100, state w = DSC/E and flow k at k−1+w periods, keep
"Same solver and conventions as YIELD_TO_MATURITY", and keep the clean price as
the input. No proto field, enum value or number changes.

Entries and comments are found by name, never by line number.
"""
import hashlib
import json
import re
from pathlib import Path

from fintekkers.models.position import measure_pb2

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE_PROTO = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
CATALOG = REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json"

DIRTY_REAL_TARGET = "(clean + real ACT/ACT accrued) × index_ratio × face / 100"
OLD_CLEAN_TARGET = "clean_price × index_ratio × face / 100"
# k−1+w uses U+2212 (minus sign), as in LM-499.
STUB = ["w = DSC/E", "k−1+w periods"]
SAME_SOLVER = "Same solver and conventions as YIELD_TO_MATURITY"
CLEAN_INPUT = "The price input is the clean price"

# sha256 of measure.proto with every `//` comment and blank line stripped,
# computed on main (54bc1942) before LM-499 and unchanged since: no field, enum
# value or number may change.
PROTO_CODE_SHA256 = "7d7bdf6130a2b96ab3ac891a52b629a98a227eb4df2310a2bc668680d9612678"
LM509_ADDED_VALUE = "DV01_PER_MILLION = 31;"


def _block(path: Path, declaration: str) -> str:
    """The `//` comment lines directly above the line that declares
    `declaration`, plus that line, as in the file."""
    lines = path.read_text().splitlines()
    pattern = re.compile(rf"(^|\s){re.escape(declaration)}\s*=")
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{declaration} in {path.name}: {matches}"
    end = start = matches[0]
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return "\n".join(lines[start:end + 1])


def _entry(name: str) -> dict:
    entries = [m for m in json.loads(CATALOG.read_text())["measures"] if m["name"] == name]
    assert len(entries) == 1, name
    return entries[0]


def _assumptions(name: str) -> str:
    return "\n".join(_entry(name)["model_assumptions"])


def _comment(name: str) -> str:
    """The proto comment with each `//` prefix removed and whitespace collapsed."""
    lines = _block(MEASURE_PROTO, name).splitlines()
    return " ".join(" ".join(line.strip().removeprefix("//") for line in lines).split())


def test_formula_solves_on_dirty_real_price():
    formula = _entry("REAL_YIELD")["formula"]
    comment = _comment("REAL_YIELD")
    for text in (formula, comment):
        assert DIRTY_REAL_TARGET in text
        assert "dirty real price" in text
        assert OLD_CLEAN_TARGET not in text
    assert formula.startswith("Solve for r: " + DIRTY_REAL_TARGET + " = ")


def test_assumptions_state_stub_convention():
    for text in (_assumptions("REAL_YIELD"), _comment("REAL_YIELD")):
        for phrase in STUB:
            assert phrase in text, phrase


def test_stub_uses_unicode_minus():
    for text in (_entry("REAL_YIELD")["formula"], _assumptions("REAL_YIELD"), _comment("REAL_YIELD")):
        assert "k−1+w" in text
        assert "k-1+w" not in text


def test_same_solver_as_ytm():
    for text in (_assumptions("REAL_YIELD"), _comment("REAL_YIELD")):
        assert SAME_SOLVER in text


def test_clean_price_stays_the_input():
    for text in (_assumptions("REAL_YIELD"), _comment("REAL_YIELD")):
        assert CLEAN_INPUT in text


def test_proto_code_outside_comments_unchanged():
    code = [line.split("//")[0].rstrip() for line in MEASURE_PROTO.read_text().splitlines()]
    # LM-509 adds exactly this enum value; the rest of the code is unchanged.
    stripped = "\n".join(line for line in code if line.strip() and line.strip() != LM509_ADDED_VALUE)
    assert hashlib.sha256(stripped.encode()).hexdigest() == PROTO_CODE_SHA256
    assert f"REAL_YIELD = {measure_pb2.MeasureProto.Value('REAL_YIELD')};" in _block(MEASURE_PROTO, "REAL_YIELD")
