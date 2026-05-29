// End-to-end perf bench for Transaction wrapper lazy hydration.
// Run: `npx jest node/wrappers/models/lazy-hydrate.bench.ts` (jest runs
// .ts files via ts-jest; stdout shows the bench output).

import * as LinkCacheModule from "../util/link-cache";
import Transaction from "./transaction/transaction";
import { UUID } from "./utils/uuid";

import { PortfolioProto } from "../../fintekkers/models/portfolio/portfolio_pb";
import { TransactionProto } from "../../fintekkers/models/transaction/transaction_pb";
import { LocalTimestampProto } from "../../fintekkers/models/util/local_timestamp_pb";
import { ZonedDateTime } from "./utils/datetime";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

const SIZES = [10, 100, 1_000, 10_000];

function makeAsOf(): LocalTimestampProto {
  const ts = new Timestamp();
  ts.setSeconds(1_700_000_000);
  ts.setNanos(0);
  const lt = new LocalTimestampProto();
  lt.setTimestamp(ts);
  lt.setTimeZone("UTC");
  return lt;
}

function runBench(n: number) {
  const asOf = makeAsOf();
  const asOfZdt = new ZonedDateTime(asOf);
  const links: TransactionProto[] = [];
  const txnUuids: string[] = [];
  const portUuids: string[] = [];

  for (let i = 0; i < n; i++) {
    const txnUuid = UUID.random();
    const portUuid = UUID.random();
    txnUuids.push(txnUuid.toString());
    portUuids.push(portUuid.toString());

    const resolvedPortfolio = new PortfolioProto();
    resolvedPortfolio.setUuid(portUuid.toUUIDProto());
    resolvedPortfolio.setAsOf(asOf);
    resolvedPortfolio.setIsLink(false);
    resolvedPortfolio.setPortfolioName(`P-${portUuid.toString().slice(0, 8)}`);

    const resolved = new TransactionProto();
    resolved.setUuid(txnUuid.toUUIDProto());
    resolved.setAsOf(asOf);
    resolved.setIsLink(false);
    resolved.setTradeName(`T-${txnUuid.toString().slice(0, 8)}`);
    resolved.setPortfolio(resolvedPortfolio);

    LinkCacheModule.TRANSACTION.put(txnUuid.toString(), resolved, asOfZdt);
    LinkCacheModule.PORTFOLIO.put(portUuid.toString(), resolvedPortfolio, asOfZdt);

    const link = new TransactionProto();
    link.setUuid(txnUuid.toUUIDProto());
    link.setAsOf(asOf);
    link.setIsLink(true);
    links.push(link);
  }

  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;
  const t0 = process.hrtime.bigint();
  let sink = 0;
  for (const link of links) {
    const t = new Transaction(link);
    // Trigger lazy hydrate via getter that calls ensureHydrated.
    const name = t.proto.getIsLink() ? "" : t.proto.getTradeName();
    // Workaround: TS wrappers' ensureHydrated is private and accessors
    // on Transaction are reads through proto. Hit a typed accessor:
    const portfolio = t.getPortfolio();
    if (portfolio) sink++;
    if (name === "" && portfolio) sink++;
  }
  const t1 = process.hrtime.bigint();
  const heapAfter = process.memoryUsage().heapUsed;

  const elapsedNs = Number(t1 - t0);
  const elapsedMs = elapsedNs / 1e6;
  const perOpUs = elapsedNs / n / 1000;
  const heapDeltaKb = (heapAfter - heapBefore) / 1024;

  // eslint-disable-next-line no-console
  console.log(
    `N=${n.toString().padStart(6)}  elapsed=${elapsedMs.toFixed(2).padStart(9)} ms  ` +
    `per_op=${perOpUs.toFixed(2).padStart(8)} us  ` +
    `heap_delta=${heapDeltaKb.toFixed(2).padStart(8)} KiB  reads=${sink}`
  );

  for (const u of txnUuids) LinkCacheModule.TRANSACTION.evict(u);
  for (const u of portUuids) LinkCacheModule.PORTFOLIO.evict(u);
}

// Wrap in describe so jest treats it as a suite; the test body is the bench.
describe("lazy-hydrate bench", () => {
  test("Transaction across 10/100/1000/10000 sizes", () => {
    // eslint-disable-next-line no-console
    console.log("# ts bench: lazy-hydrate Transaction via pre-warmed LinkCache");
    for (const n of SIZES) runBench(n);
  }, 60_000);
});
