/**
 * LM-287: every JS service client gets its address from the per-service
 * lookup, so with the UI's environment (BROKER_HOST=127.0.0.1:8085,
 * API_URL=localhost) all of them, the price client included, call the broker
 * rather than ledger-service on localhost:8082.
 *
 * The generated *_grpc_pb clients are mocked, so no channel is opened.
 */

jest.mock('../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb', () => ({
  PortfolioClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/position-service/position_service_grpc_pb', () => ({
  PositionClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/price-service/price_service_grpc_pb', () => ({
  PriceClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/security-service/security_service_grpc_pb', () => ({
  SecurityClient: jest.fn(),
}));
jest.mock('../../fintekkers/services/transaction-service/transaction_service_grpc_pb', () => ({
  TransactionClient: jest.fn(),
}));

import * as grpc from '@grpc/grpc-js';
import { PortfolioClient } from '../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb';
import { PositionClient } from '../../fintekkers/services/position-service/position_service_grpc_pb';
import { PriceClient } from '../../fintekkers/services/price-service/price_service_grpc_pb';
import { SecurityClient } from '../../fintekkers/services/security-service/security_service_grpc_pb';
import { TransactionClient } from '../../fintekkers/services/transaction-service/transaction_service_grpc_pb';
import { PortfolioService } from './portfolio-service/PortfolioService';
import { PositionService } from './position-service/PositionService';
import { PriceService } from './price-service/PriceService';
import { SecurityService } from './security-service/SecurityService';
import { TransactionService } from './transaction-service/TransactionService';
import LinkResolver from '../util/link-resolver';

// Every variable the lookup reads; each test starts with none of them set.
const LOOKUP_VARS = [
  'BROKER_HOST',
  'API_URL',
  ...['BROKER', 'LEDGER', 'VALUATION', 'PRICE'].flatMap((p) => [`${p}_SERVICE_HOST`, `${p}_SERVICE_PORT`]),
];
const saved = LOOKUP_VARS.map((k) => process.env[k]);

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  LOOKUP_VARS.forEach((k) => setEnv(k, undefined));
});

afterEach(() => {
  LOOKUP_VARS.forEach((k, i) => setEnv(k, saved[i]));
  jest.restoreAllMocks();
});

// [name, wrapper, generated client, port with only API_URL=localhost]
const clients: Array<[string, new (apiKey?: string) => unknown, unknown, number]> = [
  ['PriceService', PriceService, PriceClient, 8083],
  ['SecurityService', SecurityService, SecurityClient, 8082],
  ['TransactionService', TransactionService, TransactionClient, 8082],
  ['PortfolioService', PortfolioService, PortfolioClient, 8082],
  ['PositionService', PositionService, PositionClient, 8082],
];

function onlyCall(Client: unknown): unknown[] {
  const mock = Client as jest.Mock;
  expect(mock).toHaveBeenCalledTimes(1);
  return mock.mock.calls[0];
}

function sentMetadata(interceptor: grpc.Interceptor): grpc.Metadata {
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
  const call = interceptor({} as grpc.InterceptorOptions, jest.fn(() => fakeNextCall));
  call.start(new grpc.Metadata(), {});
  expect(nextStart).toHaveBeenCalledTimes(1);
  return nextStart.mock.calls[0][0] as grpc.Metadata;
}

describe.each(clients)('%s', (_name, Wrapper, Client, apiUrlPort) => {
  describe('with BROKER_HOST=127.0.0.1:8085 and API_URL=localhost', () => {
    beforeEach(() => {
      setEnv('BROKER_HOST', '127.0.0.1:8085');
      setEnv('API_URL', 'localhost');
    });

    test('targets the broker over an insecure channel', () => {
      const insecure = jest.spyOn(grpc.credentials, 'createInsecure');
      const ssl = jest.spyOn(grpc.credentials, 'createSsl');

      new Wrapper();

      const [address, credentials] = onlyCall(Client);
      expect(address).toBe('127.0.0.1:8085');
      expect(address).not.toBe('localhost:8082');
      expect(insecure).toHaveBeenCalledTimes(1);
      expect(credentials).toBe(insecure.mock.results[0].value);
      expect(ssl).not.toHaveBeenCalled();
    });

    test('with an API key, targets the broker and sends x-api-key', () => {
      const ssl = jest.spyOn(grpc.credentials, 'createSsl');

      new Wrapper('k');

      const [address, , options] = onlyCall(Client);
      expect(address).toBe('127.0.0.1:8085');
      expect(ssl).not.toHaveBeenCalled();
      const { interceptors } = options as { interceptors: grpc.Interceptor[] };
      expect(interceptors).toHaveLength(1);
      expect(sentMetadata(interceptors[0]).get('x-api-key')).toEqual(['k']);
    });
  });

  test(`with only API_URL=localhost, targets localhost:${apiUrlPort}`, () => {
    setEnv('API_URL', 'localhost');

    new Wrapper();

    const [address] = onlyCall(Client);
    expect(address).toBe(`localhost:${apiUrlPort}`);
  });

  test('a client built after the environment changes uses the new address', () => {
    setEnv('BROKER_HOST', '127.0.0.1:8085');
    new Wrapper();
    expect(onlyCall(Client)[0]).toBe('127.0.0.1:8085');

    (Client as jest.Mock).mockClear();
    setEnv('BROKER_HOST', 'broker.example:9000');
    new Wrapper();
    expect(onlyCall(Client)[0]).toBe('broker.example:9000');
  });
});

describe('PortfolioService.url', () => {
  test('is a getter, read on every access', () => {
    expect(typeof Object.getOwnPropertyDescriptor(PortfolioService, 'url')?.get).toBe('function');

    setEnv('BROKER_HOST', '127.0.0.1:8085');
    expect(PortfolioService.url).toBe('127.0.0.1:8085');
    setEnv('BROKER_HOST', 'broker.example:9000');
    expect(PortfolioService.url).toBe('broker.example:9000');
  });
});

describe('LinkResolver default clients', () => {
  test('target the broker', () => {
    setEnv('BROKER_HOST', '127.0.0.1:8085');
    setEnv('API_URL', 'localhost');

    new LinkResolver();

    for (const Client of [SecurityClient, PortfolioClient, TransactionClient]) {
      expect(onlyCall(Client)[0]).toBe('127.0.0.1:8085');
    }
  });
});
