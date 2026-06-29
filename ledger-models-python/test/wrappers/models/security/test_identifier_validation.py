"""Client-side identifier guard (FinTekkers/second-brain#347).

Pins behaviour of the consumer-side reject so equity / generic loaders fail
fast on the client before the gRPC round-trip, mirroring the server's
SecurityAPIGRPCImpl.validateCreateRequest UNKNOWN_IDENTIFIER_TYPE check.
"""

import pytest

from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.security.security_identifier import (
    IdentifierValidationError,
    validate_identifier_proto,
    validate_identifiers_for_create,
)


# ---------- single-identifier guard ----------

def test_validate_identifier_proto_rejects_unknown_type():
    bad = IdentifierProto(
        identifier_type=IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE,
        identifier_value="some-uuid-hex",
    )
    with pytest.raises(IdentifierValidationError) as exc:
        validate_identifier_proto(bad)
    msg = str(exc.value)
    assert "UNKNOWN_IDENTIFIER_TYPE" in msg
    # surfaces the valid alternatives so the caller can fix the typo
    assert "EXCH_TICKER" in msg
    assert "#347" in msg


def test_validate_identifier_proto_rejects_default_constructed():
    # A default-constructed IdentifierProto has identifier_type=0
    # (UNKNOWN_IDENTIFIER_TYPE) and an empty value — both fail. This pins the
    # most likely real-world bug shape (forgetting to set the type).
    bad = IdentifierProto()
    with pytest.raises(IdentifierValidationError):
        validate_identifier_proto(bad)


def test_validate_identifier_proto_rejects_empty_value():
    bad = IdentifierProto(
        identifier_type=IdentifierTypeProto.EXCH_TICKER,
        identifier_value="",
    )
    with pytest.raises(IdentifierValidationError) as exc:
        validate_identifier_proto(bad)
    assert "empty" in str(exc.value)
    assert "EXCH_TICKER" in str(exc.value)


def test_validate_identifier_proto_rejects_whitespace_value():
    bad = IdentifierProto(
        identifier_type=IdentifierTypeProto.CUSIP,
        identifier_value="   ",
    )
    with pytest.raises(IdentifierValidationError):
        validate_identifier_proto(bad)


@pytest.mark.parametrize(
    "id_type,value",
    [
        (IdentifierTypeProto.EXCH_TICKER, "AAPL"),
        (IdentifierTypeProto.CUSIP, "037833100"),
        (IdentifierTypeProto.ISIN, "US0378331005"),
        (IdentifierTypeProto.FIGI, "BBG000B9XRY4"),
        (IdentifierTypeProto.OSI, "AAPL 250620C00150000"),
        (IdentifierTypeProto.SERIES_ID, "GS10"),
        (IdentifierTypeProto.INDEX_NAME, "SPX"),
        (IdentifierTypeProto.CASH, "USD"),
    ],
)
def test_validate_identifier_proto_accepts_every_real_type(id_type, value):
    good = IdentifierProto(identifier_type=id_type, identifier_value=value)
    # No raise == accepted.
    validate_identifier_proto(good)


def test_validate_identifier_validation_error_is_value_error():
    # Subclassing ValueError keeps any existing `except ValueError:` callers
    # working — important since this guard sits on a hot path.
    assert issubclass(IdentifierValidationError, ValueError)


# ---------- whole-Security guard (the SecurityService.create_or_update hook) ----------

def test_validate_identifiers_for_create_passes_when_all_typed():
    security = SecurityProto(
        identifiers=[
            IdentifierProto(
                identifier_type=IdentifierTypeProto.EXCH_TICKER,
                identifier_value="AAPL",
            ),
            IdentifierProto(
                identifier_type=IdentifierTypeProto.ISIN,
                identifier_value="US0378331005",
            ),
        ]
    )
    validate_identifiers_for_create(security)


def test_validate_identifiers_for_create_rejects_any_unknown_in_list():
    security = SecurityProto(
        identifiers=[
            IdentifierProto(
                identifier_type=IdentifierTypeProto.EXCH_TICKER,
                identifier_value="AAPL",
            ),
            IdentifierProto(
                identifier_type=IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE,
                identifier_value="stale-uuid",
            ),
        ]
    )
    with pytest.raises(IdentifierValidationError):
        validate_identifiers_for_create(security)


def test_validate_identifiers_for_create_skips_link_mode():
    # is_link=true Securities are reference handles (uuid + as_of only) —
    # they don't carry identifiers and aren't being "created", so the
    # guard must skip rather than raise on the empty identifiers list.
    link = SecurityProto(is_link=True)
    validate_identifiers_for_create(link)


def test_validate_identifiers_for_create_handles_empty_identifiers():
    # A SecurityProto with no identifiers is not what this guard is policing.
    # The server enforces the "must have at least one" rule. Our consumer-side
    # check is purely about rejecting UNKNOWN-typed entries — an empty list
    # passes here.
    security = SecurityProto(identifiers=[])
    validate_identifiers_for_create(security)
