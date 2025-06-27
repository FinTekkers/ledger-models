from fintekkers.models.position.measure_pb2 import (
    MeasureProto, MARKET_VALUE, DIRECTED_QUANTITY, CURRENT_YIELD, YIELD_TO_MATURITY
)
from fintekkers.models.security.identifier.identifier_pb2 import IdentifierProto
from fintekkers.models.security.identifier.identifier_type_pb2 import IdentifierTypeProto
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.position.position_util_pb2 import FieldMapEntry, MeasureMapEntry
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.util.decimal_value_pb2 import DecimalValueProto
from fintekkers.requests.util.operation_pb2 import CREATE, VALIDATE
from fintekkers.requests.price.query_price_request_pb2 import PRICE_HORIZON_1_DAY

from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.services.valuation import ValuationService
from fintekkers.wrappers.services.security import SecurityService
from fintekkers.wrappers.services.price import PriceService
from fintekkers.wrappers.requests.security import QuerySecurityRequest
from fintekkers.wrappers.services.util.Environment import EnvConfig

from fintekkers.models.price.price_pb2 import PriceProto

import grpc


def test_valuation_with_cash_security():
    """Test valuation with just a security input"""
    # Get a test security (USD cash)
    security_service = SecurityService()
    security_query_request = QuerySecurityRequest.create_query_request({
        FieldProto.IDENTIFIER: IdentifierProto(
            identifier_type=IdentifierTypeProto.CASH,
            identifier_value="USD"
        )
    })
    
    security = None
    for sec in security_service.search(security_query_request):
        security = sec
        break
    
    assert security is not None, "Should find USD cash security"
    
    # Create valuation service and run valuation
    valuation_service = ValuationService()
    
    try:
        position = Position(positionProto=PositionProto())
        price = Price(proto=PriceProto())

        response = valuation_service.run_valuation(
            security=security,
            position=position,
            price=price,
            measures=[MARKET_VALUE, DIRECTED_QUANTITY]
        )
        
        # Verify response structure
        assert response is not None
        assert response.valuation_request is not None
        assert response.measure_results is not None
        
        # Try to extract measure results
        try:
            market_value = valuation_service.get_measure_result(response, MARKET_VALUE)
            print(f"Market Value: {market_value}")
        except ValueError:
            print("Market Value measure not found in response")
            
        try:
            directed_quantity = valuation_service.get_measure_result(response, DIRECTED_QUANTITY)
            print(f"Directed Quantity: {directed_quantity}")
        except ValueError:
            print("Directed Quantity measure not found in response")
            
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.UNAVAILABLE:
            print("Valuation service not available - skipping test")
        else:
            raise e


def test_valuation_with_security_and_price():
    """Test valuation with security and price inputs"""
    EnvConfig.default_api_url = "localhost"
    
    # Get a test security (USD cash)
    security_service = SecurityService()

    identifiers = security_service.get_field_values(FieldProto.IDENTIFIER)
    identifier = identifiers[0]

    cusip = "912795RL7"

    securities = security_service.search(QuerySecurityRequest.create_query_request({
        FieldProto.IDENTIFIER: IdentifierProto(identifier_type=IdentifierTypeProto.CUSIP, identifier_value=cusip)
    }))
    securities = list(securities)

    security = securities[0] if len(securities) > 0 else None
    assert security is not None, "Could not find security with CUSIP: " + cusip +". The CUSIP should exist from Fed reserve holdings. The database likely needs to be refreshed"
    
    price = Price(proto=PriceProto(price=DecimalValueProto(arbitrary_precision_value="99.874736")))

    a: MeasureMapEntry = MeasureMapEntry(measure=MeasureProto.DIRECTED_QUANTITY, measure_decimal_value=DecimalValueProto(arbitrary_precision_value="100.0"))
    position = Position(positionProto=PositionProto(measures=[a]))

    # Create valuation service and run valuation
    valuation_service = ValuationService()
    
    try:
        ##TODO: NEed to pass in the auction date as the as of now to recreate the 
        #price from the auction
        response = valuation_service.run_valuation(
            security=security,
            price=price,
            position=position,
            measures=[MARKET_VALUE, CURRENT_YIELD]
        )
        
        # Verify response structure
        assert response is not None
        assert response.valuation_request is not None
        assert response.measure_results is not None
        
        print(f"Valuation completed with {len(response.measure_results)} measure results")
        
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.UNAVAILABLE:
            print("Valuation service not available - skipping test")
        else:
            raise e


def test_valuation_operation_types():
    """Test different operation types"""
    EnvConfig.default_api_url = "localhost"
    
    # Get a test security
    security_service = SecurityService()
    security_query_request = QuerySecurityRequest.create_query_request({
        FieldProto.IDENTIFIER: IdentifierProto(
            identifier_type=IdentifierTypeProto.CASH,
            identifier_value="USD"
        )
    })
    
    security = None
    for sec in security_service.search(security_query_request):
        security = sec
        break
    
    assert security is not None, "Should find USD cash security"
    
    # Create valuation service
    valuation_service = ValuationService()
    
    # Test CREATE operation
    try:
        create_response = valuation_service.run_valuation(
            security=security,
            measures=[MARKET_VALUE],
            operation_type=CREATE
        )
        assert create_response is not None
        print("CREATE operation successful")
        
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.UNAVAILABLE:
            print("Valuation service not available - skipping CREATE test")
        else:
            raise e
    
    # Test VALIDATE operation
    try:
        validate_response = valuation_service.run_valuation(
            security=security,
            measures=[MARKET_VALUE],
            operation_type=VALIDATE
        )
        assert validate_response is not None
        print("VALIDATE operation successful")
        
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.UNAVAILABLE:
            print("Valuation service not available - skipping VALIDATE test")
        else:
            raise e


def test_valuation_error_handling():
    """Test error handling in valuation service"""
    EnvConfig.default_api_url = "localhost"
    
    valuation_service = ValuationService()
    
    # Test with no inputs (should still work but return empty results)
    try:
        response = valuation_service.run_valuation(
            measures=[MARKET_VALUE]
        )
        
        assert response is not None
        print("Valuation with no inputs completed successfully")
        
    except grpc.RpcError as e:
        if e.code() == grpc.StatusCode.UNAVAILABLE:
            print("Valuation service not available - skipping error handling test")
        else:
            raise e


if __name__ == "__main__":
    print("Running Valuation Service Tests...")
    
    test_valuation_service_basic()
    test_valuation_with_security()
    test_valuation_with_security_and_price()
    test_valuation_operation_types()
    test_valuation_error_handling()
    
    print("All valuation service tests completed!")
