import * as grpc from '@grpc/grpc-js';
import { promisify } from 'util';

// Models
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { createFieldMapEntry } from '../../models/utils/util';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

import { ZonedDateTime } from '../../../wrappers/models/utils/datetime';
import { packStringIntoAny } from '../../../wrappers/models/utils/util';

// Model Utils
import { PositionFilterProto } from '../../../fintekkers/models/position/position_filter_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

// Requests & Services
import { PositionClient } from '../../../fintekkers/services/position-service/position_service_grpc_pb';
import { QueryPositionRequestProto } from '../../../fintekkers/requests/position/query_position_request_pb';
import { QueryPositionResponseProto } from '../../../fintekkers/requests/position/query_position_response_pb';

import { Any } from "google-protobuf/google/protobuf/any_pb";
import { IdentifierProto } from '../../../fintekkers/models/security/identifier/identifier_pb';
import { FieldMapEntry } from '../../../fintekkers/models/position/position_util_pb';
import { PositionProto, PositionViewProto } from '../../../fintekkers/models/position/position_pb';


class PositionService {
  private client: PositionClient;

  constructor() {
    // this.client = new PositionClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
    this.client = new PositionClient('localhost:8082', grpc.credentials.createInsecure());
  }

  async search(request:QueryPositionRequestProto) {
    const tmpClient = this.client;
    const listPositions: PositionProto[] = [];

    async function processStreamSynchronously(): Promise<PositionProto[]> {
      const stream2 = tmpClient.search(request);

      return new Promise<PositionProto[]>((resolve, reject) => {
        stream2.on('data', (response:QueryPositionResponseProto) => {
          console.log('Result of the position search call');
          console.log('Response:', response);
          response.getPositionsList().forEach((position) => {
            listPositions.push(position);
          });
        });

        stream2.on('end', () => {
          console.log('Stream ended.');
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