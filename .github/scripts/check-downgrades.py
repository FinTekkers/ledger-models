#!/usr/bin/env python3
"""
Block consumer-side dependency downgrades and new override/patch blocks.

Implements the "fix upstream first" rule from
second-brain/processes/test-discipline.md. Run in CI on every PR.

Diffs the package manifests in the working tree against a base ref, flags:
  - Any version constraint whose lower bound decreased (e.g. ^4.0.2 -> ^3.21.4)
  - New top-level npm `overrides` / `resolutions` entries
  - New Cargo `[patch.crates-io]` / `[patch.<reg>]` entries
  - New `[tool.uv.sources]` overrides in pyproject

A `DOWNGRADE-EXCEPTION: <rationale> + <upstream-issue-url>` line in the
PR description (passed via --pr-body or GITHUB_EVENT_PATH) suppresses the
failure. Findings still print so the exception is auditable.

Supports: package.json, Cargo.toml, pyproject.toml, requirements.txt, go.mod
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from typing import Iterable

try:
    import tomllib  # 3.11+
except ModuleNotFoundError:
    try:
        import tomli as tomllib  # type: ignore
    except ModuleNotFoundError:
        tomllib = None  # type: ignore


MANIFESTS = ("package.json", "Cargo.toml", "pyproject.toml", "requirements.txt", "go.mod")


def git_show(ref: str, path: str) -> str | None:
    r = subprocess.run(["git", "show", f"{ref}:{path}"], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def lower_bound(constraint: str) -> tuple[int, ...] | None:
    """Extract the numeric lower bound from a version constraint.

    Handles: 1.2.3, ^1.2.3, ~1.2.3, >=1.2.3, >=1.2,<2, =1.2.3, 1.2.*
    Returns None if unparseable (caller should skip the comparison).
    """
    m = re.search(r"(\d+)(?:\.(\d+))?(?:\.(\d+))?", constraint)
    if not m:
        return None
    return tuple(int(g or 0) for g in m.groups())


def cmp_constraints(old: str, new: str) -> bool:
    """True if `new` represents a lower lower-bound than `old`."""
    a, b = lower_bound(old), lower_bound(new)
    if a is None or b is None:
        return False
    return b < a


def walk_npm(old: dict, new: dict) -> Iterable[str]:
    for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        old_d, new_d = old.get(key, {}) or {}, new.get(key, {}) or {}
        for name, new_v in new_d.items():
            if not isinstance(new_v, str):
                continue
            old_v = old_d.get(name)
            if isinstance(old_v, str) and cmp_constraints(old_v, new_v):
                yield f"{key}: {name} {old_v} -> {new_v}"
    for block in ("overrides", "resolutions"):
        old_b, new_b = old.get(block, {}) or {}, new.get(block, {}) or {}
        for name in new_b.keys() - old_b.keys():
            yield f"new `{block}` entry '{name}' (transitive pin = same as downgrade)"


def _flatten_cargo_dep(v) -> str | None:
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return v.get("version")
    return None


def walk_cargo(old: dict, new: dict) -> Iterable[str]:
    for key in ("dependencies", "dev-dependencies", "build-dependencies"):
        old_d, new_d = old.get(key, {}) or {}, new.get(key, {}) or {}
        for name, new_v in new_d.items():
            new_s = _flatten_cargo_dep(new_v)
            old_s = _flatten_cargo_dep(old_d.get(name))
            if new_s and old_s and cmp_constraints(old_s, new_s):
                yield f"{key}: {name} {old_s} -> {new_s}"
    old_patch, new_patch = old.get("patch", {}) or {}, new.get("patch", {}) or {}
    for registry, entries in new_patch.items():
        old_entries = old_patch.get(registry, {}) or {}
        for name in (entries or {}).keys() - old_entries.keys():
            yield f"new `[patch.{registry}]` entry '{name}' (consumer-side override = same as downgrade)"


def walk_pyproject(old: dict, new: dict) -> Iterable[str]:
    # PEP 621 dependencies = ["foo>=1,<2", ...]
    def parse_list(deps):
        out = {}
        for d in deps or []:
            m = re.match(r"^([A-Za-z0-9_.\-]+)\s*([<>=!~^].*)?$", d.strip())
            if m:
                out[m.group(1).lower()] = (m.group(2) or "").strip()
        return out

    old_proj, new_proj = old.get("project", {}) or {}, new.get("project", {}) or {}
    old_d, new_d = parse_list(old_proj.get("dependencies")), parse_list(new_proj.get("dependencies"))
    for name, new_v in new_d.items():
        old_v = old_d.get(name)
        if old_v and new_v and cmp_constraints(old_v, new_v):
            yield f"[project.dependencies]: {name} {old_v} -> {new_v}"

    # Poetry: [tool.poetry.dependencies]
    old_poe = (old.get("tool", {}) or {}).get("poetry", {}).get("dependencies", {}) or {}
    new_poe = (new.get("tool", {}) or {}).get("poetry", {}).get("dependencies", {}) or {}
    for name, new_v in new_poe.items():
        if name == "python":
            continue
        new_s = new_v if isinstance(new_v, str) else (new_v.get("version") if isinstance(new_v, dict) else None)
        old_v = old_poe.get(name)
        old_s = old_v if isinstance(old_v, str) else (old_v.get("version") if isinstance(old_v, dict) else None)
        if new_s and old_s and cmp_constraints(old_s, new_s):
            yield f"[tool.poetry.dependencies]: {name} {old_s} -> {new_s}"

    # uv override block
    old_uv = (old.get("tool", {}) or {}).get("uv", {}).get("sources", {}) or {}
    new_uv = (new.get("tool", {}) or {}).get("uv", {}).get("sources", {}) or {}
    for name in new_uv.keys() - old_uv.keys():
        yield f"new `[tool.uv.sources]` entry '{name}' (consumer-side override = same as downgrade)"


def walk_requirements(old_text: str, new_text: str) -> Iterable[str]:
    def parse(text):
        out = {}
        for line in (text or "").splitlines():
            line = line.split("#", 1)[0].strip()
            if not line or line.startswith("-"):
                continue
            m = re.match(r"^([A-Za-z0-9_.\-]+)\s*([<>=!~^].*)?$", line)
            if m:
                out[m.group(1).lower()] = (m.group(2) or "").strip()
        return out
    old_d, new_d = parse(old_text), parse(new_text)
    for name, new_v in new_d.items():
        old_v = old_d.get(name)
        if old_v and new_v and cmp_constraints(old_v, new_v):
            yield f"{name} {old_v} -> {new_v}"


def walk_gomod(old_text: str, new_text: str) -> Iterable[str]:
    def parse(text):
        out = {}
        for line in (text or "").splitlines():
            line = line.strip()
            m = re.match(r"^(?:require\s+)?([\w./\-]+)\s+v(\S+)", line)
            if m and not line.startswith("//"):
                out[m.group(1)] = m.group(2)
        return out
    old_d, new_d = parse(old_text), parse(new_text)
    for name, new_v in new_d.items():
        old_v = old_d.get(name)
        if old_v and new_v and cmp_constraints(old_v, new_v):
            yield f"{name} v{old_v} -> v{new_v}"


def parse_toml(text: str) -> dict:
    if tomllib is None:
        print("WARN: tomllib/tomli not available; skipping TOML manifest", file=sys.stderr)
        return {}
    return tomllib.loads(text)


def find_manifests(base: str) -> list[str]:
    paths = []
    for m in MANIFESTS:
        r = subprocess.run(
            ["git", "diff", "--name-only", base, "--", m, f"**/{m}"],
            capture_output=True, text=True,
        )
        paths.extend(p for p in r.stdout.splitlines() if p)
    # Always include root manifests even if diff missed (e.g. first commit)
    for m in MANIFESTS:
        if os.path.exists(m) and m not in paths:
            paths.append(m)
    return sorted(set(paths))


def check_one(path: str, base: str) -> list[str]:
    old_text = git_show(base, path) or ""
    try:
        with open(path) as f:
            new_text = f.read()
    except FileNotFoundError:
        return []
    if old_text == new_text:
        return []
    name = os.path.basename(path)
    findings = []
    if name == "package.json":
        findings = list(walk_npm(json.loads(old_text or "{}"), json.loads(new_text)))
    elif name == "Cargo.toml":
        findings = list(walk_cargo(parse_toml(old_text), parse_toml(new_text)))
    elif name == "pyproject.toml":
        findings = list(walk_pyproject(parse_toml(old_text), parse_toml(new_text)))
    elif name == "requirements.txt":
        findings = list(walk_requirements(old_text, new_text))
    elif name == "go.mod":
        findings = list(walk_gomod(old_text, new_text))
    return [f"  {path}: {f}" for f in findings]


def get_pr_body(pr_body_arg: str | None) -> str:
    if pr_body_arg:
        return pr_body_arg
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if event_path and os.path.exists(event_path):
        try:
            with open(event_path) as f:
                return ((json.load(f).get("pull_request") or {}).get("body") or "")
        except Exception:
            return ""
    return ""


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--base", default=os.environ.get("GITHUB_BASE_REF") or "origin/main")
    p.add_argument("--pr-body", default=None, help="PR description text (overrides GITHUB_EVENT_PATH)")
    args = p.parse_args()

    base = args.base if "/" in args.base else f"origin/{args.base}"
    subprocess.run(["git", "fetch", "origin", "--quiet"], check=False)

    findings: list[str] = []
    for path in find_manifests(base):
        findings.extend(check_one(path, base))

    if not findings:
        return 0

    print("downgrade-detector: consumer-side downgrades or override blocks found:")
    for f in findings:
        print(f)
    print()

    body = get_pr_body(args.pr_body)
    if re.search(r"^DOWNGRADE-EXCEPTION:\s*\S", body, re.MULTILINE):
        print("DOWNGRADE-EXCEPTION present in PR body — allowing.")
        return 0

    print(
        "Per processes/test-discipline.md (fix-upstream-first): the default fix is in the\n"
        "library, not the consumer. To override, add to the PR description:\n"
        "  DOWNGRADE-EXCEPTION: <rationale> + <upstream-issue-url>\n"
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
