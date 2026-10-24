import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
declare class LocalDate {
    private proto;
    constructor(proto: LocalDateProto);
    toDate(): Date;
    toString(): string;
    toProto(): LocalDateProto;
    static today(): LocalDate;
    static from(date: Date): LocalDate;
}
/**
 * Convert a LocalDateProto to a native Date, or null when the proto is
 * undefined/null. Hours/min/sec/ms are zeroed so equality comparisons across
 * accessors are deterministic. Months are translated from proto's 1-based
 * convention to JavaScript's 0-based Date constructor.
 */
declare function localDateProtoToDate(proto: LocalDateProto | undefined | null): Date | null;
/**
 * Convert a native Date to a LocalDateProto. Translates JS's 0-based month
 * to the proto's 1-based convention; year/day pass through.
 */
declare function dateToLocalDateProto(d: Date): LocalDateProto;
/**
 * `d` plus `months` calendar months at local midnight, clamped to the end of
 * the target month as Java's `LocalDate.plusMonths` does: Jan 31 + 1 month is
 * Feb 28 (Feb 29 in a leap year), not Mar 3 as `setMonth` gives. Reads and
 * writes local date parts, like `localDateProtoToDate`.
 */
declare function plusMonthsClamped(d: Date, months: number): Date;
/** `d` plus `days` calendar days at local midnight, from local date parts. */
declare function plusDays(d: Date, days: number): Date;
/**
 * Calendar days from `start` to `end`, negative when `end` is earlier.
 * Counts from the local date parts through `Date.UTC`, so a DST change
 * between the two dates cannot shift the count.
 */
declare function daysBetween(start: Date, end: Date): number;
export { LocalDate, localDateProtoToDate, dateToLocalDateProto, plusMonthsClamped, plusDays, daysBetween };
