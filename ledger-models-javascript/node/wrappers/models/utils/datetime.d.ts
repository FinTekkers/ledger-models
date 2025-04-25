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
    static now(): ZonedDateTime;
}
export { ZonedDateTime };
