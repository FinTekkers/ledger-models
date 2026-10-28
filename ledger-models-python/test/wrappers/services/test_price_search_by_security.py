"""A price search for a security filters on SECURITY_ID, never uuIds (LM-398).

QueryPriceRequestProto.uuIds holds price IDs only. `PriceService.get_prices`
must leave it empty and put the security's ID in a SECURITY_ID filter in
`search_price_input`. The fake stubs come from `test_services_stamp.py`.
"""
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.util.uuid_pb2 import UUIDProto
from fintekkers.requests.price.query_price_request_pb2 import PRICE_HORIZON_1_MONTH
from fintekkers.wrappers.services.price import PriceService

from wrappers.services.test_services_stamp import (  # noqa: F401 (calls is a fixture)
    _SECURITY_UUID,
    _found_security_stream,
    calls,
)


def test_get_prices_uses_security_filter_not_uuids(calls):
    calls.responses[("SecurityService", "Search")] = _found_security_stream()

    list(PriceService().get_prices("912796Y29", IdentifierTypeProto.CUSIP, PRICE_HORIZON_1_MONTH))

    assert calls.rpcs() == [("SecurityService", "Search"), ("PriceService", "Search")]
    request = calls.calls[1][2]
    assert len(request.uuIds) == 0
    filters = request.search_price_input.filters
    assert [f.field for f in filters] == [FieldProto.SECURITY_ID]
    security_id = UUIDProto()
    assert filters[0].field_value_packed.Unpack(security_id), (
        f"filter value is {filters[0].field_value_packed.type_url}, not a UUIDProto")
    assert security_id.raw_uuid == _SECURITY_UUID.bytes
