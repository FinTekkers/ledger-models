// Performance-regression guard for the Transaction wrapper's lazy-hydrate
// read path (pre-warmed cache hit). Mirrors LazyHydratePerfGuard.java.
//
// Baseline: ~2.57 µs/op at N=10000 (steady state) on a Mac Mini M-series.
// Default ceiling = baseline + 15% headroom = 2.96 µs/op.
//
// Override via env var LAZY_HYDRATE_PERF_CEILING_US for slower CI hardware.

import * as LinkCacheModule from "../util/link-cache";
import Transaction from "./transaction/transaction";
import { UUID } from "./utils/uuid";

import { PortfolioProto } from "../../fintekkers/models/portfolio/portfolio_pb";
import { TransactionProto } from "../../fintekkers/models/transaction/transaction_pb";
import { LocalTimestampProto } from "../../fintekkers/models/util/local_timestamp_pb";
import { ZonedDateTime } from "./utils/datetime";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

const N = 10_000;
const DEFAULT_CEILING_US = 2.96; // 2.57 * 1.15

function readCeilingUs(): number {
  const raw = process.env.LAZY_HYDRATE_PERF_CEILING_US;
  if (!raw) return DEFAULT_CEILING_US;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_CEILING_US;
}

function makeAsOf(): LocalTimestampProto {
  const ts = new Timestamp();
  ts.setSeconds(1_700_000_000);
  ts.setNanos(0);
  const lt = new LocalTimestampProto();
  lt.setTimestamp(ts);
  lt.setTimeZone("UTC");
  return lt;
}

function runOnce(): number {
  const asOf = makeAsOf();
  const asOfZdt = new ZonedDateTime(asOf);
  const links: TransactionProto[] = [];
  const txnUuids: string[] = [];
  const portUuids: string[] = [];

  for (let i = 0; i < N; i++) {
    const txnUuid = UUID.random();
    const portUuid = UUID.random();
    txnUuids.push(txnUuid.toString());
    portUuids.push(portUuid.toString());

    const resolvedPort = new PortfolioProto();
    resolvedPort.setUuid(portUuid.toUUIDProto());
    resolvedPort.setAsOf(asOf);
    resolvedPort.setIsLink(false);
    resolvedPort.setPortfolioName(`P-${portUuid.toString().slice(0, 8)}`);

    const resolved = new TransactionProto();
    resolved.setUuid(txnUuid.toUUIDProto());
    resolved.setAsOf(asOf);
    resolved.setIsLink(false);
    resolved.setTradeName(`T-${txnUuid.toString().slice(0, 8)}`);
    resolved.setPortfolio(resolvedPort);

    LinkCacheModule.TRANSACTION.put(txnUuid.toString(), resolved, asOfZdt);
    LinkCacheModule.PORTFOLIO.put(portUuid.toString(), resolvedPort, asOfZdt);

    const link = new TransactionProto();
    link.setUuid(txnUuid.toUUIDProto());
    link.setAsOf(asOf);
    link.setIsLink(true);
    links.push(link);
  }

  if (global.gc) global.gc();
  const t0 = process.hrtime.bigint();
  let sink = 0;
  for (const link of links) {
    const t = new Transaction(link);
    // Trigger ensureHydrated by hitting an accessor that calls it.
    const portfolio = t.getPortfolio();
    if (portfolio) sink++;
  }
  const t1 = process.hrtime.bigint();
  expect(sink).toBe(N);

  for (const u of txnUuids) LinkCacheModule.TRANSACTION.evict(u);
  for (const u of portUuids) LinkCacheModule.PORTFOLIO.evict(u);

  return Number(t1 - t0) / N / 1000;
}

describe("lazy-hydrate perf guard", () => {
  test("per_op_stays_within_15pct_of_baseline_at_n_10000", () => {
    const ceilingUs = readCeilingUs();
    // Warmup
    runOnce();
    const perOpUs = runOnce();
    // eslint-disable-next-line no-console
    console.log(
      `LazyHydratePerfGuard (ts): N=${N}  per_op=${perOpUs.toFixed(2)} us  ` +
      `ceiling=${ceilingUs.toFixed(2)} us`
    );
    expect(perOpUs).toBeLessThanOrEqual(ceilingUs);
  }, 60_000);
});
