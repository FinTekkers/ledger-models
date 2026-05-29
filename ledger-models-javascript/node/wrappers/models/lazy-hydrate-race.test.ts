// Concurrent-hydrate race test for Portfolio + Transaction wrappers.
// TypeScript has no shared-state threads, but Promise.all + a mock LinkResolver
// covers the same shape: N parallel `await wrapper.hydrate()` calls on
// wrappers that share a UUID. Contract:
//
//   1. Resolver's in-flight dedup collapses N hydrate() calls into one RPC.
//   2. Every awaiter sees the resolved proto.
//   3. The shared LinkCache singleton ends on the resolved entry.

import LinkResolver from "../util/link-resolver";
import * as LinkCacheModule from "../util/link-cache";
import Portfolio from "./portfolio/portfolio";
import Transaction from "./transaction/transaction";
import { UUID } from "./utils/uuid";

import { PortfolioProto } from "../../fintekkers/models/portfolio/portfolio_pb";
import { TransactionProto } from "../../fintekkers/models/transaction/transaction_pb";
import { LocalTimestampProto } from "../../fintekkers/models/util/local_timestamp_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { QueryPortfolioResponseProto } from "../../fintekkers/requests/portfolio/query_portfolio_response_pb";
import { QueryTransactionResponseProto } from "../../fintekkers/requests/transaction/query_transaction_response_pb";

function makeAsOf(seconds = 1_700_000_000): LocalTimestampProto {
  const ts = new Timestamp();
  ts.setSeconds(seconds);
  ts.setNanos(0);
  const lt = new LocalTimestampProto();
  lt.setTimestamp(ts);
  lt.setTimeZone("UTC");
  return lt;
}

interface CallLog {
  count: number;
}

function mockPortfolioClient(resolved: PortfolioProto, log: CallLog) {
  return {
    getByIds: (
      _req: any,
      cb: (err: Error | null, res: QueryPortfolioResponseProto) => void,
    ) => {
      log.count++;
      const r = new QueryPortfolioResponseProto();
      r.setPortfolioResponseList([resolved]);
      setImmediate(() => cb(null, r));
    },
  } as any;
}

function mockTransactionClient(resolved: TransactionProto, log: CallLog) {
  return {
    getByIds: (
      _req: any,
      cb: (err: Error | null, res: QueryTransactionResponseProto) => void,
    ) => {
      log.count++;
      const r = new QueryTransactionResponseProto();
      r.setTransactionResponseList([resolved]);
      setImmediate(() => cb(null, r));
    },
  } as any;
}

// Throw-on-call client for the unused entity types.
function throwingClient(name: string) {
  return {
    getByIds: () => {
      throw new Error(`${name} client should not be invoked in this test`);
    },
  } as any;
}

describe("lazy hydrate — concurrent hydrate() collapses to one RPC", () => {
  beforeEach(() => {
    LinkCacheModule.SECURITY.clear();
    LinkCacheModule.PORTFOLIO.clear();
    LinkCacheModule.TRANSACTION.clear();
    LinkResolver.setDefault(undefined);
  });

  test("Portfolio: 16 concurrent hydrate() calls → 1 RPC, all observe RESOLVED", async () => {
    const uuid = UUID.random();
    const asOf = makeAsOf();

    const resolved = new PortfolioProto();
    resolved.setUuid(uuid.toUUIDProto());
    resolved.setAsOf(asOf);
    resolved.setIsLink(false);
    resolved.setPortfolioName("RESOLVED");

    const log: CallLog = { count: 0 };
    const resolver = new LinkResolver({
      portfolioClient: mockPortfolioClient(resolved, log),
      securityClient: throwingClient("security"),
      transactionClient: throwingClient("transaction"),
    });

    // Build 16 wrappers from the same link-mode proto.
    const linkProto = new PortfolioProto();
    linkProto.setUuid(uuid.toUUIDProto());
    linkProto.setAsOf(asOf);
    linkProto.setIsLink(true);
    const wrappers = Array.from({ length: 16 }, () => new Portfolio(linkProto));

    const hydrated = await Promise.all(wrappers.map((w) => w.hydrate(resolver)));

    expect(log.count).toBe(1);
    for (const w of hydrated) {
      expect(w.getPortfolioName()).toBe("RESOLVED");
    }
  });

  test("Transaction: 16 concurrent hydrate() calls → 1 RPC, all observe resolved trade name", async () => {
    const uuid = UUID.random();
    const asOf = makeAsOf();

    const resolved = new TransactionProto();
    resolved.setUuid(uuid.toUUIDProto());
    resolved.setAsOf(asOf);
    resolved.setIsLink(false);
    resolved.setTradeName("RESOLVED-TRADE");

    const log: CallLog = { count: 0 };
    const resolver = new LinkResolver({
      transactionClient: mockTransactionClient(resolved, log),
      securityClient: throwingClient("security"),
      portfolioClient: throwingClient("portfolio"),
    });

    const linkProto = new TransactionProto();
    linkProto.setUuid(uuid.toUUIDProto());
    linkProto.setAsOf(asOf);
    linkProto.setIsLink(true);
    const wrappers = Array.from({ length: 16 }, () => new Transaction(linkProto));

    const hydrated = await Promise.all(wrappers.map((w) => w.hydrate(resolver)));

    expect(log.count).toBe(1);
    for (const w of hydrated) {
      expect(w.proto.getTradeName()).toBe("RESOLVED-TRADE");
    }
  });
});
