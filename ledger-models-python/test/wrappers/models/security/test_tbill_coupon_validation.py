"""LM-258: a TBILL has no coupon. coupon_rate must be unset or 0 when
product_type == TBILL. Pins the rule in security_rules, the SecurityService
client-side guard, and that stored bad rows still load.

Unit test only: the service stub is a MagicMock, no channel is used.
"""

from decimal import Decimal
from typing import Optional
from unittest.mock import MagicMock
from uuid import UUID

import pytest

from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import BondDetailsProto, SecurityProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.security.create_security_request_pb2 import (
    CreateSecurityRequestProto,
)
from fintekkers.wrappers.models.errors import ModelValidationError
from fintekkers.wrappers.models.security import security_rules
from fintekkers.wrappers.models.security.bond_security import BondSecurity
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.requests.security import CreateSecurityRequest
from fintekkers.wrappers.services.security import SecurityService

SECURITY_ID = UUID("1f0e8a4c-58b1-4d0e-9a3c-7d2b6e5f4a10")


def _security(product_type: int, coupon: Optional[str]) -> SecurityProto:
    """A security of `product_type`. `coupon` None leaves coupon_rate unset."""
    bond = BondDetailsProto(face_value=DecimalValueProto(arbitrary_precision_value="1000"))
    if coupon is not None:
        bond.coupon_rate.CopyFrom(DecimalValueProto(arbitrary_precision_value=coupon))
    return SecurityProto(
        uuid=UUIDProto(raw_uuid=SECURITY_ID.bytes),
        product_type=product_type,
        bond_details=bond,
    )


def _assert_rejected(error: ModelValidationError) -> None:
    assert type(error) is ModelValidationError
    assert isinstance(error, ValueError)
    assert len(error.violations) == 1
    assert error.field == security_rules.COUPON_RATE == "bond_details.coupon_rate"
    assert error.object_id == SECURITY_ID
    assert str(SECURITY_ID) in str(error)
    assert "coupon_rate" in str(error)


# ---------- the rule ----------

@pytest.mark.parametrize("coupon", ["6.0", "-1.0"])
def test_tbill_with_non_zero_coupon_is_rejected(coupon):
    proto = _security(ProductTypeProto.TBILL, coupon)
    with pytest.raises(ModelValidationError) as info:
        security_rules.require_valid(proto)
    _assert_rejected(info.value)
    assert [v.field for v in security_rules.validate(proto)] == ["bond_details.coupon_rate"]


def test_tbill_with_no_coupon_message_is_accepted():
    proto = _security(ProductTypeProto.TBILL, None)
    assert not proto.bond_details.HasField("coupon_rate")
    assert security_rules.validate(proto) == []
    security_rules.require_valid(proto)


def test_tbill_with_empty_coupon_value_is_accepted():
    proto = _security(ProductTypeProto.TBILL, "")
    assert proto.bond_details.HasField("coupon_rate")
    assert security_rules.validate(proto) == []
    security_rules.require_valid(proto)


@pytest.mark.parametrize("coupon", ["0", "0.00"])
def test_tbill_with_zero_coupon_is_accepted(coupon):
    proto = _security(ProductTypeProto.TBILL, coupon)
    assert security_rules.validate(proto) == []
    security_rules.require_valid(proto)


def test_treasury_note_with_coupon_six_is_accepted():
    proto = _security(ProductTypeProto.TREASURY_NOTE, "6.0")
    assert security_rules.validate(proto) == []
    security_rules.require_valid(proto)


# ---------- stored bad rows still load ----------

def test_stored_tbill_with_coupon_still_loads_through_the_wrapper():
    stored = SecurityProto.FromString(_security(ProductTypeProto.TBILL, "6.0").SerializeToString())

    for wrapper in (Security(stored), BondSecurity(stored)):
        assert wrapper.get_id() == SECURITY_ID
        coupon = ProtoSerializationUtil.deserialize(wrapper.proto.bond_details.coupon_rate)
        assert coupon == Decimal("6.0")


# ---------- SecurityService client-side guard ----------

@pytest.fixture
def svc_with_stub_sentinel():
    """Yields a SecurityService whose stub fails the test if an RPC is called."""
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


def _request(coupon: Optional[str]) -> CreateSecurityRequest:
    proto = CreateSecurityRequestProto(security_input=_security(ProductTypeProto.TBILL, coupon))
    return CreateSecurityRequest(proto=proto)


def test_create_or_update_rejects_tbill_coupon_before_rpc(svc_with_stub_sentinel):
    svc, sentinel = svc_with_stub_sentinel
    with pytest.raises(ModelValidationError) as info:
        svc.create_or_update(_request("6.0"))
    _assert_rejected(info.value)
    sentinel.CreateOrUpdate.assert_not_called()


def test_validate_create_or_update_rejects_tbill_coupon_before_rpc(svc_with_stub_sentinel):
    svc, sentinel = svc_with_stub_sentinel
    with pytest.raises(ModelValidationError) as info:
        svc.validate_create_or_update(_request("6.0"))
    _assert_rejected(info.value)
    sentinel.ValidateCreateOrUpdate.assert_not_called()


def test_tbill_with_zero_coupon_reaches_the_stub(svc_with_stub_sentinel):
    svc, sentinel = svc_with_stub_sentinel
    sentinel.CreateOrUpdate.side_effect = None
    sentinel.CreateOrUpdate.return_value = MagicMock(HasField=lambda f: False)
    sentinel.ValidateCreateOrUpdate.side_effect = None

    svc.create_or_update(_request("0"))
    svc.validate_create_or_update(_request("0"))

    sentinel.CreateOrUpdate.assert_called_once()
    sentinel.ValidateCreateOrUpdate.assert_called_once()
