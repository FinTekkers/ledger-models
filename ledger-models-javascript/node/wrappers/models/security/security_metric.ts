/**
 * Dated security metrics (LM-482): shares outstanding, NAV per share and
 * total net assets, read through an installed SecurityMetricFetcher.
 *
 * `Security.getSecurityMetric` and `Security.getSecurityMetricSeries` call the
 * installed fetcher only; they make no network call of their own. There is no
 * default fetcher: with none installed they reject with
 * SecurityMetricFetcherMissingError. They are async, like `hydrate()`, because
 * the gRPC stubs a production fetcher wraps are async. See
 * docs/adr/security_metric.md.
 */
import type { SecurityMetricTypeProto } from "../../../fintekkers/models/security/security_metric_type_pb";
import type { LocalDate } from "../utils/date";
import type { UUID } from "../utils/uuid";

/**
 * One observation: the value and the date it is for. `observationDate` is the
 * observation's own date, which may be earlier than the date asked for. An
 * unknown value has no observation: absent is never 0.
 */
export interface SecurityMetricObservation {
  /** The canonical decimal string (as `toCanonicalString` gives), never a float. */
  value: string;
  observationDate: LocalDate;
}

/**
 * Where the metric helpers read observations from. Production installs an
 * adapter over the SecurityMetric gRPC service; tests install a fake.
 */
export interface SecurityMetricFetcher {
  /** The observation with the latest observation date on or before `date`, or null when there is none. */
  latest(securityId: UUID, metric: SecurityMetricTypeProto, date: LocalDate): Promise<SecurityMetricObservation | null>;
  /** The observations with observation date in [from, to], inclusive. */
  series(securityId: UUID, metric: SecurityMetricTypeProto, from: LocalDate, to: LocalDate): Promise<SecurityMetricObservation[]>;
}

/** No SecurityMetricFetcher is installed. */
export class SecurityMetricFetcherMissingError extends Error {
  constructor() {
    super("No SecurityMetricFetcher installed: call setSecurityMetricFetcher(...)");
    this.name = "SecurityMetricFetcherMissingError";
    Object.setPrototypeOf(this, SecurityMetricFetcherMissingError.prototype);
  }
}

let securityMetricFetcher: SecurityMetricFetcher | null = null;

/** Install the fetcher the metric helpers read from. Process-wide. */
export function setSecurityMetricFetcher(fetcher: SecurityMetricFetcher): void {
  securityMetricFetcher = fetcher;
}

/** Remove the installed fetcher; the helpers reject again. */
export function clearSecurityMetricFetcher(): void {
  securityMetricFetcher = null;
}

/** The installed fetcher. Throws SecurityMetricFetcherMissingError when there is none. */
export function requireSecurityMetricFetcher(): SecurityMetricFetcher {
  if (securityMetricFetcher === null) throw new SecurityMetricFetcherMissingError();
  return securityMetricFetcher;
}

/** Negative, zero or positive as `a` is before, on or after `b`. */
export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  const pa = a.toProto();
  const pb = b.toProto();
  return pa.getYear() - pb.getYear() || pa.getMonth() - pb.getMonth() || pa.getDay() - pb.getDay();
}
