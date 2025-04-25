import { PortfolioProto } from "../../../fintekkers/models/portfolio/portfolio_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";
declare class Portfolio {
    proto: PortfolioProto;
    constructor(proto: PortfolioProto);
    toString(): string;
    getID(): UUID;
    getAsOf(): ZonedDateTime;
    getPortfolioName(): string;
    getFields(): FieldProto[];
    getField(field: FieldProto): any;
}
export default Portfolio;
