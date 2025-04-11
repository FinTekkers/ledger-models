import pytest
import grpc
from typing import Type
from fintekkers.wrappers.services.base_service import BaseService
from fintekkers.wrappers.services.util.Environment import EnvConfig

def check_service_connection(service_class: Type[BaseService]) -> bool:
    """
    Helper function to check if a service is running.
    
    Args:
        service_class: The service class to check
        
    Returns:
        bool: True if the service is running, False otherwise
    """
    try:
        service = service_class()
        # Try a simple operation to test connection
        if hasattr(service, 'get_fields'):
            service.get_fields()
        return True
    except grpc._channel._InactiveRpcError:
        print(f"\nERROR: {service_class.__name__} is not running at {EnvConfig.api_url()}")
        print("Please start the service before running these tests.")
        return False
    except Exception as e:
        print(f"\nERROR: Could not connect to {service_class.__name__} at {EnvConfig.api_url()}")
        print(f"Error details: {str(e)}")
        return False

def service_connection_required(service_class: Type[BaseService]):
    """
    Decorator to skip tests if the required service is not running.
    
    Args:
        service_class: The service class that must be running for the test
        
    Returns:
        function: A pytest decorator that skips the test if the service is not running
    """
    return pytest.mark.skipif(
        not check_service_connection(service_class),
        reason=f"{service_class.__name__} is not running"
    ) 