/**
 * Unit tests for Issue #114: all wrapper services accept optional apiKey constructor param.
 *
 * These tests do NOT require a running gRPC server — they only verify that the
 * constructor does not throw and that the client is created.
 */

import { PortfolioService } from './portfolio-service/PortfolioService';
import { PositionService } from './position-service/PositionService';
import { PriceService } from './price-service/PriceService';
import { SecurityService } from './security-service/SecurityService';
import { TransactionService } from './transaction-service/TransactionService';

// No server connection is made in constructors — gRPC connects lazily.
// API_URL is not set so it defaults to api.fintekkers.org:8082.

describe('PortfolioService', () => {
  test('zero-arg constructor succeeds', () => {
    expect(() => new PortfolioService()).not.toThrow();
  });

  test('constructor with apiKey succeeds', () => {
    expect(() => new PortfolioService('test-api-key')).not.toThrow();
  });
});

describe('PositionService', () => {
  test('zero-arg constructor succeeds', () => {
    expect(() => new PositionService()).not.toThrow();
  });

  test('constructor with apiKey succeeds', () => {
    expect(() => new PositionService('test-api-key')).not.toThrow();
  });
});

describe('PriceService', () => {
  test('zero-arg constructor succeeds', () => {
    expect(() => new PriceService()).not.toThrow();
  });

  test('constructor with apiKey succeeds', () => {
    expect(() => new PriceService('test-api-key')).not.toThrow();
  });
});

describe('SecurityService', () => {
  test('zero-arg constructor succeeds', () => {
    expect(() => new SecurityService()).not.toThrow();
  });

  test('constructor with apiKey succeeds', () => {
    expect(() => new SecurityService('test-api-key')).not.toThrow();
  });
});

describe('TransactionService', () => {
  test('zero-arg constructor succeeds', () => {
    expect(() => new TransactionService()).not.toThrow();
  });

  test('constructor with apiKey succeeds', () => {
    expect(() => new TransactionService('test-api-key')).not.toThrow();
  });
});
