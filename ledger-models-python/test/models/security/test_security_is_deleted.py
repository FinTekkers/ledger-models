"""Time-based soft-delete tests for the Security wrapper.

Phase A of /specs/soft-delete-validto-collapse.md
(FinTekkers/second-brain#316). The SecurityProto.deleted_at field has been
removed (tag 15 reserved). The single canonical soft-delete check is
Security.is_deleted(as_of), which honours valid_to with a time-based
comparison.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from google.protobuf.timestamp_pb2 import Timestamp

from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.wrappers.models.security.security import Security


def _local_timestamp(seconds: int, time_zone: str = "UTC") -> LocalTimestampProto:
    return LocalTimestampProto(
        timestamp=Timestamp(seconds=seconds, nanos=0),
        time_zone=time_zone,
    )


def _proto_with_valid_to(valid_to: Optional[LocalTimestampProto]) -> SecurityProto:
    if valid_to is None:
        return SecurityProto()
    return SecurityProto(valid_to=valid_to)


class TestSecurityIsDeleted:
    def test_null_valid_to_is_never_deleted(self):
        sec = Security(_proto_with_valid_to(None))
        assert sec.is_deleted() is False
        # And the same far-future asOf still returns False.
        assert sec.is_deleted(datetime(2999, 1, 1, tzinfo=timezone.utc)) is False

    def test_past_valid_to_is_deleted_now(self):
        past = int((datetime.now(timezone.utc) - timedelta(days=1)).timestamp())
        sec = Security(_proto_with_valid_to(_local_timestamp(past)))
        assert sec.is_deleted() is True

    def test_future_valid_to_is_not_yet_deleted(self):
        future = int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
        sec = Security(_proto_with_valid_to(_local_timestamp(future)))
        assert sec.is_deleted() is False
        # And becomes deleted once asOf catches up.
        as_of_after = datetime.fromtimestamp(future + 1, tz=timezone.utc)
        assert sec.is_deleted(as_of_after) is True

    def test_as_of_switches_answer(self):
        # valid_to fixed at 2026-01-01 UTC. Earlier asOf → not deleted.
        # Later asOf → deleted.
        cutoff = int(datetime(2026, 1, 1, tzinfo=timezone.utc).timestamp())
        sec = Security(_proto_with_valid_to(_local_timestamp(cutoff)))
        assert sec.is_deleted(datetime(2025, 6, 1, tzinfo=timezone.utc)) is False
        assert sec.is_deleted(datetime(2026, 6, 1, tzinfo=timezone.utc)) is True

    def test_round_trip_with_legacy_deleted_at_bytes_is_silently_dropped(self):
        """proto3 ignores unknown fields. A persisted blob that still carries
        a tag-15 `deleted_at` LocalTimestampProto (the now-removed field)
        must parse without error; the value is discarded. See spec §4.2.
        """
        # Build canonical bytes for a SecurityProto first.
        base = SecurityProto(issuer_name="legacy-issuer")
        canonical_bytes = base.SerializeToString()

        # Hand-craft tag-15 wire bytes:
        #   key = (15 << 3) | 2 (length-delimited) = 0x7A
        #   value = LocalTimestampProto containing google.protobuf.Timestamp
        #
        # Inner Timestamp (field 1 = seconds, varint):
        #   key = (1 << 3) | 0 = 0x08; value = varint(1700000000)
        inner_ts = bytearray()
        inner_ts.append(0x08)
        value = 1_700_000_000
        while value >= 0x80:
            inner_ts.append((value & 0x7F) | 0x80)
            value >>= 7
        inner_ts.append(value)

        # LocalTimestampProto (field 1 = timestamp, length-delimited):
        outer = bytearray()
        outer.append(0x0A)
        outer.append(len(inner_ts))
        outer.extend(inner_ts)

        # SecurityProto.deleted_at (field 15, length-delimited):
        legacy = bytearray()
        legacy.append(0x7A)
        legacy.append(len(outer))
        legacy.extend(outer)

        combined = canonical_bytes + bytes(legacy)

        reparsed = SecurityProto()
        reparsed.ParseFromString(combined)  # must not raise
        assert reparsed.issuer_name == "legacy-issuer"
        # The reserved tag 15 yields no accessor on the new proto — confirm
        # by checking that valid_to was not populated (deleted_at is dropped,
        # not silently mapped onto a different field).
        assert not reparsed.HasField("valid_to")
