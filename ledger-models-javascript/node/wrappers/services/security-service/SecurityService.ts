import * as grpc from '@grpc/grpc-js';
import { promisify } from 'util';

// Models
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { createFieldMapEntry } from '../../models/utils/util';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

// Model Utils
import { PositionFilterProto } from '../../../fintekkers/models/position/position_filter_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

// Requests & Services
import { SecurityClient } from '../../../fintekkers/services/security-service/security_service_grpc_pb';
import { QuerySecurityRequestProto } from '../../../fintekkers/requests/security/query_security_request_pb';
import { QuerySecurityResponseProto } from '../../../fintekkers/requests/security/query_security_response_pb';
import { CreateSecurityRequestProto } from '../../../fintekkers/requests/security/create_security_request_pb';
import { CreateSecurityResponseProto } from '../../../fintekkers/requests/security/create_security_response_pb';
import Security from '../../models/security/security';

class SecurityService {
  private client: SecurityClient;

  constructor() {
    this.client = new SecurityClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
    // this.client = new SecurityClient('localhost:8082', grpc.credentials.createInsecure());
  }

  async validateCreateSecurity(security: SecurityProto): Promise<SummaryProto> {
    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const validateCreateOrUpdateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateCreateOrUpdateAsync(createRequest);
    return response;
  }

  async createSecurity(security: SecurityProto): Promise<CreateSecurityResponseProto> {
    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const createSecurityAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createSecurityAsync(createRequest);
    return response;
  }

  async searchSecurity(asOf: LocalTimestampProto, fieldProto: FieldProto, fieldValue: string): Promise<Security[]> {
    const searchRequest = new QuerySecurityRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(asOf);

    const positionFilter = new PositionFilterProto();
    positionFilter.setObjectClass('PositionFilter');
    positionFilter.setVersion('0.0.1');

    const fieldMapEntry = createFieldMapEntry(fieldProto, fieldValue);
    positionFilter.setFiltersList([fieldMapEntry]);

    searchRequest.setSearchSecurityInput(positionFilter);

    const tmpClient = this.client;

    const listSecurities: Security[] = [];

    async function processStreamSynchronously(): Promise<Security[]> {
      const stream2 = tmpClient.search(searchRequest);

      return new Promise<Security[]>((resolve, reject) => {
        stream2.on('data', (response:QuerySecurityResponseProto) => {
          response.getSecurityResponseList().forEach((security) => {
            listSecurities.push(new Security(security));
          });
        });

        stream2.on('end', () => {
          resolve(listSecurities);
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

export { SecurityService };