import * as dotenv from 'dotenv';
dotenv.config();

import * as grpc from '@grpc/grpc-js';

class EnvConfig {
  private static getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is not set.`);
      }
      return defaultValue;
    }
    return value;
  }

  static get apiKey(): string | undefined {
    return process.env['API_KEY'];
  }

  /**
   * Returns the URL for the backend GRPC service. It will default to
   * api.fintekkers.org:8082 if the environment variable is not set. If
   * API_URL already includes a port (e.g. localhost:8083), it is used as-is;
   * otherwise :8082 is appended for backward compatibility.
   */
  static get apiURL(): string {
    const base = EnvConfig.getEnvVar('API_URL', 'api.fintekkers.org');
    return /:\d+$/.test(base) ? base : base + ':8082';
  }

  static get apiCredentials(): grpc.ChannelCredentials {
    if (/^localhost|^127\.0\.0\.1/.test(this.apiURL)) {
      return grpc.credentials.createInsecure();
    }
    else {
      return grpc.credentials.createSsl();
    }
  }

  /**
   * Returns channel credentials that inject `x-api-key: <apiKey>` into every
   * call's metadata. Uses insecure transport for localhost, SSL otherwise.
   */
  /**
   * Returns credentials and interceptors for authenticated calls.
   * For local (insecure) channels, injects the API key via an interceptor.
   * For remote (SSL) channels, uses combined channel + call credentials.
   */
  static getAuthenticatedClientOptions(apiKey: string): {
    credentials: grpc.ChannelCredentials;
    interceptors: grpc.Interceptor[];
  } {
    const isLocal = /^localhost|^127\.0\.0\.1/.test(this.apiURL);
    if (isLocal) {
      const interceptor: grpc.Interceptor = (_options, nextCall) => {
        return new grpc.InterceptingCall(nextCall(_options), {
          start(metadata: grpc.Metadata, listener: grpc.Listener, next: Function) {
            metadata.add('x-api-key', apiKey);
            next(metadata, listener);
          }
        });
      };
      return { credentials: grpc.credentials.createInsecure(), interceptors: [interceptor] };
    }
    const callCreds = grpc.credentials.createFromMetadataGenerator(
      (_params, callback) => {
        const metadata = new grpc.Metadata();
        metadata.add('x-api-key', apiKey);
        callback(null, metadata);
      }
    );
    return {
      credentials: grpc.credentials.combineChannelCredentials(
        grpc.credentials.createSsl(),
        callCreds
      ),
      interceptors: []
    };
  }
}

export default EnvConfig;
