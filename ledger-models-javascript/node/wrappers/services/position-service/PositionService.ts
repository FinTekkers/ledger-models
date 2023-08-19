// Models

// Model Utils

// Requests & Services
import { PositionClient } from '../../../fintekkers/services/position-service/position_service_grpc_pb';
import { QueryPositionRequestProto } from '../../../fintekkers/requests/position/query_position_request_pb';
import { QueryPositionResponseProto } from '../../../fintekkers/requests/position/query_position_response_pb';

import { PositionProto } from '../../../fintekkers/models/position/position_pb';
import EnvConfig from '../../models/utils/requestcontext';


class PositionService {
  private client: PositionClient;

  constructor() {
    this.client = new PositionClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
  }

  async search(request:QueryPositionRequestProto): Promise<PositionProto[]> {
    const tmpClient = this.client;
    const listPositions: PositionProto[] = [];

    async function processStreamSynchronously(): Promise<PositionProto[]> {
      const stream2 = tmpClient.search(request);

      return new Promise<PositionProto[]>((resolve, reject) => {
        stream2.on('data', (response:QueryPositionResponseProto) => {
          response.getPositionsList().forEach((position) => {
            listPositions.push(position);
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