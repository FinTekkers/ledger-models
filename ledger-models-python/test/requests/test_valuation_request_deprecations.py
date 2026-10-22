"""ValuationRequestProto.security_input (20) and price_input (22) are marked
deprecated in favour of product_input (70), removed under LM-376 (LM-377).
position_input (21) and product_input (70) are not deprecated.
"""
from fintekkers.requests.valuation import valuation_request_pb2

FIELDS = valuation_request_pb2.ValuationRequestProto.DESCRIPTOR.fields_by_number


def test_security_input_and_price_input_are_deprecated():
    assert FIELDS[20].name == "security_input"
    assert FIELDS[22].name == "price_input"
    assert FIELDS[20].GetOptions().deprecated is True
    assert FIELDS[22].GetOptions().deprecated is True


def test_position_input_and_product_input_are_not_deprecated():
    assert FIELDS[21].name == "position_input"
    assert FIELDS[70].name == "product_input"
    assert FIELDS[21].GetOptions().deprecated is False
    assert FIELDS[70].GetOptions().deprecated is False
