import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { DateTime } from 'luxon';
declare class ZonedDateTime {
    private proto;
    constructor(proto: LocalTimestampProto);
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
