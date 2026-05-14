"""Tests for the Security identifier API:
  - get_identifiers() returns every IdentifierProto wrapped in Identifier.
  - get_identifier_by_type(<enum>) finds the matching one; None when missing.
"""

from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)
from fintekkers.models.security.security_pb2 import SecurityProto

from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.security.security_identifier import Identifier


def _security_with_identifiers(*pairs) -> Security:
    identifiers = [
        IdentifierProto(identifier_type=t, identifier_value=v) for t, v in pairs
    ]
    return Security(SecurityProto(identifiers=identifiers))


def test_get_identifiers_returns_list_of_wrappers():
    security = _security_with_identifiers(
        (IdentifierTypeProto.CUSIP, "912828ZL7"),
        (IdentifierTypeProto.ISIN, "US912828ZL77"),
    )

    identifiers = security.get_identifiers()
    assert len(identifiers) == 2
    assert all(isinstance(i, Identifier) for i in identifiers)
    assert identifiers[0].get_identifier_type() == IdentifierTypeProto.CUSIP
    assert identifiers[0].get_identifier_value() == "912828ZL7"
    assert identifiers[1].get_identifier_type() == IdentifierTypeProto.ISIN
    assert identifiers[1].get_identifier_value() == "US912828ZL77"


def test_get_identifier_by_type_finds_match():
    security = _security_with_identifiers(
        (IdentifierTypeProto.CUSIP, "912828ZL7"),
        (IdentifierTypeProto.ISIN, "US912828ZL77"),
    )

    match = security.get_identifier_by_type(IdentifierTypeProto.CUSIP)
    assert match is not None
    assert match.get_identifier_value() == "912828ZL7"

    match = security.get_identifier_by_type(IdentifierTypeProto.ISIN)
    assert match is not None
    assert match.get_identifier_value() == "US912828ZL77"


def test_get_identifier_by_type_returns_none_when_missing():
    security = _security_with_identifiers(
        (IdentifierTypeProto.CUSIP, "912828ZL7"),
    )
    assert security.get_identifier_by_type(IdentifierTypeProto.ISIN) is None


def test_get_identifiers_returns_empty_when_no_identifiers():
    security = Security(SecurityProto())
    assert security.get_identifiers() == []
