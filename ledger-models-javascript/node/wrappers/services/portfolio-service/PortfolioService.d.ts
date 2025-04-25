import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import { CreatePortfolioResponseProto } from '../../../fintekkers/requests/portfolio/create_portfolio_response_pb';
import { PositionFilter } from '../../models/position/positionfilter';
import Portfolio from '../../models/portfolio/portfolio';
declare class PortfolioService {
    private client;
    static url: string;
    constructor();
    validateCreatePortfolio(portfolio: PortfolioProto): Promise<SummaryProto>;
    createPortfolio(portfolio: PortfolioProto): Promise<CreatePortfolioResponseProto>;
    searchPortfolio(asOf: LocalTimestampProto, positionFilter: PositionFilter): Promise<Portfolio[]>;
}
export { PortfolioService };
