/**
 * Bond day-count conventions (LM-498). Same rules in Java / Rust / Python /
 * JS-TS. See docs/adr/day_count_convention.md; the DayCountConventionProto
 * comments are the spec.
 *
 * Two halves that change for different reasons:
 *
 * - The resolver (resolveDayCount) picks a bond's convention: an explicit
 *   BondDetailsProto.day_count other than UNKNOWN_DAY_COUNT wins, else the
 *   default_day_count entry of ledger-models-protos/hierarchy.json for the
 *   security's product_type (deepest node on the parent chain wins), else
 *   UNKNOWN_DAY_COUNT. It never throws for a product with no entry and never
 *   guesses a convention. A broken section throws on first use, like
 *   default_price_types.
 * - The date helpers (dayCount, yearFraction, icma*) are plain date
 *   arithmetic on the calendar date of each luxon DateTime. They never read
 *   hierarchy.json, so a broken registry cannot break them. Results are
 *   numbers: fine for fractions, not for decimal cash amounts. Bad input
 *   throws ModelValidationError.
 */
import type { DateTime } from 'luxon';
import hierarchy from '../../../../hierarchy.json';
import { DayCountConventionProto } from '../../../fintekkers/models/security/day_count_convention_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import type { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ModelValidationError, violation } from '../errors';
import { allProductTypes, parentOf } from './product_hierarchy';

const SECTION = 'default_day_count';
const UNKNOWN = 'UNKNOWN_DAY_COUNT';
const CONVENTIONS = DayCountConventionProto as unknown as Record<string, DayCountConventionProto>;

function hasOwn(o: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, key);
}

// ---------- resolver: hierarchy.json default_day_count ----------

function bad(detail: string): Error {
  return new Error(`hierarchy.json ${SECTION}: ${detail}`);
}

/** A parsed, checked default_day_count section: node -> DayCountConventionProto value. */
export class DefaultDayCounts {
  /** node -> convention, as written in the section. Read-only. */
  readonly entries: ReadonlyMap<string, DayCountConventionProto>;

  constructor(entries: Map<string, DayCountConventionProto>) {
    const frozen = new Map(entries);
    const readOnly = (): never => { throw new TypeError('DefaultDayCounts entries are read-only'); };
    frozen.set = readOnly;
    frozen.delete = readOnly;
    frozen.clear = readOnly;
    this.entries = frozen;
  }

  /** The deepest entry on productType's parent chain, or UNKNOWN_DAY_COUNT. */
  defaultFor(productType: string): DayCountConventionProto {
    for (let node: string | null = productType; node !== null; node = parentOf(node)) {
      const conv = this.entries.get(node);
      if (conv !== undefined) return conv;
    }
    return DayCountConventionProto.UNKNOWN_DAY_COUNT;
  }
}

/**
 * Parses and checks a default_day_count section against the shipped
 * product_types tree and the DayCountConventionProto names. Throws when the
 * section is missing (undefined) or not an object, a key is not a
 * product_types node, or a value is not a DayCountConventionProto name or is
 * UNKNOWN_DAY_COUNT. Exported for tests.
 */
export function parseDefaultDayCount(section: unknown): DefaultDayCounts {
  if (section === undefined) throw bad('section missing from hierarchy.json');
  if (typeof section !== 'object' || section === null || Array.isArray(section)) {
    throw bad('section must be an object');
  }
  const productTypes = new Set(allProductTypes());
  const entries = new Map<string, DayCountConventionProto>();
  for (const [node, name] of Object.entries(section as Record<string, unknown>)) {
    if (!productTypes.has(node)) throw bad(`node '${node}' is not in product_types`);
    if (typeof name !== 'string' || !hasOwn(DayCountConventionProto, name)) {
      throw bad(`value ${JSON.stringify(name)} for node ${node} is not a DayCountConventionProto name`);
    }
    if (name === UNKNOWN) throw bad(`node ${node} must not default to ${UNKNOWN}`);
    entries.set(node, CONVENTIONS[name]);
  }
  return new DefaultDayCounts(entries);
}

let shipped: DefaultDayCounts | undefined;

/** The shipped default_day_count section, parsed and checked on first use. */
export function shippedDefaultDayCounts(): DefaultDayCounts {
  if (!shipped) {
    const root = hierarchy as Record<string, unknown>;
    shipped = parseDefaultDayCount(hasOwn(root, SECTION) ? root[SECTION] : undefined);
  }
  return shipped;
}

/**
 * The product default for the security's raw product_type, or
 * UNKNOWN_DAY_COUNT when it has none. A missing security reads as
 * PRODUCT_TYPE_UNKNOWN.
 */
export function defaultDayCountFor(security: SecurityProto | null | undefined): DayCountConventionProto {
  return shippedDefaultDayCounts().defaultFor(productTypeOf(security));
}

/**
 * The bond's convention: bond_details.day_count when set to anything but
 * UNKNOWN_DAY_COUNT, else the product default, else UNKNOWN_DAY_COUNT. Never
 * guesses: a number this build does not know (a newer writer's value) is
 * UNKNOWN_DAY_COUNT, not the product default.
 */
export function resolveDayCount(security: SecurityProto | null | undefined): DayCountConventionProto {
  const bond = security?.getBondDetails();
  if (bond && bond.hasDayCount()) {
    const explicit = bond.getDayCount();
    if (explicit !== undefined && explicit !== DayCountConventionProto.UNKNOWN_DAY_COUNT) {
      return isConvention(explicit) ? explicit : DayCountConventionProto.UNKNOWN_DAY_COUNT;
    }
  }
  return defaultDayCountFor(security);
}

function isConvention(value: number): boolean {
  return Object.values(CONVENTIONS).includes(value as DayCountConventionProto);
}

function productTypeOf(security: SecurityProto | null | undefined): string {
  const value = security ? security.getProductType() : ProductTypeProto.PRODUCT_TYPE_UNKNOWN;
  for (const [k, v] of Object.entries(ProductTypeProto)) {
    if (v === value) return k;
  }
  return String(value);
}

// ---------- date helpers: no registry access ----------

const MS_PER_DAY = 86_400_000;

/**
 * Days from start (excluded) to end (included) under the convention.
 * THIRTY_360_US applies the bond-basis rules; every other convention counts
 * actual calendar days. Throws ModelValidationError for UNKNOWN_DAY_COUNT (or
 * an unknown value), an invalid date or start > end.
 */
export function dayCount(convention: DayCountConventionProto, start: DateTime, end: DateTime): number {
  checkConvention(convention);
  checkOrder(start, end);
  if (convention === DayCountConventionProto.THIRTY_360_US) return thirty360Us(start, end);
  return actualDays(start, end);
}

/**
 * Years from start to end: days / 360 for THIRTY_360_US and ACT_360, days /
 * 365 for ACT_365_FIXED. ACT_ACT_ICMA needs the coupon period: use
 * icmaYearFraction (this throws ModelValidationError for it).
 */
export function yearFraction(convention: DayCountConventionProto, start: DateTime, end: DateTime): number {
  if (convention === DayCountConventionProto.ACT_ACT_ICMA) {
    throw invalid('convention', 'ACT_ACT_ICMA needs the coupon period: use icmaYearFraction');
  }
  const days = dayCount(convention, start, end);
  return convention === DayCountConventionProto.ACT_365_FIXED ? days / 365 : days / 360;
}

/**
 * ACT/ACT ICMA: actual days start -> end over actual days in the regular
 * coupon period that contains them. Throws ModelValidationError unless
 * periodStart <= start <= end <= periodEnd and periodStart < periodEnd.
 */
export function icmaPeriodFraction(start: DateTime, end: DateTime, periodStart: DateTime, periodEnd: DateTime): number {
  checkPeriod(start, end, periodStart, periodEnd);
  return actualDays(start, end) / actualDays(periodStart, periodEnd);
}

/**
 * ACT/ACT ICMA in years: days / (frequency x period days), frequency being
 * coupons a year (2 for semiannual). Throws ModelValidationError as
 * icmaPeriodFraction does, or when frequency is not a positive integer.
 */
export function icmaYearFraction(
  start: DateTime,
  end: DateTime,
  periodStart: DateTime,
  periodEnd: DateTime,
  frequency: number,
): number {
  if (!Number.isInteger(frequency) || frequency <= 0) {
    throw invalid('frequency', `frequency must be a positive number of coupons a year, got ${frequency}`);
  }
  return icmaPeriodFraction(start, end, periodStart, periodEnd) / frequency;
}

/** Calendar-date serial: the DateTime's own year, month and day, ignoring time and zone. */
function serial(d: DateTime): number {
  return Date.UTC(d.year, d.month - 1, d.day) / MS_PER_DAY;
}

function actualDays(start: DateTime, end: DateTime): number {
  return serial(end) - serial(start);
}

function thirty360Us(start: DateTime, end: DateTime): number {
  let d1 = start.day;
  let d2 = end.day;
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 >= 30) d2 = 30;
  return 360 * (end.year - start.year) + 30 * (end.month - start.month) + (d2 - d1);
}

function checkConvention(convention: DayCountConventionProto): void {
  if (convention === DayCountConventionProto.UNKNOWN_DAY_COUNT || !isConvention(convention)) {
    throw invalid('convention', `no day-count convention to apply (got ${convention})`);
  }
}

function checkDate(field: string, d: DateTime): void {
  if (!d || !d.isValid) throw invalid(field, `${field} must be a valid date`);
}

function checkOrder(start: DateTime, end: DateTime): void {
  checkDate('start', start);
  checkDate('end', end);
  if (serial(start) > serial(end)) {
    throw invalid('end', `start ${start.toISODate()} is after end ${end.toISODate()}`);
  }
}

function checkPeriod(start: DateTime, end: DateTime, periodStart: DateTime, periodEnd: DateTime): void {
  checkOrder(start, end);
  checkDate('period_start', periodStart);
  checkDate('period_end', periodEnd);
  if (serial(periodStart) >= serial(periodEnd)) {
    throw invalid('period_end',
      `period_start ${periodStart.toISODate()} must be before period_end ${periodEnd.toISODate()}`);
  }
  if (serial(start) < serial(periodStart) || serial(end) > serial(periodEnd)) {
    throw invalid('period_start', `${start.toISODate()} -> ${end.toISODate()} is outside the coupon period `
      + `${periodStart.toISODate()} -> ${periodEnd.toISODate()}`);
  }
}

function invalid(field: string, message: string): ModelValidationError {
  return new ModelValidationError([violation(field, undefined, message)]);
}
