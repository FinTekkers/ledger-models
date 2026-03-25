"use strict";
/**
 * Unit tests for Issue #114: all wrapper services accept optional apiKey constructor param.
 *
 * These tests do NOT require a running gRPC server — they only verify that the
 * constructor does not throw and that the client is created.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const PortfolioService_1 = require("./portfolio-service/PortfolioService");
const PositionService_1 = require("./position-service/PositionService");
const PriceService_1 = require("./price-service/PriceService");
const SecurityService_1 = require("./security-service/SecurityService");
const TransactionService_1 = require("./transaction-service/TransactionService");
// No server connection is made in constructors — gRPC connects lazily.
// API_URL is not set so it defaults to api.fintekkers.org:8082.
describe('PortfolioService', () => {
    test('zero-arg constructor succeeds', () => {
        expect(() => new PortfolioService_1.PortfolioService()).not.toThrow();
    });
    test('constructor with apiKey succeeds', () => {
        expect(() => new PortfolioService_1.PortfolioService('test-api-key')).not.toThrow();
    });
});
describe('PositionService', () => {
    test('zero-arg constructor succeeds', () => {
        expect(() => new PositionService_1.PositionService()).not.toThrow();
    });
    test('constructor with apiKey succeeds', () => {
        expect(() => new PositionService_1.PositionService('test-api-key')).not.toThrow();
    });
});
describe('PriceService', () => {
    test('zero-arg constructor succeeds', () => {
        expect(() => new PriceService_1.PriceService()).not.toThrow();
    });
    test('constructor with apiKey succeeds', () => {
        expect(() => new PriceService_1.PriceService('test-api-key')).not.toThrow();
    });
});
describe('SecurityService', () => {
    test('zero-arg constructor succeeds', () => {
        expect(() => new SecurityService_1.SecurityService()).not.toThrow();
    });
    test('constructor with apiKey succeeds', () => {
        expect(() => new SecurityService_1.SecurityService('test-api-key')).not.toThrow();
    });
});
describe('TransactionService', () => {
    test('zero-arg constructor succeeds', () => {
        expect(() => new TransactionService_1.TransactionService()).not.toThrow();
    });
    test('constructor with apiKey succeeds', () => {
        expect(() => new TransactionService_1.TransactionService('test-api-key')).not.toThrow();
    });
});
//# sourceMappingURL=apikey.test.js.map