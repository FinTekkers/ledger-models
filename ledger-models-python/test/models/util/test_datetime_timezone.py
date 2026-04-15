"""
Tests that datetime serialization correctly preserves timezone information.

time.mktime interprets timetuple() as system-local time, so serializing
a datetime in a non-local timezone (e.g. UTC on an Eastern Time machine)
shifts the epoch seconds by the UTC offset, corrupting the stored time.
"""
import os
import time as _time
import calendar
from datetime import datetime
from pytz import timezone

from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil


def test_datetime_timezone_roundtrip():
    """Serializing a UTC datetime on a non-UTC system should preserve
    the correct epoch seconds and roundtrip without shifting hours."""

    # Force system timezone to Eastern so the bug is deterministic
    # (Docker containers default to UTC, which would mask the issue)
    old_tz = os.environ.get('TZ')
    os.environ['TZ'] = 'America/New_York'
    _time.tzset()

    try:
        utc = timezone("UTC")
        # noon UTC on a summer day (EDT = UTC-4)
        dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=utc)

        proto = ProtoSerializationUtil.serialize(dt)

        # Correct epoch for 2024-06-15 12:00:00 UTC
        correct_epoch = calendar.timegm(dt.timetuple())

        assert proto.timestamp.seconds == correct_epoch, (
            f"Epoch mismatch: expected {correct_epoch} (12:00 UTC), "
            f"got {proto.timestamp.seconds} "
            f"(off by {proto.timestamp.seconds - correct_epoch}s = "
            f"{(proto.timestamp.seconds - correct_epoch) / 3600:.1f}h)"
        )

        # Also verify the full roundtrip
        result = ProtoSerializationUtil.deserialize(proto)
        result_utc = result.astimezone(utc)

        assert result_utc.hour == dt.hour, (
            f"Roundtrip hour mismatch: sent 12:00 UTC, "
            f"got back {result_utc.hour}:00 UTC"
        )
    finally:
        if old_tz is not None:
            os.environ['TZ'] = old_tz
        elif 'TZ' in os.environ:
            del os.environ['TZ']
        _time.tzset()


def test_datetime_different_timezone_same_instant():
    """Two datetimes representing the same instant in different timezones
    should serialize to the same epoch seconds."""

    old_tz = os.environ.get('TZ')
    os.environ['TZ'] = 'America/New_York'
    _time.tzset()

    try:
        utc = timezone("UTC")
        eastern = timezone("America/New_York")

        # Same instant: 16:00 UTC = 12:00 Eastern (EDT)
        dt_utc = datetime(2024, 6, 15, 16, 0, 0, tzinfo=utc)
        dt_eastern = datetime(2024, 6, 15, 12, 0, 0, tzinfo=eastern)

        proto_utc = ProtoSerializationUtil.serialize(dt_utc)
        proto_eastern = ProtoSerializationUtil.serialize(dt_eastern)

        assert proto_utc.timestamp.seconds == proto_eastern.timestamp.seconds, (
            f"Same instant, different epochs: "
            f"UTC version -> {proto_utc.timestamp.seconds}, "
            f"Eastern version -> {proto_eastern.timestamp.seconds} "
            f"(diff = {proto_utc.timestamp.seconds - proto_eastern.timestamp.seconds}s = "
            f"{(proto_utc.timestamp.seconds - proto_eastern.timestamp.seconds) / 3600:.1f}h)"
        )
    finally:
        if old_tz is not None:
            os.environ['TZ'] = old_tz
        elif 'TZ' in os.environ:
            del os.environ['TZ']
        _time.tzset()
