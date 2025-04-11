import pytest
from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.wrappers.models.position.field_wrapper import FieldWrapper, FieldList, wrap_fields

def test_field_wrapper():
    # Test creating a field wrapper
    field = FieldWrapper(FieldProto.ASSET_CLASS)
    
    # Test name property
    assert field.name == "ASSET_CLASS"
    
    # Test value property
    assert field.value == FieldProto.ASSET_CLASS
    
    # Test string representation
    assert str(field) == "ASSET_CLASS"
    assert repr(field) == "FieldWrapper(ASSET_CLASS)"


def test_field_list():
    # Create a list of fields
    fields = [FieldProto.ASSET_CLASS, FieldProto.SECURITY_ID, FieldProto.ID]
    field_list = FieldList(fields)
    
    # Test length
    assert len(field_list) == 3
    
    # Test indexing
    assert field_list[0].name == "ASSET_CLASS"
    assert field_list[1].name == "SECURITY_ID"
    assert field_list[2].name == "ID"
    
    # Test iteration
    field_names = [field.name for field in field_list]
    assert field_names == ["ASSET_CLASS", "SECURITY_ID", "ID"]
    
    # Test names method
    assert field_list.names() == ["ASSET_CLASS", "SECURITY_ID", "ID"]
    
    # Test values method
    assert field_list.values() == [FieldProto.ASSET_CLASS, FieldProto.SECURITY_ID, FieldProto.ID]
    
    # Test string representation
    assert str(field_list) == "ASSET_CLASS, SECURITY_ID, ID"
    assert repr(field_list) == "FieldList([ASSET_CLASS, SECURITY_ID, ID])"


def test_wrap_fields():
    # Test wrapping a list of fields
    fields = [FieldProto.ASSET_CLASS, FieldProto.SECURITY_ID]
    wrapped_fields = wrap_fields(fields)
    
    # Verify it returns a FieldList
    assert isinstance(wrapped_fields, FieldList)
    
    # Verify the fields are wrapped correctly
    assert wrapped_fields[0].name == "ASSET_CLASS"
    assert wrapped_fields[1].name == "SECURITY_ID" 