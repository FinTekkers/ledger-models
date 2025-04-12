from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)

from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.services.security import SecurityService

import os

print(os.getcwd())

from ..requests.test_security_request import CASH_USD_REQUEST


def test_get_usd_cash_security():
    svc = SecurityService()

    responses2 = svc.search(CASH_USD_REQUEST)

    security: Security = None
    for r in responses2:
        security = r

    assert security is not None
    assert "USD" == security.get_description()
    assert IdentifierTypeProto.CASH == security.get_security_id().get_identifier_type()


if __name__ == "__main__":
    test_get_usd_cash_security()
