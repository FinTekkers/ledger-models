import { Position } from "../../models/position/position";
import { QueryPositionRequest } from '../../requests/position/QueryPositionRequest';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
declare class PositionService {
    private client;
    constructor();
    validateRequest(positionRequest: QueryPositionRequest): Promise<SummaryProto>;
    search(positionRequest: QueryPositionRequest): Promise<Position[]>;
}
export { PositionService };
