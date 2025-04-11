import pytest
import grpc
from typing import Type
from fintekkers.wrappers.services.base_service import BaseService
from fintekkers.wrappers.services.util.Environment import EnvConfig
def check_service_connection(service_class: Type[BaseService]) -> bool:
    try:
        service = service_class()
        if hasattr(service, "get_fields"):
            service.get_fields()
        return True
    except grpc._channel._InactiveRpcError:
        print(f"ERROR: {service_class.__name__} is not running at {EnvConfig.api_url()}")
        print("Please start the service before running these tests.")
        return False
    except Exception as e:
        print(f"ERROR: Could not connect to {service_class.__name__} at {EnvConfig.api_url()}")
        print(f"Error details: {str(e)}")
        return False
def service_connection_required(service_class: Type[BaseService]):
    return pytest.mark.skipif(
        not check_service_connection(service_class),
        reason=f"{service_class.__name__} is not running"
    )
