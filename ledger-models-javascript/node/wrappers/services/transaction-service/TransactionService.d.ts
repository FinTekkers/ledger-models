import Transaction from '../../models/transaction/transaction';
import { PositionFilter } from '../../models/position/positionfilter';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';
import { CreateTransactionResponseProto } from '../../../fintekkers/requests/transaction/create_transaction_response_pb';
declare class TransactionService {
    private client;
    constructor();
    validateCreateTransaction(transaction: Transaction): Promise<SummaryProto>;
    createTransaction(transaction: Transaction): Promise<CreateTransactionResponseProto>;
    searchTransaction(asOf: LocalTimestampProto, positionFilter: PositionFilter, maxResults?: number): Promise<Transaction[]>;
}
export { TransactionService };
