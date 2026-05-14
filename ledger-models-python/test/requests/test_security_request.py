from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto

from fintekkers.models.security.product_type_pb2 import TREASURY_NOTE
from fintekkers.models.position.field_pb2 import FieldProto

from fintekkers.requests.security.create_security_request_pb2 import CreateSecurityRequestProto
from fintekkers.requests.security.query_security_request_pb2 import QuerySecurityRequestProto

from fintekkers.wrappers.requests.security import CreateSecurityRequest, QuerySecurityRequest

from models.util.dummy_security import USD

CASH_USD_REQUEST = QuerySecurityRequest.create_query_request(
        fields={
            FieldProto.IDENTIFIER: IdentifierProto(identifier_type=IdentifierTypeProto.CASH, identifier_value="USD")
        }
    )

def test_create_security_request():
    request = CreateSecurityRequest.create_ust_security_request(
        cusip="TEST_CUSIP", 
        cash_security=USD,
        product_type=TREASURY_NOTE,
        coupon_rate=0.05,
        spread=None, 
        face_value=1000.0
    )

    proto:CreateSecurityRequestProto = request.proto

    # v0.4.0: face_value lives in bond_details.
    assert proto.security_input.bond_details.face_value.arbitrary_precision_value == "1000.0"
    
def test_query_security_request():
    request = CASH_USD_REQUEST

    proto:QuerySecurityRequestProto = request.proto

    assert len(proto.search_security_input.filters) == 1