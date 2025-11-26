import grpc
import os
from enum import Enum

# Load environment variables from .env file
from dotenv import load_dotenv

load_dotenv()


class ServiceType(Enum):
    BROKER = "80"
    SECURITY_SERVICE = "8082"
    LEDGER_SERVICE = "8082"
    TRANSACTION_SERVICE = "8082"
    PORTFOLIO_SERVICE = "8082"
    VALUATION_SERVICE = "8080"
    PRICE_SERVICE = "8083"


class EnvConfig:
    default_api_url = "api.fintekkers.org"
    
    @staticmethod
    def get_env_var(key, default=None):
        value = os.environ.get(key)
        if value is None:
            if default is None:
                raise ValueError(f"Environment variable {key} is not set.")
            return default
        return value

    @staticmethod
    def api_key():
        raise NotImplementedError("API keys not supported currently.")
        # return EnvConfig.get_env_var('API_KEY')

    @staticmethod
    def api_url(service_type: ServiceType = None):
        base_url = EnvConfig.get_env_var('API_URL', EnvConfig.default_api_url)
        
        # If running on localhost, service type must be explicitly provided
        is_localhost = "localhost" in base_url or "127.0.0.1" in base_url
        
        if service_type is None:
            if is_localhost:
                raise ValueError(
                    f"When running on localhost ({base_url}), service_type must be explicitly provided. "
                    f"Available service types: {[st.name for st in ServiceType]}"
                )
            # Default to BROKER for non-localhost environments
            service_type = ServiceType.BROKER
        
        return f"{base_url}:{service_type.value}"

    @staticmethod
    def get_channel(service_type: ServiceType = ServiceType.BROKER) -> grpc.Channel:
        url = EnvConfig.api_url(service_type)

        if "localhost" in url or "127.0.0.1" in url:
            return grpc.insecure_channel(url)
        else:
            return grpc.secure_channel(url, grpc.ssl_channel_credentials())
