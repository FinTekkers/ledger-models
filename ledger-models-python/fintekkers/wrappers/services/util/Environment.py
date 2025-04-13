import grpc
import os

# Load environment variables from .env file
from dotenv import load_dotenv

load_dotenv()


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
    def api_url():
        url = EnvConfig.get_env_var('API_URL', EnvConfig.default_api_url) + ":8082"
        return url

    @staticmethod
    def get_channel() -> grpc.Channel:
        url = EnvConfig.api_url()

        if "localhost" in url or "127.0.0.1" in url:
            return grpc.insecure_channel(url)
        else:
            return grpc.secure_channel(url, grpc.ssl_channel_credentials())
