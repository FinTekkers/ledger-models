/**
 * Unit tests for Issue #114: each wrapper service hands the generated gRPC
 * client the authenticated credentials when given an apiKey, and
 * EnvConfig.apiCredentials otherwise.
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
import EnvConfig from '../models/utils/requestcontext';
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

const cases: Array<[string, new (apiKey?: string) => unknown, unknown]> = [
  ['PortfolioService', PortfolioService, PortfolioClient],
  ['PositionService', PositionService, PositionClient],
  ['PriceService', PriceService, PriceClient],
  ['SecurityService', SecurityService, SecurityClient],
  ['TransactionService', TransactionService, TransactionClient],
];

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe.each(cases)('%s', (_name, Service, Client) => {
  const ClientMock = Client as jest.Mock;

  test('with apiKey, client gets the authenticated credentials', () => {
    const sentinel = {
      credentials: grpc.credentials.createInsecure(),
      interceptors: [] as grpc.Interceptor[],
    };
    const authSpy = jest
      .spyOn(EnvConfig, 'getAuthenticatedClientOptions')
      .mockReturnValue(sentinel);

    new Service('k');

    expect(authSpy).toHaveBeenCalledWith('k');
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledWith(
      EnvConfig.apiURL,
      sentinel.credentials,
      { interceptors: sentinel.interceptors }
    );
  });

  test('zero-arg constructor constructs with EnvConfig.apiCredentials', () => {
    const plain = grpc.credentials.createInsecure();
    jest.spyOn(EnvConfig, 'apiCredentials', 'get').mockReturnValue(plain);
    const authSpy = jest.spyOn(EnvConfig, 'getAuthenticatedClientOptions');

    expect(new Service()).toBeDefined();

    expect(authSpy).not.toHaveBeenCalled();
    expect(ClientMock).toHaveBeenCalledTimes(1);
    expect(ClientMock).toHaveBeenCalledWith(EnvConfig.apiURL, plain);
  });
});
