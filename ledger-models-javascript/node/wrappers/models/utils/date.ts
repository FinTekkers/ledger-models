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
    return ProtoSerializationUtil.deserialize(this.proto);
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

export { LocalDate };