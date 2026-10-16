"""No tracked source names a field removed in 0.5 (LM-344).

Greps every tracked (or new, not ignored) text file for the fixture's pattern,
which covers the field names and their generated accessors in every language
(getter, setter, camelCase, *_FIELD_NUMBER, Rust error variants). Not counted:

- docs/adr/, where the decision records name the removed fields;
- test-fixtures/removed-fields/, which defines them;
- `reserved` lines in .proto files;
- the serialized descriptor in generated *Protos.java (quoted descriptorData
  lines) and *_pb2.py (the AddSerializedFile line), which carry the reserved
  names as bytes.

Binary files (the Rust descriptor .bin) are skipped by `git grep -I`.
The test never spells the names: they come from the fixture.
"""
import json
import re
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = "test-fixtures/removed-fields"
FIXTURE = json.loads((REPO_ROOT / FIXTURE_DIR / "lm-344.json").read_text())


def _git_grep(pattern: str, *pathspec: str) -> list[str]:
    result = subprocess.run(
        # --untracked: files not yet committed count too (.gitignore still applies).
        ["git", "grep", "--untracked", "-nIiE", pattern, "--", *pathspec],
        cwd=REPO_ROOT, capture_output=True, text=True,
    )
    # 1 means no match; anything else is a broken grep, never a pass.
    assert result.returncode in (0, 1), result.stderr
    return result.stdout.splitlines()


def _counts(hit: str) -> bool:
    """Whether a `path:line:text` hit from git grep counts as a use."""
    path, _, text = hit.split(":", 2)
    stripped = text.strip()
    if path.startswith("docs/adr/") or path.startswith(f"{FIXTURE_DIR}/"):
        return False
    if path.endswith(".proto") and stripped.startswith("reserved"):
        return False
    if path.endswith("Protos.java") and stripped.startswith('"'):
        return False
    if path.endswith("_pb2.py") and "AddSerializedFile(" in stripped:
        return False
    return True


def _accessors(name: str) -> list[str]:
    camel = "".join(part.capitalize() for part in name.split("_"))
    return [
        name, f"{name}()", f"get{camel}()", f"set{camel}(", f"has{camel}()",
        camel[0].lower() + camel[1:], f"{name.upper()}_FIELD_NUMBER", f"Missing{camel}",
    ]


def test_tracked_source_has_no_removed_field_names():
    hits = [h for h in _git_grep(FIXTURE["pattern"], ".") if _counts(h)]
    assert hits == [], "removed in 0.5 (LM-344):\n" + "\n".join(hits)


def test_pattern_catches_every_name_and_accessor():
    pattern = re.compile(FIXTURE["pattern"], re.IGNORECASE)
    for field in FIXTURE["fields"]:
        for accessor in _accessors(field["name"]):
            assert pattern.search(accessor), accessor


def test_grep_finds_hits_where_they_exist():
    # The fixture names every field, so a working grep must find each one.
    hits = _git_grep(FIXTURE["pattern"], f"{FIXTURE_DIR}/lm-344.json")
    assert len(hits) >= len(FIXTURE["fields"])


def test_exclusions_skip_only_what_they_name():
    name = FIXTURE["fields"][2]["name"]
    camel = "".join(part.capitalize() for part in name.split("_"))
    counted = [
        f"src/Foo.java:1:    return x.get{camel}();",
        f"src/Foo.java:2:    String descriptorData = \"{name}\";",
        f'src/Foo.java:3:      "\\n\\013{name}\\030\\003",',
        f"src/lib.rs:4:    // reserved {name}",
        f"src/lib.rs:5:    Missing{camel},",
        f"src/x.py:6:    AddSerializedFile(b'{name}')",
        f"src/x_pb2.pyi:7:    {name.upper()}_FIELD_NUMBER: int",
        f"src/x.proto:8:  // reserved names were {name}",
        f"docs/notes.md:9: {name}",
    ]
    skipped = [
        f"docs/adr/inflation_index_input.md:1: {name}",
        f"{FIXTURE_DIR}/lm-344.json:2: \"{name}\"",
        f"a/b.proto:3:  reserved \"{name}\";",
        f'a/ProductInputProtos.java:4:      "\\n\\013{name}\\030\\003",',
        f"a/product_inputs_pb2.py:5: DESCRIPTOR = _pool.Default().AddSerializedFile(b'{name}')",
    ]
    assert [h for h in counted if not _counts(h)] == []
    assert [h for h in skipped if _counts(h)] == []
