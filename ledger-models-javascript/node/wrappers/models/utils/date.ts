import { assert } from 'console';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { ProtoSerializationUtil } from './serialization';

class LocalDate {
  private proto: LocalDateProto;

  constructor(proto: LocalDateProto) {
    this.proto = proto;
  }

  toDate(): Date {
    //Use the deserialization class which correctly handles month indexing
    //mismatch between Javascript date and other languages, and the proto definition
    //In the Proto 2 means Februrary, but in Javascript it will be read as March
    return ProtoSerializationUtil.deserialize(this.proto) as Date;
  }

  toString(): string {
    return this.proto.getYear() + '-' + this.proto.getMonth() + '-' + this.proto.getDay();
  }

  toProto(): LocalDateProto {
    return this.proto;
  }

  static today(): LocalDate {
    const today = new Date();
    return this.from(today);
  }

  static from(date: Date): LocalDate {
    return new LocalDate(
      new LocalDateProto().setYear(date.getFullYear()).setMonth(date.getMonth() + 1).setDay(date.getDate())
    );
  }
}

/**
 * Convert a LocalDateProto to a native Date, or null when the proto is
 * undefined/null. Hours/min/sec/ms are zeroed so equality comparisons across
 * accessors are deterministic. Months are translated from proto's 1-based
 * convention to JavaScript's 0-based Date constructor.
 */
function localDateProtoToDate(proto: LocalDateProto | undefined | null): Date | null {
  if (!proto) return null;
  const d = new Date(proto.getYear(), proto.getMonth() - 1, proto.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Convert a native Date to a LocalDateProto. Translates JS's 0-based month
 * to the proto's 1-based convention; year/day pass through.
 */
function dateToLocalDateProto(d: Date): LocalDateProto {
  return new LocalDateProto()
    .setYear(d.getFullYear())
    .setMonth(d.getMonth() + 1)
    .setDay(d.getDate());
}

/**
 * `d` plus `months` calendar months at local midnight, clamped to the end of
 * the target month as Java's `LocalDate.plusMonths` does: Jan 31 + 1 month is
 * Feb 28 (Feb 29 in a leap year), not Mar 3 as `setMonth` gives. Reads and
 * writes local date parts, like `localDateProtoToDate`.
 */
function plusMonthsClamped(d: Date, months: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay));
}

/** `d` plus `days` calendar days at local midnight, from local date parts. */
function plusDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/**
 * Calendar days from `start` to `end`, negative when `end` is earlier.
 * Counts from the local date parts through `Date.UTC`, so a DST change
 * between the two dates cannot shift the count.
 */
function daysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

export { LocalDate, localDateProtoToDate, dateToLocalDateProto, plusMonthsClamped, plusDays, daysBetween };