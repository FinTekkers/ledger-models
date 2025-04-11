import pytest
from google.protobuf import any_pb2
from google.protobuf import wrappers_pb2
from datetime import date

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.security.tenor_type_pb2 import TenorTypeProto
from fintekkers.wrappers.services.security import SecurityService
from conftest import check_service_connection, service_connection_required


@service_connection_required(SecurityService)
def test_get_fields():
    service = SecurityService()
    fields = service.get_fields()
    
    # Verify we get some fields back
    assert len(fields) > 0
    
    # Print the fields we're getting for debugging
    print("\nReceived fields:", [f.name for f in fields])
    
    # Verify that we got some expected fields
    field_names = [f.name for f in fields]
    assert "SECURITY_ID" in field_names
    assert "PRODUCT_TYPE" in field_names


@service_connection_required(SecurityService)
def test_get_field_values():
    service = SecurityService()
    values = service.get_field_values(FieldProto.PRODUCT_TYPE)
    
    # Verify we get some values back
    assert len(values) > 0
    
    # Print the values we're getting for debugging
    print("\nReceived product types:", values)
    
    # Verify that we got some expected values
    assert any(str(v).startswith("BOND") for v in values)


@service_connection_required(SecurityService)
def test_get_issue_date_values():
    service = SecurityService()
    values = service.get_field_values(FieldProto.ISSUE_DATE)
    
    # Verify we get some values back
    assert len(values) > 0
    
    # Print the dates we're getting for debugging
    print("\nReceived issue dates:", [(d.year, d.month, d.day) for d in values])
    
    # Filter out the default date (1900-01-01) and verify remaining dates
    valid_dates = [d for d in values if d.year > 1900]
    assert len(valid_dates) > 0, "No valid dates found (all dates are 1900-01-01)"
    
    # Verify that we got valid dates
    for d in valid_dates:
        assert isinstance(d, date), f"Expected date object, got {type(d)}"
        assert d.year >= 1900 and d.year <= 2100, f"Invalid year: {d.year}"
        assert d.month >= 1 and d.month <= 12, f"Invalid month: {d.month}"
        assert d.day >= 1 and d.day <= 31, f"Invalid day: {d.day}" 