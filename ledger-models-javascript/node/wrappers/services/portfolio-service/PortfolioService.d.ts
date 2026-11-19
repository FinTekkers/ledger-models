import type { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import type { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import type { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import type { CreatePortfolioResponseProto } from '../../../fintekkers/requests/portfolio/create_portfolio_response_pb';
import type { PositionFilter } from '../../models/position/positionfilter';
import Portfolio from '../../models/portfolio/portfolio';
declare class PortfolioService {
    private client;
    /** Read on every access, so a changed environment is picked up. */
    static get url(): string;
    constructor(apiKey?: string);
    validateCreatePortfolio(portfolio: PortfolioProto): Promise<SummaryProto>;
    createPortfolio(portfolio: PortfolioProto): Promise<CreatePortfolioResponseProto>;
    searchPortfolio(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Portfolio[]>;
}
export { PortfolioService };
