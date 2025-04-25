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
export { LocalDate };
