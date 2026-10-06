/**
 * Unit tests for Issue #114: API key support in EnvConfig.
 *
 * No network access: grpc-js credential factories are spied on and the
 * metadata generator / interceptor are invoked directly.
 */

import * as grpc from '@grpc/grpc-js';
import EnvConfig, { InsecureChannelAuthError } from './requestcontext';

const savedApiUrl = process.env.API_URL;
const savedApiKey = process.env.API_KEY;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  restoreEnv('API_URL', undefined);
  restoreEnv('API_KEY', undefined);
});

afterEach(() => {
  restoreEnv('API_URL', savedApiUrl);
  restoreEnv('API_KEY', savedApiKey);
  jest.restoreAllMocks();
});

describe('EnvConfig.apiURL', () => {
  test('uses API_URL as-is when it includes a port', () => {
    process.env.API_URL = 'localhost:80';
    expect(EnvConfig.apiURL).toBe('localhost:80');
  });

  test('appends :8082 when API_URL has no port', () => {
    process.env.API_URL = 'localhost';
    expect(EnvConfig.apiURL).toBe('localhost:8082');
  });

  test('defaults to api.fintekkers.org:8082 when API_URL is unset', () => {
    expect(EnvConfig.apiURL).toBe('api.fintekkers.org:8082');
  });
});

describe('EnvConfig.apiKey', () => {
  test('returns API_KEY when set', () => {
    process.env.API_KEY = 'k';
    expect(EnvConfig.apiKey).toBe('k');
  });

  test('returns undefined when unset, without throwing', () => {
    expect(() => EnvConfig.apiKey).not.toThrow();
    expect(EnvConfig.apiKey).toBeUndefined();
  });
});

describe('EnvConfig.apiCredentials', () => {
  test.each(['localhost:80', '127.0.0.1:8085'])('uses insecure credentials for %s', (url) => {
    process.env.API_URL = url;
    const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
    const ssl = jest.spyOn(grpc.credentials, 'createSsl');

    EnvConfig.apiCredentials;

    expect(insecure).toHaveBeenCalledTimes(1);
    expect(ssl).not.toHaveBeenCalled();
  });

  test('uses SSL credentials when API_URL is unset', () => {
    const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
    const ssl = jest.spyOn(grpc.credentials, 'createSsl');

    EnvConfig.apiCredentials;

    expect(ssl).toHaveBeenCalledTimes(1);
    expect(insecure).not.toHaveBeenCalled();
  });
});

describe('EnvConfig.getAuthenticatedCredentials', () => {
  test('metadata generator injects x-api-key', () => {
    const generatorSpy = jest.spyOn(grpc.credentials, 'createFromMetadataGenerator');

    const creds = EnvConfig.getAuthenticatedCredentials('k');

    expect(creds).toBeInstanceOf(grpc.ChannelCredentials);
    expect(generatorSpy).toHaveBeenCalledTimes(1);

    const generator = generatorSpy.mock.calls[0][0];
    const callback = jest.fn();
    generator({ service_url: 'https://api.fintekkers.org:8082' }, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    const [err, metadata] = callback.mock.calls[0];
    expect(err).toBeNull();
    expect((metadata as grpc.Metadata).get('x-api-key')).toEqual(['k']);
  });

  test.each(['localhost:80', '127.0.0.1:8085'])(
    'throws InsecureChannelAuthError without leaking the key for %s',
    (url) => {
      process.env.API_URL = url;
      const secret = 'dummy-secret-123';

      let caught: unknown;
      try {
        EnvConfig.getAuthenticatedCredentials(secret);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(InsecureChannelAuthError);
      const err = caught as Error;
      expect(err.message).not.toContain(secret);
      expect(String(err)).not.toContain(secret);
    }
  );

  test('never logs the key', () => {
    const secret = 'dummy-secret-123';
    const spies = [
      jest.spyOn(console, 'log').mockImplementation(() => {}),
      jest.spyOn(console, 'warn').mockImplementation(() => {}),
      jest.spyOn(console, 'error').mockImplementation(() => {}),
    ];
    const generatorSpy = jest.spyOn(grpc.credentials, 'createFromMetadataGenerator');

    EnvConfig.getAuthenticatedCredentials(secret);
    generatorSpy.mock.calls[0][0]({ service_url: '' }, () => {});
    process.env.API_URL = 'localhost:80';
    EnvConfig.getAuthenticatedClientOptions(secret);

    for (const spy of spies) {
      for (const args of spy.mock.calls) {
        expect(args.map(String).join(' ')).not.toContain(secret);
      }
    }
  });
});

describe('EnvConfig.getAuthenticatedClientOptions', () => {
  test.each(['localhost:80', '127.0.0.1:8085'])('uses insecure channel for %s', (url) => {
    process.env.API_URL = url;
    const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
    const ssl = jest.spyOn(grpc.credentials, 'createSsl');

    const { interceptors } = EnvConfig.getAuthenticatedClientOptions('k');

    expect(insecure).toHaveBeenCalledTimes(1);
    expect(ssl).not.toHaveBeenCalled();
    expect(interceptors).toHaveLength(1);
  });

  test('uses SSL channel for api.fintekkers.org', () => {
    process.env.API_URL = 'api.fintekkers.org';
    const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
    const ssl = jest.spyOn(grpc.credentials, 'createSsl');

    const { interceptors } = EnvConfig.getAuthenticatedClientOptions('k');

    expect(ssl).toHaveBeenCalledTimes(1);
    expect(insecure).not.toHaveBeenCalled();
    expect(interceptors).toHaveLength(0);
  });

  test('local interceptor injects x-api-key on start', () => {
    process.env.API_URL = 'localhost:80';
    const { interceptors } = EnvConfig.getAuthenticatedClientOptions('k');

    const nextStart = jest.fn();
    const fakeNextCall = {
      start: nextStart,
      cancelWithStatus: jest.fn(),
      getPeer: jest.fn(),
      sendMessageWithContext: jest.fn(),
      sendMessage: jest.fn(),
      startRead: jest.fn(),
      halfClose: jest.fn(),
      setCredentials: jest.fn(),
    } as unknown as grpc.InterceptingCall;
    const nextCall = jest.fn(() => fakeNextCall);

    const call = interceptors[0]({} as grpc.InterceptorOptions, nextCall);
    call.start(new grpc.Metadata(), {});

    expect(nextStart).toHaveBeenCalledTimes(1);
    const sentMetadata = nextStart.mock.calls[0][0] as grpc.Metadata;
    expect(sentMetadata.get('x-api-key')).toEqual(['k']);
  });
});
