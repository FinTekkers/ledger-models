"""Pins the SecurityService client-side guard (#347): create_or_update and
validate_create_or_update MUST raise before invoking the gRPC stub when the
request carries an UNKNOWN_IDENTIFIER_TYPE / empty-value identifier.

This is a unit test — it never touches a real channel; the stub is replaced
with a sentinel that fails the test if hit, which is the contract the guard
must enforce.
"""

from unittest.mock import MagicMock

import pytest

from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.requests.security.create_security_request_pb2 import (
    CreateSecurityRequestProto,
)
from fintekkers.wrappers.models.security.security_identifier import (
    IdentifierValidationError,
)
from fintekkers.wrappers.requests.security import CreateSecurityRequest
from fintekkers.wrappers.services.security import SecurityService


@pytest.fixture
def svc_with_stub_sentinel():
    """Yields a SecurityService whose stub explodes if any RPC is called.
    Use this to assert the client-side guard rejects BEFORE the gRPC layer.
    """
    SecurityService._reset_for_tests()
    svc = SecurityService()
    sentinel = MagicMock()
    sentinel.CreateOrUpdate.side_effect = AssertionError(
        "client-side guard must reject before invoking the stub"
    )
    sentinel.ValidateCreateOrUpdate.side_effect = AssertionError(
        "client-side guard must reject before invoking the stub"
    )
    svc.stub = sentinel
    yield svc, sentinel
    SecurityService._reset_for_tests()


def _request_with(identifiers):
    proto = CreateSecurityRequestProto(
        security_input=SecurityProto(identifiers=identifiers)
    )
    return CreateSecurityRequest(proto=proto)


def test_create_or_update_rejects_unknown_identifier_before_rpc(svc_with_stub_sentinel):
    svc, sentinel = svc_with_stub_sentinel
    bad = IdentifierProto(
        identifier_type=IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE,
        identifier_value="stale-uuid",
    )
    with pytest.raises(IdentifierValidationError):
        svc.create_or_update(_request_with([bad]))
    sentinel.CreateOrUpdate.assert_not_called()


def test_validate_create_or_update_rejects_unknown_identifier_before_rpc(svc_with_stub_sentinel):
    svc, sentinel = svc_with_stub_sentinel
    bad = IdentifierProto(
        identifier_type=IdentifierTypeProto.UNKNOWN_IDENTIFIER_TYPE,
        identifier_value="stale-uuid",
    )
    with pytest.raises(IdentifierValidationError):
        svc.validate_create_or_update(_request_with([bad]))
    sentinel.ValidateCreateOrUpdate.assert_not_called()


def test_create_or_update_rejects_empty_identifier_value(svc_with_stub_sentinel):
    svc, sentinel = svc_with_stub_sentinel
    bad = IdentifierProto(
        identifier_type=IdentifierTypeProto.EXCH_TICKER,
        identifier_value="",
    )
    with pytest.raises(IdentifierValidationError):
        svc.create_or_update(_request_with([bad]))
    sentinel.CreateOrUpdate.assert_not_called()


def test_create_or_update_invokes_stub_on_valid_identifier(svc_with_stub_sentinel):
    svc, sentinel = svc_with_stub_sentinel
    # Swap out the explode-on-call sentinel so we can assert the happy path
    # actually reaches the gRPC stub.
    sentinel.CreateOrUpdate.side_effect = None
    sentinel.CreateOrUpdate.return_value = MagicMock(
        HasField=lambda f: False,
    )
    good = IdentifierProto(
        identifier_type=IdentifierTypeProto.EXCH_TICKER,
        identifier_value="AAPL",
    )
    svc.create_or_update(_request_with([good]))
    sentinel.CreateOrUpdate.assert_called_once()
