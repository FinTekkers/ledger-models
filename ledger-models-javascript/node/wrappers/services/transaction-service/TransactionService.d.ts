import Transaction from '../../models/transaction/transaction';
import { PositionFilter } from '../../models/position/positionfilter';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import { CreateTransactionResponseProto } from '../../../fintekkers/requests/transaction/create_transaction_response_pb';
import LinkResolver from '../../util/link-resolver';
declare class TransactionService {
    private client;
    constructor(apiKey?: string);
    validateCreateTransaction(transaction: Transaction): Promise<SummaryProto>;
    createTransaction(transaction: Transaction): Promise<CreateTransactionResponseProto>;
    searchTransaction(asOf: LocalTimestampProto, positionFilter: PositionFilter, maxResults?: number): Promise<Transaction[]>;
    /**
     * Search transactions and hydrate each Transaction's embedded Security
     * AND Portfolio from link to full entity, with both fetches batched.
     *
     * Pass a shared `linkResolver` to share caching across multiple
     * service-wrapper calls in the same request scope. If omitted, a new
     * resolver is constructed per call.
     *
     * Mutates each returned Transaction.proto's embedded SecurityProto and
     * PortfolioProto in place (link → full). See LinkResolver for cache +
     * dedupe semantics.
     */
    searchWithSecurityAndPortfolio(asOf: LocalTimestampProto, positionFilter: PositionFilter, maxResults?: number, linkResolver?: LinkResolver): Promise<Transaction[]>;
}
export { TransactionService };
