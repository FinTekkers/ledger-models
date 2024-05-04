// Models
import { Position } from "../../models/position/Position.1";

// Requests
import { QueryPositionRequestProto } from '../../../fintekkers/requests/position/query_position_request_pb';
import { QueryPositionResponseProto } from '../../../fintekkers/requests/position/query_position_response_pb';

// Requests & Services
import { PositionClient } from '../../../fintekkers/services/position-service/position_service_grpc_pb';

//Utils
import EnvConfig from '../../models/utils/requestcontext';
import { QueryPositionRequest } from '../../requests/position/QueryPositionRequest';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

class PositionService {
  private client: PositionClient;

  constructor() {
    this.client = new PositionClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
  }

  async validateRequest(positionRequest: QueryPositionRequest): Promise<SummaryProto> {
    const tmpClient = this.client;
    const request: QueryPositionRequestProto = positionRequest.toProto();

    return new Promise<SummaryProto>((resolve, reject) => {
      tmpClient.validateQueryRequest(request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response); // Return response from the callback
        }
      });
    });
  }

  async search(positionRequest: QueryPositionRequest): Promise<Position[]> {
    const tmpClient = this.client;
    const listPositions: Position[] = [];
    const request: QueryPositionRequestProto = positionRequest.toProto();

    const positionService = this;

    async function processStreamSynchronously(): Promise<Position[]> {
      const stream2 = tmpClient.search(request);

      return new Promise<Position[]>((resolve, reject) => {
        stream2.on('data', (response: QueryPositionResponseProto) => {
          response.getPositionsList().forEach((position) => {
            listPositions.push(new Position(position));
          });
        });

        stream2.on('end', () => {
          resolve(listPositions);
        });

        stream2.on('error', (err) => {
          console.error('Error in the stream:', err);
          reject(err);
        });
      });
    }

    return await processStreamSynchronously();
  }
}

export { PositionService };