from unittest.mock import patch, Mock


from unittest import TestCase
from uuid import UUID

from fintekkers.wrappers.models.price import Price
from fintekkers.wrappers.services.price import PriceService

def test_get_current_price():
    price_service = PriceService()

    ids = price_service.list_ids()

    assert len(ids) > 0

    id:UUID = ids[0]
    price:Price = price_service.get_price_by_uuid(id)

    id2:UUID = price.get_uuid()

    assert id.__str__() == id2.__str__()