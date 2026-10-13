#!/usr/bin/env python3
"""Wire diff: every change to the protos' wire shape must be allowed (LM-318).

Compiles ledger-models-protos at a base commit and in the working tree,
then compares every message field (number, name, type, label), enum value
and extension. Options and comments are not wire shape and don't count.
Each change must match a rule in ALLOWED, which names the item that made it;
anything else fails. A PR that changes the wire adds its rule here.

Usage: wire-diff.py [base]. base defaults to the merge base with origin/main
(or main). Needs grpcio-tools (ledger-models-python's venv).
"""

import subprocess
import sys
import tarfile
import tempfile
from io import BytesIO
from pathlib import Path

from google.protobuf import descriptor_pb2
from grpc_tools import protoc

REPO = Path(__file__).resolve().parents[2]
PROTOS = "ledger-models-protos"
FD = descriptor_pb2.FieldDescriptorProto

OBJECT_TYPE = ".fintekkers.models.util.ObjectTypeProto"
VERSION = ".fintekkers.models.util.VersionProto"


def git(*args: str) -> bytes:
    return subprocess.run(["git", *args], cwd=REPO, check=True, capture_output=True).stdout


def default_base() -> str:
    for ref in ("origin/main", "main"):
        try:
            return git("merge-base", "HEAD", ref).decode().strip()
        except subprocess.CalledProcessError:
            continue
    sys.exit("wire-diff: no origin/main or main to compare with; pass a base commit")


def compile_set(root: Path) -> descriptor_pb2.FileDescriptorSet:
    files = sorted(str(p.relative_to(root)) for p in root.rglob("*.proto"))
    with tempfile.NamedTemporaryFile(suffix=".binpb") as out:
        include = str(Path(protoc.__file__).parent / "_proto")
        if protoc.main(["protoc", f"-I{root}", f"-I{include}", f"--descriptor_set_out={out.name}", *files]) != 0:
            sys.exit(f"wire-diff: protoc failed on {root}")
        return descriptor_pb2.FileDescriptorSet.FromString(Path(out.name).read_bytes())


def shape(fds: descriptor_pb2.FileDescriptorSet) -> dict:
    """{key: description} for every field, enum value and extension."""
    out = {}

    def field(f: FD) -> str:
        label = "repeated " if f.label == FD.LABEL_REPEATED else ""
        kind = f.type_name or FD.Type.Name(f.type)[5:].lower()
        return f"{label}{kind} {f.name}"

    def enums(prefix: str, items) -> None:
        for e in items:
            out[f"enum {prefix}.{e.name}"] = "enum"
            for v in e.value:
                out[f"value {prefix}.{e.name} = {v.number}"] = v.name

    def messages(prefix: str, items) -> None:
        for m in items:
            name = f"{prefix}.{m.name}"
            out[f"message {name}"] = "message"
            for f in m.field:
                out[f"field {name} = {f.number}"] = field(f)
            for x in m.extension:
                out[f"extension {x.extendee} = {x.number}"] = field(x)
            enums(name, m.enum_type)
            messages(name, m.nested_type)

    for f in fds.file:
        prefix = f".{f.package}" if f.package else ""
        messages(prefix, f.message_type)
        enums(prefix, f.enum_type)
        for x in f.extension:
            out[f"extension {x.extendee} = {x.number}"] = field(x)
    return out


def message_of(key: str) -> str:
    return key.split(" ")[1]


def lm318(key: str, old, new, head: dict) -> bool:
    """LM-318: object_class / version replaced in place, 1001-1004 and the
    decimal string deleted, VersionProto added, legacy_object_class gone."""
    kind = key.split(" ")[0]
    if kind == "field":
        msg = message_of(key)
        number = int(key.rsplit("= ", 1)[1])
        stamped = head.get(f"field {msg} = 1") == f"{OBJECT_TYPE} object_type"
        if stamped and number == 1:
            return old == "string object_class" and new == f"{OBJECT_TYPE} object_type"
        if stamped and number == 2:
            return old == "string version" and new == f"{VERSION} version"
        if stamped and 1001 <= number <= 1004:
            return new is None and old in {
                f"{OBJECT_TYPE} object_type", "uint32 version_major",
                "uint32 version_minor", "uint32 version_patch"}
        if msg == ".fintekkers.models.util.DecimalValueProto" and number == 10:
            return old == "string arbitrary_precision_value" and new is None
    if key == f"message {VERSION}":
        return old is None
    if key.startswith(f"field {VERSION} = "):
        return old is None and new in {"uint32 major", "uint32 minor", "uint32 patch"}
    if key == "extension .google.protobuf.EnumValueOptions = 50001":
        return old == "repeated string legacy_object_class" and new is None
    return False


ALLOWED = [lm318]


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else default_base()
    with tempfile.TemporaryDirectory() as tmp:
        with tarfile.open(fileobj=BytesIO(git("archive", "--format=tar", base, PROTOS))) as tar:
            tar.extractall(tmp, filter="data")
        before = shape(compile_set(Path(tmp) / PROTOS))
    after = shape(compile_set(REPO / PROTOS))

    changes = sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k))
    bad = [k for k in changes if not any(rule(k, before.get(k), after.get(k), after) for rule in ALLOWED)]
    for k in bad:
        print(f"wire-diff: not allowed: {k}: {before.get(k)} -> {after.get(k)}", file=sys.stderr)
    print(f"wire-diff: {len(changes)} wire changes since {base[:12]}, {len(bad)} not allowed")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
