import { promisify } from 'util';

// Models
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

// Model Utils

// Requests & Services
import { PortfolioClient } from '../../../fintekkers/services/portfolio-service/portfolio_service_grpc_pb';
import { QueryPortfolioRequestProto } from '../../../fintekkers/requests/portfolio/query_portfolio_request_pb';
import { QueryPortfolioResponseProto } from '../../../fintekkers/requests/portfolio/query_portfolio_response_pb';
import { CreatePortfolioRequestProto } from '../../../fintekkers/requests/portfolio/create_portfolio_request_pb';
import { CreatePortfolioResponseProto } from '../../../fintekkers/requests/portfolio/create_portfolio_response_pb';
import EnvConfig from '../../models/utils/requestcontext';
import { PositionFilter } from '../../models/position/positionfilter';
import Portfolio from '../../models/portfolio/portfolio';

class PortfolioService {
  private client: PortfolioClient;

  static url: string = EnvConfig.apiURL;

  constructor() {
    this.client = new PortfolioClient(EnvConfig.apiURL, EnvConfig.apiCredentials);
  }

  async validateCreatePortfolio(portfolio: PortfolioProto): Promise<SummaryProto> {
    const createRequest = new CreatePortfolioRequestProto();
    createRequest.setObjectClass('PortfolioRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreatePortfolioInput(portfolio);

    const validateCreateOrUpdateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateCreateOrUpdateAsync(createRequest);
    return response as SummaryProto;
  }

  async createPortfolio(portfolio: PortfolioProto): Promise<CreatePortfolioResponseProto> {
    const createRequest = new CreatePortfolioRequestProto();
    createRequest.setObjectClass('PortfolioRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreatePortfolioInput(portfolio);

    const createPortfolioAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createPortfolioAsync(createRequest);
    return response as CreatePortfolioResponseProto;
  }

  async searchPortfolio(asOf: LocalTimestampProto,
    positionFilter: PositionFilter): Promise<Portfolio[]> {
    const searchRequest = new QueryPortfolioRequestProto();
    searchRequest.setObjectClass('PortfolioRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(asOf);

    searchRequest.setSearchPortfolioInput(positionFilter.toProto());

    const tmpClient = this.client;

    const listPortfolios: Portfolio[] = [];

    async function processStreamSynchronously(): Promise<Portfolio[]> {
      const stream2 = tmpClient.search(searchRequest);

      return new Promise<Portfolio[]>((resolve, reject) => {
        stream2.on('data', (response: QueryPortfolioResponseProto) => {
          response.getPortfolioResponseList().forEach((portfolio) => {
            listPortfolios.push(new Portfolio(portfolio));
          });
        });

        stream2.on('end', () => {
          resolve(listPortfolios);
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

export { PortfolioService };