from fintekkers.models.security.identifier.identifier_type_pb2 import (
    IdentifierTypeProto,
)

from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.services.security import SecurityService

import os

from dateutil.relativedelta import relativedelta
from ..requests.test_security_request import CASH_USD_REQUEST
from fintekkers.wrappers.models.security.tenor import Tenor
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
import re

def test_get_usd_cash_security():
    svc = SecurityService()

    responses2 = svc.search(CASH_USD_REQUEST)

    security: Security = None
    for r in responses2:
        security = r

    assert security is not None
    assert "USD" == security.get_description()
    assert IdentifierTypeProto.CASH == security.get_security_id().get_identifier_type()

from fintekkers.wrappers.services.util.Environment import EnvConfig

def test_get_fields():
    EnvConfig.default_api_url = "localhost"
    svc = SecurityService()
    fields = svc.get_fields()
    assert len(fields) > 5


from fintekkers.models.position.field_pb2 import FieldProto

def test_get_field_values():
    EnvConfig.default_api_url = "localhost"
    svc = SecurityService()
    values:list[object] = svc.get_field_values(FieldProto.ASSET_CLASS)

    assert len(values) >= 3
    assert "Cash" in values


def test_get_field_values_adjusted_tenor():
    EnvConfig.default_api_url = "localhost"
    svc = SecurityService()
    values:list[Tenor] = svc.get_field_values(FieldProto.ADJUSTED_TENOR)


    if len(values) == 0:
        raise Exception(f"Expected 0 values, got {len(values)}. We should have at least an unknown value for CASH")
    
    if len(values) > 0:
        first_tenor = [x for x in values if x.get_type() == TenorTypeProto.UNKNOWN_TENOR_TYPE][0]
        assert first_tenor.get_type() == TenorTypeProto.UNKNOWN_TENOR_TYPE
        assert first_tenor.get_tenor_description() == "UNKNOWN_TENOR_TYPE"
    
    if len(values) > 2:
        # We should check we have UNKONWN and TERM tenor types within the Tenor list
        # We should check the term values match the expected string structure via a regex
        for tenor in values:
            tenor:Tenor
            
            if tenor.get_type() == TenorTypeProto.UNKNOWN_TENOR_TYPE:
                continue

            assert tenor.get_type() == TenorTypeProto.TERM
            
            if tenor.get_tenor_description() == "":
                continue # Can be a tenor with a negative value because the adjusted tenor is in the past

            ##Just asserting the tenor is not 0; so not weighting the years, months, weeks, days
            tenor_sum = tenor.get_tenor().days + tenor.get_tenor().months + tenor.get_tenor().weeks + tenor.get_tenor().years
            assert tenor_sum >= 1
            assert re.match(r"^(\d+Y)?(\d+M)?(\d+W)?(\d+D)?$", tenor.get_tenor_description())
