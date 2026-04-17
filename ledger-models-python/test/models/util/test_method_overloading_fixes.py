from datetime import date, datetime

from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.wrappers.models.util.date_utils import get_date_proto
from fintekkers.wrappers.requests.price import QueryPriceRequest
from fintekkers.wrappers.services.price import PriceService

import pytest


def test_get_date_proto_from_string():
    proto = get_date_proto("2024-06-15")
    assert isinstance(proto, LocalDateProto)
    assert proto.year == 2024
    assert proto.month == 6
    assert proto.day == 15


def test_get_date_proto_from_datetime():
    dt = datetime(2025, 3, 20)
    proto = get_date_proto(dt)
    assert isinstance(proto, LocalDateProto)
    assert proto.year == 2025
    assert proto.month == 3
    assert proto.day == 20


def test_get_date_proto_from_date():
    d = date(2023, 12, 1)
    proto = get_date_proto(d)
    assert isinstance(proto, LocalDateProto)
    assert proto.year == 2023
    assert proto.month == 12
    assert proto.day == 1


def test_get_date_proto_none():
    proto = get_date_proto(None)
    assert proto is None


def test_query_price_request_with_horizon():
    from fintekkers.requests.price.query_price_request_pb2 import (
        PRICE_FREQUENCY_DAILY, PRICE_HORIZON_1_MONTH,
    )
    request = QueryPriceRequest.create_query_request(
        fields={},
        frequency=PRICE_FREQUENCY_DAILY,
        horizon=PRICE_HORIZON_1_MONTH,
    )
    assert request.proto.frequency == PRICE_FREQUENCY_DAILY
    assert request.proto.horizon == PRICE_HORIZON_1_MONTH


def test_query_price_request_with_date_range():
    from fintekkers.requests.price.query_price_request_pb2 import (
        PRICE_FREQUENCY_DAILY,
    )
    request = QueryPriceRequest.create_query_request_with_date_range(
        fields={},
        frequency=PRICE_FREQUENCY_DAILY,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31),
    )
    assert request.proto.frequency == PRICE_FREQUENCY_DAILY
    assert request.proto.date_range is not None


def test_price_service_renamed_methods_exist():
    assert hasattr(PriceService, 'get_latest_price')
    assert hasattr(PriceService, 'get_price_as_of_datetime')
    assert hasattr(PriceService, 'get_price_as_of_date')
    assert not hasattr(PriceService, 'get_price') or callable(getattr(PriceService, 'get_price', None)) is False


def test_price_service_renamed_methods_raise_not_implemented():
    svc = PriceService.__new__(PriceService)
    with pytest.raises(NotImplementedError):
        svc.get_latest_price("TEST", None)
    with pytest.raises(NotImplementedError):
        svc.get_price_as_of_datetime("TEST", None, datetime.now())
    with pytest.raises(NotImplementedError):
        svc.get_price_as_of_date("TEST", None, date.today())
