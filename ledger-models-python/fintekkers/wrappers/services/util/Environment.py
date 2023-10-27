import grpc

#Insure local channel
LOCAL_CHANNEL = grpc.insecure_channel('127.0.0.1:8082')
#Secure channel using SSL with default credentials
PROD_CHANNEL = grpc.secure_channel('api.fintekkers.org:8082', grpc.ssl_channel_credentials())
CHANNEL = LOCAL_CHANNEL

from grpc import _channel

def get_channel() -> _channel.Channel:
    return CHANNEL

