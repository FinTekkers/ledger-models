"""LM-411: ValuationService.run_valuation sends product_input, never a request
with it unset. An unmapped type, a missing security or a missing price raises
a typed error before any RPC. Cases come from test-fixtures/product-inputs/.
"""
import json
from datetime import datetime
from pathlib import Path

import pytest

from fintekkers.models.position.measure_pb2 import MeasureProto
from fintekkers.models.position.position_pb2 import PositionProto
from fintekkers.models.price.price_pb2 import PriceProto
from fintekkers.models.security.product_type_pb2 import ProductTypeProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.wrappers.models.errors import ModelValidationError, UnmappedProductTypeError
from fintekkers.wrappers.models.position import Position
from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.models.security.security import Security
from fintekkers.wrappers.services.valuation import ValuationService

FIXTURES = Path(__file__).resolve().parents[4] / "test-fixtures" / "product-inputs"


class _RecordingStub:
    def __init__(self):
        self.requests = []

    def RunValuation(self, request):
        self.requests.append(request)


def _service() -> ValuationService:
    service = object.__new__(ValuationService)
    service.stub = _RecordingStub()
    return service


def _inputs(name: str):
    case = json.loads((FIXTURES / f"{name}.json").read_text())
    return (Security(SecurityProto.FromString(bytes.fromhex(case["security_hex"]))),
            Price(PriceProto.FromString(bytes.fromhex(case["price_hex"]))))


def _run(service: ValuationService, security, price) -> None:
    service.run_valuation(security=security, position=Position(PositionProto()), price=price,
                          measures=[MeasureProto.MARKET_VALUE], asOf=datetime(2026, 11, 1, 9, 30))


def test_product_input_is_set():
    service = _service()
    _run(service, *_inputs("equity"))
    [request] = service.stub.requests
    assert request.HasField("product_input")
    assert request.product_input.WhichOneof("input") == "equity"


def test_unmapped_type_raises_naming_the_type_and_sends_nothing():
    security, price = _inputs("unmapped")
    name = ProductTypeProto.Name(security.proto.product_type)
    service = _service()
    with pytest.raises(UnmappedProductTypeError) as raised:
        _run(service, security, price)
    assert raised.value.product_type == name
    assert name in str(raised.value)
    assert service.stub.requests == []


@pytest.mark.parametrize("missing", ["security", "price"])
def test_missing_security_or_price_raises_and_sends_nothing(missing):
    security, price = _inputs("equity")
    service = _service()
    with pytest.raises(ModelValidationError) as raised:
        _run(service, None if missing == "security" else security, None if missing == "price" else price)
    assert [v.field for v in raised.value.violations] == [missing]
    assert service.stub.requests == []
