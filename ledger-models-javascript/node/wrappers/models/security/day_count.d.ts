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
import { DayCountConventionProto } from '../../../fintekkers/models/security/day_count_convention_pb';
import type { SecurityProto } from '../../../fintekkers/models/security/security_pb';
/** A parsed, checked default_day_count section: node -> DayCountConventionProto value. */
export declare class DefaultDayCounts {
    /** node -> convention, as written in the section. Read-only. */
    readonly entries: ReadonlyMap<string, DayCountConventionProto>;
    constructor(entries: Map<string, DayCountConventionProto>);
    /** The deepest entry on productType's parent chain, or UNKNOWN_DAY_COUNT. */
    defaultFor(productType: string): DayCountConventionProto;
}
/**
 * Parses and checks a default_day_count section against the shipped
 * product_types tree and the DayCountConventionProto names. Throws when the
 * section is missing (undefined) or not an object, a key is not a
 * product_types node, or a value is not a DayCountConventionProto name or is
 * UNKNOWN_DAY_COUNT. Exported for tests.
 */
export declare function parseDefaultDayCount(section: unknown): DefaultDayCounts;
/** The shipped default_day_count section, parsed and checked on first use. */
export declare function shippedDefaultDayCounts(): DefaultDayCounts;
/**
 * The product default for the security's raw product_type, or
 * UNKNOWN_DAY_COUNT when it has none. A missing security reads as
 * PRODUCT_TYPE_UNKNOWN.
 */
export declare function defaultDayCountFor(security: SecurityProto | null | undefined): DayCountConventionProto;
/**
 * The bond's convention: bond_details.day_count when set to anything but
 * UNKNOWN_DAY_COUNT, else the product default, else UNKNOWN_DAY_COUNT. Never
 * guesses: a number this build does not know (a newer writer's value) is
 * UNKNOWN_DAY_COUNT, not the product default.
 */
export declare function resolveDayCount(security: SecurityProto | null | undefined): DayCountConventionProto;
/**
 * Days from start (excluded) to end (included) under the convention.
 * THIRTY_360_US applies the bond-basis rules; every other convention counts
 * actual calendar days. Throws ModelValidationError for UNKNOWN_DAY_COUNT (or
 * an unknown value), an invalid date or start > end.
 */
export declare function dayCount(convention: DayCountConventionProto, start: DateTime, end: DateTime): number;
/**
 * Years from start to end: days / 360 for THIRTY_360_US and ACT_360, days /
 * 365 for ACT_365_FIXED. ACT_ACT_ICMA needs the coupon period: use
 * icmaYearFraction (this throws ModelValidationError for it).
 */
export declare function yearFraction(convention: DayCountConventionProto, start: DateTime, end: DateTime): number;
/**
 * ACT/ACT ICMA: actual days start -> end over actual days in the regular
 * coupon period that contains them. Throws ModelValidationError unless
 * periodStart <= start <= end <= periodEnd and periodStart < periodEnd.
 */
export declare function icmaPeriodFraction(start: DateTime, end: DateTime, periodStart: DateTime, periodEnd: DateTime): number;
/**
 * ACT/ACT ICMA in years: days / (frequency x period days), frequency being
 * coupons a year (2 for semiannual). Throws ModelValidationError as
 * icmaPeriodFraction does, or when frequency is not a positive integer.
 */
export declare function icmaYearFraction(start: DateTime, end: DateTime, periodStart: DateTime, periodEnd: DateTime, frequency: number): number;
