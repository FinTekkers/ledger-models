
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto


class IdentifierValidationError(ValueError):
    """Raised when an IdentifierProto is rejected by the client-side guard
    before it is sent to the SecurityService. Subclass of ValueError so
    existing `except ValueError` paths keep working."""
    pass


def validate_identifier_proto(identifier: IdentifierProto) -> None:
    """Client-side guard for a single IdentifierProto. Rejects identifiers
    that the SecurityService backend would also reject (FinTekkers/second-brain#347):

    - identifier_type == UNKNOWN_IDENTIFIER_TYPE — the proto3 default; nothing
      should ever be sent with this value. Equity loaders MUST pass a real type
      (EXCH_TICKER, CUSIP, ISIN, ...).
    - identifier_value is empty / whitespace-only — a typed identifier with no
      value is structurally broken.

    Raises IdentifierValidationError on violation. No-op on a valid identifier.
    """
    id_type = identifier.identifier_type
    if id_type == IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE:
        raise IdentifierValidationError(
            "Refusing to send Security with identifier_type=UNKNOWN_IDENTIFIER_TYPE. "
            "Pass a concrete IdentifierTypeProto (EXCH_TICKER, CUSIP, ISIN, FIGI, "
            "SERIES_ID, OSI, INDEX_NAME, CASH). See FinTekkers/second-brain#347."
        )
    value = identifier.identifier_value
    if value is None or value.strip() == "":
        type_name = IdentifierTypeProto.DESCRIPTOR.values_by_number[id_type].name
        raise IdentifierValidationError(
            f"Refusing to send Security identifier with empty identifier_value "
            f"(identifier_type={type_name}). See FinTekkers/second-brain#347."
        )


def validate_identifiers_for_create(security: SecurityProto) -> None:
    """Client-side guard for every identifier carried by a SecurityProto on
    the create/upsert path. Mirrors the server's validateCreateRequest reject
    so callers fail fast — before the gRPC round-trip — instead of catching
    INVALID_ARGUMENT on the wire.

    Skips link-mode securities (is_link=true) — those carry only uuid+as_of and
    are reference handles, not entities being created.

    Raises IdentifierValidationError on the first offending identifier.
    """
    if security.is_link:
        return
    for identifier in security.identifiers:
        validate_identifier_proto(identifier)


class Identifier():
    def __init__(self, identifier:IdentifierProto):
        self.proto = identifier

    def __str__(self):
        identifier_type_name = IdentifierTypeProto.DESCRIPTOR.values_by_number[self.proto.identifier_type].name
        return f"{identifier_type_name}:{self.proto.identifier_value}"

    def get_identifier_value(self) -> str:
        return self.proto.identifier_value

    def get_identifier_type(self) -> IdentifierTypeProto:
        return self.proto.identifier_type