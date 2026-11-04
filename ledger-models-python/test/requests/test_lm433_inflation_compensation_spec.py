"""The LM-433 spec: MeasureProto gains INFLATION_COMPENSATION right after
INDEX_RATIO, with a new number. Its measure.proto comment is the spec
(formula, units, no floor, TIPS only, absent not zero, both examples). Every
measures.json lists it for TIPS with implemented false until valuation-service
computes it (VS-155); LM-434 flips it to true, so measures_for_input_type
returns it for tips only. Every
MeasureProto name and number in v1.1.30 is unchanged and so is the
INFLATION_ADJUSTED_PRINCIPAL comment. TipsInput.clean_price changes in its
comment only. The formula lives only in the proto comment: no library helper
computes it and the catalog does not restate it.

Comments are found by the name they document, never by line number.
"""
import json
import re
from pathlib import Path

import pytest

from fintekkers.models.position import measure_pb2
from fintekkers.wrappers.models.security.product_inputs import _measures_for_input_type_in

REPO_ROOT = Path(__file__).resolve().parents[3]
MEASURE = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "models" / "position" / "measure.proto"
PRODUCT_INPUTS = REPO_ROOT / "ledger-models-protos" / "fintekkers" / "requests" / "valuation" / "product_inputs.proto"
V1_1_30 = json.loads((REPO_ROOT / "test-fixtures" / "measures" / "v1.1.30-measure-proto.json").read_text())
FOR_INPUT_TYPE = json.loads((REPO_ROOT / "test-fixtures" / "catalog" / "measures-for-input-type.json").read_text())
CATALOGS = {
    "protos": REPO_ROOT / "ledger-models-protos" / "catalog" / "measures.json",
    "java": REPO_ROOT / "ledger-models-java" / "src" / "main" / "resources" / "catalog" / "measures.json",
    "python": REPO_ROOT / "ledger-models-python" / "fintekkers" / "catalog" / "measures.json",
    "rust": REPO_ROOT / "ledger-models-rust" / "catalog" / "measures.json",
    "javascript": REPO_ROOT / "ledger-models-javascript" / "catalog" / "measures.json",
}
NAME = "INFLATION_COMPENSATION"
DECLARATION = re.compile(r"^\s*([A-Z0-9_]+)\s*=\s*(\d+)\s*;")


def _declarations() -> list:
    """(name, number) for every MeasureProto value, in file order."""
    out = []
    for line in MEASURE.read_text().splitlines():
        m = DECLARATION.match(line.split("//")[0])
        if m:
            out.append((m.group(1), int(m.group(2))))
    return out


def _number() -> int:
    numbers = [n for name, n in _declarations() if name == NAME]
    assert len(numbers) == 1, numbers
    return numbers[0]


def _block_lines(path: Path, declaration: str) -> list:
    """The `//` comment lines directly above the line that declares
    `declaration`, plus that line, as in the file."""
    lines = path.read_text().splitlines()
    pattern = re.compile(rf"(^|\s){re.escape(declaration)}\s*=")
    matches = [i for i, line in enumerate(lines) if pattern.search(line.split("//")[0])]
    assert len(matches) == 1, f"{declaration} in {path.name}: {matches}"
    end = start = matches[0]
    while start > 0 and lines[start - 1].strip().startswith("//"):
        start -= 1
    return lines[start:end + 1]


def _prose(lines: list) -> str:
    """Comment markers dropped, whitespace collapsed, lower case, and the
    minus sign (U+2212) written as '-'."""
    return " ".join(" ".join(lines).replace("//", " ").replace("−", "-").split()).lower()


SPEC = _prose(_block_lines(MEASURE, NAME))


# ── Metric 1: position, number and the spec comment ─────────────────────────

def test_declared_right_after_index_ratio():
    names = [name for name, _ in _declarations()]
    assert names[names.index("INDEX_RATIO") + 1] == NAME


def test_number_is_new_and_unused():
    number = _number()
    assert number not in {v["number"] for v in V1_1_30["values"]}
    assert [n for _, n in _declarations()].count(number) == 1


def test_number_is_not_reserved():
    text = MEASURE.read_text()
    body = text[text.index("enum MeasureProto"):]
    reserved = " ".join(re.findall(r"^\s*reserved\s+([^;]*);", body, re.M))
    numbers = set()
    for part in re.split(r"\s*,\s*", reserved):
        if re.fullmatch(r"\d+", part):
            numbers.add(int(part))
        elif m := re.fullmatch(r"(\d+)\s+to\s+(\d+|max)", part):
            numbers.update(range(int(m.group(1)), 536870912 if m.group(2) == "max" else int(m.group(2)) + 1))
    assert _number() not in numbers
    assert f'"{NAME}"' not in reserved


# Each phrase is its own check: one missing phrase fails on its own.
@pytest.mark.parametrize("phrase", [
    "inflationcompensation = face × (index_ratio - 1)",
    "as-of date",
    "dollars",
    "no deflation floor",
    "may be negative",
    "applicability: tips only",
    "absent, never 0, for every input type other than tips",
    "absent when index_ratio is absent",
    "directed_quantity",
    "face is signed",
    "a short position gives the opposite sign",
    "10.0b × (1.381 - 1) = 3.81b",
    "10.0b × (0.98 - 1) = -0.2b",
])
def test_spec_comment_states(phrase):
    assert phrase in SPEC


# ── Metric 2': a TIPS-only catalog entry, implemented true since LM-434 ─────

def _entries(path: Path) -> list:
    return [m for m in json.loads(path.read_text())["measures"] if m["name"] == NAME]


@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_catalog_has_one_tips_only_entry_not_implemented(path):
    entries = _entries(path)
    assert len(entries) == 1
    entry = entries[0]
    assert entry["enum_value"] == _number()
    assert entry["applies_to"] == ["TIPS"]
    # LM-434: valuation-service computes it (VS-155), so it is implemented.
    assert entry["implemented"] is True
    assert entry["computed_by"] == "valuation-service"
    assert "CLEAN_PRICE" not in entry["depends_on"]


# LM-434: implemented, so measures_for_input_type returns it for tips only.
@pytest.mark.parametrize("input_type", FOR_INPUT_TYPE["input_types"])
@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_measures_for_input_type_returns_it_for_tips_only(path, input_type):
    measures = json.loads(path.read_text())["measures"]
    assert (_number() in _measures_for_input_type_in(measures, input_type)) == (input_type == "tips")


def test_measures_for_input_type_fixture_lists_it_for_tips_only():
    # Java, Rust and JS ProductInputs tests (and their deprecated-alias tests)
    # match this fixture exactly, so it is their evidence too.
    assert FOR_INPUT_TYPE["input_types"]
    for input_type, names in FOR_INPUT_TYPE["input_types"].items():
        assert (NAME in names) == (input_type == "tips"), input_type


# ── Metric 3 (Python): resolves by name to the declared number ──────────────

def test_python_resolves_by_name():
    assert measure_pb2.MeasureProto.Value(NAME) == _number()
    assert measure_pb2.MeasureProto.Name(_number()) == NAME


# ── Metric 4 and guardrail 2: v1.1.30 is unchanged ──────────────────────────

def test_every_v1_1_30_name_and_number_is_unchanged():
    current = dict(_declarations())
    assert V1_1_30["values"]
    for v in V1_1_30["values"]:
        assert current.get(v["name"]) == v["number"], v
        assert measure_pb2.MeasureProto.Value(v["name"]) == v["number"], v
    assert current["INFLATION_ADJUSTED_PRINCIPAL"] == 11


def test_inflation_adjusted_principal_comment_is_unchanged():
    assert _block_lines(MEASURE, "INFLATION_ADJUSTED_PRINCIPAL") == V1_1_30["inflation_adjusted_principal_block"]
    assert "max(face_value * index_ratio, face_value)" in _prose(V1_1_30["inflation_adjusted_principal_block"])


# ── Metric 5 and guardrail 1: TipsInput.clean_price, comment only ───────────

def _tips_clean_price() -> list:
    lines = PRODUCT_INPUTS.read_text().splitlines()
    start = next(i for i, line in enumerate(lines) if re.match(r"message TipsInput\s*\{", line))
    end = next(i for i in range(start, len(lines)) if re.search(r"\sclean_price\s*=", lines[i]))
    first = end
    while lines[first - 1].strip().startswith("//"):
        first -= 1
    return lines[first:end + 1]


def test_tips_clean_price_comment_says_price_only_for_price_dependent_measures():
    assert "a price is required only for price-dependent measures" in _prose(_tips_clean_price()[:-1])


def test_tips_clean_price_keeps_number_and_type():
    assert _tips_clean_price()[-1].strip() == "fintekkers.models.util.DecimalValueProto clean_price = 2;"


# ── Guardrail 3: the formula lives only in the proto comment ────────────────

LIBRARY_SOURCES = [
    "ledger-models-java/src/main",
    "ledger-models-python/fintekkers",
    "ledger-models-rust/fintekkers",
    "ledger-models-javascript/node/wrappers",
]
SOURCE_SUFFIXES = {".java", ".py", ".rs", ".ts", ".js"}
ALLOWED_HELPER_FILES = {"ledger-models-java/src/main/java/common/models/postion/Measure.java"}


def _is_generated_or_test(rel: str) -> bool:
    name = rel.rsplit("/", 1)[-1]
    return (
        "/generated-src/" in f"/{rel}"
        or "/catalog/" in f"/{rel}"
        or "/__pycache__/" in f"/{rel}"
        or "_pb2" in name
        or "_pb." in name
        or "_grpc_pb" in name
        or ".test." in name
        or name.startswith("test_")
    )


def _helper_hits(root: Path) -> list:
    """Hand-written library source files under `root` that name the measure."""
    hits = []
    for base in LIBRARY_SOURCES:
        for path in sorted((root / base).rglob("*")):
            rel = path.relative_to(root).as_posix()
            if not path.is_file() or path.suffix not in SOURCE_SUFFIXES or _is_generated_or_test(rel):
                continue
            if NAME in path.read_text(errors="ignore"):
                hits.append(rel)
    return [rel for rel in hits if rel not in ALLOWED_HELPER_FILES]


def test_no_library_helper_names_the_measure():
    assert _helper_hits(REPO_ROOT) == []


def test_helper_scan_finds_an_injected_helper(tmp_path):
    helper = tmp_path / "ledger-models-python" / "fintekkers" / "wrappers" / "inflation.py"
    helper.parent.mkdir(parents=True)
    helper.write_text(f"def inflation_compensation(face, ratio):  # {NAME}\n    return face * (ratio - 1)\n")
    generated = tmp_path / "ledger-models-python" / "fintekkers" / "models" / "measure_pb2.py"
    generated.parent.mkdir(parents=True)
    generated.write_text(f"{NAME} = 30\n")
    assert _helper_hits(tmp_path) == ["ledger-models-python/fintekkers/wrappers/inflation.py"]


@pytest.mark.parametrize("path", CATALOGS.values(), ids=CATALOGS.keys())
def test_catalog_does_not_restate_the_formula(path):
    entry = _entries(path)[0]
    text = json.dumps(entry, ensure_ascii=False).replace("−", "-")
    assert "INDEX_RATIO - 1" not in text
    assert "MeasureProto.INFLATION_COMPENSATION" in entry["formula"]
