import * as dotenv from 'dotenv';
dotenv.config();

import * as grpc from '@grpc/grpc-js';

import { Service, resolve, target } from '../../util/serviceaddress';

class EnvConfig {
  static get apiKey(): string | undefined {
    return process.env['API_KEY'];
  }

  /**
   * Returns the `host:port` of the ledger service, found the same way as
   * every other service: `BROKER_HOST`, then `LEDGER_SERVICE_HOST`/`_PORT`,
   * then `API_URL` (with :8082 unless it carries a port), then
   * localhost:8082. Clients should prefer {@link EnvConfig.urlFor}.
   */
  static get apiURL(): string {
    return EnvConfig.urlFor(Service.SECURITY);
  }

  /** Returns the `host:port` a client for `service` connects to. */
  static urlFor(service: Service): string {
    return target(resolve(service));
  }

  private static isPlaintext(service: Service): boolean {
    return resolve(service).plaintext;
  }

  /** Channel credentials for {@link EnvConfig.apiURL}. */
  static get apiCredentials(): grpc.ChannelCredentials {
    return EnvConfig.credentialsFor(Service.SECURITY);
  }

  /** Insecure credentials for a loopback address, SSL otherwise. */
  static credentialsFor(service: Service): grpc.ChannelCredentials {
    if (EnvConfig.isPlaintext(service)) {
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
   * @throws {InsecureChannelAuthError} when the address of `service` is
   * localhost / 127.0.0.1.
   */
  static getAuthenticatedCredentials(apiKey: string, service: Service = Service.SECURITY): grpc.ChannelCredentials {
    if (EnvConfig.isPlaintext(service)) {
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
   * Returns credentials and interceptors for authenticated calls to `service`.
   * For local (insecure) channels, injects the API key via an interceptor.
   * For remote (SSL) channels, uses {@link EnvConfig.getAuthenticatedCredentials}.
   */
  static getAuthenticatedClientOptions(apiKey: string, service: Service = Service.SECURITY): {
    credentials: grpc.ChannelCredentials;
    interceptors: grpc.Interceptor[];
  } {
    if (EnvConfig.isPlaintext(service)) {
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
      credentials: EnvConfig.getAuthenticatedCredentials(apiKey, service),
      interceptors: []
    };
  }
}

/**
 * Thrown by EnvConfig.getAuthenticatedCredentials when the service address is
 * an insecure (local) channel. The message never includes the API key.
 */
export class InsecureChannelAuthError extends Error {
  constructor() {
    super('API key auth over an insecure channel requires getAuthenticatedClientOptions()');
    this.name = 'InsecureChannelAuthError';
    Object.setPrototypeOf(this, InsecureChannelAuthError.prototype);
  }
}

export default EnvConfig;
