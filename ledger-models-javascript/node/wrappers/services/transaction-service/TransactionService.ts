import * as grpc from '@grpc/grpc-js';
import { promisify } from 'util';

// Models
import Transaction from '../../models/transaction/transaction';
import { createFieldMapEntry } from '../../models/utils/util';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { SummaryProto } from '../../../fintekkers/requests/util/errors/summary_pb';

// Model Utils
import { PositionFilterProto } from '../../../fintekkers/models/position/position_filter_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

// Requests & Services
import { TransactionClient } from '../../../fintekkers/services/transaction-service/transaction_service_grpc_pb';
import { CreateTransactionRequestProto } from '../../../fintekkers/requests/transaction/create_transaction_request_pb';
import { CreateTransactionResponseProto } from '../../../fintekkers/requests/transaction/create_transaction_response_pb';
import { QueryTransactionRequestProto } from '../../../fintekkers/requests/transaction/query_transaction_request_pb';
import { QueryTransactionResponseProto } from '../../../fintekkers/requests/transaction/query_transaction_response_pb';


class TransactionService {
  private client: TransactionClient;

  constructor() {
    // this.client = new SecurityClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
    this.client = new TransactionClient('localhost:8082', grpc.credentials.createInsecure());
  }

  async validateCreateTransaction(transaction: Transaction): Promise<SummaryProto> {
    const createRequest = new CreateTransactionRequestProto();
    createRequest.setObjectClass('TransactionRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreateTransactionInput(transaction.proto);

    const validateCreateOrUpdateAsync = promisify(this.client.validateCreateOrUpdate.bind(this.client));
    const response = await validateCreateOrUpdateAsync(createRequest);
    return response;
  }

  async createTransaction(transaction: Transaction): Promise<CreateTransactionResponseProto> {
    const createRequest = new CreateTransactionRequestProto();
    createRequest.setObjectClass('TransactionRequest');
    createRequest.setVersion('0.0.1');
    createRequest.setCreateTransactionInput(transaction.proto);

    const createSecurityAsync = promisify(this.client.createOrUpdate.bind(this.client));
    const response = await createSecurityAsync(createRequest);
    return response;
  }

  async searchTransaction(asOf: LocalTimestampProto, fieldProto: FieldProto, fieldValue: string): Promise<Transaction[]> {
    const searchRequest = new QueryTransactionRequestProto();
    searchRequest.setObjectClass('SecurityRequest');
    searchRequest.setVersion('0.0.1');
    searchRequest.setAsOf(asOf);

    const positionFilter = new PositionFilterProto();
    positionFilter.setObjectClass('PositionFilter');
    positionFilter.setVersion('0.0.1');

    const fieldMapEntry = createFieldMapEntry(fieldProto, fieldValue);
    positionFilter.setFiltersList([fieldMapEntry]);

    searchRequest.setSearchTransactionInput(positionFilter);

    const tmpClient = this.client;

    const listTransactions: Transaction[] = [];

    async function processStreamSynchronously(): Promise<Transaction[]> {
      const stream2 = tmpClient.search(searchRequest);

      return new Promise<Transaction[]>((resolve, reject) => {
        stream2.on('data', (response:QueryTransactionResponseProto) => {
          console.log('Result of the transaction search call');
          console.log('Response:', response);
          response.getTransactionResponseList().forEach((transaction) => {
            listTransactions.push(new Transaction(transaction));
          });

          console.log('Size of transactions:', listTransactions.length );
        });

        stream2.on('end', () => {
          console.log('Stream ended.');
          resolve(listTransactions);
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

export { TransactionService };