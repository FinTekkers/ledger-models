#!/usr/bin/env python3
"""LM-418 guardrail: in hierarchy.json only the key and field names change
(valuation_arms -> valuation_input_types, arm -> input_type). Every entry, its
coupon_types and requires, the unpriced list and every other section stay the
same, in the same order.

Loads hierarchy.json at a base commit, renames those keys in the base copy,
drops _doc and schema_version from both copies, and checks they are equal.

Usage: hierarchy-rename-only.py [base]. base defaults to the merge base with
origin/main (or main), as in wire-diff.py.
"""

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
HIERARCHY = "ledger-models-protos/hierarchy.json"


def git(*args: str) -> bytes:
    return subprocess.run(["git", *args], cwd=REPO, check=True, capture_output=True).stdout


def default_base() -> str:
    for ref in ("origin/main", "main"):
        try:
            return git("merge-base", "HEAD", ref).decode().strip()
        except subprocess.CalledProcessError:
            continue
    sys.exit("hierarchy-rename-only: no origin/main or main to compare with; pass a base commit")


def renamed(root: dict) -> dict:
    """`root` with the legacy section and entry keys renamed, if it has them."""
    out = dict(root)
    if "valuation_arms" in out:
        section = dict(out.pop("valuation_arms"))
        section["entries"] = [
            {("input_type" if k == "arm" else k): v for k, v in entry.items()} for entry in section["entries"]
        ]
        out["valuation_input_types"] = section
    return out


def comparable(root: dict) -> dict:
    return {k: v for k, v in root.items() if k not in ("_doc", "schema_version")}


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else default_base()
    before = comparable(renamed(json.loads(git("show", f"{base}:{HIERARCHY}"))))
    after = comparable(json.loads((REPO / HIERARCHY).read_text(encoding="utf-8")))
    bad = sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k))
    for k in bad:
        print(f"hierarchy-rename-only: {k} differs from {base[:12]} beyond the LM-418 rename", file=sys.stderr)
    if list(before) != list(after):
        print("hierarchy-rename-only: top-level key order differs", file=sys.stderr)
        bad.append("order")
    print(f"hierarchy-rename-only: {len(after)} sections compared with {base[:12]}, {len(bad)} differ")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
