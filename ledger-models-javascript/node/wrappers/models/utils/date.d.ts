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
export { LocalDate, localDateProtoToDate, dateToLocalDateProto };
