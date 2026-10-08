import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { DateTime } from 'luxon';
declare class ZonedDateTime {
    private proto;
    /**
     * Wraps a LocalTimestampProto.
     *
     * Throws ModelValidationError (field `local_timestamp.time_zone`) if
     * `time_zone` is empty/whitespace — luxon's DateTime would
     * otherwise silently produce an invalid DateTime (isValid=false,
     * year=NaN), which propagates as silent corruption rather than a clear
     * failure. See second-brain#276 for the original report from
     * backend-dev-ledger during #268 verification.
     *
     * Callers with optional/unset timestamps should gate
     * `new ZonedDateTime(parent.getAsOf())` with a `parent.hasAsOf()`
     * check at the call site rather than relying on the constructor to
     * substitute a default.
     */
    constructor(proto: LocalTimestampProto);
    /**
     * Wraps a required timestamp. Never substitutes a default
     * (second-brain#276). Throws ModelValidationError naming `fieldPath` when
     * `proto` is unset, or `${fieldPath}.time_zone` when the zone is blank.
     */
    static fromRequired(proto: LocalTimestampProto | undefined, fieldPath: string): ZonedDateTime;
    private static requireTimeZone;
    getTimezone(): string;
    getSeconds(): number;
    getNanoSeconds(): number;
    toDateTime(): DateTime;
    toString(): string;
    toProto(): LocalTimestampProto;
    /**
     * Creates a ZonedDateTime from a JavaScript Date object
     * @param date - The Date object to convert
     * @returns A new ZonedDateTime instance with America/New_York timezone
     */
    static from(date: Date): ZonedDateTime;
    static now(): ZonedDateTime;
}
export { ZonedDateTime };
