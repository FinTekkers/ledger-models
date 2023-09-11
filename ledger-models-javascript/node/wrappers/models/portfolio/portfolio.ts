import { PortfolioProto } from "../../../fintekkers/models/portfolio/portfolio_pb";
import { FieldProto } from "../../../fintekkers/models/position/field_pb";
import { ZonedDateTime } from "../utils/datetime";
import { UUID } from "../utils/uuid";

class Portfolio {
    proto: PortfolioProto;

    constructor(proto: PortfolioProto) {
        this.proto = proto;
    }

    // getProto(): PortfolioProto {
    //     return this.proto;
    // }

    getID(): UUID {
        return UUID.fromU8Array(this.proto.getUuid().getRawUuid_asU8());
    }

    getAsOf(): ZonedDateTime {
        return new ZonedDateTime(this.proto.getAsOf());
    }

    getPortfolioName(): string {
        return this.proto.getPortfolioName();
    }

    getFields(): FieldProto[] {
        return [FieldProto.ID, FieldProto.PORTFOLIO, FieldProto.PORTFOLIO_ID, FieldProto.PORTFOLIO_NAME];
    }

    getField(field: FieldProto): any {
        switch (field) {
            case FieldProto.ID:
            case FieldProto.PORTFOLIO_ID:
                return this.getID();
            case FieldProto.AS_OF:
                return this.getAsOf();
            case FieldProto.PORTFOLIO_NAME:
                return this.getPortfolioName();
            default:
                throw new Error(`Field not mapped in Portfolio wrapper: ${field}`);
        }
    }
}


export default Portfolio;