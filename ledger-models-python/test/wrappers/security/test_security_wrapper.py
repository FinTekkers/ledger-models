from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.security.security_pb2 import SecurityProto
from fintekkers.models.security.security_type_pb2 import SecurityTypeProto
from fintekkers.models.security.security_quantity_type_pb2 import SecurityQuantityTypeProto
from fintekkers.wrappers.models.security import Security
from fintekkers.wrappers.models.security.product_type import ProductType
from datetime import datetime
import pytest

def test_security_wrapper():
    # Test data from the original test
    protos = [
        SecurityProto.FromString(
            b"\n\x08Security\x12\x050.0.1*\x12\n\x10\xb6H\x9du\x91,@\x9b\xa9 \xe4:\x83\xd5#B2\x16\n\x02\x08\x01\x12\x10America/New_YorkP\x03Z\x0cFixed Incomeb\rUS Governmentj\x82\x01\n\x08Security\x12\x050.0.1*\x12\n\x10\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x012\x1f\n\x0b\x08\x80\x99\xf4\xfb\x8d\xff\xff\xff\xff\x01\x12\x10America/New_YorkP\x01Z\x04Cashb\x03USDp\x03\xc2\x02\x1a\n\nIdentifier\x12\x050.0.1*\x03USD02\xca\x02\x03USD\x92\x03\x07CASHUSDp\x01\xc2\x02 \n\nIdentifier\x12\x050.0.1*\t912796Y290\x03\xe2\x03\x05R\x030.0\xe8\x03\x03\xf0\x03\x05\x82\x04\x08R\x061000.0\x8a\x04\x07\x08\xe7\x0f\x10\x01\x18\x1a\x92\x04\x07\x08\xe7\x0f\x10\x07\x18\x1b"
        ),
    ]

    for proto in protos:
        security = Security(proto)

        # Test get_fields()
        fields = security.get_fields()
        assert len(fields) > 0
        assert FieldProto.ID in fields
        assert FieldProto.SECURITY_ID in fields
        assert FieldProto.AS_OF in fields
        assert FieldProto.ASSET_CLASS in fields
        assert FieldProto.IDENTIFIER in fields

        # Test get_field() for each field type
        for field in fields:
            value = security.get_field(field)
            assert value is not None

        # Test specific field getters
        assert isinstance(security.get_id(), str)  # UUID
        assert isinstance(security.get_as_of(), datetime)
        assert security.get_asset_class() == "Fixed Income"
        assert security.get_product_class() == "Security"
        assert security.get_product_type() == ProductType.BOND
        assert security.get_issuer() == "US Government"
        assert security.get_security_type() == SecurityTypeProto.BOND_SECURITY
        assert security.get_quantity_type() == SecurityQuantityTypeProto.UNITS
        assert not security.is_cash()

        # Test string representation
        assert str(security) == "ID[CUSIP:912796Y29], Security[US Government]"

        # Test equality and comparison
        assert security == security  # self equality
        assert hash(security) == hash(security)  # hash consistency

def test_security_wrapper_with_missing_fields():
    # Create a minimal SecurityProto with only required fields
    proto = SecurityProto()
    proto.object_class = "Security"
    proto.version = "0.0.1"
    proto.issuer_name = "Test Issuer"
    
    security = Security(proto)
    
    # Test default values for missing fields
    assert security.get_asset_class() == "Unclassified"
    assert security.get_product_class() == "Security"
    assert security.get_product_type() == ProductType.UNCLASSIFIED
    assert security.get_description() == "Security[Test Issuer]"
    assert security.get_security_id() is None
    assert security.get_issue_date() is None
    assert security.get_maturity_date() is None
    assert security.get_settlement_currency() is None

def test_security_wrapper_field_mapping():
    proto = SecurityProto()
    proto.object_class = "Security"
    proto.version = "0.0.1"
    proto.issuer_name = "Test Issuer"
    proto.asset_class = "Test Asset Class"
    proto.description = "Test Description"
    
    security = Security(proto)
    
    # Test field mapping
    assert security.get_field(FieldProto.SECURITY_ISSUER_NAME) == "Test Issuer"
    assert security.get_field(FieldProto.ASSET_CLASS) == "Test Asset Class"
    assert security.get_field(FieldProto.SECURITY_DESCRIPTION) == "Test Description"
    
    # Test invalid field
    with pytest.raises(ValueError, match="Field not mapped in Security wrapper"):
        security.get_field(999)  # Invalid field number
