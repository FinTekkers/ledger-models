"""No tracked source names a removed field (LM-344, LM-376).

One scan, driven by a fixture in test-fixtures/removed-fields/ per removal.
It greps every tracked (or new, not ignored) text file for the fixture's
pattern, which covers the field names and their generated accessors in every
language (getter, setter, camelCase, *_FIELD_NUMBER, Rust error variants).
A hit is not counted only when the fixture says so:

- `exempt_files`: exact paths (the ADR, release notes, fixture and test);
- `exempt_dirs` (LM-344 only): docs/adr/ and test-fixtures/removed-fields/;
- `reserved` lines in .proto files;
- the serialized descriptor, which carries the reserved names as bytes:
  quoted lines in generated *Protos.java and the AddSerializedFile line in
  *_pb2.py, in the exact `descriptor_files` (LM-376) or any file ending in a
  `descriptor_suffixes` entry (LM-344 only);
- `not_preceded_by`: a match preceded by one of these prefixes (optional `_`,
  any case) is another field, e.g. search_price_input; a bare match on the
  same line still counts;
- `homonyms`: a file in `homonyms.files` that uses another message's field
  with the same name, while the file never mentions `unless_file_mentions`.

Binary files (the Rust descriptor .bin) are skipped by `git grep -I`.
The test never spells the names: they come from the fixture.
"""
import json
import re
import subprocess
from pathlib import Path
from typing import NamedTuple

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = "test-fixtures/removed-fields"


def load_fixture(name: str) -> dict:
    return json.loads((REPO_ROOT / FIXTURE_DIR / f"{name}.json").read_text())


FIXTURE = load_fixture("lm-344")
LM376 = load_fixture("lm-376")


class Hit(NamedTuple):
    path: str
    line: int
    language: str
    text: str


def language_of(path: str) -> str:
    """The binding a file belongs to, by extension; anything else is `other`
    and still counts."""
    for suffixes, language in (((".java",), "Java"), ((".py", ".pyi"), "Python"),
                               ((".rs",), "Rust"), ((".js", ".ts"), "JS")):
        if path.endswith(suffixes):
            return language
    return "other"


def _git_grep(pattern: str, *pathspec: str, root: Path = REPO_ROOT) -> list[str]:
    result = subprocess.run(
        # --untracked: files not yet committed count too (.gitignore still applies).
        ["git", "grep", "--untracked", "-nIiE", pattern, "--", *pathspec],
        cwd=root, capture_output=True, text=True,
    )
    # 1 means no match; anything else is a broken grep, never a pass.
    assert result.returncode in (0, 1), result.stderr
    return result.stdout.splitlines()


def _is_descriptor_line(path: str, stripped: str) -> bool:
    if path.endswith(".java"):
        return stripped.startswith('"')
    if path.endswith(".py"):
        return "AddSerializedFile(" in stripped
    return False


def _bare_names(text: str, fixture: dict) -> list[str]:
    """Matches of the pattern not preceded by a `not_preceded_by` prefix."""
    prefixes = [p.lower() for p in fixture.get("not_preceded_by", [])]
    names = []
    for match in re.finditer(fixture["pattern"], text, re.IGNORECASE):
        before = text[:match.start()].lower()
        if not any(before.endswith(p) or before.endswith(f"{p}_") for p in prefixes):
            names.append(match.group(0))
    return names


def _normal(name: str) -> str:
    return name.replace("_", "").lower()


def counts(hit: str, fixture: dict, root: Path = REPO_ROOT) -> bool:
    """Whether a `path:line:text` hit from git grep counts as a use."""
    path, _, text = hit.split(":", 2)
    stripped = text.strip()
    if path in fixture.get("exempt_files", []):
        return False
    if any(path.startswith(d) for d in fixture.get("exempt_dirs", [])):
        return False
    if path.endswith(".proto") and stripped.startswith("reserved"):
        return False
    descriptor = path in fixture.get("descriptor_files", []) or any(
        path.endswith(s) for s in fixture.get("descriptor_suffixes", []))
    if descriptor and _is_descriptor_line(path, stripped):
        return False
    names = _bare_names(text, fixture)
    if not names:
        return False
    homonyms = fixture.get("homonyms")
    if homonyms and path in homonyms["files"] and all(_normal(n) == _normal(homonyms["field"]) for n in names):
        mentions = re.search(homonyms["unless_file_mentions"], (root / path).read_text(), re.IGNORECASE)
        return mentions is not None
    return True


def scan(fixture: dict, root: Path = REPO_ROOT) -> list[Hit]:
    hits = []
    for hit in _git_grep(fixture["pattern"], ".", root=root):
        if counts(hit, fixture, root):
            path, line, text = hit.split(":", 2)
            hits.append(Hit(path, int(line), language_of(path), text))
    return hits


def report(fixture: dict, hits: list[Hit]) -> str:
    return f"removed in {fixture['item']}:\n" + "\n".join(
        f"{h.path}:{h.line} [{h.language}]: {h.text.strip()}" for h in hits)


def assert_no_hits(fixture: dict, root: Path = REPO_ROOT) -> None:
    hits = scan(fixture, root)
    assert hits == [], report(fixture, hits)


def _counts(hit: str) -> bool:
    return counts(hit, FIXTURE)


def _accessors(name: str) -> list[str]:
    camel = "".join(part.capitalize() for part in name.split("_"))
    return [
        name, f"{name}()", f"get{camel}()", f"set{camel}(", f"has{camel}()",
        camel[0].lower() + camel[1:], f"{name.upper()}_FIELD_NUMBER", f"Missing{camel}",
    ]


# --- LM-344 ----------------------------------------------------------------------

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


# --- LM-376 (LM-411): ValuationRequestProto.security_input (20), price_input (22) --

SECURITY, PRICE = (f["name"] for f in LM376["fields"])
HOMONYM_FILE = next(f for f in LM376["homonyms"]["files"] if f.endswith(".py"))
DESCRIPTOR_FILE = next(f for f in LM376["descriptor_files"] if f.endswith("Protos.java"))


def _camel(name: str) -> str:
    return "".join(part.capitalize() for part in name.split("_"))


def _lower_camel(name: str) -> str:
    camel = _camel(name)
    return camel[0].lower() + camel[1:]


def test_lm376_no_hits():
    assert_no_hits(LM376)


def test_lm376_pattern_catches_every_name_and_accessor():
    for field in LM376["fields"]:
        for accessor in _accessors(field["name"]):
            assert _bare_names(accessor, LM376), accessor


def test_lm376_prefix_filter_never_hides_a_bare_name():
    counted = [
        f"src/a.py:1:    req.{SECURITY} = x",
        f"src/A.java:2:    createReq.set{_camel(PRICE)}(p);",
        f"src/b.py:3:    req.search_{PRICE}.filters; req.{PRICE}",
    ]
    skipped = [
        f"src/c.py:4:    req.search_{PRICE}.filters",
        f"src/c.ts:5:    const x = create{_camel(SECURITY)};",
    ]
    assert [h for h in counted if not counts(h, LM376)] == []
    assert [h for h in skipped if counts(h, LM376)] == []


SEEDS = {
    "Seed.java": ("Java", {SECURITY: f"x.get{_camel(SECURITY)}();", PRICE: f"b.set{_camel(PRICE)}(p);"}),
    "seed.py": ("Python", {SECURITY: f"r.{SECURITY}", PRICE: f"r.{PRICE}"}),
    "seed.rs": ("Rust", {SECURITY: f"r.{SECURITY}", PRICE: f"r.{PRICE}"}),
    "seed.ts": ("JS", {SECURITY: f"r.{_lower_camel(SECURITY)}", PRICE: f"r.{_lower_camel(PRICE)}"}),
}


@pytest.mark.parametrize("name", [SECURITY, PRICE])
@pytest.mark.parametrize("seed", sorted(SEEDS))
def test_lm376_seeded_hit_fails(tmp_path, seed, name):
    language, lines = SEEDS[seed]
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / seed).write_text(f"// seeded\n{lines[name]}\n")

    hits = scan(LM376, tmp_path)
    assert hits == [Hit(f"src/{seed}", 2, language, lines[name])]
    with pytest.raises(AssertionError) as failed:
        assert_no_hits(LM376, tmp_path)
    assert f"src/{seed}:2 [{language}]" in str(failed.value)


def test_lm376_exemptions_skip_only_what_they_name(tmp_path):
    (tmp_path / "other").mkdir()
    (tmp_path / "other" / "uses_both.py").write_text(f"ValuationRequestProto\nproto.{SECURITY}\n")
    (tmp_path / "other" / "create_only.py").write_text(f"CreateSecurityRequestProto\nproto.{SECURITY}\n")
    homonym = tmp_path / HOMONYM_FILE
    homonym.parent.mkdir(parents=True)
    homonym.write_text(f"CreateSecurityRequestProto\nproto.{SECURITY}\n")
    homonyms = dict(LM376["homonyms"], files=[*LM376["homonyms"]["files"], "other/uses_both.py"])
    fixture = dict(LM376, homonyms=homonyms)

    counted = [
        f"docs/adr/valuation_input_units.md:1: `{SECURITY}`",
        f"{FIXTURE_DIR}/other.json:1: \"{PRICE}\"",
        f'a/OtherProtos.java:1:      "\\n\\016{SECURITY}\\030\\024",',
        f"{DESCRIPTOR_FILE}:1:    return get{_camel(SECURITY)}();",
        f"other/uses_both.py:2: proto.{SECURITY}",
        f"other/create_only.py:2: proto.{SECURITY}",
        f"{HOMONYM_FILE}:2: proto.{PRICE}",
        f"a/b.proto:1:  // reserved {PRICE}",
    ]
    skipped = [
        *(f"{path}:1: {SECURITY}" for path in LM376["exempt_files"]),
        f"a/b.proto:1:  reserved \"{SECURITY}\", \"{PRICE}\";",
        f'{DESCRIPTOR_FILE}:1:      "\\n\\016{SECURITY}\\030\\024",',
        f"{HOMONYM_FILE}:2: proto.{SECURITY}",
    ]
    assert [h for h in counted if counts(h, fixture, tmp_path)] == counted
    assert [h for h in skipped if counts(h, fixture, tmp_path)] == []


def test_lm376_lists_name_exact_files_only():
    assert "exempt_dirs" not in LM376 and "descriptor_suffixes" not in LM376
    assert set(LM376["exempt_files"]) == {
        "docs/adr/product_input_engine_arms.md", "docs/release-notes/lm-411.md",
        f"{FIXTURE_DIR}/lm-376.json", "ledger-models-python/test/requests/test_removed_fields_scan.py",
    }
    for path in [*LM376["exempt_files"], *LM376["descriptor_files"], *LM376["homonyms"]["files"]]:
        assert not path.endswith("/") and "*" not in path, path
        assert (REPO_ROOT / path).is_file(), path
