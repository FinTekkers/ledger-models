import { promisify } from 'util';

import Price from '../../models/price/Price';
import { PositionFilter } from '../../models/position/positionfilter';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

import { PriceClient } from '../../../fintekkers/services/price-service/price_service_grpc_pb';
import { QueryPriceRequestProto } from '../../../fintekkers/requests/price/query_price_request_pb';
import { QueryPriceResponseProto } from '../../../fintekkers/requests/price/query_price_response_pb';
import { CreatePriceRequestProto } from '../../../fintekkers/requests/price/create_price_request_pb';
import { CreatePriceResponseProto } from '../../../fintekkers/requests/price/create_price_response_pb';

import { UUID } from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';
import EnvConfig from '../../models/utils/requestcontext';

class PriceService {
  private client: PriceClient;

  constructor(apiKey?: string) {
    if (apiKey) {
      const { credentials, interceptors } = EnvConfig.getAuthenticatedClientOptions(apiKey);
      this.client = new PriceClient(EnvConfig.apiURL, credentials, { interceptors });
    } else {
      this.client = new PriceClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
    }
  }

  close(): void {
    this.client.close();
  }

  async validateCreateOrUpdate(price: Price | PriceProto): Promise<SummaryProto> {
    const priceProto = price instanceof Price ? price.proto : price;

    const createRequest = new CreatePriceRequestProto();
    createRequest.setObjectClass('PriceRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreatePriceInput(priceProto);

    const validateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateAsync(createRequest);
    return response as SummaryProto;
  }

  async createOrUpdate(price: Price | PriceProto): Promise<CreatePriceResponseProto> {
    const priceProto = price instanceof Price ? price.proto : price;

    const createRequest = new CreatePriceRequestProto();
    createRequest.setObjectClass('PriceRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreatePriceInput(priceProto);

    const createAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createAsync(createRequest);
    return response as CreatePriceResponseProto;
  }

  async searchPriceAsOfNow(positionFilter: PositionFilter): Promise<Price[]> {
    const now = dt.ZonedDateTime.now().toProto();
    return this.search(now, positionFilter);
  }

  /**
   * Search for prices matching the given filter, returning Price wrapper objects.
   */
  async search(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Price[]> {
    const searchRequest = new QueryPriceRequestProto();
    searchRequest.setObjectClass('PriceRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(asOf);
    searchRequest.setSearchPriceInput(positionFilter.toProto());

    const tmpClient = this.client;
    const results: Price[] = [];

    async function processStreamSynchronously(): Promise<Price[]> {
      const stream = tmpClient.search(searchRequest);

      return new Promise<Price[]>((resolve, reject) => {
        stream.on('data', (response: QueryPriceResponseProto) => {
          response.getPriceResponseList().forEach((priceProto) => {
            results.push(new Price(priceProto));
          });
        });

        stream.on('end', () => {
          resolve(results);
        });

        stream.on('error', (err) => {
          console.error('Error in the price stream:', err);
          reject(err);
        });
      });
    }

    return await processStreamSynchronously();
  }

  /**
   * Backward-compatible alias for search().
   */
  async searchPrice(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<PriceProto[]> {
    const prices = await this.search(asOf, positionFilter);
    return prices.map(p => p.proto);
  }

  /**
   * Search prices by security UUID string.
   * Convenience method so callers can write:
   *   priceService.searchBySecurityId('18e8c4e6-3da0-47c9-...')
   */
  async searchBySecurityId(securityId: string, asOf?: LocalTimestampProto): Promise<Price[]> {
    const effectiveAsOf = asOf ?? dt.ZonedDateTime.now().toProto();
    const securityUuid = new UUID(UUID.fromString(securityId));
    const filter = new PositionFilter()
      .addEqualsFilter(FieldProto.SECURITY_ID, securityUuid);

    return this.search(effectiveAsOf, filter);
  }
}

export { PriceService };
