#!/usr/bin/env python3
"""LM-318 deleted the legacy object_class -> ObjectTypeProto map (LM-297).

object_class is gone from the wire, so there is nothing to generate. --check
now fails if a JS or Rust mirror of the map is still in the tree.

The script stays only because main's scripts/checks/test.sh runs
`scripts/gen-object-type-legacy-map.py --check` until this release lands.
Delete it once main's test.sh no longer calls it.
"""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MIRRORS = [
    REPO_ROOT / "ledger-models-javascript/node/wrappers/util/object-type-legacy.json",
    REPO_ROOT / "ledger-models-rust/fintekkers/wrappers/util/object_type_legacy.json",
]


def main() -> int:
    if sys.argv[1:] != ["--check"]:
        print("LM-318 removed the legacy object_class map: nothing to generate", file=sys.stderr)
        return 1
    left = [str(p.relative_to(REPO_ROOT)) for p in MIRRORS if p.exists()]
    for path in left:
        print(f"{path}: the legacy object_class map was removed by LM-318; delete it", file=sys.stderr)
    return 1 if left else 0


if __name__ == "__main__":
    sys.exit(main())
