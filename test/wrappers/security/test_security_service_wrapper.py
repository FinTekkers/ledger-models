import pytest
from google.protobuf import any_pb2
from google.protobuf import wrappers_pb2

from fintekkers.models.position.field_pb2 import FieldProto
from fintekkers.models.util.local_date_pb2 import LocalDateProto
from fintekkers.wrappers.services.security import SecurityService
from test.conftest import check_service_connection, service_connection_required


@service_connection_required(SecurityService)
def test_get_fields():
    service = SecurityService()
    fields = service.get_fields()
    
    # Print the fields we're getting for debugging
    print("\nReceived fields:", fields)
    
    # Verify we get some fields back
    assert len(fields) > 0
    print(f"{len(fields)} fields returned")
    
    # Verify some common fields are present - using the field names
    field_names = fields.names()
    assert "SECURITY_ID" in field_names
    assert "ASSET_CLASS" in field_names
    # Temporarily comment out SECURITY_TYPE check until server supports it
    # assert "SECURITY_TYPE" in field_names


@service_connection_required(SecurityService)
def test_get_field_values():
    service = SecurityService()
    values = service.get_field_values(FieldProto.ASSET_CLASS)
    
    # Verify we get some values back
    assert len(values) > 0
    
    # Print the asset classes we're getting for debugging
    print("\nReceived asset classes:", values)
    
    # Verify some common asset classes are present
    assert "Fixed Income" in values
    assert "Equity" in values
    assert "Cash" in values


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
    for date in valid_dates:
        assert isinstance(date, LocalDateProto)
        assert date.year > 1900  # Basic sanity check
        assert 1 <= date.month <= 12
        assert 1 <= date.day <= 31 