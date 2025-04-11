import grpc
from typing import Any, Generator, List
from fintekkers.wrappers.services.util.Environment import EnvConfig

class BaseService:
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.api_url = EnvConfig.api_url()
        print(f"{service_name} connecting to: {self.api_url}")
        try:
            self.stub = self._create_stub()
        except Exception as e:
            self._handle_connection_error(e)
            raise

    def _create_stub(self) -> Any:
        """To be implemented by subclasses to create their specific stub"""
        raise NotImplementedError("Subclasses must implement _create_stub")

    def _handle_connection_error(self, error: Exception) -> None:
        """Handle connection errors with a consistent error message format"""
        print(f"\nERROR: Could not connect to {self.service_name} at {self.api_url}")
        print("Please ensure the service is running and accessible.")
        print(f"Error details: {str(error)}")

    def _handle_operation_error(self, error: Exception, operation: str) -> None:
        """Handle operation errors with a consistent error message format"""
        print(f"\nERROR: Error during {operation} operation with {self.service_name} at {self.api_url}")
        print(f"Error details: {str(error)}")

    def _execute_operation(self, operation: str, func: callable, *args, **kwargs) -> Any:
        """Execute an operation with consistent error handling"""
        try:
            return func(*args, **kwargs)
        except Exception as e:
            self._handle_operation_error(e, operation)
            raise

    def _execute_streaming_operation(self, operation: str, func: callable, *args, **kwargs) -> Generator[Any, None, None]:
        """Execute a streaming operation with consistent error handling"""
        try:
            responses = func(*args, **kwargs)
            try:
                while not responses._is_complete():
                    yield responses.next()
            except StopIteration:
                pass
            except Exception as e:
                self._handle_operation_error(e, operation)
                raise
            finally:
                responses.cancel()
        except Exception as e:
            self._handle_operation_error(e, operation)
            raise 