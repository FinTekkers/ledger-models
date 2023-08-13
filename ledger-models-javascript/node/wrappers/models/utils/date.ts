import { assert } from 'console';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';

class LocalDate {
  private proto: LocalDateProto;

  constructor(proto: LocalDateProto) {
    this.proto = proto;
  }

  toDate(): Date {
    return new Date(this.proto.getYear(), this.proto.getMonth(), this.proto.getDay());
  }

  toString(): string {
    return this.proto.getYear() + '-' + this.proto.getMonth() + '-' + this.proto.getDay();
  }

  toProto(): LocalDateProto {
    return this.proto;
  }

  static today(): LocalDate {
    const today = new Date();
    return new LocalDate(
      new LocalDateProto().setYear(today.getFullYear()).setMonth(today.getMonth()).setDay(today.getDate())
    );
  }
}

export { LocalDate };