"""The price query's time-filter comments are the spec (LM-298).

Parses query_price_request.proto with source info and checks that every
PriceHorizonProto value and the `frequency` field carry the comment a service
author needs to implement Price/Search's time filtering.
"""
import re
from pathlib import Path

import grpc_tools
from google.protobuf import descriptor_pb2
from grpc_tools import protoc

from fintekkers.requests.price import query_price_request_pb2

REPO_ROOT = Path(__file__).resolve().parents[3]
PROTO_ROOT = REPO_ROOT / "ledger-models-protos"
PROTO_FILE = "fintekkers/requests/price/query_price_request.proto"

# FileDescriptorProto / DescriptorProto / EnumDescriptorProto field numbers,
# used to build SourceCodeInfo location paths.
FILE_MESSAGE_TYPE = 4
FILE_ENUM_TYPE = 5
MESSAGE_FIELD = 2
ENUM_VALUE = 2

# Each frequency value and the bucket boundary its comment line must give.
FREQUENCY_BOUNDARIES = {
    "PRICE_FREQUENCY_UNSPECIFIED": ["every price"],
    "PRICE_FREQUENCY_WEEKLY": ["ISO week", "Monday"],
    "PRICE_FREQUENCY_DAILY": ["00:00 UTC"],
    "PRICE_FREQUENCY_HOURLY": [":00 minutes"],
    "PRICE_FREQUENCY_MINUTE": [":00 seconds"],
    "PRICE_FREQUENCY_EVERY_TICK": ["every price"],
}


def _load_file_descriptor(tmp_path) -> descriptor_pb2.FileDescriptorProto:
    out = tmp_path / "query_price_request.desc"
    well_known = Path(grpc_tools.__file__).parent / "_proto"
    rc = protoc.main([
        "protoc",
        f"-I{PROTO_ROOT}",
        f"-I{well_known}",
        "--include_source_info",
        f"--descriptor_set_out={out}",
        PROTO_FILE,
    ])
    assert rc == 0, f"protoc failed with exit code {rc}"
    fds = descriptor_pb2.FileDescriptorSet.FromString(out.read_bytes())
    matches = [f for f in fds.file if f.name == PROTO_FILE]
    assert len(matches) == 1
    return matches[0]


def _leading_comment(fd, path) -> str:
    """Leading comment at exactly `path`; no fallback to an enclosing element."""
    for loc in fd.source_code_info.location:
        if tuple(loc.path) == tuple(path):
            return loc.leading_comments.strip()
    return ""


def _enum(fd, name):
    for idx, enum in enumerate(fd.enum_type):
        if enum.name == name:
            return idx, enum
    raise AssertionError(f"enum {name} not found")


def _has_word(text, word) -> bool:
    return re.search(rf"\b{re.escape(word)}\b", text, re.IGNORECASE) is not None


def test_descriptor_has_every_value(tmp_path):
    fd = _load_file_descriptor(tmp_path)
    assert len(_enum(fd, "PriceHorizonProto")[1].value) == 10
    assert len(_enum(fd, "PriceFrequencyProto")[1].value) == 6


def test_every_horizon_value_documents_its_window(tmp_path):
    fd = _load_file_descriptor(tmp_path)
    enum_idx, enum = _enum(fd, "PriceHorizonProto")
    enum_comment = _leading_comment(fd, (FILE_ENUM_TYPE, enum_idx))
    assert len(enum.value) == 10

    for value_idx, value in enumerate(enum.value):
        comment = _leading_comment(fd, (FILE_ENUM_TYPE, enum_idx, ENUM_VALUE, value_idx))
        assert comment, f"{value.name} has no leading comment"
        assert comment != enum_comment, f"{value.name} must have its own comment"
        for word in ("as_of", "now", "inclusive"):
            assert _has_word(comment, word), f"{value.name} comment does not say '{word}'"
        assert _has_word(comment, "fixed-day") or _has_word(comment, "calendar"), (
            f"{value.name} comment says neither 'fixed-day' nor 'calendar'"
        )


def _frequency_comment(fd) -> str:
    msg_idx = next(i for i, m in enumerate(fd.message_type) if m.name == "QueryPriceRequestProto")
    field_idx = next(
        i for i, f in enumerate(fd.message_type[msg_idx].field) if f.name == "frequency"
    )
    return _leading_comment(fd, (FILE_MESSAGE_TYPE, msg_idx, MESSAGE_FIELD, field_idx))


def test_frequency_comment_documents_buckets(tmp_path):
    fd = _load_file_descriptor(tmp_path)
    comment = _frequency_comment(fd)
    assert "latest price per security per bucket" in comment
    assert _has_word(comment, "UTC")

    enum_idx, enum = _enum(fd, "PriceFrequencyProto")
    names = [v.name for v in enum.value]
    # The commented-out SECOND..NANOSECOND values stay out of EVERY_TICK's doc.
    every_tick_idx = names.index("PRICE_FREQUENCY_EVERY_TICK")
    every_tick = _leading_comment(fd, (FILE_ENUM_TYPE, enum_idx, ENUM_VALUE, every_tick_idx))
    assert "PRICE_FREQUENCY_SECOND" not in every_tick
    assert len(names) == 6
    lines = comment.splitlines()
    for name in names:
        assert name in FREQUENCY_BOUNDARIES, f"{name} has no expected bucket boundary"
        # The line naming this value, and no other value, gives its boundary.
        own_lines = [
            line for line in lines
            if _has_word(line, name) and not any(_has_word(line, o) for o in names if o != name)
        ]
        assert own_lines, f"frequency comment has no line of its own for {name}"
        assert any(
            all(phrase in line for phrase in FREQUENCY_BOUNDARIES[name]) for line in own_lines
        ), f"{name} line does not give {FREQUENCY_BOUNDARIES[name]}"


def test_committed_bindings_carry_the_comments():
    rust = (REPO_ROOT / "ledger-models-rust" / "fintekkers.requests.price.rs").read_text()
    java_dir = (
        REPO_ROOT / "ledger-models-java" / "generated-src" / "main" / "java"
        / "fintekkers" / "requests" / "price"
    )
    request_java = (java_dir / "QueryPriceRequestProto.java").read_text()
    horizon_java = (java_dir / "PriceHorizonProto.java").read_text()

    for name, text in [("rust", rust), ("QueryPriceRequestProto.java", request_java)]:
        assert "latest price per security per bucket" in text, f"{name} is stale: run ./compile.sh"
    for name, text in [("rust", rust), ("PriceHorizonProto.java", horizon_java)]:
        assert "fixed-day" in text, f"{name} is stale: run ./compile.sh"


def test_comments_only_descriptor_unchanged(tmp_path):
    fd = _load_file_descriptor(tmp_path)
    fd.ClearField("source_code_info")
    # --descriptor_set_out fills in json_name; the generated Python descriptor
    # does not carry it.
    for msg in fd.message_type:
        for field in msg.field:
            field.ClearField("json_name")
    assert fd.SerializeToString() == query_price_request_pb2.DESCRIPTOR.serialized_pb
