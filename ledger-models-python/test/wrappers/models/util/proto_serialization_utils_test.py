from datetime import date
from decimal import Decimal
from google.protobuf import wrappers_pb2
from google.protobuf.any_pb2 import Any
import pytest

from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.models.security.tenor_pb2 import TenorProto
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
from fintekkers.models.security.security_type_pb2 import SecurityTypeProto
from fintekkers.wrappers.models.security.tenor import Tenor
from fintekkers.wrappers.models.security.security_identifier import Identifier
from fintekkers.wrappers.models.security.product_type import ProductType
from fintekkers.wrappers.models.util.proto_serialization_utils import ProtoSerializationUtils

def test_unpack_string_value():
    # Create a StringValue proto
    string_value = wrappers_pb2.StringValue(value="test")
    any_value = Any()
    any_value.Pack(string_value)
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert result == "test"

def test_unpack_date_value():
    # Create a LocalDateProto
    date_proto = LocalDateProto(year=2023, month=1, day=1)
    any_value = Any()
    any_value.Pack(date_proto)
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert result == date(2023, 1, 1)

def test_unpack_int_value():
    # Create an Int32Value proto
    int_value = wrappers_pb2.Int32Value(value=42)
    any_value = Any()
    any_value.Pack(int_value)
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert result == 42

def test_unpack_bool_value():
    # Create a BoolValue proto
    bool_value = wrappers_pb2.BoolValue(value=True)
    any_value = Any()
    any_value.Pack(bool_value)
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert result is True

def test_unpack_double_value():
    # Create a DoubleValue proto
    double_value = wrappers_pb2.DoubleValue(value=3.14)
    any_value = Any()
    any_value.Pack(double_value)
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert isinstance(result, Decimal)
    assert float(result) == 3.14

def test_unpack_tenor_value():
    # Create a TenorProto
    tenor_proto = TenorProto(
        object_class="Tenor",
        version="0.0.1",
        tenor_type=TenorTypeProto.TERM,
        term_value="1Y6M"
    )
    any_value = Any()
    any_value.Pack(tenor_proto)
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert isinstance(result, Tenor)
    assert result.type == TenorTypeProto.TERM
    assert result.get_tenor_description() == "1Y6M"

def test_unpack_security_identifier_value():
    # Create an Identifier proto
    identifier = Identifier("ISIN", "US1234567890")
    any_value = Any()
    any_value.Pack(identifier.proto)
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert isinstance(result, Identifier)
    assert result.get_identifier_value() == "US1234567890"

@pytest.mark.skip(reason="ProductType serialization needs to be redesigned")
def test_unpack_product_type_value():
    # Create a SecurityTypeProto
    any_value = Any()
    any_value.Pack(SecurityTypeProto(BOND_SECURITY=True))
    
    # Test unpacking
    result = ProtoSerializationUtils.unpack_value(any_value)
    assert isinstance(result, ProductType)
    assert result == ProductType.BOND

def test_unpack_unknown_value():
    # Create a custom message type that's not in our known types
    class UnknownMessage:
        DESCRIPTOR = None
        def SerializeToString(self):
            return b"test"
    
    # Create an Any message with an unknown type
    any_value = Any()
    any_value.type_url = "type.googleapis.com/unknown.Message"
    any_value.value = b"test"
    
    # Test unpacking an unknown type
    try:
        ProtoSerializationUtils.unpack_value(any_value)
        assert False, "Should have raised ValueError"
    except ValueError:
        pass 