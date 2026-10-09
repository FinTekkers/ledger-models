import grpc
import os
from enum import Enum

from fintekkers.wrappers.services.util.service_address import Endpoint, Service, resolve

# Load environment variables from .env file
from dotenv import load_dotenv

load_dotenv()


class ServiceType(Enum):
    # Values are the standard ports, as in Java ServiceAddress. The four
    # ledger names share "8082", so Python makes them aliases of one member.
    BROKER = "8085"
    SECURITY_SERVICE = "8082"
    LEDGER_SERVICE = "8082"
    TRANSACTION_SERVICE = "8082"
    PORTFOLIO_SERVICE = "8082"
    VALUATION_SERVICE = "8080"
    PRICE_SERVICE = "8083"


# ServiceType value -> the lookup's Service. All 8082 names are one member.
_SERVICES = {
    ServiceType.BROKER: Service.BROKER,
    ServiceType.SECURITY_SERVICE: Service.SECURITY,
    ServiceType.VALUATION_SERVICE: Service.VALUATION,
    ServiceType.PRICE_SERVICE: Service.PRICE,
}


def _to_service(service_type: ServiceType) -> Service:
    return _SERVICES[service_type]


class EnvConfig:
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
    def endpoint(service_type: ServiceType = None) -> Endpoint:
        """Where ``service_type`` lives: BROKER_HOST, then
        <SERVICE>_SERVICE_HOST/_PORT, then API_URL, then localhost (see
        service_address). No service type means the broker."""
        if service_type is None:
            service_type = ServiceType.BROKER
        return resolve(_to_service(service_type))

    @staticmethod
    def api_url(service_type: ServiceType = None) -> str:
        """``host:port`` of ``service_type``; the broker when omitted."""
        return EnvConfig.endpoint(service_type).target

    @staticmethod
    def get_channel(service_type: ServiceType = ServiceType.BROKER) -> grpc.Channel:
        endpoint = EnvConfig.endpoint(service_type)

        if endpoint.plaintext:
            return grpc.insecure_channel(endpoint.target)
        else:
            return grpc.secure_channel(endpoint.target, grpc.ssl_channel_credentials())
