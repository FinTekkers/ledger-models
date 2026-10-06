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

  private static get isLocalURL(): boolean {
    return /^localhost|^127\.0\.0\.1/.test(this.apiURL);
  }

  static get apiCredentials(): grpc.ChannelCredentials {
    if (this.isLocalURL) {
      return grpc.credentials.createInsecure();
    }
    else {
      return grpc.credentials.createSsl();
    }
  }

  private static addApiKey(metadata: grpc.Metadata, apiKey: string): void {
    metadata.add('x-api-key', apiKey);
  }

  /**
   * Returns SSL channel credentials combined with per-call credentials that
   * inject `x-api-key: <apiKey>` into every call's metadata.
   *
   * Remote (SSL) hosts only: grpc-js cannot compose call credentials with
   * insecure channel credentials. For localhost / 127.0.0.1 use
   * {@link EnvConfig.getAuthenticatedClientOptions}, which sends the key via
   * an interceptor instead.
   *
   * @throws {InsecureChannelAuthError} when apiURL is localhost / 127.0.0.1.
   */
  static getAuthenticatedCredentials(apiKey: string): grpc.ChannelCredentials {
    if (this.isLocalURL) {
      throw new InsecureChannelAuthError();
    }
    const callCreds = grpc.credentials.createFromMetadataGenerator(
      (_params, callback) => {
        const metadata = new grpc.Metadata();
        EnvConfig.addApiKey(metadata, apiKey);
        callback(null, metadata);
      }
    );
    return grpc.credentials.combineChannelCredentials(
      grpc.credentials.createSsl(),
      callCreds
    );
  }

  /**
   * Returns credentials and interceptors for authenticated calls.
   * For local (insecure) channels, injects the API key via an interceptor.
   * For remote (SSL) channels, uses {@link EnvConfig.getAuthenticatedCredentials}.
   */
  static getAuthenticatedClientOptions(apiKey: string): {
    credentials: grpc.ChannelCredentials;
    interceptors: grpc.Interceptor[];
  } {
    if (this.isLocalURL) {
      const interceptor: grpc.Interceptor = (_options, nextCall) => {
        return new grpc.InterceptingCall(nextCall(_options), {
          start(metadata: grpc.Metadata, listener: grpc.Listener, next: Function) {
            EnvConfig.addApiKey(metadata, apiKey);
            next(metadata, listener);
          }
        });
      };
      return { credentials: grpc.credentials.createInsecure(), interceptors: [interceptor] };
    }
    return {
      credentials: EnvConfig.getAuthenticatedCredentials(apiKey),
      interceptors: []
    };
  }
}

/**
 * Thrown by EnvConfig.getAuthenticatedCredentials when API_URL points at an
 * insecure (local) channel. The message never includes the API key.
 */
export class InsecureChannelAuthError extends Error {
  constructor() {
    super('API key auth over an insecure channel requires getAuthenticatedClientOptions()');
    this.name = 'InsecureChannelAuthError';
    Object.setPrototypeOf(this, InsecureChannelAuthError.prototype);
  }
}

export default EnvConfig;
