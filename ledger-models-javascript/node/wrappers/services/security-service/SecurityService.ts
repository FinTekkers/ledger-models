import { promisify } from 'util';

// Models
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import Security from '../../models/security/security';

// Model Utils
import { PositionFilter } from '../../models/position/positionfilter';
import * as dt from '../../models/utils/datetime';
import { validateIdentifiersForCreate } from '../../models/security/identifier';

// Requests & Services
import { SecurityClient } from '../../../fintekkers/services/security-service/security_service_grpc_pb';
import { QuerySecurityRequestProto } from '../../../fintekkers/requests/security/query_security_request_pb';
import { QuerySecurityResponseProto } from '../../../fintekkers/requests/security/query_security_response_pb';
import { CreateSecurityRequestProto } from '../../../fintekkers/requests/security/create_security_request_pb';
import { CreateSecurityResponseProto } from '../../../fintekkers/requests/security/create_security_response_pb';

import EnvConfig from '../../models/utils/requestcontext';
import { UUID } from '../../models/utils/uuid';
import { ZonedDateTime } from '../../models/utils/datetime';
import * as LinkCacheModule from '../../util/link-cache';

class SecurityService {
  private client: SecurityClient;

  constructor(apiKey?: string) {
    if (apiKey) {
      const { credentials, interceptors } = EnvConfig.getAuthenticatedClientOptions(apiKey);
      this.client = new SecurityClient(EnvConfig.apiURL, credentials, { interceptors });
    } else {
      this.client = new SecurityClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
    }
  }

  async validateCreateSecurity(security: SecurityProto): Promise<SummaryProto> {
    // Client-side guard (#347): reject UNKNOWN_IDENTIFIER_TYPE and empty
    // identifier values before the gRPC round-trip. Mirrors the server's
    // validateCreateRequest reject so the dry-run RPC can't mask a request
    // that the real createOrUpdate would also fail on.
    validateIdentifiersForCreate(security);

    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const validateCreateOrUpdateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateCreateOrUpdateAsync(createRequest);
    return response as SummaryProto;
  }

  async createSecurity(security: SecurityProto): Promise<CreateSecurityResponseProto> {
    // Client-side guard (#347): see validateCreateSecurity above.
    validateIdentifiersForCreate(security);

    const createRequest = new CreateSecurityRequestProto();
    createRequest.setObjectClass('SecurityRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setSecurityInput(security);

    const createSecurityAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createSecurityAsync(createRequest) as CreateSecurityResponseProto;
    // Write-through to the process-wide LinkCache. Lazy-hydrate wrappers
    // read from this cache, so a fresh persist becomes visible to subsequent
    // accessor reads with no second RPC. See docs/adr/lazy-link-hydration.md.
    const persisted = response.getSecurityResponse();
    if (persisted) {
      const uuidProto = persisted.getUuid();
      const asOfProto = persisted.getAsOf();
      if (uuidProto && asOfProto) {
        const uuidKey = UUID.fromU8Array(uuidProto.getRawUuid_asU8()).toString();
        LinkCacheModule.SECURITY.put(uuidKey, persisted, new ZonedDateTime(asOfProto));
      }
    }
    return response;
  }

  async searchSecurityAsOfNow(positionFilter: PositionFilter): Promise<Security[]> {
    const now = dt.ZonedDateTime.now().toProto();
    return this.searchSecurity(now, positionFilter);
  }

  async searchSecurity(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Security[]> {
    const searchRequest = new QuerySecurityRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(asOf);

    searchRequest.setSearchSecurityInput(positionFilter.toProto());

    const tmpClient = this.client;

    const listSecurities: Security[] = [];

    async function processStreamSynchronously(): Promise<Security[]> {
      const stream2 = tmpClient.search(searchRequest);

      return new Promise<Security[]>((resolve, reject) => {
        stream2.on('data', (response: QuerySecurityResponseProto) => {
          response.getSecurityResponseList().forEach((security) => {
            listSecurities.push(Security.create(security));
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