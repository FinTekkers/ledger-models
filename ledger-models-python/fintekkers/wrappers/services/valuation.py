from datetime import datetime
from decimal import Decimal
from typing import Optional
import grpc
from grpc import RpcError
from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.position.position_util_pb2 import MeasureMapEntry
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.util.local_timestamp_pb2 import LocalTimestampProto
from fintekkers.requests.valuation.valuation_response_pb2 import ValuationResponseProto
from fintekkers.requests.util.operation_pb2 import RequestOperationTypeProto, CREATE
from fintekkers.services.valuation_service.valuation_service_pb2_grpc import ValuationStub
from fintekkers.wrappers.models.errors import ModelValidationError, violation
from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.product_inputs import MarketData, for_security
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.requests.valuation import ValuationRequests
from fintekkers.wrappers.models.util.serialization import ProtoSerializationUtil
from fintekkers.wrappers.services.util.Environment import EnvConfig, ServiceType


class ValuationService:
    # Singleton: see FinTekkers/ledger-models#223. The gRPC channel is
    # constructed once and reused across all `ValuationService()` calls
    # in the process. Tests that need isolation should call
    # `ValuationService._reset_for_tests()` between cases.
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            instance = super().__new__(cls)
            print(
                "ValuationService connecting to: "
                + EnvConfig.api_url(ServiceType.VALUATION_SERVICE)
            )
            instance.stub = ValuationStub(
                EnvConfig.get_channel(ServiceType.VALUATION_SERVICE)
            )
            cls._instance = instance
        return cls._instance

    def __init__(self):
        pass

    @classmethod
    def _reset_for_tests(cls) -> None:
        cls._instance = None

    def run_valuation(self, 
                     security: Security = None, 
                     position: Position = None, 
                     price: Price = None,
                     measures: list[MeasureProto] = None,
                     asOf: datetime = datetime.now(),
                     market_data: Optional[MarketData] = None) -> ValuationResponseProto:
        """
        Runs a valuation with the provided inputs.
        
        Args:
            security: The security to value (required)
            position: The position to value (required)
            price: The price to use for valuation (required)
            measures: List of measures to calculate (optional)
            asOf: The valuation date and time
            market_data: Market data the security's arm requires, e.g. the
                CPI for a TIPS (optional when the arm requires none)
            
        Returns:
            ValuationResponseProto containing the valuation results
            
        Raises:
            ModelValidationError: If security, position or price is missing
            UnmappedProductTypeError: If the security's type has no ProductInput arm
            MissingMarketDataError: If market_data lacks a kind the arm requires
            RpcError: If the gRPC call fails
        """
        missing = [violation(name, None, f"{name} is required")
                   for name, value in (("security", security), ("position", position), ("price", price))
                   if value is None]
        if missing:
            raise ModelValidationError(missing)
        # Typed request: product_input (70) and position_input (21) (LM-410).
        # The caller's protos are copied in as they are, not stamped (LM-322).
        asOfProto: LocalTimestampProto = ProtoSerializationUtil.serialize(asOf)
        product_input = for_security(security.proto, price.proto, market_data)
        request = ValuationRequests.typed(asOfProto, product_input, position.positionProto, measures or [])
        try:
            # Run the valuation
            response = self.stub.RunValuation(request)
            return response
            
        except RpcError as e:
            if e.code() == grpc.StatusCode.CANCELLED:
                print(f"Network call cancelled, likely due to a service error trying to contact {EnvConfig.api_url(ServiceType.VALUATION_SERVICE)} ({e.details()})")
            else:
                print(f"Service unavailable trying to contact {EnvConfig.api_url(ServiceType.VALUATION_SERVICE)} ({e.details()})")
            raise e

    def get_measure_result(self, response: ValuationResponseProto, measure: MeasureProto) -> Decimal:
        """
        Extracts a specific measure result from the valuation response.
        
        Args:
            response: The valuation response
            measure: The measure to extract
            
        Returns:
            The measure value as an exact Decimal
            
        Raises:
            ValueError: If the measure is not found in the response
        """
        for measure_entry in response.measure_results:
            if measure_entry.measure == measure:
                return ProtoSerializationUtil.deserialize(measure_entry.measure_decimal_value)
        
        raise ValueError(f"Measure {measure} not found in valuation response") 